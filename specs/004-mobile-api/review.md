# Revue de code

## Fichiers relus

```text
f239b0643a89b97f6ff9098199ecbf76ae2676b6  .env.example
ba4fa7b0fb576a5b716bcf887741a9b2792817ab  app/api/[version]/[...path]/route.ts
32e2cbe8c2a0f5d6c3c35e14972ef2c8e8406886  app/api/v1/auth/login/route.ts
16b567f97ca44f0cee0f928e74b15812be4e142f  app/api/v1/auth/logout/route.ts
3f5133aff6ae5ec9acb6aaa8ff672b5ae68a8df7  app/api/v1/auth/password-reset/route.ts
000b4d3c4caf7e215a3712f1a5709cbb38030416  app/api/v1/auth/register/route.ts
01e0ffa38914eaf61d7916af4365a3c6ad1ff88d  app/api/v1/capabilities/route.ts
721c546771450f9678e07c402c0f1f7f5a5a46c4  app/api/v1/invitations/[inviteToken]/accept/route.ts
488b386d3fc9697ef1a9f835fd25755ead1e5e5a  app/api/v1/lists/[listId]/enrich/route.ts
e9f83600aaabc305d9c0d88322e6e298c3bae39f  app/api/v1/lists/[listId]/invitations/route.ts
99cb93591d6c4168c682221d109d0acf5bb1967b  app/api/v1/lists/[listId]/invite-link/route.ts
452ee4cfafc2ef1e49642d71814e2faaba081fe4  app/api/v1/lists/[listId]/items/[itemId]/route.ts
fc0ef9dfda4c9b8bc158edfdb083fa270b1b6f97  app/api/v1/lists/[listId]/items/route.ts
50f903d25910c13db6965f52f3c5339338ce7f33  app/api/v1/lists/[listId]/leave/route.ts
27621113459ceb911916117e7ead0e309205d929  app/api/v1/lists/[listId]/members/[userId]/route.ts
cc338efc3d0b9d70104e78f1a2f04fbb6822d169  app/api/v1/lists/[listId]/people/[personId]/route.ts
827e2de3a40c04cf76b75929a5bc5abb56a14ab9  app/api/v1/lists/[listId]/people/route.ts
a4acef1dd6c2d10fd11aa60e2abaf56fd60483f9  app/api/v1/lists/[listId]/read-password/route.ts
f1933c8ffbb19351f37b73e581b4d1d8ef652475  app/api/v1/lists/[listId]/reservations/[reservationId]/route.ts
e610b3ab571a9c64143664d1f90cc7f0e66ad864  app/api/v1/lists/[listId]/route.ts
a2a4902f83cb43540b5ae15d9602876f0007c49f  app/api/v1/lists/[listId]/types/[typeId]/route.ts
652402e0818b4d4ea2eab1ed701dbaee288d5a51  app/api/v1/lists/[listId]/types/order/route.ts
af916b680c2c8083c612d570fb59aab3a81e5177  app/api/v1/lists/[listId]/types/route.ts
33badd040a8d1b7015b9f0ee336f027127133f78  app/api/v1/lists/route.ts
2c06287946da54e2b73597b56a8ccbd434685a53  app/api/v1/me/password/route.ts
7760aa9f8460910b62461be2d99d74f362eb2839  app/api/v1/me/route.ts
73c4b8b36d97d10d668acff1f4d8a8aad741517d  app/api/v1/public/lists/[readToken]/reservations/[reservationId]/route.ts
b7385075b27ad7f307df2a053963427c0a46c0ce  app/api/v1/public/lists/[readToken]/reservations/route.ts
00ce2fc213312c2bd09dd9ac967c209d2b6401ff  app/api/v1/public/lists/[readToken]/route.ts
671a39cabe66c2e1e6ee5e0826c73c2031c433dc  app/api/v1/public/lists/[readToken]/unlock/route.ts
30cd03480a4525a6cd57721215ba27bc1cd61d16  deploy/compose.prod.yml
9321cf1da7ddc22beb742a50c04e61a6d66569da  locales/en/errors.json
5dbf74a8dc61502af580a580d6a6dac5209b1f23  locales/fr/errors.json
449be1a459581d62e5ff248e424d786be2bce702  proxy.ts
f299785d54453c6fee0829bd72525156fa8b5bb3  specs/004-mobile-api/contracts/openapi.yaml
688f7490eb9cc5cd8a0ed5fa38b7f0cb8e64ac1a  src/auth/api-session.ts
9fd4641e254044289ddb25bdbe562fa9d5392022  src/auth/public-list.ts
d12da238764343f509c3735bfa41a29af77c5084  src/auth/read-unlock.ts
2679d7fb756def5758ba4b597af2dd3e8de3a591  src/auth/reservation-claim.ts
ecd4997ab1eba0ea8d473ae8621eb3ed00525ad4  src/domain/types.ts
d0c3056f08862349c4e9fa6c0b09d414bc75504b  src/i18n/server.ts
63289f7a0e4c121cb3a51ea411cc596482763fff  src/server/actions.ts
3f4fa69aeb4e020bdfe65ef0bc4dff7c85af9f21  src/server/api/auth.ts
6865853754ee3e3c6ca87e07d57381d415abcd25  src/server/api/context.ts
1bb5a9865156abed4ecd799cc159bdc8a224c8cb  src/server/api/errors.ts
2589fd0e2c53c6cc6d4cf4f29677a12818a1f0e9  src/server/api/http.ts
e8f447163df86363dd0878da2239fd137e4af0ff  src/server/api/item-body.ts
fb8bf79cce29e5309aaca739e9042613c0c578dc  src/server/api/label-routes.ts
2cbd61029795b0905cbbb804b4a35a9d4f4c7dfc  src/server/api/views.ts
890b98f45e076baa87563a5da14540ae3eb4a5e0  src/server/commands/auth.ts
b3e42672573b7f9df45a0fc8f5d43f7b7e10da15  src/server/commands/context.ts
2fb880389bb918200b8eb303dcbe5b004d38e91a  src/server/commands/items.ts
919a2288ef9c6ad71467d00e892c66a873edad88  src/server/commands/labels.ts
45c06d48aaaf276cc57228ec63f727b86ec003b1  src/server/commands/lists.ts
338d881a43dc2a81c141ae72541248fa99fd105a  src/server/commands/public-list.ts
268cfad7137be2c3dafae1047f2542b901167170  src/server/commands/sharing.ts
d6b32a28e500f5f4a91b06668bdf6ea2c3256544  src/server/mail.ts
4b4afd1b2876bdd2d8c74fa5c0081564b02f2276  src/server/rate-limit.ts
d24bb666e757eb8d8f5ff9f45d0326028d05cbf7  src/store/db.ts
5ff8a25cb821dc1d111bdbc83fcd95a0d0065ff2  tests/domain/api-contract.test.ts
e24e52d00f611fe4b244c6dba4172812e4c06042  tests/domain/api-http.test.ts
a675bb664c563a16e2c087738c728890124ea611  tests/domain/api-session.test.ts
b8a6a55cee30ad1e10e1884bd20117faa38e422c  tests/domain/commands-auth.test.ts
34a49b9812321aa9281e85f30b62f2d3a7f6a2e7  tests/domain/commands-items.test.ts
1cc896185e014b8bdee435ca2b05d20b5e2f0b5b  tests/domain/commands-labels.test.ts
70feb80c21c794669ebd5827c9d5faaf3b8b21ee  tests/domain/commands-lists.test.ts
3d726fb7433c0ffd8f8f6afeba464244db3236b3  tests/domain/commands-public-list.test.ts
6797cd8e946cd3b72053bd5815135b69a1923e30  tests/domain/commands-sharing.test.ts
c5cb8befc131d61b7314c7c02e59548a0694b42f  tests/domain/guest-proofs.test.ts
c5a1d54e04f2830685cf59a182717a9bda9a9ff6  tests/domain/helpers/api-fixtures.ts
0d438a8351018d6a5d44cd8ce6546f4049ffe7a4  tests/domain/rate-limit.test.ts
```

## Règles métier et tests

- [x] src/server/commands/public-list.ts:28 — Un compte `mustChangePassword` lit une liste protégée sans unlock (accès membre), réserve au nom du compte et annule par compte, car `readPublicList`, `reserve` et `cancelOwn` utilisent `ctx.user` sans `activeUser` (FR-023, contrat `/auth/login`). Correction : traiter ce compte comme absent (ou refuser `mustChangePassword`) dans ces trois commandes, avec un test dans tests/domain/commands-public-list.test.ts.
- [x] app/api/v1/lists/[listId]/items/[itemId]/route.ts:30 — Un `PATCH` avec `typeId` et `archived` fait deux écritures : si la seconde échoue, la première est déjà enregistrée (US3-4, FR-004 « rien ne change »), et l'orchestration vit dans `app/` (règle « Couches »). Correction : une commande `patchItem` dans src/server/commands/items.ts qui applique les deux règles dans un seul `updateDocument`, avec un test dans tests/domain/commands-items.test.ts.
- [x] app/api/v1/me/password/route.ts:17 — `changeOwnPassword` puis `openApiSession` font deux écritures (T062 demande un seul `updateDocument`) : si la seconde échoue, toutes les connexions sont périmées sans jeton de remplacement (US6-2). Correction : émettre la session dans le `updateDocument` de `changeOwnPassword` (src/server/commands/auth.ts:86) et la rendre dans son résultat.
- [x] src/server/api/errors.ts:17 — `itemNotInList` n'est pas dans la table, donc une idée supprimée ou archivée pendant une réservation rend `400` au lieu du « introuvable » de la spec (cas limite) et du `404` du contrat. Correction : ajouter `itemNotInList: 404` et une assertion dans tests/domain/api-http.test.ts.
- [x] src/server/api/http.ts:91 — `readJsonBody` (`415`, `413` au-delà de 64 Ko, `invalidJson` pour un tableau ou un JSON cassé) n'a pas de test automatique, alors que FR-043 en demande un. Correction : ajouter ces trois cas dans tests/domain/api-http.test.ts avec un `Request` construit à la main.
- [x] specs/004-mobile-api/quickstart.md:83 — L'étape US6-4 cite `data/password-reset.log`, qui n'existe pas : sans e-mail configuré, le lien est écrit dans `data/mail.log` (src/server/mail.ts:146). Correction : citer `data/mail.log`.

## Constitution et sécurité

- [x] src/server/commands/auth.ts:86 — `changeOwnPassword` (appelé aussi par `POST /api/v1/me/password`) vérifie l'ancien mot de passe sans limite de débit : avec un jeton volé, on peut essayer des mots de passe sans fin. Correction : `rateLimitForIp(\`change-password:${user.id}\`, ctx.ip, …)` avant `changePassword`, avec une limite proche de celle de la connexion.
- [x] src/server/commands/items.ts:84 — `saveItem` lance un appel HTTP sortant (`fetchOgImage`) vers une URL fournie à chaque création ou modification d'idée, sans limite de débit, et l'API le rend scriptable en boucle. Correction : limiter avec `rateLimitForIp` (clé `enrich:` ou dédiée) avant `resolveImageUrl` quand une nouvelle URL doit être récupérée.
- [x] src/server/api/http.ts:98 — Le corps est lu en entier par `req.arrayBuffer()` avant le contrôle des 64 Ko quand `Content-Length` est absent (`Transfer-Encoding: chunked`) : la limite ne protège pas la mémoire. Correction : lire `req.body` en flux et arrêter dès `MAX_BODY_BYTES` dépassé.

## Duplication

- [x] src/server/commands/public-list.ts:26 — `doc.wishlists.find((entry) => entry.readToken === input.readToken)` est recopié quatre fois (lignes 26, 41, 71, 103) et existe dans `getPublicWishlist` (src/domain/read.ts:109). Correction : exporter `findWishlistByReadToken(doc, readToken)` depuis src/domain/read.ts et l'utiliser partout.
- [x] src/server/api/http.ts:25 — `parseAllowedOrigins` réécrit la normalisation d'origine de `normalizeAppOrigin` (src/auth/origin.ts), qui est plus stricte (identifiants, chemin, query refusés). Correction : appeler `normalizeAppOrigin` sur chaque entrée et ignorer les `null`.
- [x] src/auth/api-session.ts:11 — `hashApiToken` et le jeton `randomBytes(32).toString("base64url")` (ligne 20) refont `hashToken` et le jeton de src/domain/password-reset.ts:10 et :27. Correction : exporter `hashSecretToken` / `newSecretToken` depuis src/domain/tokens.ts et les utiliser dans les deux modules.
- [x] src/server/api/views.ts:165 — Le tri des idées recopie `sortItems` (src/domain/read.ts:26) et le comptage `!item.archived` (ligne 147) recopie `listItems` (read.ts:30). Correction : exporter `sortItems`, l'utiliser ici, et écrire `listItems(doc, wishlist.id).length`.
- [x] src/server/commands/items.ts:102 — Le callback de `saveItem` refait « appliquer la règle, relire l'idée, rendre `itemMissing` » de `mutateItem` (lignes 49-60). Correction : passer `updateItem` / `createItem` par `mutateItem` ou un helper commun qui rend `{ item }`.
- [x] src/server/commands/sharing.ts:54 — `regenerateInvite` recopie le contrôle `findMembership` → `notMember` de `memberWrite` (ligne 37). Correction : faire rendre à `memberWrite` un résultat typé et l'utiliser dans `regenerateInvite`.

## Conventions

- [x] src/server/commands/public-list.ts:67 — Les longueurs maximales de `fromName` et `note` (`fieldTooLong`) sont une nouvelle règle métier placée dans les commandes, alors que les règles vivent dans `src/domain/` (« Couches »). Correction : déplacer le contrôle dans `reserveItem` (src/domain/reserve.ts).
- [x] src/server/commands/public-list.ts:88 — La traduction `itemNotInList` → `itemAlreadyReserved` pour une idée réservée est une décision métier hors de `src/domain/` (« Couches »). Correction : faire rendre `itemAlreadyReserved` directement par `reserveItem`.
- [x] src/server/api/http.ts:103 — `parsed as Partial<T>` type un JSON non validé (règle : pas de cast pour faire taire le compilateur) ; par exemple `theme` passe tel quel comme `Partial<WishlistTheme>` dans app/api/v1/lists/[listId]/route.ts:31. Correction : rendre `Record<string, unknown>` et resserrer chaque champ dans la route, y compris chaque valeur de `theme`.
- [x] src/server/api/http.ts:132 — `({} as P)` est un cast pour les routes sans paramètre (même règle). Correction : exiger `params` dans `HandlerContext`, ou une signature séparée sans `P` pour les routes statiques.

## i18n

- [x] locales/en/errors.json:63 — `unauthorized` dit « Sign in to continue. » alors que le reste de l'anglais dit « Log in » (ex. `loginToJoin`). Correction : « Log in to continue. »
