# Revue de code

Revue complète, 2026-11-18, depuis `0b997dd` (tête de `staging` au départ de la branche).

## Fichiers relus

```text
0584284f34ca31549dbe06a446c947fc1154bd04  app/lists/[id]/page.tsx
c56e3907c8308440ae7bdf775ae9feafd0ee2209  components/site/list-access-help.tsx
1c6bb2b65d70ee77efc54bfd9f7ece6e6af31dcf  locales/en/list.json
b9537f0a9b99fc6e414efa8117c32e0fedbfc0d7  locales/en/mobile.json
520d54c80d6422914e0bc73179d036c58a2d7026  locales/fr/list.json
7d842c011b5c0022045dd5129767754e002ac511  locales/fr/mobile.json
fc20511ec06da1cf32eb280d8e2c528068648701  mobile/.maestro/flows/026-us2-management-link.yaml
c6cdc9329be9662ba804be97cd7c3e167e556150  mobile/__tests__/e2e/coverage.test.ts
9a509ae6c3174ff7ecbe3d897f1ba1d3176f8831  mobile/__tests__/helpers/fetch.ts
a7044518e9bf0141f83705d75497c34069b4ebfa  mobile/__tests__/links/app-config.test.ts
38a2992d310ba9cdcb1b3ea7957de1b6c836819d  mobile/__tests__/links/linked-list.test.ts
63b5cbe3027cb7abe66cf1d3f1989ec7f5d64d6f  mobile/__tests__/links/native-intent.test.ts
6a27919b6e6b24c9b04fedb0ec48ef244b40f098  mobile/__tests__/links/pending.test.tsx
e68db8316f9e37f5b8af6e10530357f567d978c5  mobile/__tests__/screens/links-invite.test.tsx
978bd623b3fc28c8ff279f1e7d0bf5e539f2a39e  mobile/__tests__/screens/links-list.test.tsx
7feb5cd19c7aa98a28c847b5c3285ed31210ab6a  mobile/app/links/invite/[token].tsx
a001006624709df87c526a79258d111f82ec7446  mobile/app/links/list/[listId].tsx
d5b6dd48adde9ecb406b187f65ab9abb0df4087c  mobile/src/features/account/SignInChoices.tsx
536b13c64c666c1025fc5b73664a9d40d3d04a7f  mobile/src/features/lists/ListAccessHelp.tsx
23ebe80e1f34c9b19a2ec5dd691d9f072d07fc74  mobile/src/features/lists/ListScreen.tsx
f972bfc863e54a8784d1bfe87eb93c127227d4df  mobile/src/features/lists/tab-routes.ts
e322e2c1ce9d5c8d665d4252600ef747baf73db0  mobile/src/links/linked-list.ts
fd70304a5d6bcb4e24d4141f9dbe54790a8f5a48  mobile/src/links/pending.ts
63c14a1006692cf0f6dc3dab99e635d3ff504be0  src/domain/subscription.ts
822e105e7a9fa155ee3a5675aa57c2632f0d7c28  src/site/app-link-routes.json
6e6858f460834cea05ee220e9fd448a8418612a2  src/site/app-links.ts
6f1b7988740c45af298aa26c1eb84ef14307d3cf  tests/domain/app-links.test.ts
6207dacfd554257338ae4f7f7766fe6ba05fbd4c  tests/domain/subscription.test.ts
```

## Règles métier et tests

- [x] tests/domain/subscription.test.ts:182 — T020 est cochée, mais le cas « membre et abonné → `subscribed: false` » n'est pas testé : dans la fixture, `lou` est membre de `solo` sans la suivre, donc la garde `!isMember &&` (qui évite de montrer un membre comme abonné, FR-004) n'est jamais exercée. Correction : ajouter un abonnement de `lou` à `solo` et vérifier que `viewerRelation(doc, "solo", "lou")` donne `{ isMember: true, subscribed: false }`.
- [x] app/lists/[id]/page.tsx:74 — La règle d'accès de FR-003/FR-004 est écrite dans la page, sans test de domaine : un non-membre reçoit `/l/<readToken>` seulement s'il est abonné. Seul `viewerRelation` est testé, une régression qui donnerait le jeton à un simple visiteur passerait inaperçue (US1 scénario 3, US3 scénario 1). Correction : déplacer la décision (non-membre → chemin de lecture suivi ou `null`) dans une fonction pure de `src/domain/subscription.ts`, testée dans `tests/domain/subscription.test.ts` pour l'abonné, le visiteur et le membre qui suit aussi la liste.

## Constitution et sécurité

Aucun point.

## Duplication

- [x] mobile/src/links/linked-list.ts:9 — `TAB_SCREEN` répète la table onglet → chemin d'écran ("" / "/archives" / "/reservations" / "/share" / "/settings") qui existe déjà sous le nom `routes` dans `mobile/src/features/lists/ListScreen.tsx:26`, avec d'autres clés : un nouvel onglet devrait être ajouté aux deux. Correction : exporter le chemin de chaque onglet depuis un seul module et construire `TAB_SCREEN` à partir de lui, par une table onglet du site → onglet de l'app.
- [x] mobile/app/links/list/[listId].tsx:26 — Le bloc `self` + `useEffect` (`setPendingLink` / `clearPendingLink` selon la session) + redirection `mustChangePassword` est copié de `mobile/app/links/invite/[token].tsx:44-48` et `79`. Correction : en faire un hook de `mobile/src/links/pending.ts` (par exemple `useResumableLink(self)`) utilisé par les deux écrans.
- [x] mobile/app/links/list/[listId].tsx:38 — `SignInFirst` répète le bloc « Se connecter / Créer un compte » de `mobile/app/links/invite/[token].tsx:81-93` (même `AuthLayout`, même `View`, mêmes clés `public:invite.login` / `register`, même `router.push`). Correction : un composant partagé dans `mobile/src/features/account/`, avec le préfixe de testID en prop, utilisé par les deux écrans.
- [x] mobile/__tests__/screens/links-list.test.tsx:62 — `signInAs` est une copie de celle de `mobile/__tests__/screens/links-invite.test.tsx:33`. Correction : la déplacer dans `mobile/__tests__/helpers/fetch.ts`, à côté de `me` et `fakeFetch`, et l'importer dans les deux tests.
- [x] mobile/__tests__/links/next-link.test.tsx:1 — Ce nouveau fichier teste `useNextLink` / `afterSignIn` de `mobile/src/links/pending.ts`, qui a déjà son fichier de test `mobile/__tests__/links/pending.test.tsx`. Correction : y ajouter ces cas plutôt qu'un second fichier (en ajoutant `useLocalSearchParams` à sa simulation d'`expo-router`).

## Conventions

Aucun point.

## i18n

Aucun point.
