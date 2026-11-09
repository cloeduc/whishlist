# Revue de code

## Fichiers relus

```text
276c47e6d66d8176e4afa0eacb79676ee3e358d6  app/about/page.tsx
ca9ceaf44ba8e8ffa8af2de0e4825711a0097815  app/account/export/route.ts
2311ea4e4260f66b46a5fd929dde57f92553980a  app/account/layout.tsx
a3207a251c94fd610f28a276656eda1f0fc430e3  app/account/page.tsx
18541304773f7bb5682bf2e4562129a6bf6c51f2  app/change-password/page.tsx
289a9a67d562299bf8280f99ee5971fe58350ef1  app/confirm-email/[token]/page.tsx
43a82c8f89daf2dcec9a92841fb3489a9c60f4de  app/confirm-email/layout.tsx
f8a6fb90290c4e1958d93715c5da8802465f630e  app/forgot-password/page.tsx
08c4d3134f0abf5d4459740c51c4a67f52f42a0b  app/guide/page.tsx
d49469b925874a490d1ffff2371785212f742e79  app/invite/[token]/page.tsx
9fd5e5b8201def292ec5c539ce3acb495b479661  app/invite/layout.tsx
4b12b5b16199df76862c7c91bb75f8610b76c80a  app/l/[readToken]/page.tsx
381a17e175588f7526d84aa3c7922a27b40171f4  app/l/[readToken]/reserve/page.tsx
be95b2761e5b1e10a65bf433e4187b450515a076  app/layout.tsx
3d2f5c47121036896ae7c16e08512a16c1a27089  app/legal-notice/page.tsx
b60b866822b0934df3189b914bf89990399ef7ac  app/lists/[id]/page.tsx
f15d3d53dac87ca99daa38889589f8db3f3a355e  app/lists/layout.tsx
82dc44238b75164660ed63b831a0d9f9588f4103  app/lists/new/page.tsx
baa66a2c94f84fe3e334e1e300dfaded6e7c6056  app/login/page.tsx
b15d72050433aa002f8512f58174602ea1594208  app/page.tsx
42f724c00bdb83a06587fae41850484097fcf91f  app/privacy/page.tsx
f32d99034a35a0cf51ae0ceadd28d968dd6079de  app/register/page.tsx
e89289087de19ddc5ded0b9fe6d6974c57be5c09  app/reset-password/[token]/page.tsx
afe8f3dbbcdb067461d9dd9ee1808e2d5f56e50a  app/reset-password/layout.tsx
cb3a936ce1b94ec3d8001240576fdf6ae838d6c6  app/robots.ts
070cefa9ee7db0c8eadce9da4deb4379cf5eec76  app/sitemap.ts
eb32b7e8375a6f21af32abeab0d21b3a082455be  components/site/appearance-form.tsx
0f884e36ae0f35aa675e14cbc0960b53a04759f8  components/site/dev-link-alert.tsx
f7b7e4a43f298d4af2c13ae473005e58f06657b3  components/site/email-verification-banner.tsx
b347421eec881f639abefab50286ef349a079280  components/site/guest-hero.tsx
227f70129a5ea3e9306719b90933866fead60ca3  components/site/ideas-accordion.tsx
fb57c27c23b721a984a0fc9ac0306d63f297a538  components/site/invite-email-form.tsx
d7a3943b7b10f115616f68e6b5e717132419f21a  components/site/item-form.tsx
64dc6a477808d9aa4a8c7e62ff4b577c22abf265  components/site/public-item-card.tsx
98079138f3e9e01bcb923d290bc5a71b98811b85  components/site/read-password-form.tsx
4d975500934ae300fae8d3281d267b1a96f13b22  components/site/site-footer.tsx
0f23963738c0c17997fd670f6403de8d1614b34f  components/site/site-nav.tsx
7a0e420d625543dea996788f0e8b7b1dd442a8a3  mobile/.maestro/flows/011-us1-email-links.yaml
9ecd926cf6e8372e9041c1590cc8b9816720722e  mobile/.maestro/flows/011-us2-invite-link.yaml
d69c4b60a6765055c6f43d7241a08c1709dc9dc6  mobile/.maestro/flows/018-us2-legacy-links.yaml
b0555dc3ba3c83fb6a274df04aee162c0608cd13  mobile/.maestro/scripts/former-link.js
f52f27be57d96cf6652dd83f8bd4e1624f7da808  mobile/.maestro/scripts/maildev-link.js
60bcf8e653dbf4310f84faf625c0672397ff3028  mobile/.maestro/subflows/open-mail-link.yaml
b5b5215e96cf1c41d62581c3a8b2999bd65b15a1  mobile/__tests__/e2e/coverage.test.ts
c95fc2c8c1b8b1ee5bd0772083db246e1b731285  mobile/__tests__/e2e/legacy-paths.test.ts
c0a6d9e487ed04d8cad0ea29c2f8764a8b555fdb  mobile/__tests__/features/incoming-share.test.tsx
9ca69f67a1070acd3c14b6929580a0cd9b482855  mobile/__tests__/links/native-intent.test.ts
78e497d34e578deb7822702e751df907a1604c17  mobile/__tests__/screens/guest-reserve.test.tsx
1ca203c60fda6f6550af0c3c86dcc24588d826fa  mobile/__tests__/screens/links-confirm-email.test.tsx
0d683bd8d289ac2b83eaf7c6e347d8ce1e580be9  mobile/__tests__/screens/login.test.tsx
5f86df3ce9a5949f706aa084c860c161e19bdd87  mobile/app.config.ts
c825fb19880724523f6ca253ec2dfcc1dd212732  mobile/app/(app)/lists/[listId]/share.tsx
f7b72f5edeffdd04aa2e6e008bcc9c726a7148ba  mobile/app/(auth)/forgot-password.tsx
6bd113748bd10bcc989722d465ad53d17f56366f  mobile/app/+native-intent.tsx
08d38164660a9b385ec9d473078d7c9d93c67b17  mobile/app/guest/[readToken]/reserve.tsx
4f22b1c9fbdba536f3d53d0f4ea8eb1d2f302c4d  mobile/app/legal/mentions.tsx
f6d6727eda261fd5f84a25c7dfffee601af601a5  mobile/app/legal/privacy.tsx
8d8f4829475d75aaa70a14f2f788feda11f85370  mobile/app/links/confirm-email/[token].tsx
bbfca98143944ca8dfbaa78e264c1f633d525bc9  mobile/app/links/invite/[token].tsx
7e0dc6260d7f487da44ec407737a11ec915e690f  mobile/app/links/reset-password/[token].tsx
b66735e9d61ad5b07585059457ca1b8fe9d696b5  mobile/scripts/e2e.mjs
e387c64b8f08edd4348ac6b88f888f62304ce72f  mobile/scripts/e2e/legacy-paths.cjs
6157fa1b782119e3f5f0f1254eb5f4e6e8be0117  mobile/src/links/pending.ts
00ee5f79509af2b8fb38ed669e3572bc28ec1a4b  proxy.ts
7adbaa3b8a9f85bd136be4ee10af60f903424ed3  scripts/capture-demo.mjs
abe52ea1721f73e04e35d70365659cd61ffc8324  scripts/test-reset-mail.ts
45e7bf9a77d0a315b22be96ba18e0d7fb72cf12f  specs/004-mobile-api/contracts/openapi.yaml
be1aad21e06426e8b2437ce515157170eac5d4e4  src/auth/guard.ts
e4c94eb8ae347382cb19bacec068529fe814c73b  src/domain/read-link.ts
445af7f86af75de9a8361adb9ac77264c77a86ba  src/i18n/locale-path.ts
ac53738476e8ee9827a2b514a3620061e22f8341  src/server/actions.ts
f2c200f467583b453cdb4d647a50199fb99d1b2d  src/server/api/views.ts
1904d3cee681120cdad35cd1baf11c164c8e4529  src/server/commands/auth.ts
09d3d8bdcfa4b3913cc0d9264a238584c727afa9  src/server/commands/email.ts
6e1b7bbe8681ed45fdf255d2e325c4bce755bae7  src/server/commands/sharing.ts
eab1a25898e14d0c48a608ccc7aa03df1b742f9e  src/site/analytics-public.ts
8fb1a189a659e67fee6efd60de46a4b9da8db8fe  src/site/app-link-routes.json
d822cb0b888a3bfe98c740317a353be0a6653c32  src/site/app-links.ts
5b0f485a40dd5be92e062169541b345a83fbb1e0  src/site/legacy-paths.json
52cc78c1c7012c0ea5e3a6874f5fee1dec632efd  src/site/legacy-paths.ts
720765043e2535caba9c8a8605ab6dcfd3ed1999  src/site/list-tabs.ts
82536ec74e3f133d3a819602d2d73bb7ea88b088  tests/domain/analytics.test.ts
d5828ff0b277956b31ae614c56b5b645d9b7f5ae  tests/domain/app-links.test.ts
442e4fa54e284d0f67fa4cf28b4386a1c397a41d  tests/domain/commands-auth.test.ts
76dbb5393f6e474bd81963eb9031e1b0db01d9a3  tests/domain/commands-email.test.ts
494ff5f5500263bebb81c747df9bfec945cc6c6a  tests/domain/commands-lists.test.ts
21ba25d6d08a4e2f5432b6f0807ad0554749f49d  tests/domain/commands-sharing.test.ts
6ab33ad20c7b7161204b3d6a71e6b93c106f4ef0  tests/domain/dev-link.test.ts
73ad53c047733cc7198776f9d7fc95575447e615  tests/domain/form-state.test.ts
a91c9de5b6bb899725fc60caa46a8e11374bc7cd  tests/domain/helpers/api-fixtures.ts
49af8a5f5b52ca0c29a35b5fc892aca68e1a1847  tests/domain/legacy-paths.test.ts
0be4a361e318ae1d277371e8621ee830c43ad7b4  tests/domain/list-tabs.test.ts
027b57b0e034dd4d1a55bed198c09101f7398a07  tests/domain/locale-path.test.ts
06ff1ca2c70610e73af0aa3fc4a7cb657a468588  tests/domain/mail-config.test.ts
3e01001eba0cae6db240fe7c7f2e4e860428e260  tests/domain/sitemap.test.ts
2bc5dd84b512aeb1d0de799b3aa90dd3327a809a  tests/domain/subscription.test.ts
```

## Règles métier et tests

- [x] tests/domain/commands-email.test.ts:112 — FR-005 (US1-8) : aucun test ne donne une ancienne adresse de renvoi à `sendVerificationLink` ni à `confirmEmailWithToken`, qui la traduisent pourtant (src/server/commands/email.ts:49, :102). Correction : ajouter un cas `next: "/inviter/it"` (lien attendu `?next=%2Finvite%2Fit`) et `confirmEmailWithToken(..., { suite: "/en/inviter/it" })` (attendu `"/en/invite/it"`).
- [x] tests/domain/commands-auth.test.ts:151 — US1-3 : les e-mails de réinitialisation (`resetUrl` → `/reset-password/<token>`) et « compte déjà existant » (`loginUrl` → `/login`) n'ont pas de test sur leur nouvelle adresse. Correction : ajouter un test en mode dev qui vérifie `resetUrl` (avec et sans `/en`) et `/login` dans l'e-mail d'une inscription avec une adresse déjà prise.
- [x] app/sitemap.ts:8 — FR-002, SC-006, US1-9 : le plan du site et `robots()` n'ont aucun test de domaine. Correction : ajouter `tests/domain/sitemap.test.ts`, qui vérifie qu'aucune adresse du plan du site ne correspond à un `from` de `LEGACY_PATHS`, et que `/about`, `/legal-notice`, `/privacy` (et leur `/en`) y sont.
- [x] app/robots.ts:5 — T013 demande d'interdire aussi `/login` et `/register`, absents de `PRIVATE_PATHS` (l'ancien fichier n'interdisait pas non plus `/connexion` ni `/inscription`). Correction : les ajouter, ou corriger T013 si leur absence est voulue. Ajoutés à `PRIVATE_PATHS`.
- [x] src/site/legacy-paths.ts:124 — T022 et data-model.md nomment `legacyPrefixesFor(sitePatterns)` ; le code fournit `legacySitePatterns` et `claimedSitePatterns` (même comportement, testé). Correction : aligner data-model.md et T022 sur les noms du code.

## Constitution et sécurité

- [x] src/site/legacy-paths.ts:116 — Redirection ouverte : `canonicalInternalPath("/en//evil.com?onglet=idees")` rend `//evil.com?tab=ideas` (reproduit), que `nextPath` (src/server/actions.ts:111) passe à `loginAction` ; `/login?next=/en//evil.com%3Fonglet%3Didees` envoie donc vers evil.com après la connexion. Avant la feature, la valeur restait `/en//evil.com`, sur le site. Correction : repasser le résultat traduit par `internalPath()` (ou rendre `null` si le chemin sans préfixe commence par `//`), et ajouter ce cas à tests/domain/legacy-paths.test.ts.

## Duplication

- [x] app/robots.ts:8 — `LEGACY_PRIVATE_PATHS` recopie à la main les anciens chemins, alors que src/site/analytics-public.ts:23-30 les calcule depuis `LEGACY_PATHS`. Correction : les calculer de la même façon depuis `LEGACY_PATHS`, ou partager une fonction entre les deux fichiers.
- [x] src/site/legacy-paths.ts:32 — `segments()` double celle de src/site/app-links.ts:48-50, qui importe déjà `legacy-paths.ts`. Correction : exporter `segments` de `legacy-paths.ts` et retirer la copie de `app-links.ts`.
- [x] mobile/app.config.ts:29 — `segments` et `LEGACY_SITE_PATTERNS` refont `legacySitePatterns()` (le chargeur d'Expo ne lit pas ce module TS ; `mobile/__tests__/links/app-config.test.ts` compare les résultats). Correction : garder la copie, avec un commentaire qui nomme `legacySitePatterns()` comme source et ce test comme garde.
- [x] mobile/.maestro/scripts/former-link.js:3 — les paires ancien → nouveau sont écrites à la main alors qu'elles sont dans src/site/legacy-paths.json. Correction : les faire écrire par `mobile/scripts/e2e.mjs` dans un script généré, comme `strings.generated.js`.

## Conventions

- [x] src/site/legacy-paths.ts:28 — `table.params as readonly LegacyParamRule[]` est un cast qui fait taire le compilateur (règle « pas de cast pour faire taire le compilateur »). Correction : typer `values` en `Readonly<Record<string, string | undefined>>` et retirer le cast.
- [x] src/site/list-tabs.ts:29 — deux casts pour restreindre le type (même règle). Correction : une garde `isListTab(value): value is ListTab` avec `LIST_TABS.some(...)`.
- [x] mobile/app/+native-intent.tsx:14 — le commentaire réécrit garde le mot français `<jeton>` (aussi ligne 15) (« Langue du code »). Correction : `<token>`.
- [x] src/i18n/locale-path.ts:25 — le commentaire réécrit garde `hote` dans `//hote` et `/\\hote` (« Langue du code »). Correction : `//host` et `/\\host`.

## i18n

Aucun point.
