---

description: "Tâches de la feature App mobile pour gérer ses listes"
---

# Tasks: App mobile pour gérer ses listes

**Input**: Design documents from `specs/005-mobile-list-app/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-v1-additions.md](contracts/api-v1-additions.md), [contracts/screens.md](contracts/screens.md), [design-reference.md](design-reference.md), [quickstart.md](quickstart.md)

**Tests**: inclus. `AGENTS.md` exige un test par règle et cas limite côté serveur, et research R11 prévoit des tests de l'app sur les parties à risque (moteur hors ligne, apparence vérifiable par le code, cohérence avec le site).

**Organization**: une phase par User Story. US6 (design, P1) vient avant les autres parce que chaque écran est construit avec ses composants : un écran livré doit déjà ressembler à son modèle (spec, US6).

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (autre fichier, pas de dépendance sur une tâche non finie)
- **[Story]** : User Story de la spec (US1 à US6)

## Règles communes à toutes les tâches

- **Design** : chaque écran reproduit son modèle de [contracts/screens.md](contracts/screens.md) et ses captures `design/web-mobile/`. On n'écrit aucun style « en dur » dans un écran : on compose les composants de `mobile/src/ui/` et les valeurs de `mobile/src/theme/tokens.ts`. Un écart avec le site est corrigé ou justifié dans [design-reference.md](design-reference.md).
- **Textes** : un libellé qui existe sur le site est lu dans son namespace (`auth`, `home`, `list`, `common`, `errors`…) avec la même clé, jamais recopié. Un texte propre à l'app va dans `locales/{fr,en}/mobile.json`, dans les deux langues, vouvoiement et lexique du site.
- **Règles** : l'app ne réécrit aucune règle du serveur (FR-041). Les erreurs viennent du serveur (`error.code` traduit par `errors`).
- **Création** : tout ce que l'app crée (liste, première catégorie, premier « qui », idée) porte un identifiant généré par l'app (`mobile/src/offline/ids.ts`, R5), dès US2. Le serveur l'utilise après la Phase 8.
- **Commandes de l'app** : `npm --prefix mobile run lint|typecheck|test`. Commandes du site inchangées.
- **Données** : seulement la base de démo et des comptes `@example.test` (principe I).

---

## Phase 1: Setup

**Purpose**: créer le projet Expo et l'isoler du site.

- [X] T001 Créer l'app Expo SDK 58 dans `mobile/` (modèle TypeScript avec Expo Router : `npx create-expo-app@latest mobile --template default`), puis supprimer les écrans et composants d'exemple. Garder `mobile/app/_layout.tsx` minimal.
- [X] T002 Installer dans `mobile/` avec `npx expo install` : `expo-secure-store`, `expo-sqlite`, `expo-localization`, `expo-font`, `@expo-google-fonts/geist`, `expo-clipboard`, `@react-native-community/netinfo`, `react-native-svg`, `react-native-qrcode-svg`, `i18next`, `react-i18next`, `openapi-fetch` ; en dev : `openapi-typescript`, `jest-expo`, `@testing-library/react-native`. Ajouter à `mobile/package.json` les scripts `lint`, `typecheck` (`tsc --noEmit`), `test` (`jest`), `api:types`, `ios`, `android`.
- [X] T003 [P] Écrire `mobile/app.config.ts` : `name` localisé (« Oh, mais fallait pas ! » / « Oh, You Shouldn't! »), `slug` `ohyoushouldnt`, `scheme` `ohyoushouldnt`, `ios.bundleIdentifier` et `android.package` `app.ohyoushouldnt.mobile`, `orientation: "portrait"`, `userInterfaceStyle: "light"`, aucune permission, `extra.apiUrl` lu depuis `EXPO_PUBLIC_API_URL` (FR-042). Icône et splash : provisoires, remplacés en T015.
- [X] T004 [P] Écrire `mobile/eas.json` avec trois profils : `development` (client de dev, `EXPO_PUBLIC_API_URL` vers la démo locale), `preview` (distribution interne), `production` (`EXPO_PUBLIC_API_URL=https://ohyoushouldnt.app`).
- [X] T005 [P] Écrire `mobile/metro.config.js` : `watchFolders` sur `../locales` pour que l'app lise les textes du site (R8).
- [X] T006 [P] Configurer `mobile/tsconfig.json` (strict, alias `@/` vers `mobile/src/`), `mobile/jest.config.js` (preset `jest-expo`) et le lint de l'app (`eslint-config-expo`).
- [X] T007 [P] Isoler l'app du site : ajouter `mobile/**` à `exclude` de `tsconfig.json`, à `ignores` de `eslint.config.mjs`, et `mobile` à `.dockerignore`. Vérifier `npm run lint`, `npm run typecheck` et `docker build` à la racine sans changement.

---

## Phase 2: Foundational (bloque toutes les User Stories)

**Purpose**: client d'API typé, textes, connexion stockée, copie locale en lecture.

### Tests

- [X] T008 [P] Écrire `mobile/__tests__/api/client.test.ts` avec un `fetch` simulé : l'intercepteur ajoute `Authorization: Bearer <jeton>` si une session existe, `Accept-Language` selon la langue de l'app, `Content-Type: application/json` ; une réponse `{ error: { code, message } }` devient une `ApiError` avec `code`, `status` et `message` ; une erreur réseau devient `NetworkError` ; un `401` déclenche le rappel `onUnauthorized` ; un `410` déclenche `onUpgradeRequired`.
- [X] T009 [P] Écrire `mobile/__tests__/i18n.test.ts` : la langue vaut `en` si la première langue du téléphone commence par `en`, `fr` sinon (`de-DE` → `fr`) ; une clé du site (`auth:login.submit`) se traduit dans les deux langues ; chaque clé de `locales/fr/mobile.json` existe dans `locales/en/mobile.json` et inversement.

### Implémentation

- [X] T010 Écrire le script `api:types` de `mobile/package.json` : `openapi-typescript ../specs/004-mobile-api/contracts/openapi.yaml -o src/api/schema.d.ts`, et générer `mobile/src/api/schema.d.ts`.
- [X] T011 Écrire `mobile/src/api/client.ts` : client `openapi-fetch` sur `Constants.expoConfig.extra.apiUrl + "/api/v1"`, intercepteur décrit en T008, classes `ApiError` et `NetworkError`, rappels `onUnauthorized` et `onUpgradeRequired` réglables. Aucune autre logique.
- [X] T012 Créer `locales/fr/mobile.json` et `locales/en/mobile.json` (mêmes clés, vide au départ sauf `appName`) et ajouter `mobile` aux `namespaces` de `src/i18n/config.ts` et à `src/i18n/resources.ts`. Vérifier `npm test` à la racine.
- [X] T013 Écrire `mobile/src/i18n/index.ts` : i18next + react-i18next sur les fichiers `../../locales/{fr,en}/*.json` (tous les namespaces de `src/i18n/config.ts`), langue choisie par `expo-localization` (règle de T009), `fallbackLng: "fr"`, et `translateError(code)` sur le namespace `errors` (même règle que `translateErrorFor` du site).
- [X] T014 Écrire `mobile/src/auth/session.ts` : lire / écrire / effacer `session.token`, `session.expiresAt`, `session.userId` dans `expo-secure-store` (data-model, « Connexion ») ; un état observable (`signedOut`, `mustChangePassword`, `signedIn`) ; `restore()` au démarrage (jeton présent → `signedIn`, puis vérification par `GET /me` si le réseau est là) ; `signIn(session)`, `signOut()` (appelle `POST /auth/logout` si possible, puis efface toujours) ; branchement de `onUnauthorized` du client sur l'effacement (FR-004).
- [X] T015 [P] Générer l'icône et le splash de l'app à partir du cadeau du site (géométrie de `components/site/gift-mark.tsx`, couleurs par défaut) dans `mobile/assets/` et les référencer dans `mobile/app.config.ts`.
- [X] T016 Écrire `mobile/src/offline/db.ts` (ouverture SQLite, création des tables `meta`, `snapshot`, `outbox` de data-model.md, migrations par version) et `mobile/src/offline/snapshot.ts` (`get(key)`, `put(key, body)` avec `fetchedAt`, `remove(key)`, `clearAll()`, `ensureUser(userId)` qui vide `snapshot` et `outbox` si `meta.userId` change).
- [X] T017 [P] Écrire `mobile/__tests__/offline/snapshot.test.ts` (SQLite en mémoire) : `put` puis `get` rend le corps et la date ; `ensureUser` avec un autre compte vide tout ; avec le même compte ne vide rien.
- [X] T018 Écrire `mobile/src/offline/ids.ts` : `newClientId()` rend 16 caractères base64url à partir de 12 octets aléatoires (`expo-crypto` ou `crypto.getRandomValues`), et `isClientId(id)` (`^[A-Za-z0-9_-]{16,32}$`, contrat api-v1-additions). Test dans `mobile/__tests__/offline/ids.test.ts`.
- [X] T019 Écrire `mobile/src/network.ts` : état en ligne / hors ligne observable via `@react-native-community/netinfo`, et hook `useOnline()`.

**Checkpoint** : l'app démarre sur un écran vide, en français ou en anglais selon le téléphone ; `npm --prefix mobile test` passe ; le site est inchangé.

---

## Phase 3: User Story 6 - Ressembler au site, écran par écran (Priority: P1)

**Goal**: les valeurs de design et tous les composants du site, prêts avant le premier écran.

**Independent Test**: un écran « catalogue » de développement (`mobile/app/dev/catalog.tsx`, absent des builds `preview` et `production`) montre chaque composant dans chaque variante ; il est comparé aux composants du site (même grille que [quickstart.md US6](quickstart.md)).

### Tests US6

- [X] T020 [P] [US6] Écrire `mobile/__tests__/theme/tokens.test.ts` : lire `../app/globals.css` et vérifier que `tokens.colors` reprend exactement `--gift-blue` (`#1a56e8`), `--gift-red` (`#ff2d2d`), `--gift-yellow` (`#ffd700`), `--background` (`#e8f0ff`), `--muted` (`#d6e4ff`), `--destructive` (`#c41212`), et que `tokens.borderWidth` = 2, `tokens.shadowOffset` = 4 (`--shadow: 4px 4px 0px 0px`), `tokens.radius` = 5 (`--radius-base: 5px`), `tokens.fontWeight.base` = 500, `tokens.fontWeight.heading` = 700.
- [X] T021 [P] [US6] Écrire `mobile/__tests__/ui/components.test.tsx` : `Button` (variantes `default`, `neutral`, `destructive`, `link`, `disabled`) a la couleur de fond, la bordure de 2 et l'ombre décalée de 4 de design-reference.md ; à l'appui (`pressIn`), il est décalé de 4/4 et l'ombre est masquée, et revient à `pressOut` ; `Card`, `Input`, `Badge` ont bordure et ombre ; `Badge` a la hauteur 24 et le texte 12 gras ; `PillTabs` rend l'onglet actif en bleu à texte blanc ; dans un `ListThemeProvider` au thème `{ primary: "#00a86b" }`, le `Button` par défaut prend `#00a86b`.

### Implémentation US6

- [X] T022 [US6] Écrire `mobile/src/theme/tokens.ts` avec les valeurs de design-reference.md (couleurs, texte secondaire `#4d4d4d`, bordure 2, ombre 4, rayon 5, rayon du cadre cadeau, tailles de police 12/14/16/30, poids 500/700, espacements 4/8/12/16/24) et `mobile/src/theme/fonts.ts` (chargement de Geist 500 et 700 avec `useFonts`, écran retenu tant que la police n'est pas prête).
- [X] T023 [US6] Écrire `mobile/src/theme/ListTheme.tsx` : `ListThemeProvider` et `useTheme()` ; par défaut les couleurs du site, dans une liste les 4 couleurs `primary`, `accent`, `highlight`, `background` de son `theme` (équivalent de `components/site/wishlist-theme-scope.tsx`).
- [X] T024 [US6] Écrire `mobile/src/ui/Shadow.tsx` : boîte à bordure noire de 2, rayon 5, avec sous elle une vue noire pleine de même forme décalée de 4/4 (ombre sans flou, identique sur iOS et Android, R7) ; prop `pressed` qui décale le contenu de 4/4 et masque l'ombre ; prop `shadow={false}`.
- [X] T025 [P] [US6] Écrire `mobile/src/ui/Button.tsx` sur `Shadow` + `Pressable` : variantes et tailles de `components/ui/button.tsx` (`default` bleu texte blanc, `neutral` blanc texte noir, `destructive` `#c41212` texte blanc, `ghost`, `link` souligné ; hauteurs 32/36/40/44), état désactivé (opacité 50 %), effet « s'enfonce » à l'appui, `accessibilityRole="button"`, cible tactile ≥ 44.
- [X] T026 [P] [US6] Écrire `mobile/src/ui/Card.tsx` (`Card`, `CardHeader`, `CardTitle` 16 gras, `CardDescription` 14 gris, `CardContent`, `CardFooter` ; marges 16 ; variante cliquable avec l'effet d'appui) d'après `components/ui/card.tsx`.
- [X] T027 [P] [US6] Écrire `mobile/src/ui/Field.tsx` (`Field`, `FieldLabel` poids 500, `FieldDescription` gris, `FieldError` rouge), `mobile/src/ui/Input.tsx` (fond blanc, hauteur 40, bordure + ombre, focus : anneau noir 2) et `mobile/src/ui/Select.tsx` (même apparence avec chevron, ouverture dans une feuille au style du site) d'après `components/ui/field.tsx`, `input.tsx`, `native-select.tsx`.
- [X] T028 [P] [US6] Écrire `mobile/src/ui/Badge.tsx` (variantes `default` bleu, `highlight` jaune, `neutral` blanc, `destructive` ; hauteur 24, texte 12 gras, bordure + ombre) et `mobile/src/ui/Stars.tsx` (lecture : 1 à 5 étoiles jaunes à contour noir ; saisie : étoiles vides cliquables, comme `components/site/priority-star-picker.tsx`).
- [X] T029 [P] [US6] Écrire `mobile/src/ui/PillTabs.tsx` (pastilles qui passent à la ligne ou défilent, actif bleu texte blanc, inactif blanc, bordure + ombre, `accessibilityRole="tab"`), `mobile/src/ui/Alert.tsx` (blanche ou rouge à texte blanc, avec titre et actions) et `mobile/src/ui/Empty.tsx` (texte centré, sans carte).
- [X] T030 [P] [US6] Écrire `mobile/src/ui/GiftMark.tsx` avec `react-native-svg` : même `viewBox` et mêmes formes que `components/site/gift-mark.tsx`, couleurs du thème courant, cadre blanc + ombre (`framed`), et `mobile/src/ui/LiveGiftMark.tsx` (le cadeau qui bouge doucement, comme `components/site/live-gift-mark.tsx`, pour les chargements).
- [X] T031 [US6] Écrire `mobile/src/ui/Screen.tsx` : fond `#e8f0ff` (ou celui du thème), marges latérales 16, défilement, « tirer pour rafraîchir » optionnel, et `mobile/src/ui/BrandHeader.tsx` (cadeau encadré + nom du produit en gras, lu dans `common:brand`).
- [X] T032 [US6] Écrire l'écran de développement `mobile/app/dev/catalog.tsx` qui montre tous les composants et variantes, sur le fond du site et dans un thème de liste personnalisé ; l'exclure des profils `preview` et `production`.
- [ ] T033 [US6] Comparer le catalogue aux composants du site (même grille que quickstart US6) sur simulateur iOS et émulateur Android ; corriger chaque écart ou le justifier dans `specs/005-mobile-list-app/design-reference.md`.

**Checkpoint** : tous les composants existent et ressemblent à ceux du site ; les écrans des phases suivantes ne font que les assembler.

---

## Phase 4: User Story 1 - Se connecter ou créer un compte (Priority: P1)

**Goal**: connexion, création de compte, connexion gardée, déconnexion, mot de passe oublié, changement imposé.

**Independent Test**: [quickstart.md US1](quickstart.md) étapes 1 à 7.

### Tests US1

- [X] T034 [P] [US1] Écrire `mobile/__tests__/auth/session.test.ts` : `restore()` avec jeton → `signedIn` ; sans jeton → `signedOut` ; `GET /me` en `401` → jeton effacé, `signedOut` ; `GET /me` avec `mustChangePassword: true` → état `mustChangePassword` ; `signOut()` appelle `/auth/logout` puis efface même si l'appel échoue.
- [X] T035 [P] [US1] Écrire `mobile/__tests__/screens/login.test.tsx` : mauvais identifiants → le message de `errors:invalidCredentials` s'affiche et l'e-mail reste saisi ; succès → `signIn` appelé ; hors ligne → bouton désactivé avec le texte `mobile:offline.needsNetwork`.

### Implémentation US1

- [X] T036 [US1] Écrire `mobile/app/_layout.tsx` : chargement des polices (T022), i18n (T013), `restore()` de la session (T014) pendant que `LiveGiftMark` s'affiche, puis redirection selon l'état : `signedOut` → `(auth)/login`, `mustChangePassword` → `change-password` (seul écran accessible, FR-005), `signedIn` → `(app)`. Écran plein « mise à jour requise » sur `onUpgradeRequired` (`410`), avec le message du serveur.
- [X] T037 [P] [US1] Écrire `mobile/app/(auth)/login.tsx` d'après `design/web-mobile/02-connexion.png` : `BrandHeader`, carte « Se connecter » avec la description du site, champs e-mail et mot de passe, bouton principal pleine largeur, lien « Mot de passe oublié ? » dans la carte, lien « Créer un compte » sous la carte ; libellés lus dans `auth` ; erreurs traduites.
- [X] T038 [P] [US1] Écrire `mobile/app/(auth)/register.tsx` d'après `design/web-mobile/03-inscription.png` : mêmes champs et libellés que le site ; `201` → `signIn` ; `202 checkEmail` → message du site « vérifiez vos e-mails », sans connexion ; erreurs sous les champs, champs gardés.
- [X] T039 [P] [US1] Écrire `mobile/app/(auth)/forgot-password.tsx` d'après la page `/mot-de-passe-oublie` du site : un champ e-mail, `POST /auth/password-reset`, puis le même message de confirmation que le site, quel que soit l'e-mail (FR-006).
- [X] T040 [US1] Écrire `mobile/app/change-password.tsx` d'après le bloc mot de passe de `design/web-mobile/11-compte.png` : nouveau mot de passe et confirmation (refus si différents, message du site `mismatch`), `POST /me/password`, nouveau jeton enregistré, puis `(app)`.
- [X] T041 [US1] Écrire la barre du haut de « Mes listes » (`mobile/src/features/account/AppHeader.tsx` : en-tête du site + bouton profil, au lieu d'une barre d'onglets en bas, choix de l'utilisatrice) et `mobile/app/(app)/account.tsx` d'après `design/web-mobile/11-compte.png` : changer le nom affiché (`PATCH /me`), changer le mot de passe (`POST /me/password`, nouveau jeton), se déconnecter (FR-003, FR-007). Libellés de `auth` / `home`.
- [X] T042 [US1] Remplir `locales/{fr,en}/mobile.json` avec les textes propres à l'app de cette tranche (`offline.needsNetwork`, `session.expired`, `upgrade.title`, `upgrade.body`), vouvoiement, même sens en anglais.
- [ ] T043 [US1] Dérouler [quickstart.md US1](quickstart.md) sur iOS et Android, et la comparaison de design des écrans Connexion, Création de compte, Mon compte.

**Checkpoint** : on se connecte, on reste connecté, on se déconnecte ; écrans conformes au site.

---

## Phase 5: User Story 2 - Voir ses listes et en créer une (Priority: P1)

**Goal**: « Mes listes » depuis l'API, avec copie locale ; création d'une liste.

**Independent Test**: [quickstart.md US2](quickstart.md) étapes 1 à 4.

### Tests US2

- [X] T044 [P] [US2] Écrire `mobile/__tests__/data/lists.test.ts` (faux client, SQLite en mémoire) : `useMyLists` affiche d'abord la copie locale puis la réponse du serveur, qu'il enregistre dans `snapshot` (`lists`) ; en `NetworkError`, il garde la copie et rend `offline: true` avec `fetchedAt` ; `createList` envoie `id`, `categoryId`, `personId` générés par `newClientId()`.

### Implémentation US2

- [X] T045 [US2] Écrire `mobile/src/data/lists.ts` : `useMyLists()` et `useMemberList(listId)` (copie `snapshot` puis `GET /lists` / `GET /lists/{id}`, rafraîchissement à la demande et au retour au premier plan, FR-017 ; `404` → retrait de la copie et retour à « Mes listes » avec message) et `createList({ title, category, person })` (en ligne pour l'instant ; identifiants générés, R5).
- [X] T046 [US2] Écrire `mobile/app/(app)/index.tsx` d'après `design/web-mobile/04-mes-listes.png` : titre « Mes listes » à gauche, bouton « Créer une liste » à droite, une `Card` cliquable par liste (cadeau aux couleurs du thème, titre gras, sous-titre gris), état vide « créez votre première liste », tirer pour rafraîchir. Libellés de `home`.
- [X] T047 [US2] Écrire `mobile/app/(app)/lists/new.tsx` d'après `design/web-mobile/05-nouvelle-liste.png` : titre, première catégorie, premier « qui », mêmes libellés et mêmes erreurs que le site (`listNeedsTitle`, `listNeedsCategory`, `listNeedsPerson`) ; succès → ouverture de la liste.
- [X] T048 [US2] Écrire `mobile/app/(app)/lists/[listId]/_layout.tsx` : en-tête de liste d'après `design/web-mobile/06-liste-idees.png` (cadeau encadré + titre 30 en poids 500, bouton « Voir la liste partagée » qui ouvre `readUrl` dans le navigateur), `PillTabs` Idées (n) / Archives (n) / Réservations (n) / Partage / Réglages avec les compteurs, et `ListThemeProvider` au thème de la liste (FR-031).
- [ ] T049 [US2] Dérouler [quickstart.md US2](quickstart.md) et la comparaison de design de « Mes listes », « Nouvelle liste » et de l'en-tête de liste.

**Checkpoint** : US1 + US2 + US6 forment un premier livrable : se connecter, voir et créer ses listes, avec l'apparence du site.

---

## Phase 6: User Story 3 - Remplir une liste (Priority: P2)

**Goal**: idées (ajout, modification, archivage, suppression), préremplissage, catégories et « qui », réservations.

**Independent Test**: [quickstart.md US3](quickstart.md) étapes 1 à 6.

### Tests US3

- [X] T050 [P] [US3] Écrire `mobile/__tests__/data/items.test.ts` : `createItem` envoie un `id` généré et le prix tel que saisi (« 24,90 ») ; une `ApiError` `priceInvalid` est rendue avec son message traduit ; `deleteItem` traite un `404 itemMissing` comme un succès (contrat api-v1-additions) ; `useCapabilities().enrich` vaut la réponse de `GET /capabilities`.
- [X] T051 [P] [US3] Écrire `mobile/__tests__/screens/item-form.test.tsx` : une erreur du serveur s'affiche sous le formulaire et tous les champs saisis restent (FR-014) ; le bouton « Remplir depuis le lien » est absent si `enrich` est faux, désactivé hors ligne.

### Implémentation US3

- [X] T052 [US3] Écrire `mobile/src/data/items.ts` : `createItem`, `updateItem` (`PUT`), `patchItem` (`archived` / `typeId`), `deleteItem`, `enrich(url)`, `useCapabilities()`, et `mobile/src/data/labels.ts` : `addLabel`, `renameLabel`, `deleteLabel` (catégories et « qui »), `reorderTypes`, `cancelReservation`. Après chaque succès, rechargement de la liste dans `snapshot`.
- [X] T053 [US3] Écrire `mobile/src/features/items/ItemForm.tsx` d'après la carte « Ajouter une idée cadeau » de `design/web-mobile/06-liste-idees.png` : lien du cadeau + « Remplir depuis le lien », nom, catégorie (`Select`), « Pour qui ? » (`Select`), prix, niveau d'envie (`Stars`), lien de l'image avec aperçu carré ; mêmes libellés, mêmes aides et mêmes erreurs que `components/site/item-form.tsx` ; brouillon gardé en cas d'erreur.
- [X] T054 [US3] Écrire `mobile/app/(app)/lists/[listId]/index.tsx` (onglet Idées) : bouton « Ajouter une idée », catégories en accordéon (carte avec nom gras, nombre d'idées, chevron), chaque idée en `Card` (nom, `Stars`, badges « qui » et prix, image carrée à bordure et ombre, lien « Archiver »), appui sur une idée → modification ; et `mobile/app/(app)/lists/[listId]/items/new.tsx`, `items/[itemId].tsx` sur `ItemForm`, avec « Supprimer » (bouton destructif + confirmation, FR-013).
- [X] T055 [P] [US3] Écrire `mobile/app/(app)/lists/[listId]/archives.tsx` d'après `design/web-mobile/07-liste-archives.png` (idées archivées, « Désarchiver ») et `reservations.tsx` d'après `design/web-mobile/08-liste-reservations.png` (idée, offreur, petit mot, annulation par un membre avec confirmation).
- [X] T056 [P] [US3] Écrire `mobile/app/(app)/lists/[listId]/settings.tsx` d'après le bloc catégories / « qui » de `design/web-mobile/10-liste-reglages.png` : pastilles éditables (ajouter, renommer, retirer ; flèches haut/bas pour l'ordre des catégories), refus d'un libellé utilisé avec le message du site.
- [ ] T057 [US3] Dérouler [quickstart.md US3](quickstart.md) et la comparaison de design des onglets Idées, Archives, Réservations, Réglages et du formulaire d'idée.

---

## Phase 7: User Story 4 - Partager une liste publiquement (Priority: P2)

**Goal**: QR code du lien public, feuille de partage, copie.

**Independent Test**: [quickstart.md US4](quickstart.md) étapes 1 à 5.

### Tests US4

- [X] T058 [P] [US4] Écrire `mobile/__tests__/screens/share.test.tsx` : le QR code encode exactement `readUrl` (jamais `inviteUrl`) ; « Partager » appelle `Share.share` avec un message qui contient le titre et `readUrl` ; « Copier » appelle `Clipboard.setStringAsync(readUrl)` puis affiche la confirmation ; `hasReadPassword: true` affiche l'avertissement sans mot de passe ; une liste en attente d'envoi n'affiche ni QR code ni partage, mais l'explication.

### Implémentation US4

- [X] T059 [US4] Écrire `mobile/src/ui/QrCard.tsx` : `react-native-qrcode-svg` noir sur blanc avec marge blanche (« quiet zone »), taille ≥ 240 points (FR-020), dans une `Card` au style du site.
- [X] T060 [US4] Écrire `mobile/app/(app)/lists/[listId]/share.tsx` d'après la carte « Partager avec vos proches » de `design/web-mobile/09-liste-partage.png` : titre et description du site, `QrCard`, bouton principal « Partager » (feuille de partage, message `mobile:share.message` avec le titre et le lien, FR-021), champ lien en lecture seule + bouton carré « copier » (FR-022), alerte si mot de passe de lecture (FR-024), lien « Gérer le partage sur le site » vers la page admin.
- [X] T061 [US4] Ajouter à `locales/{fr,en}/mobile.json` les textes du partage (`share.message`, `share.copied`, `share.passwordNotice`, `share.manageOnSite`, `share.pendingList`).
- [ ] T062 [US4] Dérouler [quickstart.md US4](quickstart.md) (scan du QR code depuis un second téléphone) et la comparaison de design de l'onglet Partage.

---

## Phase 8: User Story 5 - Continuer sans réseau (Priority: P2)

**Goal**: extension `id` du contrat côté serveur, puis file de changements, vue optimiste et synchronisation dans l'app.

**Independent Test**: [quickstart.md US5](quickstart.md) étapes 1 à 10.

### Serveur : extension compatible du contrat v1

- [X] T063 [P] [US5] Écrire `tests/domain/commands-client-ids.test.ts` (fichier temporaire, fixtures de `tests/domain/helpers/api-fixtures.ts`) : `createList` avec `id`, `categoryId`, `personId` crée ces identifiants ; le même appel rejoué par le même compte rend la même liste sans doublon (`replayed: true`) ; un `id` déjà pris par une liste dont le compte n'est pas membre → `idConflict` ; un `id` hors format `^[A-Za-z0-9_-]{16,32}$` → `idInvalid` ; `saveItem` (création) avec `id` : création, puis renvoi → même idée sans doublon et sans modification ; `id` d'une idée d'une autre liste → `idConflict` ; deux créations simultanées avec le même `id` → une seule idée.
- [X] T064 [US5] Implémenter l'extension dans `src/server/commands/lists.ts` (`createList` : `id`, `categoryId`, `personId` optionnels, renvoi reconnu dans le même `updateDocument`, `replayed` dans le résultat) et `src/server/commands/items.ts` (`saveItem` en création : `id` optionnel, même règle), en passant les identifiants à `createWishlist`, `addType`, `addPerson`, `createItem`. Ajouter `idInvalid: 400` et `idConflict: 409` à `src/server/api/errors.ts`, et les messages de [contracts/api-v1-additions.md](contracts/api-v1-additions.md) à `locales/{fr,en}/errors.json`.
- [X] T065 [US5] Brancher les routes : `app/api/v1/lists/route.ts` et `app/api/v1/lists/[listId]/items/route.ts` lisent `id` (et `categoryId`, `personId`) et répondent `200` sur un renvoi, `201` sinon. Mettre à jour `specs/004-mobile-api/contracts/openapi.yaml` (champs optionnels, réponses `200` et `409`, `version: "1.1.0"`) et `apiVersion` de `app/api/v1/capabilities/route.ts`. Lancer `npm run lint`, `npm run typecheck`, `npm test` à la racine et `npm --prefix mobile run api:types`.

### App : file de changements et synchronisation

- [X] T066 [P] [US5] Écrire `mobile/__tests__/offline/outbox.test.ts` (SQLite en mémoire) : ajout ordonné par `seq` ; compaction des seuls `pending` de data-model.md (plusieurs `updateItem`/`patchItem` → le dernier ; `createItem` puis `deleteItem` → rien ; `createItem` puis `updateItem` → un `createItem` aux valeurs finales) ; un `sending` au démarrage repasse `pending` ; dépendances : si un `createList` est `rejected`, les changements de cette liste le deviennent avec le même `errorCode`.
- [X] T067 [P] [US5] Écrire `mobile/__tests__/offline/optimistic.test.ts` : la vue = `snapshot` + `outbox` appliqué dans l'ordre (tableau « Vue optimiste » de data-model.md) ; une liste créée hors ligne apparaît dans « Mes listes » sans `readUrl` ; une idée supprimée en attente est masquée ; une idée `rejected` porte son `errorCode`.
- [X] T068 [P] [US5] Écrire `mobile/__tests__/offline/sync.test.ts` avec un faux client : envoi un par un dans l'ordre ; succès → changement retiré et copie rechargée ; `NetworkError` ou `5xx` → arrêt, `pending`, nouvel essai avec attente croissante plafonnée à 60 s ; `401` → arrêt, `outbox` gardé ; `4xx` métier → `rejected` + dépendants, les autres continuent ; réponse perdue puis renvoi d'un `createItem` → le faux serveur ne crée qu'une idée (`200` au renvoi) ; 20 changements avec coupures aléatoires → 20 arrivés, 0 doublon (SC-008).
- [X] T069 [US5] Écrire `mobile/src/offline/outbox.ts` (ajout, compaction, dépendances, cycle de vie de data-model.md, `retry(seq, payload)` pour « Corriger », `discard(seq)` pour « Abandonner »), `mobile/src/offline/optimistic.ts` (vue = snapshot + outbox) et `mobile/src/offline/sync.ts` (déclencheurs : démarrage, retour du réseau, retour au premier plan, après chaque ajout ; règles de réponse de research R6).
- [X] T070 [US5] Faire passer toutes les écritures de `mobile/src/data/lists.ts` et `mobile/src/data/items.ts` (création de liste, création / modification / archivage / changement de catégorie / suppression d'idée) par l'outbox, en ligne comme hors ligne ; les lectures `useMyLists` et `useMemberList` rendent la vue optimiste. Les actions qui exigent le serveur (connexion, compte, mots de passe, préremplissage, réglages de liste, annulation de réservation) restent directes et sont désactivées hors ligne avec `mobile:offline.needsNetwork` (FR-029b).
- [X] T071 [US5] Écrire `mobile/src/ui/OfflineBanner.tsx` (alerte blanche en haut d'écran : « Hors ligne · dernière mise à jour à HH:MM » + nombre de changements en attente) et `mobile/src/ui/PendingBadge.tsx` (badge jaune « En attente ») ; afficher sur une idée ou une liste `rejected` une `Alert` rouge avec la raison traduite et les boutons « Corriger » (ouvre le formulaire pré-rempli, puis `retry`) et « Abandonner » (`discard`).
- [X] T072 [US5] Avertir à la déconnexion s'il reste des changements en attente (FR-029c) dans `mobile/app/(app)/account.tsx` ; garder l'`outbox` sur `401` et l'envoyer après reconnexion du même compte (`ensureUser`).
- [X] T073 [US5] Ajouter à `locales/{fr,en}/mobile.json` les textes du hors ligne (`offline.banner`, `offline.pendingCount`, `offline.pending`, `offline.rejected`, `offline.fix`, `offline.discard`, `offline.logoutWarning`).
- [ ] T074 [US5] Dérouler [quickstart.md US5](quickstart.md) étapes 1 à 10 sur iOS et Android (mode avion, coupures pendant l'envoi, refus), et la comparaison de design du bandeau, du badge et de l'alerte de refus.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T075 [P] Ajouter un mode mobile à `scripts/capture-demo.mjs` (option `--mobile` : viewport 390 × 844, densité 2, `isMobile`, captures pleine page des écrans de `design-reference.md`, sortie `specs/005-mobile-list-app/design/web-mobile/`, noms `01-accueil.png` à `12-liste-publique.png`) sans changer le mode guide ; refaire les captures et vérifier qu'elles correspondent à celles de la spec.
- [ ] T076 Comparaison finale du design (SC-005) : pour chaque ligne de [contracts/screens.md](contracts/screens.md), capture de l'app (iOS et Android, 390 × 844, compte de démo) à côté de la capture du site, grille de quickstart US6 cochée, en français, en anglais et avec le texte agrandi au maximum ; ranger les captures de l'app dans `specs/005-mobile-list-app/design/app/` et noter chaque écart justifié dans `design-reference.md`.
- [ ] T077 [P] Accessibilité (FR-033) : chaque élément interactif a un `accessibilityRole` et un `accessibilityLabel` traduit ; vérification au lecteur d'écran (VoiceOver, TalkBack) des parcours US1 à US4.
- [X] T078 [P] Mettre à jour `AGENTS.md` (commandes de l'app, couche `mobile/` : composants dans `mobile/src/ui/`, valeurs dans `tokens.ts` vérifiées contre `app/globals.css`, textes lus dans `locales/`) et `README.md` (section « App mobile » : lancer sur simulateur, `EXPO_PUBLIC_API_URL`, profils EAS).
- [ ] T079 Vérification finale : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` à la racine ; `npm --prefix mobile run lint`, `typecheck`, `test` ; un build EAS `preview` iOS et Android ; parcours du guide sur le site (non-régression).

---

## Dependencies & Execution Order

### Phases

- **Setup (1)** → **Foundational (2)** → **US6 (3)** : bloquent tout.
- **US1 (4)** après US6. **US2 (5)** après US1 (il faut être connecté).
- **US3 (6)** et **US4 (7)** après US2 ; indépendantes entre elles.
- **US5 (8)** après US3 (elle fait passer les écritures de US2 et US3 par l'outbox). Les tâches serveur T063–T065 peuvent commencer dès la Phase 2.
- **Polish (9)** à la fin ; T075 peut se faire à tout moment.

### Dans chaque phase

- Tests d'abord (ils échouent), puis données, puis écrans, puis parcours et comparaison de design.
- `locales/{fr,en}/mobile.json` est modifié par T042, T061, T073 : jamais en parallèle.

### Graphe

```text
Setup → Foundational → US6 → US1 → US2 ─┬→ US3 ─┐
                                          └→ US4  ├→ US5 → Polish
              (T063–T065 serveur) ───────────────┘
```

## Parallel Example

```text
# Phase 1 : après T001–T002
T003 app.config.ts | T004 eas.json | T005 metro.config.js | T006 tsconfig/jest | T007 isolation du site

# Phase 3 (US6) : après T022–T024
T025 Button | T026 Card | T027 Field/Input/Select | T028 Badge/Stars | T029 PillTabs/Alert/Empty | T030 GiftMark

# Phase 4 (US1) : après T036
T037 login | T038 register | T039 forgot-password

# Après US2 : deux personnes
US3 (T050–T057) | US4 (T058–T062)

# Pendant US3/US4 : le serveur
T063 → T064 → T065
```

## Implementation Strategy

### Premier livrable : US6 + US1 + US2

1. Phases 1 et 2.
2. US6 : tous les composants, comparés au site.
3. US1 puis US2.
4. **Stop et vérifier** : quickstart US1, US2 et comparaison de design de ces écrans. On peut se connecter, voir et créer ses listes, avec l'apparence du site.
5. Commit, revue (`wishlist-feature-review`).

### Livraison incrémentale

1. US3 (remplir) → US4 (partager) : l'app couvre la demande en ligne.
2. Extension serveur puis US5 : l'app marche sans réseau.
3. Polish : comparaison finale du design, accessibilité, docs, builds EAS `preview`.

## Notes

- `[P]` = autre fichier et pas de dépendance ouverte.
- Commit après chaque tâche ou groupe logique, en français, préfixé `feat:` / `fix:` / `chore:`.
- Un écart de design découvert en cours de route se corrige dans le composant de `mobile/src/ui/`, pas dans l'écran.
- La publication sur les stores n'est pas une tâche de cette feature ; les choix de T003, T004 et T015 la préparent.
