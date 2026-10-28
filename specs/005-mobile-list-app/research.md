# Research: App mobile pour gérer ses listes

Chaque décision résout une question du Technical Context de [plan.md](plan.md). Versions relevées sur npm le 2026-10-28.

## R1. Où vit l'app

- **Decision** : dossier `mobile/` dans ce dépôt, avec son propre `package.json` et son `node_modules`. Il n'entre ni dans le build Next, ni dans l'image Docker, ni dans le lint et le typecheck du site (exclu de `tsconfig.json`, `eslint.config.mjs`, `.dockerignore`), et il a ses propres commandes (`npm --prefix mobile run …`).
- **Rationale** : l'app partage avec le site le contrat d'API, les textes (`locales/`) et les valeurs de design ; les garder dans le même dépôt permet de les changer ensemble et de vérifier qu'ils ne divergent pas (R7, R8). Un `package.json` séparé évite de mélanger les dépendances React Native avec celles de Next.
- **Alternatives considered** :
  - Dépôt séparé : contrat, textes et design se désynchronisent. Rejeté.
  - Monorepo à workspaces npm : demande de déplacer le site dans `apps/web`, gros changement pour un gain faible. Rejeté pour l'instant.

## R2. Socle de l'app

- **Decision** : Expo SDK 58 (`expo` 58.0.x, React Native 0.88), TypeScript strict, **Expo Router** 58 pour la navigation par fichiers. Builds avec **EAS Build** (profils `development`, `preview`, `production`), avec un client de développement plutôt qu'Expo Go.
- **Rationale** : Expo est demandé. Expo Router donne une navigation à onglets et à pile proche de l'organisation du site, et des liens profonds pour plus tard. Un client de développement EAS accepte tous les modules natifs, et prépare la publication sur les stores (identifiants, icônes, permissions) sans la faire dans cette feature.
- **Alternatives considered** : React Navigation à la main (plus de code pour le même résultat) ; Expo Go (limite les modules natifs, impasse pour les stores).

## R3. Connexion

- **Decision** : le jeton bearer de la 004 est gardé dans **expo-secure-store** (Keychain iOS, Keystore Android). Au lancement : lecture du jeton, puis `GET /me` si le réseau est là. Sur `401`, le jeton est effacé et l'app revient à la connexion (FR-004). Sur `mustChangePassword`, seul l'écran de changement est accessible (FR-005). La déconnexion appelle `POST /auth/logout` puis efface le jeton (FR-003).
- **Rationale** : un jeton qui donne accès au compte pendant 30 jours ne doit pas être dans un stockage en clair.
- **Hors ligne** : sans réseau, l'app fait confiance au jeton stocké pour ouvrir la copie locale ; la validité est vérifiée au retour du réseau.

## R4. Copie locale et changements en attente

- **Decision** : **expo-sqlite** (58), avec trois tables (voir [data-model.md](data-model.md)) :
  - `snapshot` : la dernière réponse du serveur pour `GET /lists` et pour chaque `GET /lists/{id}`, en JSON, avec sa date (FR-025) ;
  - `outbox` : les changements en attente, dans l'ordre, avec leur état (FR-026 à FR-029a) ;
  - `meta` : le compte de la copie (pour l'effacer si un autre compte se connecte).
  
  L'écran affiche toujours `snapshot` + les changements de `outbox` appliqués par-dessus (« vue optimiste »). Un moteur de synchronisation envoie `outbox` dans l'ordre dès que le réseau revient, puis recharge `snapshot`.
- **Rationale** : les changements en attente doivent survivre au redémarrage du téléphone et rester ordonnés (FR-027, FR-028) ; une base locale transactionnelle le garantit mieux qu'un fichier clé/valeur. Garder la réponse brute du serveur évite de dupliquer le modèle de données côté app.
- **Alternatives considered** :
  - AsyncStorage : pas de transactions, risque de perdre l'ordre de l'outbox. Rejeté.
  - TanStack Query avec mutations persistées : pratique pour le cache, mais les créations hors ligne qui dépendent l'une de l'autre (une idée dans une liste créée hors ligne) demandent des identifiants temporaires que la bibliothèque ne gère pas. Rejeté au profit d'un moteur court et testé.
  - Une base synchronisée (WatermelonDB, PowerSync, Replicache) : il faudrait un protocole de synchronisation côté serveur. Disproportionné (principe V). Rejeté.

## R5. Ne rien enregistrer deux fois

- **Decision** : l'app génère elle-même l'identifiant de ce qu'elle crée (liste, première catégorie, premier « qui », idée), au format des identifiants du serveur (`newId()` : 16 caractères base64url, 96 bits aléatoires). Extension **compatible** du contrat v1 de la 004 (voir [contracts/api-v1-additions.md](contracts/api-v1-additions.md)) :
  - `POST /lists` accepte en option `id`, `categoryId` et `personId` ;
  - `POST /lists/{listId}/items` accepte en option `id` ;
  - si l'objet existe déjà avec cet identifiant **dans la même liste et pour le même compte membre**, le serveur répond comme à la première fois (`200` au lieu de `201`, même corps) au lieu de créer un doublon ; si l'identifiant est pris ailleurs, `409 idConflict` ;
  - les autres opérations sont déjà idempotentes (`PUT` d'idée, `PATCH` archivage/catégorie) ou rendues sûres côté app (`DELETE` d'une idée déjà supprimée : le `404` est traité comme un succès).
- **Rationale** : FR-029 (réponse perdue → renvoi). Les fonctions du domaine (`createWishlist`, `createItem`, `addType`, `addPerson`) acceptent déjà un `id` : aucune règle métier ne change. L'identifiant connu à l'avance permet aussi de rattacher une idée à une liste créée hors ligne.
- **Alternatives considered** : en-tête `Idempotency-Key` avec mémoire des réponses côté serveur : nouveau stockage et nouvelle purge pour le même effet. Rejeté.

## R6. Réseau et ordre d'envoi

- **Decision** : `@react-native-community/netinfo` (12) pour savoir si le réseau est là. Le moteur de synchronisation se lance : au démarrage, au retour du réseau, au retour de l'app au premier plan, et après chaque changement fait en ligne. Il envoie l'outbox **un changement à la fois, dans l'ordre**. Pour chaque réponse :
  - succès → le changement est retiré, la copie de la liste est rechargée ;
  - erreur réseau ou `5xx` → arrêt, nouvel essai plus tard (attente croissante, plafonnée à 1 minute) ;
  - `401` → arrêt, retour à la connexion, l'outbox est gardé si le même compte se reconnecte ;
  - `4xx` métier (liste supprimée, catégorie retirée, non-membre, donnée invalide) → le changement passe « refusé » avec son code et le message traduit, et les changements qui en dépendent (même idée, idées d'une liste refusée) sont refusés avec lui ; les autres continuent (FR-029a).
- **Rationale** : envoyer dans l'ordre garde les dépendances (FR-028) ; un changement à la fois suffit pour quelques dizaines de changements (SC-009 : moins de 30 s).

## R7. Design fidèle au site

- **Decision** :
  - **Valeurs de design** dans `mobile/src/theme/tokens.ts` (couleurs, bordure 2, ombre 4, rayon 5, poids 500/700), recopiées de `app/globals.css`. Un test de l'app lit `app/globals.css` et vérifie que les valeurs sont identiques, pour que les deux ne divergent pas.
  - **Police Geist** par `@expo-google-fonts/geist` (500 et 700) chargée avec `expo-font` avant le premier écran.
  - **Composants maison** dans `mobile/src/ui/`, un par composant de [design-reference.md](design-reference.md) (Button, Card, Field/Input, Select, Badge, Tabs en pastilles, Stars, Alert, Empty, GiftMark…), qui reprennent les noms et variantes de `components/ui/`. L'ombre néo-brutaliste est dessinée par une vue noire décalée de 4 points sous l'élément (et non par l'ombre native, floue et différente sur iOS et Android). L'effet « s'enfonce » : à l'appui, l'élément se décale de 4 points et la vue d'ombre disparaît.
  - **Cadeau** : `react-native-svg` (15) avec la même géométrie que `components/site/gift-mark.tsx`, recoloré par le thème de la liste.
  - **Thème de liste** : un contexte de thème, équivalent de `WishlistThemeScope`, qui remplace les couleurs par celles de la liste.
  - Pas de bibliothèque de composants (React Native Paper, Tamagui, NativeWind…) : leurs styles par défaut éloignent du site.
- **Vérification** : `scripts/capture-demo.mjs` gagne un mode mobile (390 × 844) qui produit `specs/005-mobile-list-app/design/web-mobile/` ; les captures de l'app viennent du simulateur iOS et de l'émulateur Android à la même taille. Comparaison côte à côte écran par écran (SC-005), décrite dans [quickstart.md](quickstart.md).
- **Rationale** : FR-030 à FR-030c. Seule une ombre dessinée donne le même rendu que `box-shadow: 4px 4px 0 0 #000` sur les deux plateformes.

## R8. Textes et langue

- **Decision** : l'app lit directement les fichiers `locales/{fr,en}/*.json` du site (Metro est configuré pour regarder le dossier parent), avec **i18next** et **react-i18next**, comme le site. Les textes propres à l'app vont dans un nouveau namespace `mobile`, ajouté aux deux langues et à `src/i18n/config.ts`, pour garder la parité de clés vérifiée par la revue. La langue vient d'**expo-localization** (58) : anglais si la première langue du téléphone est l'anglais, français sinon. L'app envoie `Accept-Language` en conséquence, ce qui rend les erreurs et les liens publics dans la bonne langue.
- **Rationale** : FR-032 exige les libellés du site mot pour mot ; les relire à la source empêche toute dérive.

## R9. Client d'API typé

- **Decision** : types générés depuis `specs/004-mobile-api/contracts/openapi.yaml` par **openapi-typescript** (7.13, dépendance de dev), et appels par **openapi-fetch** (0.17) avec un intercepteur qui ajoute `Authorization`, `Accept-Language` et `Content-Type`, et traduit les erreurs `{ error: { code, message } }`. La génération tourne dans un script `npm --prefix mobile run api:types` ; un test vérifie que les types générés sont à jour.
- **Rationale** : le contrat est la source de vérité (004, R6) ; si une route change, le typecheck de l'app casse.

## R10. Partage et QR code

- **Decision** :
  - QR code : `react-native-qrcode-svg` (6.3), dessiné en SVG noir sur blanc avec la marge réglementaire, dans une carte au style du site.
  - Partage : l'API `Share` de React Native (feuille de partage du système) avec `{ title, message: "<titre> — <lien>", url }`. `expo-sharing` sert au partage de fichiers ; il n'est pas adapté à un lien.
  - Copie : `expo-clipboard` (58).
  - Le lien partagé est `readUrl` de la vue membre, déjà rendu dans la langue de l'app par l'API (FR-023).
- **Rationale** : FR-020 à FR-024 ; aucune permission supplémentaire n'est demandée (important pour les stores).

## R11. Tests

- **Decision** :
  - **jest-expo** (58) + **@testing-library/react-native** (14) dans `mobile/`.
  - Tests unitaires du moteur hors ligne (application optimiste de l'outbox, ordre, dépendances, gestion de chaque type de réponse, renvoi idempotent) avec un faux client d'API et une base SQLite en mémoire : c'est la partie la plus risquée (SC-008).
  - Tests de composants pour l'apparence vérifiable par le code (couleurs, bordures, ombre, état appuyé) et pour les écrans clés (erreurs affichées, champs gardés).
  - Test de cohérence `tokens.ts` ↔ `app/globals.css`, et parité des clés du namespace `mobile`.
  - Côté serveur : les tests de domaine existants plus des tests de commandes pour l'extension `id` (création idempotente, `idConflict`, liste d'un autre compte).
  - Parcours réels : [quickstart.md](quickstart.md), sur simulateur iOS et émulateur Android, avec la base de démo (principe IV).
- **Alternatives considered** : tests de bout en bout Maestro ou Detox : utiles plus tard pour les stores, trop lourds pour cette première tranche.

## R12. Configuration et publication future

- **Decision** :
  - `mobile/app.config.ts` : nom « Oh, You Shouldn't! » / « Oh, mais fallait pas ! » (nom localisé), identifiants `app.ohyoushouldnt.mobile` (iOS et Android), icône et splash à partir du cadeau, `userInterfaceStyle: "light"`, orientation portrait, aucune permission demandée.
  - Adresse du serveur : `EXPO_PUBLIC_API_URL` (FR-042), différente par profil EAS (démo locale, production `https://ohyoushouldnt.app`).
  - Côté serveur, rien à configurer : l'app native n'envoie pas d'en-tête `Origin`, donc `API_ALLOWED_ORIGINS` n'est pas nécessaire.
- **Rationale** : ces choix ne demandent rien de plus au moment de publier sur les stores (hors périmètre de cette feature).
