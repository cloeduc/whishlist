# Research : suites de l'audit Next.js (015)

Sources : guides de `node_modules/next/dist/docs/` (Next 16.4.2), code du dépôt au 2026-11-06.

## R1. Formulaires : état d'action au lieu de la redirection `?e=`

- **Decision** : chacun des 13 formulaires de l'US1 devient un composant client qui appelle `useActionState(action, null)`. L'action prend `(prev, formData)` et, en cas de refus, **rend** `{ error, values }` au lieu de rediriger. `values` ne contient que les champs listés comme gardés pour ce formulaire ([contracts/form-states.md](contracts/form-states.md)), jamais un mot de passe. Sur succès, l'action redirige comme aujourd'hui (`redirect()` marche dans une action appelée par `useActionState`). Les champs reçoivent `defaultValue={state?.values.x}`.
- **Rationale** : c'est le modèle recommandé (`01-app/02-guides/forms.md`, « Validation errors ») et celui de `components/site/item-form.tsx` (`saveItemAction` rend `{ error, draft }`). Sans JavaScript, le formulaire est posté au serveur, qui rend la page avec l'état de l'action : FR-003 est tenu sans code à part.
- **Point à vérifier à l'implémentation** : React 19 remet un formulaire à zéro après une action. Le reset rétablit `defaultValue`, qui vaut alors la valeur rendue par l'action. Si un champ revient vide quand même, passer une `key` qui change à chaque refus (le formulaire se remonte avec les nouvelles valeurs). Le vérifier sur l'inscription avant de traiter les autres formulaires.
- **Messages** : le composant traduit le code avec les clés existantes. L'inscription, la connexion et les mots de passe gardent leurs clés de page (`auth:register.errorPassword`…), les autres passent par `errors:<code>`, comme les pages aujourd'hui. Pas de nouveau texte.
- **Adresses `?e=` existantes (FR-005)** : les pages arrêtent de lire les codes que seules les actions migrées produisaient. Une ancienne adresse s'ouvre sans message. Les codes encore posés par d'autres actions (boutons seuls : `deleteAccountAction`, `subscribeAction`, `cancelMyReservationAction`, `joinInviteAction`, actions de l'onglet d'une liste par `redirectToList`) restent lus.
- **Correction de la spec** : l'inscription avec une adresse déjà utilisée ne doit **pas** afficher d'erreur. Le code l'accepte volontairement en silence (`registerAction` : « Email already registered: same screen, no sign-in (an email was sent) ») pour ne pas révéler qui a un compte. Le scénario 1 de l'US1 prend donc l'exemple du mot de passe trop court.
- **Alternatives rejetées** :
  - Mettre la saisie dans l'adresse de la redirection : elle irait dans l'historique et les journaux (cas limite de la spec).
  - Un cookie flash avec la saisie : c'est un mécanisme de plus pour un résultat que `useActionState` donne déjà.
  - Contrôler les champs avec `useState` : cela ne marche pas sans JavaScript.

## R2. Une seule demande après une action (US3)

- **Decision** : `transferItemAction`, `manageLabelAction` et `createApiKeyAction` appellent `refresh()` de `next/cache` avant de rendre leur résultat. Les composants retirent leur `router.refresh()`. Dans `label-chips.tsx`, le retour en arrière à la main (`setChips(items)`) est remplacé par `useOptimistic` : la puce s'affiche tout de suite et l'état optimiste disparaît à la fin de la transition, remplacé par la page à jour ou par l'état d'avant si le serveur refuse.
- **Rationale** : `refresh()` « refresh the client router from within a Server Action » (`03-api-reference/04-functions/refresh.md`). La page à jour revient avec la réponse de l'action, en un seul aller-retour.
- **Cas de `api-keys-card.tsx`** : quand un avis (`?k=revoked`) est dans l'adresse, le composant fait `router.replace(pathname)`, ce qui recharge la page une seconde fois. Il le remplacera par `window.history.replaceState(null, "", pathname + hash)`, que le routeur suit sans nouvelle demande (API History native, suivie par le routeur : `01-app/01-getting-started/04-linking-and-navigating.md`, « window.history.replaceState »).
- **Alternatives rejetées** : `revalidatePath` (fait pour le cache, que le site n'utilise pas : rendu à la demande partout) ; garder le `router.refresh()` client (deux allers-retours, c'est le point de l'audit).

## R3. Page d'erreur générale (US2)

- **Decision** : créer `app/global-error.tsx`, un composant client avec ses propres `<html>` et `<body>` (exigés par la doc), qui importe `./globals.css`. Il calcule la langue avec `stripLocalePrefix(usePathname())` (`src/i18n/locale-path.ts`), français par défaut, et enveloppe son contenu dans `I18nProvider`. Il réutilise les clés `common:error.title`, `common:error.body` et `common:error.retry`, avec une nouvelle clé `common:error.home` (« Revenir à l'accueil » / « Back to home ») et un lien vers `withLocale(locale, "/")`. Le bouton appelle `retry()`.
- **`app/error.tsx`** : il appelle aujourd'hui `reset()`. La doc (`03-file-conventions/error.md`, `retry` stable depuis 16.3.0) recommande `retry()`, qui recharge les données au lieu de seulement réafficher. On passe aussi cette page à `retry()`, pour que « Réessayer » fasse la même chose partout.
- **Sans session ni base (FR-007)** : le composant n'importe que `src/i18n/` (modules purs et ressources) et les primitives `components/ui/`.
- **Risque** : `usePathname()` au rendu serveur de la page d'erreur peut rendre le chemin réécrit par `proxy.ts` (sans `/en`). Si la langue diffère entre le rendu serveur et le navigateur, le texte se corrige à l'hydratation (React le signale en dev). C'est acceptable pour une page de panne, et le quickstart le vérifie en `/en`.
- **Alternative rejetée** : lire la langue dans un cookie ou un en-tête. Un composant client ne lit pas les en-têtes, et le cookie de langue n'est pas posé pour toutes les visites.

## R4. Garde-fou `server-only` (US4, point c)

- **Decision** : ajouter la dépendance `server-only` et mettre `import "server-only";` en tête de chaque fichier de `src/store/`, `src/auth/` et `src/server/` (dont `commands/`, `api/`, `mcp/`), **sauf** `src/server/actions.ts`. Ce fichier est en `"use server"` et les composants clients l'importent légitimement (9 imports) ; le compilateur le remplace par des références côté client.
- **Tests et scripts** : hors de Next, `server-only` lance une erreur, sauf sous la condition d'export `react-server` (qui pointe vers `empty.js`). Les commandes `node --import tsx` de `package.json` (`test`, `demo:data`, `db:check` et les autres) prennent `--conditions=react-server`. Essai fait le 2026-11-06 : les 389 tests passent sous cette condition. Parmi les dépendances directes, seuls `react` et `react-dom` exportent une variante `react-server`, et aucun test ne les importe.
- **App mobile** : elle reprend seulement `src/i18n/`, `src/domain/` et des modules purs, sans fichier marqué. Rien ne change pour elle.
- **Vérification (SC-006)** : un essai unique, noté dans le quickstart. On ajoute à un composant client un import de `@/src/store/db`, puis `npm run build` doit échouer avec le message de `server-only`. On retire ensuite l'import.
- **Alternatives rejetées** :
  - Une règle ESLint `no-restricted-imports` sur les fichiers clients : ESLint ne sait pas quels fichiers sont en `"use client"`.
  - Marquer seulement quelques fichiers d'entrée : un import direct d'un fichier non marqué passerait.

## R5. Déclarations `force-dynamic` (US4, point e)

- **Constat** : 62 fichiers. Ce sont 14 pages, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` et 45 gestionnaires de route (API v1, MCP, `.well-known`, `compte/export`, `u/[...path]`).
- **Decision** :
  - **Pages et layout** : retirer la déclaration. Le layout lit `cookies()` par `currentUser()`, donc toutes les pages sont rendues à la demande.
  - **Gestionnaires de route** : retirer la déclaration partout où le gestionnaire lit la requête (`withApi` lit les en-têtes d'authentification), c'est-à-dire l'API v1, MCP, `compte/export` et `u/[...path]`.
  - **À garder, avec un commentaire qui dit pourquoi** : `robots.ts`, `sitemap.ts` et les deux routes `.well-known`. Ils lisent l'environnement à l'exécution, et l'image est construite avec des valeurs factices.
- **Vérification** : comparer le tableau des routes de `npm run build` avant et après. Chaque route marquée `ƒ` (dynamique) doit le rester ; une route qui passerait en `○` (statique) reprend sa déclaration, avec son commentaire. Les GET de gestionnaires ne sont plus mis en cache par défaut depuis Next 15 (`02-guides/upgrading/version-15.md`), mais le tableau du build tranche.
- **Ajustement de la spec** : FR-011 et SC-005 disent « seuls les fichiers qui en ont besoin, chacun commenté » au lieu d'un nombre fixe, puisque le build peut en garder d'autres.

## R6. Un seul démarrage en production (US4, point f)

- **Constat** : `app.js` date de l'hébergement mutualisé (le premier commit). `next.config.ts` produit déjà la sortie `standalone`, et l'image lance `node server.js`. `npm start` lance `app.js`, un serveur maison qui charge `next` en mode prod, et aucune documentation ne le cite.
- **Decision** :
  - Supprimer `app.js`.
  - Ajouter un script `postbuild` qui complète `.next/standalone` comme le fait le Dockerfile, avec `public/`, `.next/static/`, `drizzle/` et `data/seed.json`.
  - `npm start` lance `scripts/start.mjs`. Ce petit script donne à `WISHLIST_DATA_PATH` un chemin absolu vers `data/wishlist.json` du dépôt quand la variable manque, puis importe `.next/standalone/server.js`.
  - Le Dockerfile copie le dossier `standalone` déjà complet et garde ses propres `ENV` (`PORT`, `HOSTNAME`, `WISHLIST_DATA_PATH=/data/…`), son contrôle de santé et `CMD ["node", "server.js"]`.
- **Pourquoi un chemin absolu** : `server.js` fait `process.chdir(__dirname)`. Sans chemin absolu, `npm start` ouvrirait une base vide dans `.next/standalone/data/`, effacée à chaque build.
- **Rationale** : c'est le même `server.js` dans les deux cas (FR-013), lancé selon la doc (`03-api-reference/05-config/01-next-config-js/output.md`), avec `PORT` et `HOSTNAME` lus de la même façon.
- **Alternative rejetée** : `next start`. Next prévient qu'il ne marche pas avec `output: "standalone"`, et ce ne serait pas le serveur de l'image.
- **Docs** : le README dit ce que fait `npm start`, et `deploy/DEPLOY-RUNTIPI.md` est relu ; il ne cite ni `app.js` ni `npm start` aujourd'hui.

## R7. Point (g) : hors périmètre

La lecture ciblée de la base (étape 2 de la 008) est écartée (Clarifications, 2026-11-06). Rien dans cette feature ne touche `getDocument()`.

## Écarts à l'implémentation

### US1 (2026-11-06)

- **Remise à zéro (T004)** : avec `defaultValue` seul, les champs gardés revenaient bien, mais le mot de passe restait affiché : React n'a pas vidé le formulaire. Chaque formulaire prend donc `key={state?.attempt ?? 0}`, et `FormState` a un champ `attempt` (`refusal()` dans `src/server/form-state.ts`). Le formulaire se reconstruit à chaque refus : les champs gardés reprennent `values`, les mots de passe reviennent vides. Vérifié dans Chromium (Playwright) pour les formulaires 1, 2, 4, 5, 6, 7, 9, 10, 12 et 13, puis sur un build de production pour l'inscription.
- **Réglages de la liste (n° 9)** : ses champs sont contrôlés. Il perdait ses brouillons après un refus, parce que l'action rafraîchit la page (elle touche aux cookies de session) et que le composant comparait l'objet `theme` reçu en props par identité. Il le compare désormais par valeur. Pas de `key` pour ce formulaire.
- **Réservation (n° 10)** : `itemId` est gardé pour la variante avec liste de choix, et l'action appelle `refresh()` sur un refus.
- **Nouvelle liste (n° 8)** : aucun refus n'est atteignable depuis le formulaire (un titre vide prend un nom par défaut). La conversion suit le même modèle, vérifiée par les types et par un envoi réussi.
- **Sans JavaScript (FR-003)** : non vérifiable. Sans JavaScript, aucune page du site ne s'affiche, ni en dev ni en prod : `app/loading.tsx` enveloppe chaque page dans un `Suspense`, et le contenu arrive dans un `<div hidden>` que seul le script de React insère. C'était déjà le cas avant cette feature. Les actions restent compatibles (elles sont passées à `<form action>`), mais il faut une décision : retirer ou déplacer `app/loading.tsx`, ou abandonner FR-003.
- **Succès inchangés (FR-004)** : vérifiés pour la connexion (vers `next`), l'inscription avec une adresse déjà prise (écran « e-mail envoyé », sans erreur), la création d'une liste et une réservation (`?ok=1`).

### US2 (2026-11-06)

- `global-error.tsx` ne s'affiche qu'en production (en dev, c'est l'overlay de Next). Vérifié sur un build de production, avec un `throw` temporaire dans `RootLayout` puis dans `app/compte/page.tsx`, en `/` et en `/en` : la page générale s'affiche dans la bonne langue et aux couleurs du site, avec « Réessayer » et « Revenir à l'accueil ». L'erreur d'une page seule garde `app/error.tsx` dans la mise en page du site. Aucun avertissement d'hydratation lié à la langue : `usePathname()` rend le chemin avec `/en` au rendu serveur aussi.
- « Réessayer » (`retry()`) relance une demande au serveur dans les deux cas.
- La console montre l'erreur React n° 441 : c'est le message masqué en production d'une erreur serveur (le `throw` de test), attendu.
- Piège de test : en production, un `SESSION_SECRET` de moins de 32 caractères fait échouer le layout, donc toute page tombe sur la page générale.

### US3 (2026-11-06)

- Vérifié dans Chromium, en comptant les requêtes portant l'en-tête `Next-Action` ou `RSC` : une seule requête pour l'ajout d'une catégorie, le refus d'une catégorie en double, la suppression d'une catégorie, la copie d'une idée vers une autre liste et la création d'une clé d'API (avec ou sans `?k=revoked` dans l'adresse).
- `label-chips.tsx` n'était pas vraiment optimiste avant (le `setChips(items)` du refus ne changeait rien). Avec `useOptimistic`, la puce s'affiche tout de suite et disparaît d'elle-même si le serveur refuse. L'ajout découpe la saisie comme le serveur : `splitLabels` est passé dans `src/domain/split-labels.ts`, un module pur, et `src/domain/items.ts` le réexporte. Le navigateur n'importe donc pas `items.ts`, qui tire `node:crypto`.
- Clés d'API : l'avis `?k=…` s'affiche tant que `k` est dans l'adresse (`useSearchParams`). Après une création, `window.history.replaceState` retire `k`, ce qui masque l'avis sans nouvelle requête.

### US4 (2026-11-06)

- **server-only** : 40 fichiers marqués. `npm test`, `npm run typecheck`, `npm run build`, `npm run db:generate` (« No schema changes »), `demo:data` et `db:check` passent. Trois tests de domaine lancent des processus `node --import tsx` (`demo-seed`, `store-concurrency`, `store-import`) : ils prennent aussi `--conditions=react-server`, comme `mobile/scripts/e2e.mjs`. Le lockfile a été écrit par npm 10 (`npx npm@10 install server-only`) : le `npm install` local retirait les entrées `@emnapi/*` dont `npm ci` en npm 10 a besoin.
- **SC-006** : avec `import "@/src/store/db";` dans `components/site/label-chips.tsx`, `npm run build` échoue avec « You're importing a module that depends on "server-only" », et la trace remonte `label-chips.tsx` → `src/store/db.ts` → `src/store/connection.ts`. Après ce build raté, Turbopack a planté deux fois de suite (« generate_source_map was canceled ») jusqu'à la suppression de `.next/`.
- **force-dynamic** : 58 déclarations retirées. Le tableau des routes du build local est identique à celui de `main` (68 routes `ƒ`, `/icon.png` statique). **Mais** le build Docker a échoué sans la déclaration du layout racine : Next tente alors de pré-rendre `/_not-found` et `/changer-mot-de-passe`, et le code de session refuse le `SESSION_SECRET` factice de l'image (`docker-build-placeholder`, trop court) avant d'appeler `cookies()`. Le layout garde donc sa déclaration, avec un commentaire : elle couvre toutes les pages et empêche tout rendu pendant le build. Restent 5 fichiers : `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` et les deux routes `.well-known`, tous commentés. SC-005 est ajusté.
- **Démarrage** : `app.js` est supprimé. `postbuild` (`scripts/prepare-standalone.mjs`) complète `.next/standalone` et `npm start` (`scripts/start.mjs`) le lance. Vérifié avec `PORT=3020 WISHLIST_DATA_PATH=tmp/015-demo.json npm start` : la liste de démo, le CSS et `public/` répondent, et aucune base n'est créée dans `.next/standalone`. L'image se construit et le conteneur passe `healthy`. Avec `APP_ORIGIN=https://exemple.test` et `APPLE_TEAM_ID=ABCDE12345`, `/robots.txt` et `/.well-known/apple-app-site-association` reflètent ces valeurs.
- **Écart découvert** : le traçage de Next copie `data/mail.log` (journal du dev local) dans `.next/standalone/data/`, et donc dans l'image : `.dockerignore` n'excluait que les `*.log` de la racine. Ajout de `data/*.log` à `.dockerignore`, puis vérifié dans l'image reconstruite.

### Polish (2026-11-06)

- `npm run typecheck`, `npm test` (396 tests), `npm run build` et `npm --prefix mobile test` (264 tests) passent. `npm run lint` signale 35 erreurs, toutes dans `.claude/worktrees/agent-ac1f606b0d49db6da/`, un worktree laissé par une autre session (branche `feat/api-keys-mcp`) que `eslint .` parcourt aussi ; `npx eslint . --ignore-pattern ".claude/**"` passe sans erreur.

