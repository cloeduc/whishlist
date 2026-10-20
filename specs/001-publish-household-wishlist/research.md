# Research: Wishlists personnelles et communes

## Runtime et hébergement

- **Decision**: Node.js 20, Next.js 15 (App Router), entrée Passenger `app.js` à la racine qui appelle `next({ dev: false })` et écoute `process.env.PORT`.
- **Rationale**: La constitution impose Node 20+, `app.js`, et l'injection de `PORT` par Passenger. Le déploiement N0C déjà utilisé pour Next repose sur ce shim. Pages de liste, formulaires et session passent en rendu serveur, sans client obligatoire.
- **Alternatives considered**: Express + templates HTML (moins de RAM au build, mais un second mode de déploiement à côté du shim Next déjà en place). Site statique (ne peut pas garder une réservation après redémarrage).

## Persistance

- **Decision**: Un document JSON `data/wishlist.json` (comptes, listes, membres, idées, réservations). Au premier lancement il est vide de listes. `data/seed.json` versionné est le modèle d'import, pas l'état public. Écriture atomique (fichier temporaire + rename). Exclusion via `proper-lockfile` autour de chaque lecture-modification-écriture.
- **Rationale**: Rien ne doit être lisible tant qu'un compte n'a pas créé ou importé une liste. Pas de `better-sqlite3` sur N0C. Le lock couvre deux inscriptions du même e-mail et deux réservations de la même idée.
- **Alternatives considered**: SQLite (addon natif, compilation fragile sur N0C). Postgres (service annexe, interdit). Lowdb (dépendance pour un rename).

## Comptes

- **Decision**: Comptes dans le même JSON que les listes. Mot de passe hashé avec `crypto.scrypt` (livré avec Node, pas d'addon natif). Cookie de session `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, valeur = id de compte + HMAC avec `SESSION_SECRET` dans `.env`. Pas de `ADMIN_SECRET`. Pas d'e-mail sortant : pas de vérification d'adresse, pas de reset.
- **Rationale**: La constitution 2.0.0 exige un compte pour créer ou éditer, et interdit l'envoi d'e-mail. Scrypt évite `bcrypt` natif sur N0C.
- **Alternatives considered**: Secret partagé (rejeté par la spec). Magic link par e-mail (pas de SMTP). Lib JWT.

## Listes et invitations

- **Decision**: Chaque wishlist a un `readToken` non devinable (lien de lecture) et un `inviteToken` distinct, régénérable. Accepter une invitation exige une session. Le créateur a le rôle `owner`. S'il part, le membre restant le plus ancien devient `owner`. Tous les membres éditent. Les idées, types, personnes, vues et réservations portent un `wishlistId`.
- **Rationale**: Le lien de lecture ne doit pas donner l'édition. Un seul token d'invite à faire tourner évite une table d'invitations.
- **Alternatives considered**: Invitation par e-mail. Lien de lecture qui rend aussi membre (contredit « lire sans compte »).

## Réservation

- **Decision**: Une réservation active = une ligne. Annuler la supprime. Pas d'historique. L'idée réservée reste dans la liste publique avec un marquage, et sort du formulaire. Refus de la seconde confirmation, même sous lock.
- **Rationale**: La spec exige au plus une réservation active et la disparition de « Je veux offrir » après annulation. L'historique n'est pas demandé.
- **Alternatives considered**: Statut `cancelled` conservé (audit inutile pour cette version).

## Filtres

- **Decision**: Les onze vues épinglées du doc ne sont copiées que lors de l'import du modèle, dans cette wishlist. « Outils de jardinage et bricolage » groupe `outil-jardinage` et `outils-bricolage`. « Crochet (Sam) » filtre le type Crochet. « Alex » et « Sam » filtrent le Qui. « Couple » n'a pas de bouton sur ce modèle. « Maison » est une vue épinglée de libellé Maison dont `typeIds` vaut `["divers"]`. Une liste créée vide n'a pas ces vues : un bouton apparaît avec chaque type et chaque Qui ajoutés. Une valeur de Qui ajoutée sur une liste importée reçoit un bouton, sauf `couple` qui reste sans bouton sur ce modèle.
- **Rationale**: Les boutons du doc ne sont pas une bijection avec les types, et ils n'ont pas de sens sur une liste vide. La sous-page Maison du doc, lue le 2026-10-18, affiche les lignes Divers, pas une liste vide.
- **Alternatives considered**: Imposer Alex / Sam / Maison à toute liste. Un bouton par type seulement sur le modèle (perd le groupe outils et le libellé Maison). Traiter Maison comme un type absent, ce qui vidait le bouton.

## Prix et libellés

- **Decision**: Prix stocké en centimes entiers, ou `null`. Affichage `€18.00` comme le doc, pas la virgule française. Priorité = chaîne libre ou `null`, jamais un tri. Libellés du seed copiés tels quels.
- **Rationale**: La spec demande deux décimales. Le doc source écrit `€18.00`. Inventer une échelle de priorité violerait la constitution.

## Identifiants

- **Decision**: À l'import, ids stables `item-001` … `item-079` dans l'ordre de l'annexe, préfixés par l'id de la wishlist pour rester uniques si deux imports coexistent. Types et personnes du modèle : `livres`, `cloe`, `couple`, eux aussi préfixés. Le nom n'est pas l'id.
- **Rationale**: Les tests et les formulaires d'édition doivent survivre à un renommage. Deux listes importées ne partagent pas les mêmes ids.

## Tests

- **Decision**: Logique de filtre, de réservation et de validation dans `src/domain`, sans import Next. Tests `node:test` lancés avec `tsx` (Node 20 n'a pas le strip TypeScript stable). Le quickstart couvre les parcours navigateur. Pas de Playwright dans cette version.
- **Rationale**: La constitution exige des tranches vérifiables. La course entre deux réservations se prouve sans navigateur.

## Hors scope technique

- **Decision**: Pas de synchro avec le doc Superhuman, pas de scrape de prix, pas de `output: 'standalone'`. `npm install` et `npm run build` se font dans l'app N0C, comme aujourd'hui.
- **Rationale**: Constitution, simplicité et mode de déploiement réel.
