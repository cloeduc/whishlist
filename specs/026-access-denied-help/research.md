# Research: Aide sur la page « Accès refusé » d'une liste

## R1. Où l'app reçoit l'adresse de gestion

- **Decision** : ajouter `{ "site": "/lists/:listId", "app": "/links/list/:listId", "keepQuery": ["tab"] }` à `src/site/app-link-routes.json`. Le nouvel écran vit dans `mobile/app/links/list/[listId].tsx`, à côté des autres écrans de lien (`invite`, `confirm-email`, `reset-password`), hors du groupe `(app)` qui exige une session.
- **Rationale** : une seule table alimente déjà l'association iOS (`/.well-known/apple-app-site-association`), les intent filters Android (`mobile/app.config.ts`) et la résolution dans l'app (`appPathForSiteUrl`). Les formes anciennes (`/listes/<id>`, `?onglet=partage`) sont traduites par `canonicalSitePath` et `legacySitePatterns` sans rien ajouter (FR-009). Un écran de lien peut garder l'adresse pendant la connexion (R4).
- **Alternatives considered** : pointer directement vers `/lists/:listId` de l'app : un non-membre arriverait sur un écran de liste vide ou en erreur, et sans session le groupe `(app)` renverrait vers la connexion sans garder l'adresse. Rejeté.
- **Commentaire à retirer** : `src/site/app-links.ts` dit « No `/lists/:id`: the app opens these site pages on purpose (« Gérer le partage sur le site ») ». L'app n'ouvre plus aucune page de gestion du site (seul `LegalScreen` ouvre le site, pour les pages légales) : la raison n'existe plus.

## R2. Versions de l'app déjà installées

- **Constat** : iOS lit le fichier d'association du site au fil de l'eau (route `force-dynamic`). Dès le déploiement du site, une app iOS installée (1.0.x, 1.1.x) recevra `/lists/*` ; sa table ne connaît pas l'adresse, `+native-intent.tsx` renvoie alors l'écran d'accueil. Android, lui, lit les intent filters compilés dans l'app : les versions installées continuent d'ouvrir le navigateur jusqu'à leur mise à jour.
- **Decision** : accepté (spec, Hypothèses). Ordre conseillé : publier d'abord la nouvelle version de l'app sur les stores, puis merger sur `main`. Pour une app iOS pas à jour, l'écran d'accueil montre au moins « Mes listes » (où la propriétaire retrouve sa liste).
- **Alternatives considered** : n'ajouter `/lists/*` au fichier Apple qu'à partir d'une date ou d'une variable : mécanisme de plus pour une période courte (principe V). Rejeté.

## R3. Décision de l'écran de l'app

- **Decision** : module pur `mobile/src/links/linked-list.ts`, `linkedListTarget(listId, tab, data)` où `data` est la copie de `GET /lists` (`lists: ListSummary[]`, `subscriptions: SubscribedListSummary[]`) :
  - `listId === "new"` → `/lists/new` (le site a `/lists/new`, que la table capte aussi : R5) ;
  - membre (`lists` contient l'id) → `/lists/<id>` + suffixe d'onglet : `sharing` → `/share`, `archive` → `/archives`, `reservations` → `/reservations`, `settings` → `/settings`, autre → rien (FR-013). L'onglet est lu par `parseListTab` (`src/site/list-tabs.ts`, déjà pur et partagé), qui accepte aussi les anciennes valeurs françaises ;
  - abonné (`subscriptions` contient l'id) → aide avec « Voir la liste » vers `/guest/<readToken>` (comme la carte de « Mes listes », `mobile/app/(app)/index.tsx`) ;
  - sinon → aide simple.
- **Données** : l'écran rafraîchit `GET /lists` (`refreshLists`) puis décide ; hors ligne ou en erreur, il décide sur la copie locale (cas limite de la spec). Pendant le rafraîchissement : état de chargement.
- **Rationale** : `GET /lists` donne déjà les deux listes avec leurs `id` (`SubscribedListSummary.id`, `readToken`) : aucune route ni champ nouveau, aucune fuite (le serveur ne renvoie que les listes du compte). Ne pas appeler `GET /lists/{id}` : son 404 mélange « inexistante » et « pas membre », ce qui convient, mais il ne dit rien de l'abonnement.

## R4. Sans session

- **Decision** : même schéma que `mobile/app/links/invite/[token].tsx` : sans session, l'écran pose `setPendingLink("/links/list/<id>[?tab=…]")` et affiche l'invitation à se connecter ; `afterSignIn()` y revient. `useNextLink` (`mobile/src/links/pending.ts`) garde aussi les `next` qui se résolvent en `/links/list/…`, pour l'adresse de prod `/connexion?next=/listes/<id>` (FR-009, FR-012). `mustChangePassword` → `/change-password`, comme les autres écrans de lien.

## R5. `/lists/new` capté par la table

- **Constat** : le motif Apple `/lists/*` et le préfixe Android `/lists/` couvrent aussi `/lists/new` du site.
- **Decision** : la fonction pure envoie `new` vers l'écran « Nouvelle liste » de l'app (`mobile/app/(app)/lists/new.tsx`). Test dans `linked-list.test.ts`. Pas d'exclusion dans le fichier Apple (Android ne sait pas exclure, les deux plateformes resteraient incohérentes).

## R6. Site : page d'aide et bouton « Partager »

- **Decision** :
  - `components/site/list-access-help.tsx` (serveur), reçoit `readUrl | null` : titre, explication, « Comment voir la liste », retour à « Mes listes » (`LinkButton` vers `withLocale(locale, "/lists")`), et pour l'abonné un bouton « Voir la liste » vers `/l/<readToken>` (la page publique applique déjà le mot de passe de lecture, FR-004). Mise en page avec `Empty` ou `Card` de `components/ui/`, comme les autres pages d'état.
  - La relation vient de `viewerRelation(doc, id, user.id)` ; le `readToken` n'est lu que si `subscribed` (FR-003).
  - En-tête de la page de gestion : `LinkButton` « Partager » vers `?tab=sharing` (`tabHref`), visible sur tous les onglets (FR-006), masqué quand on est déjà sur l'onglet Partage.
  - Onglet Partage : une phrase sous la description (`share.addressNote`) : l'adresse de cette page est réservée aux personnes qui gèrent la liste ; pour partager, envoyez le lien de la liste (FR-007).
- **Textes** : namespace `list` (déjà chargé par la page et lu par l'app via `LIST_TAB_LABEL_KEY`), groupe `accessHelp`. Les clés `errors.accessDenied` et `errors.notMember` restent (utilisées ailleurs : `translateError`, app `sharing.ts`).
- **Alternatives considered** : afficher le prénom de la propriétaire pour aider la personne : contraire à FR-003. Rejeté.

## R7. App : apparence de l'écran d'aide

- **Decision** : `ListAccessHelp` compose `Text`, `Button`, `Alert` de `mobile/src/ui/` dans la mise en page des écrans de lien (`AuthLayout`, comme l'invitation), sans style en dur. Mêmes clés que le site (`list:accessHelp.*`), avec `mobile:` seulement si un texte est propre à l'app (aucun prévu). testID : `link-list.screen`, `link-list.help`, `link-list.view-followed`, `link-list.back`, `link-list.loading`.
- **Parcours Maestro** (`026-us2`) : compte démo connecté ; `openLink` sur `ohyoushouldnt://lists/<id d'une liste du compte>` → `list.screen` ; sur `ohyoushouldnt://listes/<id d'une autre liste>` (forme ancienne) → `link-list.help` puis `link-list.back` → `lists.screen`. L'id d'une liste d'un autre compte vient de la base e2e (script existant ou `GET` de démo, à choisir aux tâches).
