# Research: Pages légales, données et suppression du compte

Chaque décision s'appuie sur le code existant (feature 004 pour l'API, 005 pour l'app).

## R1 — Où vit la règle de suppression

- **Decision** : une fonction pure `deleteAccount(doc, { userId })` dans `src/domain/account.ts`, et un `previewAccountDeletion(doc, userId)` qui donne les nombres affichés avant de confirmer. La commande `deleteOwnAccount` (`src/server/commands/account.ts`) vérifie le mot de passe, limite le débit et écrit par `updateDocument`. La server action du site et la route d'API l'appellent toutes les deux.
- **Rationale** : c'est la répartition des couches de AGENTS.md. La règle est testable sans Next ni fichier.
- **Alternatives considered** : boucler sur `leaveWishlist` puis `deleteWishlist` pour chaque liste. Rejeté : `leaveWishlist` refuse la dernière membre (`aloneMustDelete`) et `deleteWishlist` exige le rôle owner, donc une liste dont la personne est seule *member* sans owner ne serait pas traitée. On réutilise plutôt la règle de transmission (le membre le plus ancien) et `wipeWishlist`, sortis dans des fonctions partagées de `membership.ts`.

## R2 — Effet de la suppression sur les données

- **Decision** (en une écriture) :
  1. listes où la personne est la seule membre → `wipeWishlist` (liste, catégories, « qui », vues, idées, réservations) ;
  2. autres listes → retrait de son adhésion ; si elle était owner, le membre restant le plus ancien (`joinedAt`, puis `userId`) devient owner, comme dans `leaveWishlist` ;
  3. réservations restantes avec `userId` = elle → `userId: null`, `fromName` et `note` gardés ;
  4. `apiSessions` et `passwordResets` du compte supprimés ;
  5. l'utilisateur est retiré de `users`.
- **Rationale** : FR-011 à FR-014. Le cookie du site devient inutile tout seul : `currentUser` cherche le compte par `userId`, et ne le trouve plus. Une réinscription avec le même e-mail donne un nouvel `id` (`newId`), donc un ancien cookie ne la rejoint jamais (FR-017).
- **Alternatives considered** : garder le compte avec un drapeau `deletedAt`. Rejeté : contraire à « suppression définitive », et il faudrait filtrer partout.

## R3 — Confirmation par mot de passe et limite

- **Decision** : `verifyPassword` sur le compte connecté, avec `rateLimitForIp("delete-account:<userId>", ip, 10, 15 min)`. Mot de passe faux → `wrongCurrentPassword` (code et texte déjà traduits). Le compte doit être actif (`activeUser`) : un compte qui doit changer son mot de passe le change d'abord (cas limite de la spec).
- **Rationale** : même schéma que `changeOwnPassword`. La limite est par compte et par IP, pour qu'un jeton volé ne permette pas de deviner le mot de passe.
- **Alternatives considered** : envoyer un code par e-mail. Rejeté : l'e-mail est optionnel sur ce serveur (constitution, hébergement).

## R4 — Forme de l'API

- **Decision** : trois routes ajoutées au contrat v1, avec `apiVersion` 1.1.0 → 1.2.0 (ajout compatible) :
  - `GET /me/deletion` → l'aperçu (nombres et titres, R1) ;
  - `POST /me/deletion` `{ password }` → `204` ; la session d'API disparaît avec le compte ;
  - `GET /me/export` → le document d'export (R5) en JSON, avec `Content-Disposition: attachment`.
  Et `capabilities` gagne `analytics: boolean` pour la page « Données personnelles » de l'app (R7).
- **Rationale** : `POST` plutôt que `DELETE /me` avec un corps, que certains clients et proxys perdent. La ressource « suppression » se lit (aperçu) et se crée (demande).
- **Alternatives considered** : calculer l'aperçu dans l'app à partir de la copie locale. Rejeté : la copie peut être ancienne, et l'app ne doit pas porter de règle (FR-041 de la 005).

## R5 — Format de l'export

- **Decision** : un document JSON versionné (`format: "ohyoushouldnt-export"`, `version: 1`, `exportedAt`), construit par une fonction pure `exportAccount(doc, userId)` dans `src/domain/account.ts`. Il ne garde que des champs nommés un par un (liste blanche), jamais un objet du store tel quel. Détail dans [data-model.md](data-model.md).
- **Rationale** : FR-020 à FR-022. Une liste blanche empêche qu'un champ secret ajouté plus tard (hash, jeton) parte sans qu'on le voie. Un test vérifie l'absence de chaque secret.
- **Alternatives considered** : CSV (plusieurs tableaux, peu lisible), ZIP (dépendance en plus). JSON est lisible et réutilisable.

## R6 — Export et suppression sur le site

- **Decision** :
  - Suppression : un formulaire en bas de `/compte`, qui ouvre une confirmation (`Dialog` de `components/ui/`) avec l'aperçu et le champ mot de passe. Elle appelle `deleteAccountAction`, qui efface le cookie de session et redirige vers `/connexion?deleted=1`.
  - Export : une route GET `app/compte/export/route.ts` (cookie de session, même commande `exportOwnAccount`), avec un lien de téléchargement en bas de `/compte`.
- **Rationale** : une server action ne rend pas de fichier. Une route sous `/compte` garde l'adresse dans la zone du compte, que la mesure d'audience ignore déjà.
- **Alternatives considered** : servir l'export du site par `/api/v1/me/export` avec le cookie. Rejeté : l'API n'accepte que le jeton Bearer.

## R7 — Pages légales : contenu, site et app

- **Decision** :
  - Le site gagne une page `/donnees-personnelles` (et `/en/donnees-personnelles`), ajoutée au sitemap. C'est l'adresse à donner aux stores (FR-032).
  - `/mentions-legales` garde l'éditeur, l'hébergeur (Cloudflare, FR-035) et le contact, avec un lien vers la nouvelle page.
  - Les textes vivent dans le namespace `content` (`legal.*`, `privacy.*`), lus par le site et par l'app (l'app charge déjà tous les namespaces).
  - Les paragraphes des prestataires optionnels (e-mail, IA, audience) s'affichent selon `capabilities`, et la dernière réponse est gardée hors ligne (déjà le cas pour `enrich`).
- **Rationale** : un seul texte pour le site et l'app (FR-030, FR-051), lisible hors ligne puisqu'il est dans le build de l'app (FR-034).
- **Alternatives considered** : ouvrir la page du site dans un navigateur intégré. Rejeté : elle ne marche pas sans réseau et ne ressemble pas aux écrans de l'app.

## R8 — Contenu de « Données personnelles »

- **Decision** : sections courtes, à partir des faits du code :
  - données d'un compte (e-mail, nom, empreinte du mot de passe, date) ;
  - listes et idées ; réservations (nom, petit mot, compte si connecté) ;
  - connexions (30 jours) ; liens de réinitialisation (1 h) ; cookies (texte actuel) ;
  - téléphone : connexion dans le stockage sécurisé, copie des listes et changements en attente, effacés à la déconnexion ou à la suppression ;
  - prestataires : Cloudflare (toujours, adresses IP et trafic, transfert hors de l'UE, FR-036), Resend, Gemini / OpenAI, Umami (seulement si configurés) ;
  - durée : jusqu'à la suppression du compte, sauvegardes chiffrées gardées 14 jours (`deploy/backup-whishlist.sh`) ;
  - droits : télécharger, supprimer, écrire au contact.
- **Rationale** : FR-031. Chaque durée affichée correspond à une constante du code ; une constante qui change doit changer le texte.

## R9 — Effacement sur le téléphone

- **Decision** : après un `204`, l'app appelle le même chemin que `signOut` sans le `POST /auth/logout` : `forgetToken` + `clearAll` (SQLite : copie, file) + `resetStore`. Elle passe ensuite à l'état `signedOut` avec `deleted: true`, pour que l'écran de connexion montre la confirmation. Si la réponse est perdue, le `401` suivant passe par `onUnauthorized` (cas limite de la spec), puis par `clearAll`.
- **Rationale** : FR-015, et réutilise la déconnexion existante. Aujourd'hui `onUnauthorized` n'efface que le jeton et garde la file pour une reconnexion du même compte (T072 de la 005). Ce comportement ne change pas : la file appartient à un `userId` qui ne se reconnectera jamais, et `ensureUser` l'efface quand un autre compte se connecte.

## R10 — Partager le fichier d'export dans l'app

- **Decision** : `expo-file-system` (écrit `ohyoushouldnt-donnees-AAAA-MM-JJ.json` dans le cache) puis `expo-sharing` (feuille de partage). Le fichier du cache est supprimé au partage suivant.
- **Rationale** : `Share` de React Native ne partage pas de fichier sur Android. Les deux modules sont des modules Expo du SDK 58, compatibles avec les builds EAS, et ne demandent aucune permission (la publication sur les stores reste possible).

## R11 — Licences et version

- **Decision** :
  - Licences : un script `mobile/scripts/licenses.mjs` lit l'arbre des dépendances de production (`npm ls --omit=dev --all --json`) et les `package.json` / `LICENSE` de `node_modules`, puis écrit `mobile/src/legal/licenses.json` (nom, version, licence, texte). Le fichier est généré, versionné, et ajouté à la liste des fichiers générés de AGENTS.md. Un test vérifie que chaque dépendance directe de `mobile/package.json` y figure, pour qu'une dépendance ajoutée sans régénérer le fichier se voie.
  - Version : `Constants.expoConfig.version` (`expo-constants`, déjà installé).
- **Rationale** : pas de nouvelle dépendance pour un besoin simple, et le texte se lit hors ligne (FR-041).
- **Alternatives considered** : `license-checker` (dépendance de dev peu maintenue).

## R12 — Adresse de contact

- **Decision** : `CONTACT_EMAIL` dans un module pur `src/site/contact.ts`, importé par la page du site et par l'app (comme `price.ts`). Les textes `content` l'interpolent (`{{email}}`).
- **Rationale** : l'adresse est aujourd'hui écrite deux fois, dans `page.tsx` et dans les textes ; FR-042 a besoin d'une seule source.

## R13 — Design des nouveaux écrans

- **Decision** :
  - Les pages légales de l'app reprennent `ContentPage` / `ContentSection` du site : sur-titre, titre, intro, cartes à bordure et ombre. Deux composants `mobile/src/ui/ContentPage.tsx` et `ContentSection.tsx`, un par composant du site.
  - La section du bas de « Mon compte » est une `Card` avec des boutons `link`, puis le bouton `destructive`.
  - La confirmation de suppression est un écran `(app)/delete-account.tsx`, et pas un `ConfirmDialog`, parce qu'il faut un champ mot de passe et l'aperçu.
  - Pas de capture de référence : on compare aux pages du site ouvertes sur téléphone ; une ligne par écran dans la correspondance de [design-reference.md](../005-mobile-list-app/design-reference.md).
- **Rationale** : mémoire « design fidèle au site » ; FR-050.
