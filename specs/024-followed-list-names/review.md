# Revue de code

Revue complète de la feature 024, depuis `staging` (`31a696c`), branche `024-followed-list-names`.

## Fichiers relus

```text
ac84846730e26b47fcfd6edd48404136559dc087  app/api/v1/capabilities/route.ts
eca7f7b8ae6ad72c8d8ff942c14e6a8fcdb5f97f  app/api/v1/subscriptions/[readToken]/route.ts
89fa55aa15d484d7994f27acc3770238e5683c73  app/l/[readToken]/page.tsx
25acdbe39c8f0f83d151433f1d6e9276be9f3fec  app/page.tsx
c4c5fafcc5538b8519c42dbff1d80f0e8e759658  components/site/follow-names-dialog.tsx
2f7d881a6f6cd3fef87c3c7ec79ac12a41cb4605  drizzle/0007_followed_list_names.sql
618098a27b9f282370e1d6ed1cbbfa45cbff7c8d  locales/en/errors.json
8d29e5ef5ab01e8f96cf2c961e22cc720f3dc468  locales/en/home.json
388a8134529c1c987f541bfab1a88b97bb4a0347  locales/en/public.json
615406219992a4a366bc6680374364be681ab919  locales/fr/errors.json
fbc1a5c67fd8ccdc17faa733ffc8310461bee3db  locales/fr/home.json
8023343474be9f249950d37c82af6a89c2b5a830  locales/fr/public.json
4e6d50af093b34db69d26ff3e0474f797a1fef43  mobile/__tests__/e2e/coverage.test.ts
e18b053444607270146bcaed0b5f42b0198ac1d0  mobile/__tests__/helpers/public-list.ts
b9b48a56cd9f8fcec370b35e9453461eb7c3bd04  mobile/__tests__/screens/followed-lists.test.tsx
bc642a7ed7509ca92f8d8f3a19e139f7a12af340  mobile/__tests__/screens/guest-list.test.tsx
94cf1e5f16a602587ff62479831d7e1eef5328b6  mobile/.maestro/flows/024-us1-rename-followed.yaml
35c1246485bc2bd90ed1ac555ef95d6a2187739b  mobile/app/(app)/index.tsx
6ccacccbf60e8f0d012df74af9fe3802f9522b1b  mobile/app/guest/[readToken]/index.tsx
ea03fb711cf46bdb43fd38a41bc47db44769f220  mobile/app/guest/[readToken]/names.tsx
97451285b8657719fc0fe2321a5e5287b87df14f  mobile/src/data/store.ts
ee70d3357835d74af7508b1d419de42e6ba24f38  mobile/src/data/subscriptions.ts
ff7cd827622659a43cdede079fb8c0413d00799a  mobile/src/features/guest/GuestFollow.tsx
72f579f1fa846a6eed561091a849dd81e167f2cf  mobile/src/features/guest/GuestListHeader.tsx
75d7f3b99c26872fa12b45e332930aa7ff149f50  specs/004-mobile-api/contracts/openapi.yaml
ff647f9c0334069c478f0816e102ec6b2f3e88a1  src/domain/account.ts
df8597927956a5a501e0099c21405a0d398b4139  src/domain/followed-display.ts
d59e02ebb4100820aa9e91289c010f53c87ad151  src/domain/items.ts
8dd1c405a725be77d8f0d4ee2de21dbf61d7db8e  src/domain/membership.ts
632c3fceff32b09e332c985eadff7233a617b18a  src/domain/subscription.ts
9e38661363a0e2a30c5aaa43b3e23c81a096a719  src/domain/text.ts
6b1260cbea87796d8d42e2d159e6ee4c7d069cf3  src/domain/types.ts
cc04039acec534896f6b1892a5fa3bbc2c8b268f  src/server/actions.ts
07b712965aaa0b1a669f3c3b7d67ac1bc0767a50  src/server/api/http.ts
e64e8384365ffe5f381df3ad9fcdda8fa151ef5b  src/server/api/views.ts
e43f784e0c6292116d2528b337c78396294fa035  src/server/commands/public-list.ts
1d834805590e27c06d240c68d74a902da0ba990d  src/store/legacy-json.ts
b897d0463875d6920ce4950de77d2515a4869b76  src/store/schema.ts
66b7a87d7afe086b666f848f2803fa4ff33c8431  tests/domain/account-export.test.ts
ba60a5cf375004e0b5f9b3e74c5ab6c2e1820505  tests/domain/api-http.test.ts
b2d37d053246b6e92bfe0a8910be0b57bf3bf966  tests/domain/commands-subscription.test.ts
89f4a44a7fd79cf96865f465126a63bf5bc06802  tests/domain/followed-display.test.ts
033b690e3cf38af405f73fecc33dfb8c153e79d5  tests/domain/helpers/account-fixtures.ts
9b48a9785bad379e549cb0b1e8946bda984c1087  tests/domain/store-import.test.ts
fe701a2ea10ed4d9d1f684900661f3959f3c5871  tests/domain/subscription.test.ts
```

## Règles métier et tests

- [x] app/api/v1/subscriptions/[readToken]/route.ts:8 — `nameOrNull` change un champ absent ou qui n'est pas une chaîne (nombre, objet, clé manquante) en `null` : un corps mal formé efface les noms enregistrés, alors que le contrat (contracts/api.md) dit « 400 … ou corps invalide ». Correction : répondre 400 quand un champ n'est ni une chaîne ni `null`, ou manque, et tester ce cas dans tests/domain/commands-subscription.test.ts ou le test de la route.
- [x] components/site/follow-names-dialog.tsx:111 — « Revenir aux noms de la liste » envoie `null` pour les deux noms, donc efface aussi la personne ; la spec (US1, scénario 4 et Independent Test) parle de « Revenir au titre de la liste », alors que contracts/screens.md dit que le bouton envoie deux `null`. Correction : accorder spec.md et contracts/screens.md (dire que la personne revient aussi au nom du propriétaire, ou ne remettre que le titre), avec le même comportement dans `mobile/app/guest/[readToken]/names.tsx`.
- [x] locales/fr/public.json:107 — La clé `followNames.saved` (« Noms enregistrés », aussi en EN, listée dans contracts/screens.md, T012) n'est utilisée nulle part : ni la boîte du site ni l'écran de l'app n'affichent de confirmation. Correction : l'afficher après un enregistrement réussi, ou la retirer des deux langues et de contracts/screens.md.
- [x] tests/domain/store-import.test.ts:57 — Aucun test ne vérifie qu'un abonnement d'un ancien `wishlist.json`, sans `customTitle` / `customOwnerName`, se lit avec `null` (T002, R8, data-model). Correction : dans ce test, garder un abonnement sans les deux champs et vérifier qu'ils reviennent à `null`.
- [x] tests/domain/account-export.test.ts:105 — L'export n'est vérifié qu'avec des noms `null` : rien ne montre que des noms choisis y figurent, et seulement dans l'export de l'abonné (FR-007, FR-008, T011). Correction : donner des noms à l'abonnement de la fixture et vérifier qu'ils sont dans l'export de l'abonné et absents de celui du propriétaire.

## Constitution et sécurité

- [x] src/server/api/views.ts:267 — `toSubscribedListSummary` rend `ownerName` même quand l'abonnement est verrouillé (mot de passe de lecture changé), alors que la même vue cache déjà le contenu (`itemCount: 0`) : un abonné qui a perdu l'accès reçoit encore le nom du propriétaire par `GET /lists` et `PUT /subscriptions/{readToken}` (FR-011, principe II). Correction : `ownerName: null` quand `locked`, en gardant `customTitle` et `customOwnerName`, qui sont à l'abonné.
- [x] app/page.tsx:84 — Même fuite sur le site : la carte d'une liste suivie verrouillée affiche le nom du propriétaire (personne affichée, aide et placeholder du dialogue). Correction : `ownerName: locked ? null : ownerName(doc, wishlist.id)`.

## Duplication

- [x] src/domain/subscription.ts:175 — `cleanName` (trim, puis `null` si vide) est une troisième copie du `blankToNull` privé de src/domain/items.ts:12 et src/domain/membership.ts:8. Correction : exporter un seul `blankToNull` d'un module de domaine commun et l'utiliser dans les trois fichiers.
- [x] app/page.tsx:80 — Construire `{ customTitle, customOwnerName, ownerName(...) }` à partir de l'abonnement refait `followNamesOf` (src/server/api/views.ts:41), et app/l/[readToken]/page.tsx:113 le refait encore. Correction : déplacer `followNamesOf` dans src/domain/subscription.ts et l'utiliser dans les deux pages et dans views.ts.

## Conventions

Aucun point.

## i18n

- [x] locales/en/public.json:106 — « Use the list's names » a une apostrophe droite, alors que les autres textes anglais du fichier prennent l'apostrophe typographique. Correction : « Use the list’s names ».
