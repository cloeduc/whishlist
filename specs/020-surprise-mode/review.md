# Revue de code

Revue complète de la feature 020, depuis `f85ceed` (fin de la 019).

## Fichiers relus

```text
b9700327e5cbe522164db3eff92242d94398d0a4  app/api/v1/capabilities/route.ts
8403d181790107ee677b447f1c7d88917a229f54  app/api/v1/lists/[listId]/reservations/route.ts
ff165ac9d98c12a4b0fe53e7e6b0ac44fff27dbd  app/api/v1/lists/[listId]/surprise-mode/route.ts
437bb13bf89313b8ec39a064db3fe6e02b0bd5ee  app/lists/[id]/page.tsx
1e3e14cd32e079c807b81a8a82229e470985441f  components/site/confirm-form.tsx
c256ae2b1101680a491f72cecb1fa0a594296221  components/site/reservation-card.tsx
0847d90a6c905273b20d0e37ce23d31892c6305f  components/site/reservations-reveal.tsx
c03ecb9528f643394651289e2684832a88f140ff  components/site/surprise-mode-form.tsx
5d33a4b504b7df0cc1b09f4bf2028b4d31c78524  drizzle/0006_surprise_mode.sql
73066428fe37937809dfab3127e1097ea15004be  locales/en/content.json
fe2d5442db2bdd660c1955e289ced6cf2d8acd87  locales/en/errors.json
35a72680fef3cfa06c92762e1080edd4c38f4d43  locales/en/list.json
e943fb13dc07e819550d482d2d20f627edc2b9a6  locales/fr/content.json
a766676666fcf87906abee1ab3cdd4bb31e3c696  locales/fr/errors.json
612af0869f86dbbb1af4f6eac079ba1b5375baf3  locales/fr/list.json
b597af430e5a22b212945bf86f1169f80452000a  mobile/.maestro/flows/020-us3-surprise-mode.yaml
8cde60c559e0a228665bc276abe1a478a50d79e1  mobile/.maestro/subflows/dev-client-reconnect.yaml
96a212bd936dcbe5d6bffdfb3c9dc91639ce6759  mobile/__tests__/data/sharing.test.ts
fca0b0dd5c1bcca60a4bf8304a23aad0bd686cf8  mobile/__tests__/e2e/coverage.test.ts
879cca8d499d27cf9c5276237d262b01ce260270  mobile/__tests__/features/ideas-accordion.test.tsx
0009e8f21407a52b15996d7b5fb60aee15285f5e  mobile/__tests__/features/incoming-share.test.tsx
541d207808da2860c55297302c039a95e719a13a  mobile/__tests__/offline/optimistic.test.ts
7ab8c6fede4c6b2fb615a07e9ed4bc4598e2ade6  mobile/__tests__/screens/archives.test.tsx
6ace7af6d6c24e8aec89e56f237bbcbe6d99f885  mobile/__tests__/screens/item-form.test.tsx
48990aa87f32d26e5c0db75d3a2795430d563cb4  mobile/__tests__/screens/item-transfer.test.tsx
28016cc14730bc642dd5e553a7db6ba15d758a7c  mobile/__tests__/screens/reservations.test.tsx
bbe4a7146d6af0443e40f4aece40b6e6d4632f7d  mobile/__tests__/screens/settings.test.tsx
bbc19c4970462c8756f910c35844faeb84d66f33  mobile/__tests__/screens/share.test.tsx
886ec632dc18da755edf9336eb951b20778f7bd7  mobile/app/(app)/lists/[listId]/archives.tsx
da6b77da37693e988db4ae6aa382e6f663a032de  mobile/app/(app)/lists/[listId]/reservations.tsx
dfd19250926198c6e2bdfe1fb3ea85978d529dca  mobile/app/(app)/lists/[listId]/share.tsx
702d7784dee1d17e162df8d56d41b38c66b6194e  mobile/src/data/sharing.ts
13556b73dbdcbfa5bb06aaa988ac6867f609e2b4  mobile/src/features/lists/ListScreen.tsx
5049438e2a1e261e38ef2d17a6aa9d4fa5b735a4  mobile/src/features/sharing/SurpriseCard.tsx
d859013e7f16d2f11924f8b9189eb22dbbd0c41b  mobile/src/offline/optimistic.ts
68604bf2ce510f79a44d254ac8fe4879f20dbb6f  mobile/src/ui/Checkbox.tsx
f10ca8bd65668c29ab41a129c17e2d12ce4c472c  scripts/create-demo-data.mjs
af19ef4271894f655ca8e5c29ad1204c64930221  specs/004-mobile-api/contracts/openapi.yaml
7d531a0e9dfbd84a80ddcb37b6e9000204638c32  src/domain/account.ts
d2aab0fc67cbb672037eae16a7b3ade0ef67b839  src/domain/import.ts
f12da1f3995e050f467c69c71d61095ce09959fb  src/domain/items.ts
fc1fcdc01210647dbafc2a593c59c54b70586b54  src/domain/membership.ts
dfcc5c326aed19bb209d1af7eb1aad153b5ba2e7  src/domain/offrir.ts
ffebfe2c5e977df58d57528c66fdd7cff89f95e9  src/domain/reserve.ts
d5a1916e7accdaaaac143b37f847bae2cf4e61be  src/domain/surprise.ts
b89e3fe439039bf68d97c1f6f02477cd8a4a97c3  src/domain/types.ts
398987804b16f1eac6b856e4da3661c30fcc379f  src/server/actions.ts
b3c2f4d9e7961a601a23721785f28119e5aa63fe  src/server/api/views.ts
7996684fa22c4f2729c6c5b1c861a5f6e9710ef1  src/server/commands/items.ts
c53d5e91013c3adbb4caa903fa0bbd0f9f966c97  src/server/commands/lists.ts
c4842d2f4b444b5aa5373b5af14089d7294c1b73  src/server/mcp/server.ts
b09dc8d7e678607c5c168a39b00983074f1ac053  src/store/legacy-json.ts
8d22d7375ef7c55630a43b04377a0304b39fdc4b  src/store/schema.ts
f58824d7b4562bfdd0beef0bf18066a96ce81f34  tests/domain/account-export.test.ts
fb6925c0d38ec5a77fa55b539c65357210a0614a  tests/domain/api-http.test.ts
c6cdec66bbb007f7310a6342a4e4efd8dbe66358  tests/domain/commands-client-ids.test.ts
30549f1f5b73a368b6ce0280f53445e98cfb9aeb  tests/domain/commands-items.test.ts
0fb877765395b1bb360caa7e7c1da9d16997bcfd  tests/domain/commands-lists.test.ts
b218dfef1e81332a826e4cfc1fc39bb17b693d81  tests/domain/commands-sharing.test.ts
58dd16baf55260a272f3efc8048c3b6fcbda4ce3  tests/domain/helpers/account-fixtures.ts
cc565a84a6ba3b5916b90caf2d1485f55aaafefb  tests/domain/helpers/api-fixtures.ts
c574aa085d2c9a5920dd25e5ea762ff3e4bc2b5e  tests/domain/items.test.ts
c8cef32797084e58f1e865a58f127396c82e7fa1  tests/domain/mcp-server.test.ts
cf18fd3af94d0c579663c894bbc9c065ecdf3f1d  tests/domain/move-copy.test.ts
11855803c12d7fea44978f68e145bd9b11f5a915  tests/domain/read-list.test.ts
290e0b8b61dd45f83e6e1054365e55d9c689c1ee  tests/domain/read-password.test.ts
e8f3e61ba75b54f8910a1be4fff489955fdcb3a6  tests/domain/reserve.test.ts
59c0e662f73feaabb025af4650ef296d7774fc95  tests/domain/store-import.test.ts
3db72f616707904ae734ee19b913376c040180a1  tests/domain/surprise.test.ts
```

## Règles métier et tests

- [x] mobile/src/features/lists/ListScreen.tsx:100 — Dans l'app, « Voir la liste partagée » ouvre la vue invité directement en mode surprise ; comparée à « Idées », elle montre quelles idées sont réservées (FR-011, cas limite « Voir comme invité », US3 scénario 3, SC-001). Correction : quand `list.surpriseMode`, afficher un `ConfirmDialog` avec les textes `list:surprise.guestView*` avant `viewAsGuest`, ajouter un test jest dans `mobile/__tests__/screens/` et la ligne dans `contracts/screens.md`.
- [x] src/domain/account.ts:205 — L'export « Télécharger mes données » contient toutes les réservations des listes du membre (offreur, mot), même en mode surprise, et n'exporte pas le réglage `surpriseMode` ; la spec n'en parle pas (FR-010). Correction : en mode surprise, n'exporter que les réservations faites par le membre (`byMe`) et exporter le réglage, avec un test dans `tests/domain/account-export.test.ts` ; ou écrire dans la spec que l'export vaut demande explicite.
- [x] src/server/commands/items.ts:64 — Les idées rendues par modifier / archiver passent par `asSeenBy`, mais aucun test ne le couvre (cas limites « Modifier une idée réservée » et « Archiver une idée réservée en mode surprise », R7). Correction : dans `tests/domain/commands-items.test.ts`, modifier puis archiver et remettre l'idée réservée `taken`, en mode surprise (`archived: false`, puis retour dans les idées) et hors mode surprise (`archived: true`).
- [x] tests/domain/api-http.test.ts:111 — T042 demande le cas « corps invalide → 400 » et un succès pour les deux routes ; le test n'appelle que les commandes et `apiError`, pas la vérification `typeof enabled !== "boolean"` de `app/api/v1/lists/[listId]/surprise-mode/route.ts:12` ni la forme `{ reservations }` du GET. Correction : ajouter ces cas dans `tests/domain/api-http.test.ts`.
- [x] specs/004-mobile-api/contracts/openapi.yaml:1003 — `contracts/api.md` prévoit un `401` sur `PUT /lists/{listId}/surprise-mode` et `GET /lists/{listId}/reservations`, absent du contrat OpenAPI (seulement 400/404 et 404, l. 1025). Correction : ajouter `"401"` aux deux opérations, puis `npm --prefix mobile run api:types`.
- [x] specs/020-surprise-mode/quickstart.md:45 — Le quickstart, T051/T052 et plan.md nomment `.maestro/flows/020-us3.yaml` ; le parcours écrit est `020-us3-surprise-mode.yaml`. Correction : mettre le vrai nom dans quickstart.md, tasks.md (T051, T052) et plan.md.

## Constitution et sécurité

- [x] src/domain/account.ts:205 — Même point que l'export ci-dessus, vu sous l'angle de la fuite : le nom de l'offreur et le mot sortent hors de l'action explicite « Voir les réservations ». Correction : voir le point des règles métier (un seul correctif).

## Duplication

- [x] components/site/reservations-reveal.tsx:56 — La boîte de confirmation (déclencheur, titre, description, « garder », bouton de confirmation) recopie celle de `ConfirmForm`. Correction : utiliser `components/site/confirm-form.tsx` avec une action qui appelle `revealReservationsAction` puis `setOffers` / `setError` (au besoin, une prop `disabled` sur `ConfirmForm`).
- [x] components/site/guest-view-link.tsx:23 — Troisième copie du même squelette de dialogue, avec un lien à la place du formulaire. Correction : donner à `ConfirmForm` une variante lien (`href`), ou en extraire un composant de confirmation commun, et l'utiliser ici.
- [x] src/domain/surprise.ts:15 — `reservedItemIds` refait l'ensemble déjà construit par `availableItems` (`src/domain/reserve.ts:14`). Correction : faire appeler `reservedItemIds` par `availableItems` (ou déplacer l'aide dans `reserve.ts`).

## Conventions

- [x] app/lists/[id]/page.tsx:97 — La règle « en mode surprise, aucune réservation » est écrite dans la page (`surpriseMode ? [] : listOffrir(...)`) et une seconde fois dans `src/server/api/views.ts:292` ; AGENTS.md veut les règles métier dans `src/domain/` et des pages « sans règle métier ». Correction : une fonction pure `visibleReservations(doc, wishlistId, userId)` dans `src/domain/surprise.ts`, testée dans `tests/domain/surprise.test.ts`, appelée par la page et par `toMemberListView`.

## i18n

Aucun point.
