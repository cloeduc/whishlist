# Revue de code

## Fichiers relus

```text
5e5d5a3c0bc5a48e9c1be7090838fe512bb6514d  .dockerignore
097cbbe11b9ff6672051a492166345e1f9071e63  app/api/[version]/[...path]/route.ts
3faa2db2b58f7bc7d7bbda08f54706b2b8e388bc  app/api/mcp/route.ts
d93f869f1a52ec54be4b20c5b912ede37f5d2321  app/api/v1/auth/email-confirmation/route.ts
770376b9b6ca333709f4fe524929bf075ec9d900  app/api/v1/auth/login/route.ts
03e7d6744d50b69dba714c37303c741d4e0d50b7  app/api/v1/auth/logout/route.ts
e5d2bb0a4ad158ad07ed1ecde4e8366cc3cd1503  app/api/v1/auth/password-reset/confirm/route.ts
3fddd1d88cd789944e245a6e8c1faa72b9b9572a  app/api/v1/auth/password-reset/route.ts
026ad926abf54b700c4197de8185f7db833f5995  app/api/v1/auth/register/route.ts
ff3a260b24222f4763db83d560818ad8c5337acf  app/api/v1/capabilities/route.ts
1055e9006533947173b463aa9e68116e3fce1a39  app/api/v1/invitations/[inviteToken]/accept/route.ts
128bd8aad8b091f35a3b199cd33f44ce6eed431c  app/api/v1/invitations/[inviteToken]/route.ts
eab2f8fca3f622839fdcf9432bb7a3d77d809900  app/api/v1/lists/[listId]/enrich/route.ts
f530deb1b821460a4ced908c2d752863046530d1  app/api/v1/lists/[listId]/invitations/route.ts
7f5c18c5935202bd2ea8c23e9729ad5b00a66498  app/api/v1/lists/[listId]/invite-link/route.ts
ac9875bcbc670050b9d8d8a3e1738934c09ae5c2  app/api/v1/lists/[listId]/items/[itemId]/copy/route.ts
de1ea86f9125855620b91f1b1298bb6303cea023  app/api/v1/lists/[listId]/items/[itemId]/move/route.ts
05da99295600b7df71c850fea67c38b03ee7aa49  app/api/v1/lists/[listId]/items/[itemId]/route.ts
25ac441dd54d9b0602e8b0c52b9fdf36b65c91de  app/api/v1/lists/[listId]/items/route.ts
113905f6739dfd26f1d546b09dd5b4c002d99424  app/api/v1/lists/[listId]/leave/route.ts
81f7e4261f6ff1524beffe8e69063f31ef6fe534  app/api/v1/lists/[listId]/members/[userId]/route.ts
1e69d1a7a12b5c805f9b121f43cd48f96bb2f048  app/api/v1/lists/[listId]/people/[personId]/route.ts
eda1c2a7d3eff29b4649819c53f8418711ced44c  app/api/v1/lists/[listId]/people/route.ts
d72fe9f2abe1704a5b4f1b04aa29b0d48c954684  app/api/v1/lists/[listId]/read-password/route.ts
3adb34b2b88c3c37c79fec00e872436ee6c9af5a  app/api/v1/lists/[listId]/reservations/[reservationId]/route.ts
21d2d7a0a5a02f1be06b1d496329e164d10f8d1a  app/api/v1/lists/[listId]/route.ts
c0d8a8fd8716911935cff533839772f6b8dce927  app/api/v1/lists/[listId]/types/[typeId]/route.ts
6c232cbff502d5e2c0f0302235d4b20879249c4a  app/api/v1/lists/[listId]/types/order/route.ts
985d48115c4119c3adabf19c40bb3699af891f9b  app/api/v1/lists/[listId]/types/route.ts
59e2aa0380fe270c5009549603e8a0a531650f1e  app/api/v1/lists/route.ts
902f862d2e1839a71c2339e30435e0c649a801ff  app/api/v1/me/deletion/route.ts
2f6cb3b5b883b3a7b14ecef841b93359d52bd3db  app/api/v1/me/email-verification/route.ts
225135bd388258b982e8fb006c2db91593d3ca31  app/api/v1/me/email/route.ts
b28e6eb6f1b78ff870c2c814bc834d1d572145a3  app/api/v1/me/export/route.ts
cc2761805e06e5583f55e12d48bdf0a2ed573cb6  app/api/v1/me/password/route.ts
6ce5d2247d3c7af621205c1015c6b6af7d8ac508  app/api/v1/me/route.ts
88e998c20d4bd2c59955de7aaf730fefad621bba  app/api/v1/public/lists/[readToken]/reservations/[reservationId]/route.ts
ec26a2bbdeabc3a2894163cbf779781a576e1100  app/api/v1/public/lists/[readToken]/reservations/route.ts
25c3fbc518ac3f0fd3b2a948102fba635a8d3541  app/api/v1/public/lists/[readToken]/route.ts
11b1f92bb7cd2b852830c0f6e349fa750a3719cd  app/api/v1/public/lists/[readToken]/unlock/route.ts
a43c1a083240c81963cd0a43f79c2a4bdac3ce7f  app/api/v1/subscriptions/[readToken]/route.ts
7bc1a3efe73e3d300ceba65ed5caeed798e9de88  app/api/v1/subscriptions/route.ts
234fb72f5b57ed12802ebc227bed3549898794fa  app/changer-mot-de-passe/page.tsx
de949a49d0258456fd1f380158aa7150c77d09c0  app/compte/export/route.ts
e220a34aba18a10d5779e563655c0293cbc4f6a2  app/compte/page.tsx
469d0a4ff92f57f3c297dffdd9d4ab8b5449c515  app/confirmer-email/[token]/page.tsx
0ff518d3295eb4191cd1deb80b29924db9c55919  app/connexion/page.tsx
029fe4e3fbcb979723fdc7dc0d49e0b4f6247171  app/error.tsx
91e1eb8cadb72732dad52a33f31505498ded386d  app/global-error.tsx
b2622ff079223e4b76b14e520566557fac683e38  app/inscription/page.tsx
f0a73f493b856b61b720a2afab68d7ce10263604  app/inviter/[token]/page.tsx
af78a483513c9b62ec7ae161f673a1358ee20bc6  app/l/[readToken]/page.tsx
f0fc7858d3b63dc3cc6a96d0f944dbceed0a7f2d  app/l/[readToken]/reserver/page.tsx
8fb1cf77edc39c58cbd86b6b913962c273f5651c  app/l/[readToken]/types/page.tsx
54a931c356331b1f92f9412e8cd7147d140372ea  app/layout.tsx
13786d6fd1246098e657f6ba79fa521b39ae8dce  app/listes/[id]/page.tsx
64f5e76be5344a73f717c921ec757450ef9fe815  app/listes/new/page.tsx
e9b3509a0ccf832117de96f872545df73b288b3a  app/mot-de-passe-oublie/page.tsx
23ad8a67440f893fa34f4d78dc1332ff3776586e  app/page.tsx
29f73cc27cccade830a688166351077419bd5d7f  app/reinitialiser/[token]/page.tsx
6be4bcc9241fb1592c52318fb1398228f7d25e21  app/u/[...path]/route.ts
9ddca13f46481eee1afeb42f5b3ea79e9c7e3cec  components/site/api-keys-card.tsx
f203ce7f795d2717d593fa368bb7c495d12b160f  components/site/appearance-form.tsx
355967104b0cfe2fed35833c4231ad13dfd57705  components/site/display-name-form.tsx
5b3b07fd93a520d07e26da384faa169df4321160  components/site/email-change-form.tsx
1d70d848fca41b079f8e3c43e2c5edc7c6414c2e  components/site/error-content.tsx
ee150e8432a2656655798ccb07b02ab3a4b7e72e  components/site/forgot-password-form.tsx
34e19e639a0f6d11ce0736e6b5e5b4e4bbd19094  components/site/form-refusal.tsx
23c928b953f884f2d689a9cfe0941a680022f9f6  components/site/ideas-accordion.tsx
b710dd97dac059e78a077f95b506d7d5eb708da7  components/site/invite-email-form.tsx
35f5eab8fdd2d2e6255fd863379d68aa1b71f7dc  components/site/label-chips.tsx
ed4ca358638576596c3088caeac36de746ce84c3  components/site/login-form.tsx
1dd49ce9382be207d10100404cb4132e885d1cf5  components/site/new-list-form.tsx
e7e79a40bbd16dc63f2b4e2652cce066a29708ca  components/site/password-form.tsx
203ce31254ea2c8d7c565e984dacb8f293470414  components/site/read-password-form.tsx
c27f67f26d6fe42cb7192e203980c90b4147aaf8  components/site/read-unlock-form.tsx
4660183b0cdc32c049d11cd125376905e153bc1a  components/site/register-form.tsx
5c7b9415dea98e9760f3d8150a2c91e75fe96b10  components/site/reservation-form.tsx
9f41539450fd94da321af9833eaa414fa0cce9e2  components/site/reset-password-form.tsx
b01b3f9760d05069a96cdf679cefd392b0f87d22  components/site/root-shell.tsx
e5e505b83abdca986c6bf98d1a667102c10d8725  Dockerfile
26dc68105b27e236099d4e546c7e745c325c8f46  locales/en/common.json
bc66741fe585e0273f81ec8d045b6c1cafd46dd1  locales/en/list.json
2b24bef892cb8aa947812e85e87040ea5bd10a3e  locales/fr/common.json
36beff7eed180a816280fc42bcc06f2b3e278339  locales/fr/list.json
8e081810b6f3d96864be3f665fd4490180a5db7a  mobile/scripts/e2e.mjs
857ccd88d21c5588a2292fdc197d863c70c5b24f  package.json
56e6d5a390f577493de94eff2705884f36e35944  scripts/backfill-og.ts
7c803c050b600fb7a77a56d79130e8e5f0619edd  scripts/db-sessions.ts
506fe10ae7126fb64ddafb0d36a992a20011cd2f  scripts/prepare-standalone.mjs
2440f94aaed50bb966993d3fdc651178672117bc  scripts/start.mjs
ad3e2c4b816c93f51a9af16433691c5d6449f1f0  scripts/test-reset-mail.ts
1e31c181d52fe5a4ef880b57e5aab606588c9cf7  src/auth/api-keys.ts
7c471765a9aacdbc8b9d1257ab1b29a0dff59ac7  src/auth/api-session.ts
897a6939ca57d2aee34c1cde8268813e4edf9078  src/auth/current.ts
1754b073783154f99192e58304e1dd81199f5544  src/auth/guard.ts
7477b6950075964bbc3bd6bcc7f85b894be566d9  src/auth/origin.ts
d8e42fa6ddbfd6efa9d0951306e447a5a28270d8  src/auth/public-list.ts
3feff5b382e190846dd2a300494d77454e15526c  src/auth/read-unlock.ts
289521cb7112500d9eebd40f4b7f4f4a84c8b255  src/auth/reservation-claim.ts
f12f835587a0e93e8da0aed129e59bd745fc73ef  src/auth/session.ts
ef11c330d7d63b4cc36e41a8d44f9c68ff17c462  src/domain/items.ts
a74d48038073c7de43c8d483229366c9d6a6961c  src/domain/split-labels.ts
a2274ced799dbfda00a727d0160ed28fa376dd92  src/server/action-context.ts
f66cd1227fe0cd4b0664f5fa00990f89d67ba652  src/server/actions.ts
4096eb5e9434549e86204623311e00b1a5e31005  src/server/analytics.ts
35f74426c9676a571515af96d8d4518d6697345f  src/server/api/auth.ts
3909d26bce6dd27085815a6c4bd8ddf0cc6968ab  src/server/api/context.ts
d5b9de802cd1e84063103f2176f83e827088acc9  src/server/api/errors.ts
b84fe5aa712dcce7eca265c31d373f0e3f2e7090  src/server/api/http.ts
0a833885d0a3c6cee34bf32dc01c8319fee70c12  src/server/api/item-body.ts
d62afb1e50155d621fc58ff76c162c015299279f  src/server/api/label-routes.ts
80b679c8e86b24a05abc5f0998768b5ec5b354d8  src/server/api/views.ts
3cd402f95a649efcfc7d4ba830992736ea8bd12c  src/server/commands/account.ts
b5b62e3d6de7210f6eedc0a7903b3eadc2b05abe  src/server/commands/api-keys.ts
87bcbb8835222014eaf0857ed5cc3d193c264f59  src/server/commands/auth.ts
3f9c7ffcffb8e80240929e12d7c89411d41041ce  src/server/commands/context.ts
6119331cde6fca000cc648b0de21d1f0db490544  src/server/commands/email.ts
143403eb3caf07ac49b3fa1959af70b9ddc0ec72  src/server/commands/items.ts
e453f2d5a83e524a7c6cfd3c77194c79d77f38e7  src/server/commands/labels.ts
66a83b5e3293f2da2417b0c41a57c132f12ccb2e  src/server/commands/lists.ts
d2849cdab2208361096a1e8e74213a613e1ae64d  src/server/commands/public-list.ts
f3a0a60955e8f54baae4130df732ffdcd72889c9  src/server/commands/sharing.ts
e4ddf6f41a4376a61fd981a8928f63a1377f9d7c  src/server/content-security.ts
0f7fb41fd08777309bfc83d647afeddb7bee7d1c  src/server/form-state.ts
d71806054bedb8166230415d182b8e550c82e007  src/server/mail.ts
f6b1817a7850e1a0b947b9286e110fa34a151ff2  src/server/mcp/gate.ts
1c544422cbb44b64167f270376da0c0e57b367e3  src/server/mcp/server.ts
dd0ab108a63011c9fa55e0aa321db6e7098eb11b  src/server/rate-limit.ts
fcc8a38ca69930c3a5839c6299ed30b237eec9bc  src/site/read-unlock.ts
0501692d64ead419b0ddd7966527187f6aeaaeb5  src/store/connection.ts
e567372ab29259acbf57f0dda205fb48969adfaf  src/store/db.ts
9d78d49c980bd4c0266da4612e16e04616348af7  src/store/diff.ts
421c6dd298d67603bf2adbce1528375cda1cbbec  src/store/legacy-json.ts
18828df314e0f2daff839f45881563655e099214  src/store/rows.ts
ce8d49df3a27a0446f67e587e7b5970a12b3b437  src/store/startup.ts
a1efd0831b30e85142cd277b340d01811e3e8991  tests/domain/demo-seed.test.ts
c5f69f07b04be72723d6da3780379545957eb54a  tests/domain/form-state.test.ts
458935c8ef1070b782e30ce94d4435b536870789  tests/domain/server-only.test.ts
0f7a3e11aa08bdd49943213b869717d841349c9b  tests/domain/store-concurrency.test.ts
f7b5c157e042f6922f62db2f1db1cdd765016401  tests/domain/store-import.test.ts
```

## Règles métier et tests

- [x] app/l/[readToken]/reserver/page.tsx:69 — US1 scénario 2 / FR-001 : si l'idée choisie est réservée entre-temps, la page bascule de la carte « J'offre … » (l. 75) à la liste de choix (l. 107) ; le `ReservationForm` est démonté avec son état, donc le nom de l'offreur, le petit mot et le message d'erreur de l'action sont perdus. Correction : rendre un seul `ReservationForm` à la même place pour les deux variantes, ou remonter l'état de l'action au-dessus du choix de branche.
- [x] specs/015-nextjs-audit/spec.md:119 — FR-003, US1 scénario 5 et SC-001 (« sans JavaScript ») ne sont ni tenus ni tranchés : research.md note qu'aucune page ne s'affiche sans JavaScript à cause de `app/loading.tsx`, alors que T015 est coché et la spec `Implemented`. Correction : décider (déplacer/retirer `app/loading.tsx`, ou retirer FR-003, le scénario 5 et la mention dans SC-001), puis mettre spec et quickstart à jour. Corrigé : FR-003 abandonnée (décision du 2026-11-06), `app/loading.tsx` reste.
- [x] tests/domain/form-state.test.ts:38 — FR-002 : le test vérifie seulement que les listes `*_KEPT_FIELDS` ne contiennent pas de mot de passe ; rien ne vérifie que chaque action passe sa propre liste à `refusal()`, ni ce qui reste une redirection (anti-robot → `?ok=1`, `listMissing`, `readPasswordRequired`). Correction : ajouter un contrôle statique action → constante (sur le modèle de `tests/domain/server-only.test.ts`), ou noter ces cas comme vérifiés à la main dans quickstart.md.
- [x] specs/015-nextjs-audit/quickstart.md:54 — FR-013 / T039 : le parcours US4 lance le conteneur avec `-e SESSION_SECRET=x`, refusé en production par `src/auth/session.ts:14` (moins de 32 caractères) : toutes les pages tombent sur la page d'erreur générale. Correction : utiliser un `SESSION_SECRET` d'au moins 32 caractères.
- [x] specs/015-nextjs-audit/spec.md:89 — Test indépendant de l'US4 : il dit qu'il ne reste que les déclarations de robots, du plan du site et de `.well-known`, alors que `app/layout.tsx:28` garde la sienne (écart T035, SC-005 déjà ajusté). Correction : ajouter la mise en page commune à ce test indépendant.
- [x] specs/015-nextjs-audit/tasks.md:69 — T003 décrit `FormState` sans `attempt` et `RESERVATION_KEPT_FIELDS = ["fromName", "note"]`, alors que le code (`src/server/form-state.ts:8`, `:48`) suit à juste titre le contrat (`attempt`, `itemId`). Correction : aligner le texte de T003 sur le contrat.

## Constitution et sécurité

Aucun point.

## Duplication

- [x] components/site/display-name-form.tsx:27 — Le même bloc `Alert` destructif qui traduit `state.error` est recopié dans email-change-form.tsx:18, invite-email-form.tsx:20, new-list-form.tsx:22, read-password-form.tsx:24, reservation-form.tsx:35 et appearance-form.tsx, et répète move-copy-dialog.tsx:119 et item-form.tsx:134. Correction : un composant `FormRefusal` dans components/site/ (sur `components/ui/alert.tsx`) qui prend `state`, utilisé partout.
- [x] components/site/read-unlock-form.tsx:37 — La correspondance code d'erreur → message (`rateLimited` / `badPassword`) répète `unlockErrorMessage` de app/l/[readToken]/page.tsx:38-46. Correction : exporter `unlockErrorMessage` une seule fois (par exemple depuis read-unlock-form.tsx) et l'appeler aux deux endroits.
- [x] app/global-error.tsx:36-47 — `GlobalErrorContent` recopie le balisage de app/error.tsx:9-16 (titre, texte, bouton « réessayer ») et n'ajoute que le lien d'accueil. Correction : exporter ce contenu une fois depuis app/error.tsx (avec une prop optionnelle pour le lien d'accueil) et le rendre dans global-error.tsx.
- [x] app/global-error.tsx:21-24 — Les classes de `<html>`/`<body>` et le conteneur `max-w-3xl` sont copiés de app/layout.tsx:60-63 ; un changement d'un côté fera diverger les deux pages. Correction : les partager (constantes ou petit composant `RootShell`) entre layout.tsx et global-error.tsx.
- [x] .dockerignore:13 — La nouvelle ligne `data/*.log` rend redondante la ligne `data/password-reset.log` juste au-dessus. Correction : retirer `data/password-reset.log`.

## Conventions

Aucun point (le placeholder écrit en dur de invite-email-form.tsx, aussi relevé ici, est rapporté sous i18n).

## i18n

- [x] components/site/invite-email-form.tsx:33 — Le placeholder `"prenom@exemple.fr"` est écrit en dur (recopié de l'ancien app/listes/[id]/page.tsx) et s'affiche aussi en anglais. Correction : une clé `share.inviteEmailPlaceholder` dans `locales/{fr,en}/list.json` (« prenom@exemple.fr » / « name@example.com »), utilisée via `t(...)`.
