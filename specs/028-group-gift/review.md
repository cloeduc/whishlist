# Revue de code

## Fichiers relus

```text
e17c07aa9044c59a506fdf92076235c3c0f3c3a5  app/account/page.tsx
481e0ecc239bb0ab6c63f52737856287e4d1ad7e  app/api/v1/capabilities/route.ts
2d864ed9a0b9824ff67baf80ecb2e3a52af36dc0  app/api/v1/lists/[listId]/group-gifts/[groupGiftId]/route.ts
a17a64f483a9245a73f2dd7f36821ebf786fc1d2  app/api/v1/public/group-gifts/[token]/messages/[messageId]/route.ts
145cedce3d2abf411c1926409e449fd6159c2c94  app/api/v1/public/group-gifts/[token]/messages/route.ts
de227f0312de1a7a3c9c9ab300fe01c7194e35f8  app/api/v1/public/group-gifts/[token]/participations/[reservationId]/route.ts
fbd86f67f96c1b31a581fa1acc152054111cc6c6  app/api/v1/public/group-gifts/[token]/participations/route.ts
0bfa0aa82a4dc0d1415e6e2637c667d1a5894a2a  app/api/v1/public/group-gifts/[token]/route.ts
ad3b52db7eaac0e23d2997066b38bb73ff703fde  app/api/v1/public/group-gifts/[token]/status/route.ts
b99e71fe778421538a7e3278dbd96dc75dd78651  app/api/v1/public/group-gifts/[token]/unlock/route.ts
26295b0656848406e522483135243d70845810c0  app/api/v1/public/lists/[readToken]/reservations/route.ts
03ecbe243242d00c9e339b59ea70332dc61b9d06  app/api/v1/public/lists/[readToken]/route.ts
08b53a1db3b2a2fcef71770666d069eb2128bafc  app/g/[token]/page.tsx
ee782153b641092f8963ea629e9dd5d547e3ab2b  app/l/[readToken]/page.tsx
8530e32f34b1b3225c32543ca68194a238dee5f9  app/robots.ts
962d325906a8674f33708f855334060271bca899  components/site/giver-fields.tsx
6197eca29929a400eab7ef39734ba590a183240c  components/site/group-gift-amount-form.tsx
ccb62e14b6586e6bdd16f3df40aa7e9af2696374  components/site/group-gift-join-form.tsx
67218a29891da5a0b5d561f1d0550f6b2df11b0e  components/site/group-gift-thread.tsx
d9f1fa0aa759e46dc9d6391ae7e8d042dede8152  components/site/public-item-card.tsx
e181146fbd6b783c3314d6ed5952e6161b1af00e  components/site/read-unlock-form.tsx
58fb101d3a9bdcb62dcb4964125bdf8dc22bda3d  components/site/reservation-card.tsx
05be697b5ea4b72d0b11c5020ae6b2977818c0e1  components/site/reservation-form.tsx
dbaf698124b109bf51b5e7c37e94863cc16843be  components/site/reservations-reveal.tsx
9edb9a435b6ef4f790bf49bb7d8062272ba8e712  components/ui/radio-group.tsx
19c79a6853d3536308715556a15456c4d7d2c073  drizzle/0008_group_gifts.sql
8184ff00336901445af6f08583b809eb4b8cb012  locales/en/auth.json
94311c41f4e6bc73a08da5f15ee836027e7d42ec  locales/en/content.json
757c7cd91852358cd041e5b6e013be3593088c37  locales/en/errors.json
5c8b42b9d21446c96f7dcc3ad84f804c104af6c0  locales/en/list.json
045dbf4a1a1d9711261829ea3b456079ca37c5c8  locales/en/mobile.json
acc3c18abfa82715b02207eae13485be71fc1dce  locales/en/public.json
924776421b0cd957f7757bdd3046b8ac422b1ebd  locales/fr/auth.json
0451c7472a2fa365b7f6d6dc82f5748fe1144234  locales/fr/content.json
a0940a98ebf74b23761038183d4d421efdaf7ee8  locales/fr/errors.json
e9fb049eebacf81c05c2f954e0d8b6d6777c47fa  locales/fr/list.json
65863b03cda1b3b53e25a482acad029543b10f2b  locales/fr/mobile.json
9a933da2e34cfb33ad93641ab79839aa5d34712d  locales/fr/public.json
19615974c37aa2858a154fb4291eb095b4a0f783  mobile/.maestro/flows/020-us3-surprise-mode.yaml
2b0ac3311af1c9654e28a275832d65cc408207c7  mobile/.maestro/flows/028-us5-group-gift-thread.yaml
7203866c8c2a8b1da86c8758e92d0eb41e6f638c  mobile/.maestro/flows/028-us7-group-gift.yaml
4900669c3b837d2baf461fdd99891c0fa2c9ec3a  mobile/__tests__/features/guest-storage.test.ts
2a1c8e0dd41ceffd730f6b8e4926654ef87be4e5  mobile/__tests__/helpers/public-list.ts
e3b20487bb6c8a68f3128ef4fe6ec131ca86f06f  mobile/__tests__/screens/group-gift.test.tsx
ee6c5945b12d0457255714317b1a6f32ff9d3f08  mobile/__tests__/screens/guest-list.test.tsx
a031db34720a785866105b4d7c7bc0bbcb6118a5  mobile/__tests__/screens/guest-reserve.test.tsx
f9878629e50cd388253ac2445db6559e5691f1c2  mobile/__tests__/screens/reservations.test.tsx
6094bad6dd0b911cc5e00c04bd8350d7d602ff91  mobile/__tests__/shared-modules.test.ts
b0197976847da3b10e1769fddaf18546b8893b8e  mobile/__tests__/ui/password-fields.test.ts
cc06962eb9416c0c5ba65600cdd8489476bedf99  mobile/app/(app)/lists/[listId]/reservations.tsx
f7bb8a1d8d2266f69a27b420d153de3d2819de7f  mobile/app/dev/catalog.tsx
2ebd0d6a69c795287e6e7f02b29f734f94b05cab  mobile/app/gift/[token].tsx
c7b4856851d5158224826037d104c6a51807759b  mobile/app/guest/[readToken]/index.tsx
07318c58a627f1d360b7fa579ca0da73372ad211  mobile/app/guest/[readToken]/reserve.tsx
ae82666d049feb9db5d03ee44b61673c9d0529ae  mobile/src/data/labels.ts
4d86bca9a7f49ec698c97f3d42185c57bfe174e5  mobile/src/features/group-gift/api.ts
ce7a81f38498a7414f52716427dc04793bbd2157  mobile/src/features/group-gift/useGroupGift.ts
832cd508b58050a2eb23ef57367b050cda9ba881  mobile/src/features/guest/GuestItemCard.tsx
7d8d917d2683c4b415ba6fc0187ec16aada10033  mobile/src/features/guest/UnlockCard.tsx
0e6414f053902228a88ef65f07ac193c7853f52c  mobile/src/features/guest/api.ts
6836099e05e3029b3e0248afe86bb61518900295  mobile/src/features/guest/proofs.ts
7fe4b46646d0772f33833fb460e3056258b3de95  mobile/src/features/guest/storage.ts
1c3afb9464a62064b407be0e6aa3dbbdaf2d23f3  mobile/src/features/lists/ListScreen.tsx
71cf5fc35a086b109305d26c431bbe40b5c3c893  mobile/src/ui/RadioGroup.tsx
0305766eeb6a802af19c4691df9f052144eae35b  scripts/create-demo-data.mjs
677b9a81aedeed46930b9ab2b063e2316caffa43  specs/004-mobile-api/contracts/openapi.yaml
774e64f50a79d7e5e1f80624c69114ef7f36924c  src/auth/reservation-claim.ts
460dca99faca7c0a757c3e7ad925afc24ed92df9  src/domain/account.ts
36de52e4fa4f6d6bae9b19c06ee6f37959727c79  src/domain/amount.ts
8d8f20403636ec60092acd0bba89d6fb807ad1da  src/domain/group-gift-view.ts
f684fc000317964798dc82177134fdc0670112e5  src/domain/group-gift.ts
44fdab2f2512636a81f2914764f81c386ad6e18f  src/domain/items.ts
c90083e18ac59672d8fda1fe890be704333365a3  src/domain/membership.ts
fa4ac023779b8409f3dad163b4d9e139f6584438  src/domain/offrir.ts
e6413ddc57904329b0b2440645cdff4b51fd4dbb  src/domain/read.ts
6282ff5526cf269a771057c186f11b9ac5e4ac2f  src/domain/reserve.ts
7a27c859df0185393c8b3ecf2fb3cff84f1648a4  src/domain/types.ts
f9a8f5395a40fa559d38a86855b4c00a7383e8b2  src/server/actions.ts
ae92d5bb543d5d60c8b7d396177c607f193bcce2  src/server/api/auth.ts
0de720b69cc917818322ef39efd6c0921b1fb4f1  src/server/api/errors.ts
423d234c57d5282ad412199acc36fd1f0c05d2ca  src/server/api/group-gift.ts
d5f09b6191c500cd124bcba42d28f6effd63e099  src/server/api/views.ts
a35798ee402fdd6927e574a28673315f5bebcede  src/server/commands/group-gift.ts
58af383c34a04176adcc06950b8c9ff46072af0e  src/server/commands/items.ts
9268eccd9079f126f237039a1636cdb243bba4a9  src/server/commands/public-list.ts
dd2f262c29f426d2c1ad68a7f2592273756b2104  src/server/form-state.ts
b21bfaa9a285967b51ec41981c7851628ba46f34  src/site/analytics-public.ts
594c05249114406032aadade70ddf78ac25a0c2b  src/site/app-link-routes.json
7fa536aa9840db1c49a2ccad47d2d35f2f0b727c  src/site/group-gift-text.ts
3147a36764424ed2740b836481a2fcfa6f4c1e8d  src/store/legacy-json.ts
c8b95ce54fbe757e8cf9a777d9defab60a858c2b  src/store/rows.ts
b984d1ea28052e0de0d84552a755cbcbe1b44c57  src/store/schema.ts
d4a19c3440d9fc165461cadb0d11743471ddbe82  tests/domain/account-deletion.test.ts
85b0335bf3f23fa3e0b66591ee80a531f89b4046  tests/domain/account-export.test.ts
6e5371453cfbac39156409fa77401a844f3a0e40  tests/domain/analytics.test.ts
3117c8f2ff96ebdc91c6bbd6bf02460b2e9575c2  tests/domain/app-links.test.ts
974e7aa00c41d3f1aecdd13c37dac8c260313172  tests/domain/commands-group-gift.test.ts
f6e51498581fff02e5fade26b4047c48edcf13fb  tests/domain/commands-lists.test.ts
e2abfceb8e82403bf810d9e8221e3ca0426bf527  tests/domain/demo-seed.test.ts
374eea9da092450747ea7afe68da60e8a625adba  tests/domain/form-state.test.ts
d4c569e939bed3f684a6041495c18ef154ecb9a4  tests/domain/group-gift.test.ts
f6eeac5eb77b718452230c305c0dac5986d30beb  tests/domain/helpers/account-fixtures.ts
ab624d38165479a7bc9a22f03b7b55b731eb7c36  tests/domain/helpers/api-fixtures.ts
1bb6e1742bcd174d2ccc29d8fd45287a87cc077f  tests/domain/helpers/group-gift-fixtures.ts
8b4c298b4f36dbca90aa5f90d2bc7adc32f54ce3  tests/domain/mcp-server.test.ts
6db78487efdb7f2c089f9cc19531fa3e9ce7753b  tests/domain/move-copy.test.ts
85f9fdb3dbcdad368d9bc219dc3598d13b037be7  tests/domain/offrir.test.ts
95634f5cda51fe3a5ee67cc1300c1670acf028b7  tests/domain/read-list.test.ts
956067eed70d557447578e6ce3b1d793f7699d8d  tests/domain/reservation-claim.test.ts
f6856b89af0e07e6b372cad3a7eb073f6bb5f083  tests/domain/sitemap.test.ts
39d00b43d437078de4456a5d7a0763d9cc7a8bdb  tests/domain/store-import.test.ts
50b827b82032c8160812756a9896b7220a8a79b3  tests/domain/store-rows.test.ts
b12271b2ca6256b484dc24431786643318fba5ff  tests/domain/store-write.test.ts
ad639319c72877bda07fc6adfd8cb5efc20d8466  tests/domain/surprise.test.ts
```

## Règles métier et tests

- [x] src/domain/group-gift.ts:122 — `joinGroupGift` ne regarde pas si l'idée est archivée : un membre peut archiver une idée qui a un cadeau commun (`setItemArchived`, src/domain/items.ts:170), elle quitte la liste publique mais `/g/<token>` accepte encore des participations (cas limite « Idée archivée ou supprimée », FR-001). Correction : refuser l'archivage d'une idée qui a un cadeau commun (comme une idée réservée), ou refuser `itemNotInList` dans `joinGroupGift`, avec un test dans tests/domain/group-gift.test.ts.
- [x] src/server/actions.ts:789 — Lancer un cadeau commun sur une idée où quelqu'un vient d'en lancer un donne seulement « Ce cadeau vient d'être réservé » ; le cas limite « Actions simultanées » dit qu'elle peut alors y participer. Correction : sur `itemAlreadyReserved` en mode `group`, si l'idée a maintenant un cadeau commun ouvert, rediriger vers `/g/<token>`.
- [x] src/server/commands/group-gift.ts:77 — Participer par le lien du cadeau utilise le seau de débit `reserve:gift:<token>`, pas celui de la réservation (`reserve:<readToken>`), contrairement à research R11 et T020. Correction : prendre la clé `reserve:${wishlist.readToken.slice(0, 12)}` après `locate`.
- [x] app/account/page.tsx:203 — Dans « Mes réservations », un cadeau dont le montant est atteint n'affiche ni reste ni « Montant atteint » (FR-021, FR-008, US1 scénario 7). Correction : afficher « Montant atteint » quand `remainingCents === 0`.
- [x] mobile/app/dev/catalog.tsx:1 — T067 est cochée mais `RadioGroup` n'a pas d'entrée dans le catalogue des composants. Correction : ajouter un exemple au catalogue, ou corriger la tâche.
- [x] specs/028-group-gift/tasks.md:87 — T027 (`group-gift-summary.tsx`, `group-gift-participants.tsx`, `group-gift-mine.tsx`) et T049 (`group-gift-invite.tsx`) sont cochées mais ces composants n'existent pas : leur contenu est dans app/g/[token]/page.tsx (et `CopyLinkField` est réutilisé). Correction : mettre à jour les tâches.
- [x] tests/domain/commands-group-gift.test.ts:28 — Aucun test de SC-004 avec des actions simultanées (réservation seule et cadeau commun en parallèle sur la même idée ; participation pendant qu'un autre déclare complet). Correction : ajouter un test avec `Promise.all` sur deux `reserve` (single et group), un seul réussit.
- [x] tests/domain/commands-group-gift.test.ts:110 — Le cas limite « Limite de débit » n'a aucun test pour les commandes du cadeau commun. Correction : dépasser le seau de `joinGroupGift` et de `postMessage` et attendre une erreur de débit.
- [x] tests/domain/account-export.test.ts:193 — T039 promet un test de l'export d'une liste par un membre (participations sans montant) ; le test ne vérifie que `myReservations` et `groupGiftMessages`. Correction : vérifier que `lists[].reservations` d'un membre ne contient ni `amountCents` ni `groupGiftId`.
- [x] src/store/legacy-json.ts:332 — Les nouvelles règles de contrôle d'un ancien JSON (cadeau en double sur une idée, jeton en double, `groupGiftId` et messages qui pointent vers rien, plusieurs participations acceptées sur une idée) n'ont aucun test. Correction : ajouter ces cas dans tests/domain/store-import.test.ts.

## Constitution et sécurité

- [x] src/server/commands/group-gift.ts:130 — `setStatus` (comme `leaveGroupGift` l. 106, `setAmount` l. 174, `postMessage` l. 200 et `deleteMessage` l. 213) écrit sans vérifier l'accès à la liste (`locate` / `canAccessPublicListWith`) : sur une liste dont le mot de passe de lecture a été ajouté ou changé depuis, un participant peut encore déclarer complet, changer son montant ou écrire dans le fil sans le saisir (principe II, mot de passe de lecture). Correction : passer par `locate(ctx, token, isUnlocked)` dans ces commandes ; décider explicitement si le retrait reste possible sans mot de passe, comme `cancelOwn` pour une réservation. (Décidé : le retrait reste possible sans mot de passe, avec la preuve seule, comme `cancelOwn`.)
- [x] app/api/v1/public/group-gifts/[token]/status/route.ts:17 — L'écriture (`setStatus`) a lieu avant le contrôle d'accès (`readGroupGift` l. 19) : un client verrouillé reçoit `readPasswordRequired` après que son changement a été enregistré. Même chose dans participations/[reservationId]/route.ts:17 avec `setAmount`. Correction : contrôler l'accès avant toute écriture (voir le point précédent), puis relire.
- [x] app/l/[readToken]/page.tsx:121 — Le résumé du cadeau commun (« Cadeau commun · N participants · il reste X € ») est montré à tout visiteur de la liste publique, membres compris ; `toPublicListView` (src/server/api/views.ts:121) fait de même pour l'app. Un membre qui ne participe pas, même en mode surprise, voit ainsi le cadeau et le reste à réunir (SC-005, principe III). Correction : pour un membre qui ne participe pas, traiter le cadeau commun comme une réservation (absent de sa vue publique).
- [x] app/g/[token]/page.tsx:33 — `generateMetadata` met le nom de l'idée dans le titre de la page sans vérifier l'accès : sur une liste protégée, le lien du cadeau révèle l'idée avant le mot de passe (FR-014, principe II). Correction : sans accès, un titre neutre.
- [x] src/server/commands/group-gift.ts:209 — `deleteMessage` n'a pas de limite de débit, contrairement aux autres actions du fil (research R11). Correction : ajouter `rateLimitForIp("group-gift:message", …)`.

## Duplication

- [x] src/domain/group-gift.ts:37 — `blank()` copie `blankToNull` de src/domain/text.ts:2. Correction : importer `blankToNull`.
- [x] src/domain/group-gift.ts:133 — `leaveGroupGift` répète le contrôle compte ou preuve et le retrait de `cancelOwnReservation` (src/domain/items.ts:505), dont `removeReservation` appelle déjà `pruneGroupGifts`. Correction : vérifier l'appartenance au cadeau puis appeler `cancelOwnReservation`.
- [x] src/domain/group-gift.ts:87 — Les contrôles de l'idée et des longueurs de `startGroupGift` copient `reserveItem` (src/domain/reserve.ts:40-52). Correction : une fonction de contrôle partagée dans reserve.ts, appelée par les deux.
- [x] src/server/commands/group-gift.ts:106 — La recherche « cadeau par jeton + liste + `groupGiftMissing` » est écrite cinq fois (`locate`, lignes 106, 130, 156, 174). Correction : un seul helper appelé partout.
- [x] src/server/commands/group-gift.ts:78 — La lecture d'un montant « texte ou centimes » est répétée ligne 172 et dans src/server/commands/public-list.ts:245. Correction : une fonction `amountFrom` dans src/domain/amount.ts.
- [x] app/api/v1/public/group-gifts/[token]/participations/route.ts:29 — La route signe elle-même la preuve, alors que la commande `reserve` la rend déjà (src/server/commands/public-list.ts:277). Correction : faire rendre `claim` par la commande `joinGroupGift`.
- [x] components/site/group-gift-join-form.tsx:24 — Le piège anti-robot et les champs montant, nom et message répètent ceux de components/site/reservation-form.tsx:50-106. Correction : un composant de champs partagé dans components/site/.
- [x] components/site/group-gift-join-form.tsx:31 — Les aides de champ sont des `<p className="text-sm text-muted-foreground">` (aussi l. 40 et reservation-form.tsx:90) alors que `FieldDescription` existe (components/ui/field.tsx). Correction : utiliser `FieldDescription`.
- [x] mobile/app/gift/[token].tsx:41 — `webUrl` copie celui de mobile/src/features/guest/GuestItemCard.tsx:24. Correction : l'exporter une fois et l'importer.
- [x] mobile/app/gift/[token].tsx:88 — Le composant `Unlock` répète presque ligne à ligne celui de mobile/app/guest/[readToken]/index.tsx:110. Correction : une carte de déverrouillage partagée dans mobile/src/features/guest/.
- [x] mobile/app/gift/[token].tsx:293 — Les champs de message (aussi l. 536) utilisent `Input` multiligne alors que `Textarea` existe (mobile/src/ui/Textarea.tsx). Correction : utiliser `Textarea`.
- [x] mobile/src/features/group-gift/api.ts:19 — `headers()` répète `proofHeaders` de mobile/src/features/guest/api.ts:18, et `readGroupGift` répète la relecture après `rememberClaimKey` de `readGuestList`. Correction : une fonction partagée par portée de preuve, utilisée pour la liste et le cadeau.

## Conventions

- [x] mobile/src/ui/RadioGroup.tsx:32 — `onChange(next as T)` caste la valeur `string` de `RadioGroupItem` en `T` pour faire taire le compilateur (typage strict, pas de cast). Correction : typer le contexte et `RadioGroupItem` sur le même `T`.

## i18n

Aucun point.
