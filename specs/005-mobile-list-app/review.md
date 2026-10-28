# Revue de code

Revue complète, point de départ `00e4536`. Les deux écrans de `app/(app)/(tabs)/` ont été déplacés dans `app/(app)/` (nouvelle navigation) pendant la revue : les points sont notés à leur nouvel emplacement.

## Fichiers relus

```text
7e752e31294f648646fe4cfdf0a6ad32278c66ea  .dockerignore
b35bc9ddf1f03bb4fc5a3a7c492f7eb1d9a19b01  app/api/v1/capabilities/route.ts
d89f8f886bd97314e093f2b119996e9dfc0a6d91  app/api/v1/lists/[listId]/items/route.ts
7b4759bfd99c41010ff7ff5a114380381eab19ef  app/api/v1/lists/route.ts
2582f2f6a53246f33f56ec1e05bc654127e2c8fb  eslint.config.mjs
dd402fff92a281cd855a788af90c2e933e85b926  locales/en/errors.json
54511469e348f1d6061c6e1cf911d9cfcb656a16  locales/en/mobile.json
fe63a90dc2a375a68c2f07806051bc43fbce41d3  locales/fr/errors.json
1c43b23108f1c3229febd6a3e7d829abe45af2c7  locales/fr/mobile.json
4b00baf340f593d39d7fc296e02d5e8fe29f21f9  mobile/.gitignore
f5e43113e6390ce575b5f776a74c7b8bf30878e7  mobile/__tests__/api/client.test.ts
a98faa6e1112f5720336436151090cd618ea235f  mobile/__tests__/api/schema.test.ts
ef79c39f47ce410e8a9cbd2b6bb017322464d919  mobile/__tests__/auth/session.test.ts
29e646564971842d64124073240d0b643f36d3ae  mobile/__tests__/data/items.test.ts
a950376cf3cbddb88efaa22208c8cf671c6292aa  mobile/__tests__/data/lists.test.ts
a556de7e6ac2f89052ea0fd7e913b5600ffd314f  mobile/__tests__/helpers/fetch.ts
af1735238bf207c46f8be638e6d4bb21448d37f0  mobile/__tests__/helpers/memory-db.ts
35bd6b3e64ecb849b44d0a936030be799a8790be  mobile/__tests__/i18n.test.ts
1b66bf9184acf9cb057fc1991e13076510ab692a  mobile/__tests__/offline/ids.test.ts
a2dead3c22ab7479fecc95b321230c26ee153fff  mobile/__tests__/offline/optimistic.test.ts
b181c5a02b024766682728dfb647e2bd9fcba2d2  mobile/__tests__/offline/outbox.test.ts
fdf3484e3acdff248dd4a3df2bd2e20dee753ef9  mobile/__tests__/offline/snapshot.test.ts
046f4dcb7fc70a61a3020ffc6a19bed70b884472  mobile/__tests__/offline/sync.test.ts
272e6148022edd5774db094b9be57bbbbc367fb4  mobile/__tests__/screens/item-form.test.tsx
dfdba25b53ba9ca7d5b2d84463711bd621e849e0  mobile/__tests__/screens/login.test.tsx
9c2a461e52ffaa04719beaabbc6dd115e219c4a5  mobile/__tests__/screens/share.test.tsx
bcf583cd8eb3bca5a10a486fc0ec00ea5b553add  mobile/__tests__/setup.ts
ea8c6a041aaa76861b8e59f2f231eedfd857ad7c  mobile/__tests__/theme/tokens.test.ts
79989f749132ede1a1dd65aa629543523ecbf374  mobile/__tests__/ui/components.test.tsx
1f7a87dd19e7cb20245f8e67ccb19edf833a4745  mobile/app.config.ts
2b2923a5a790ab9d000ac811bb3617444d2f9e64  mobile/app/(app)/_layout.tsx
cf328bd1e599634c9cf9b5debabb4681989af819  mobile/app/(app)/account.tsx
f27fe0ec0a8269927a46d8e9b71f6516471ca549  mobile/app/(app)/index.tsx
9cfd3cce0f8cc0584b825e487506d71f88221682  mobile/app/(app)/lists/[listId]/_layout.tsx
4194d3455a024ba7840b383c66012604f9ed02eb  mobile/app/(app)/lists/[listId]/archives.tsx
b5600ca905ec89fe3d013bd129c0ecc8be6425ab  mobile/app/(app)/lists/[listId]/index.tsx
522b99664bf866a3e5313453e17152e7f4fae551  mobile/app/(app)/lists/[listId]/items/[itemId].tsx
9ffefd64ccd2f304b763cfbedb3b254ab8cfd282  mobile/app/(app)/lists/[listId]/items/new.tsx
c4d5356311fd501bf669eff785535a7becf3987d  mobile/app/(app)/lists/[listId]/reservations.tsx
1a1e0156a3a294331d3ea2af5e645b6ccd75c6c8  mobile/app/(app)/lists/[listId]/settings.tsx
4a5339ab5ad65e73d8be7f7e8b05fa8a0721ea78  mobile/app/(app)/lists/[listId]/share.tsx
ad747b606d834e4855be13572cb6ff178d86d800  mobile/app/(app)/lists/new.tsx
c5067d9bfd969fe0464c36bba644ad4eee269b83  mobile/app/(auth)/_layout.tsx
5ce1e4f507d5781ef7a7b82237c9a45ed6577b42  mobile/app/(auth)/forgot-password.tsx
ba0d83f39353a967d7476cf5e9fc487c1108a79a  mobile/app/(auth)/login.tsx
74d8ce06f05d3ab133212c56b5cc459ef8d0e176  mobile/app/(auth)/register.tsx
b06ed6ca82e3341e0dee4730ce831f82b8412139  mobile/app/_layout.tsx
b1a25739ebe7eb8fe0351a97344e1a12499a50cd  mobile/app/change-password.tsx
d27378637d8efb1ded62e84973317a383c5d501f  mobile/app/dev/catalog.tsx
6af378603929815f190c41bf2877c64f1e643570  mobile/eas.json
5aed3ed4b7ea218f1e3c2ec6322b8a124007c852  mobile/eslint.config.js
524b6dde01b42d52b7f1ba8a60161ac2aefbbc23  mobile/jest.config.js
664c61a7122dcef2defcd06b9e51c308ed1e7c4d  mobile/metro.config.js
5cb4a10347beb7f2d439524281550e627383276d  mobile/package.json
61ccc17ed2486444358cb7c16ae62803f7304e3f  mobile/scripts/make-icons.mjs
d1973edea26a84369c9d6503e84b254c0669b72f  mobile/src/api/client.ts
206d34bd610cb5374d9f7d858087d7f3d879396c  mobile/src/auth/session.ts
34217baa9205ce2a62c1592365326910300b17d2  mobile/src/data/items.ts
d5055f43e59beff6617414a124bf2395b158a58f  mobile/src/data/labels.ts
248eee4d3b6ac0407fbefb562a7b434cc47d93bf  mobile/src/data/lists.ts
28e9edd6e84d2c42f68d90d5ccc575ccd848eb87  mobile/src/data/store.ts
9a3cf177f44eb952e08fb439466786c59f74c050  mobile/src/data/write.ts
ea3026d3a42931f611ff49e229c6a78cc9498fbe  mobile/src/features/account/AppHeader.tsx
0dae107c73c99ec0d081a7f00ed862b1f6359a8a  mobile/src/features/account/AuthLayout.tsx
54080622c55253fe11df04468084da38f25a55b3  mobile/src/features/account/PasswordForm.tsx
9f1a5a41623aea0b32ffd9ecbd8fbe9fb28b0be5  mobile/src/features/account/UpgradeRequired.tsx
c6b904ef135d1349ada96ce22b15e2137f513695  mobile/src/features/errors.ts
a836d38043e570c16a74f5b8746543c6cf9f5a60  mobile/src/features/items/IdeasAccordion.tsx
9720bc69df4cf0ce8b5d684d04aa4f761bacf718  mobile/src/features/items/ItemCard.tsx
854d718520d92da54fd76c1a22f56e8771d31e80  mobile/src/features/items/ItemForm.tsx
46b55ad0a0ee0b78a3d392414e2e166cc2f0564f  mobile/src/features/items/draft.ts
0ea63716283df44e091c6443d1752c35e4f8c102  mobile/src/features/items/useItemSave.ts
28ed69d8fea4aac13841a46894934a003eab654d  mobile/src/features/lists/LabelEditor.tsx
f9be42b61a1a075aa2c25f419ca5351324381abf  mobile/src/features/lists/ListContext.tsx
bf41f222deb9a0e0ed6fa469be3e91cdbbbbc48e  mobile/src/features/lists/ListScreen.tsx
cfb2642ca06dc522d35c8cbb467edf33511bbd76  mobile/src/i18n/index.ts
fea1e11e6a1d0a7f0b94b4bdd4bb8964e96160a7  mobile/src/network.ts
af9e7788deae7f90ac9b3c47afe3c979dd92b72a  mobile/src/offline/db.ts
b59906d4d07bf283233cdff851ff356308c56c90  mobile/src/offline/ids.ts
fddf60a45452a321072e68ed1e69bcb9fd23624e  mobile/src/offline/optimistic.ts
f1f5b60a2ed7f6f862f34e2b799901d0271c9147  mobile/src/offline/outbox.ts
4ca145482879460d3ec9bff93d7151f6b23a3045  mobile/src/offline/snapshot.ts
5bcc53620965fee9e1623bc42a617e9960d9ca4f  mobile/src/offline/sync.ts
d35caa423aef0f41e2e6103b4a27506f797ac883  mobile/src/theme/ListTheme.tsx
70cf00dba0af62b89cdbe2d7ac600fb59ab5a2e6  mobile/src/theme/fonts.ts
164a445044a60f4f2e441005ea7cbc3809f8b7eb  mobile/src/theme/tokens.ts
46ce28fdd3fdeddedc16950fa0bb5a6565570ea4  mobile/src/ui/Alert.tsx
5c80f11aa2276e6a738879d8e918ab9483445466  mobile/src/ui/BackLink.tsx
58428009411c37d85e5494fac42c79ec0c6748a0  mobile/src/ui/Badge.tsx
bdd77260a2e79ebd28e9993ce2f058453899f6cf  mobile/src/ui/BrandHeader.tsx
bcf025b285475954f3a882ff075f1ffad14d88b8  mobile/src/ui/Button.tsx
1d3665576b10fbefe2d08479440f160502a0237c  mobile/src/ui/Card.tsx
2bdb5fea88d7e0e2f27b3c1d93705631732d81d3  mobile/src/ui/ConfirmDialog.tsx
976f2ce6a123fb599264491b3430448ced1d21a3  mobile/src/ui/Empty.tsx
3f6312115c8f57add06773d24b6b1506733e5e4a  mobile/src/ui/Field.tsx
42e1de11ab2e384fb747bf7ff873885fd1b2a8ca  mobile/src/ui/GiftMark.tsx
180099ca1dab95427e715833a89b3647033460cb  mobile/src/ui/Input.tsx
dc5f431f44552afd4218023e7c8d1fe2707ffcad  mobile/src/ui/ListCover.tsx
683bb6f9538d56b488668f17f1ff7067d4889697  mobile/src/ui/LiveGiftMark.tsx
964b73b270058489eae9201d4271687f8c32f3a9  mobile/src/ui/NetworkNote.tsx
3888cfea4e94a126f216714aa9512b29a71298cd  mobile/src/ui/OfflineBanner.tsx
d013cdbc08c83c5d19810cf8a0021021d085cc78  mobile/src/ui/PageTitle.tsx
3a406c77a65aa3aa78646f4d679fe8ecc21d9485  mobile/src/ui/PendingBadge.tsx
6fe8caf37c479ff9737f0ea74dc7798c8a7c89d1  mobile/src/ui/PillTabs.tsx
bba9151c427a5b427a638678ac86a88c6abb9c55  mobile/src/ui/QrCard.tsx
dca19636eeb76288749a4a04d315770adb28da15  mobile/src/ui/RejectedAlert.tsx
71fb7017ca8520a3866cab8b3a922cfcada26e5b  mobile/src/ui/Screen.tsx
06c4090298b7716811fefba18551a6892b731fb2  mobile/src/ui/Select.tsx
8915a5d356abb8df98ac23cdf69e0e03097f3878  mobile/src/ui/Shadow.tsx
7615e93282285f9fbaa02ee7beaf3b8f829970b2  mobile/src/ui/Stars.tsx
eeb2c4b22579c85f10f55fbc2b0c9b47ebc6e583  mobile/src/ui/Text.tsx
09163c729b0997fdf923c66f0077a74c3ddf56a0  mobile/tsconfig.json
51a57804f49489ba049b4da23711361a2a6d49b5  scripts/capture-demo.mjs
20f189e69929935c5a12c2b5477944913600f31c  specs/004-mobile-api/contracts/openapi.yaml
c6665d549fb603f9c6e0781ee8f325c31b2d4b86  src/domain/client-ids.ts
8ff54b3ae55b17e488d8bc8ba5b850c92d996648  src/i18n/config.ts
cb403fc854bebea59cebd9e04990d4e7ebdf316a  src/i18n/resources.ts
842a66b90f295dafee04260ce37955e5bc6ae749  src/server/api/errors.ts
4eaff51778a480f2ca5808c4557bb1388121c9f4  src/server/api/http.ts
a100ddc31b2dd07c2b51980a262f48194df1ed63  src/server/api/views.ts
fa5f9a73529c2628fff33eb3ec22f66752c1af0b  src/server/commands/items.ts
bc2f9936718502df1ac0ea91e81101b680d6da79  src/server/commands/lists.ts
2cff0ed5c7bc8ec4c20d6b3aa1fb5a217f70ac5d  tests/domain/commands-client-ids.test.ts
2ab49a29d8512548b6e912c3f64526c55e328910  tests/domain/commands-lists.test.ts
977abff92003f5b2ff7648f0ba41fd6460dd40f8  tsconfig.json
```

## Règles métier et tests

- [ ] mobile/src/offline/optimistic.ts:105 — Un changement refusé dont l'idée ou la liste n'existe plus (idée supprimée sur le site, liste supprimée ou accès retiré) n'est affiché nulle part : ni alerte, ni « Abandonner », et il reste pour toujours dans la file (FR-029a, US5-6, quickstart US5-7). Correction : afficher ces refus orphelins (alerte en tête de la liste ou de « Mes listes », avec « Abandonner ») et le tester dans `mobile/__tests__/offline/optimistic.test.ts`.
- [ ] mobile/__tests__/offline/optimistic.test.ts:68 — Le test du refus `itemMissing` garde l'idée dans la copie, cas qui n'arrive pas ; il ne vérifie pas US5-6. Correction : le refaire avec une copie où l'idée n'existe plus.
- [ ] mobile/src/offline/outbox.ts:115 — Un `patchItem` se fond dans un `patchItem` plus ancien même si un `updateItem` est en attente entre les deux : catégorie X, puis formulaire (Y), puis Z → l'état final est Y au lieu de Z (data-model, compaction ; T069). Correction : ne fusionner qu'avec un `patchItem` sans `updateItem` en attente après lui ; ajouter ce cas à `outbox.test.ts`.
- [ ] mobile/app/(app)/lists/new.tsx:48 — Après un refus, `submit()` ne garde pas le `seq` du changement refusé : un second envoi ajoute un nouveau changement au lieu de reprendre le premier (FR-029a). Correction : un hook générique « écriture par la file » (busy, erreur, `retrySeq`), partagé avec `useItemSave`.
- [ ] mobile/src/features/items/ItemForm.tsx:106 — Le bouton de préremplissage est toujours affiché (comme sur le site et selon le contrat : sans IA, le serveur lit la page) ; FR-015, US3-3, T051 et quickstart US3-3 disent « absent sans le service ». Correction : réécrire FR-015, US3-3, T051 et quickstart US3-3 pour suivre le site, ou masquer le bouton.
- [ ] mobile/__tests__/screens/item-form.test.tsx:79 — Le cas `enrich: false` n'est pas testé. Correction : l'ajouter une fois le point précédent tranché.
- [ ] mobile/app/(app)/index.tsx:49 — La carte de « Mes listes » n'affiche pas le nombre d'idées demandé par la User Story 2 ; la clé `mobile:lists.itemCount` n'est jamais utilisée. Correction : l'afficher sur la carte, ou retirer l'exigence (le site ne le montre pas) et la clé.
- [ ] src/server/commands/lists.ts:57 — `createList` accepte la même valeur pour `id`, `categoryId` et `personId` dans une même requête (contrat api-v1-additions : identifiant pris par un objet d'un autre type → `idConflict`). Correction : refuser les doublons dans la requête et le tester dans `tests/domain/commands-client-ids.test.ts`.
- [ ] tests/domain/commands-client-ids.test.ts:188 — Deux `createList` simultanés avec le même `id` ne sont pas testés (T063). Correction : ajouter un test `Promise.all` → une seule liste, `replayed` `[false, true]`.
- [ ] mobile/app/(app)/account.tsx:44 — L'avertissement de déconnexion avec des changements en attente (FR-029c, US5-8, T072) n'a pas de test. Correction : `mobile/__tests__/screens/account.test.tsx` (confirmation sans appel à `/auth/logout` ; sans changement, déconnexion directe).
- [ ] mobile/app/(auth)/register.tsx:31 — US1-3 et US1-4 (`201` connecte, `202` affiche « vérifiez vos e-mails » sans connexion) ne sont pas testés. Correction : `mobile/__tests__/screens/register.test.tsx`.
- [ ] mobile/__tests__/auth/session.test.ts:43 — Le test du `401` ne vérifie pas que la file est gardée puis retrouvée à la reconnexion du même compte (cas limite de la spec, T072). Correction : mettre un changement en file avant le `401`, `signIn` avec le même compte, vérifier qu'il est toujours là.

## Constitution et sécurité

Aucun point.

## Duplication

- [ ] mobile/src/network.ts:5 — Le même petit store (listeners, emit, subscribe, `useSyncExternalStore`) est écrit quatre fois : ici, `mobile/src/auth/session.ts:26`, `mobile/src/data/store.ts:28`, `mobile/src/offline/outbox.ts:36`. Correction : un utilitaire `createListeners()` partagé.
- [ ] mobile/src/features/lists/LabelEditor.tsx:54 — `run()` refait busy/erreur/try-catch déjà fournis par `useServerAction` (`mobile/src/features/errors.ts:18`) ; idem `mobile/src/features/items/IdeasAccordion.tsx:47` et `mobile/app/(app)/lists/[listId]/reservations.tsx:68`. Correction : passer ces actions par `useServerAction`.
- [ ] mobile/src/features/items/ItemCard.tsx:29 — Les catégories sont retriées par `sortOrder` alors que l'API les rend déjà triées ; même tri dans `IdeasAccordion.tsx:43`, `ItemForm.tsx:90`, `settings.tsx:26`. Correction : utiliser `list.categories` tel quel.
- [ ] mobile/__tests__/api/client.test.ts:12 — `json()` est redéclaré alors qu'il existe dans `mobile/__tests__/helpers/fetch.ts:16`. Correction : l'importer.
- [ ] mobile/__tests__/screens/item-form.test.tsx:19 — La fixture `MemberList` est copiée dans `share.test.tsx:28` et `optimistic.test.ts:19`. Correction : une fonction `memberList(overrides)` dans `mobile/__tests__/helpers/`.
- [ ] mobile/__tests__/offline/sync.test.ts:42 — La fabrique `createItem(id)` double celle de `outbox.test.ts:17`. Correction : `mobile/__tests__/helpers/changes.ts`.
- [ ] mobile/__tests__/screens/login.test.tsx:12 — Les mocks `expo-router` et `react-native-safe-area-context` sont recopiés dans `item-form.test.tsx:16` et `share.test.tsx:16`. Correction : les mettre dans `mobile/__tests__/setup.ts`.
- [ ] scripts/capture-demo.mjs:263 — La connexion du mode `--mobile` recopie celle de `captureLocale` (lignes 134-138). Correction : une fonction `login(page, locale)` partagée.

## Conventions

- [ ] src/server/commands/items.ts:156 — La règle « identifiant pris : renvoi dans la même liste, sinon `idConflict` » est dans la commande, et `src/server/commands/lists.ts:67` en a une seconde version (Couches : règles métier dans `src/domain/`, testées). Correction : des fonctions pures dans `src/domain/client-ids.ts`, appelées par les deux commandes.
- [ ] mobile/src/api/client.ts:84 — Une erreur sans corps `{ error }` donne le code `unexpected`, absent de `errors.json` : l'écran affiche « unexpected » (i18n : `translateError` pour les codes d'erreur). Correction : utiliser `serverError`, ou ajouter `unexpected` aux deux `errors.json`.
- [ ] mobile/src/offline/snapshot.ts:15 — `JSON.parse` (`any`) devient `T` sans vérification ; idem `mobile/src/offline/outbox.ts:49` (typage strict, pas de cast caché). Correction : `unknown` + garde de type, ou documenter que c'est un format interne écrit par l'app.
- [ ] mobile/app/(app)/index.tsx:43 — L'écran écrit ses propres styles de mise en page ; idem `archives.tsx:28-40`, `share.tsx:49-60`, `reservations.tsx:42`, `account.tsx:87` (mobile/ : « un écran n'écrit aucun style en dur »). Correction : des composants de mise en page dans `mobile/src/ui/` (ligne, pile).
- [ ] mobile/src/features/items/ItemForm.tsx:146 — Tailles en dur (`48`, `44`) hors de `tokens.ts` ; idem `ItemCard.tsx:57` (`140`), `LabelEditor.tsx:95,104` (`180`, `32×28`), `IdeasAccordion.tsx:26` (`32×28`, opacité `0.3`). Correction : les mettre dans `tokens.ts`.
- [ ] mobile/src/ui/ConfirmDialog.tsx:35 — Couleur du voile `rgba(0,0,0,0.35)` en dur (aussi dans `Select.tsx`). Correction : un token `overlay`.
- [ ] mobile/app.config.ts:7 — `EXPO_PUBLIC_API_URL` est décrite dans la section « App mobile » du README mais pas dans le tableau des variables. Correction : l'ajouter au tableau avec « build de l'app mobile uniquement » (`.env.example` et `compose.prod.yml` concernent le serveur).

## i18n

- [ ] locales/en/mobile.json:6 — « You have been signed out » : l'anglais du site dit « log in / log out ». Correction : « Your session has expired. Please log in again. »
