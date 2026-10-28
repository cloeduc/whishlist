---

description: "Tâches de la feature API pour une app mobile"
---

# Tasks: API pour une app mobile

**Input**: Design documents from `specs/004-mobile-api/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/openapi.yaml](contracts/openapi.yaml), [quickstart.md](quickstart.md)

**Tests**: demandés par la spec (FR-043) et par `AGENTS.md` (un test de domaine par règle et cas limite). Les tests de chaque tranche s'écrivent avant son code et doivent échouer d'abord.

**Organization**: une phase par User Story, livrable seule (principe IV).

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (autre fichier, pas de dépendance sur une tâche non finie)
- **[Story]** : User Story de la spec (US1 à US6)

## Règles communes à toutes les tâches

- Une commande (`src/server/commands/*.ts`) ne dépend pas de Next : ni `cookies()`, ni `headers()`, ni `redirect()`, ni `getDocument` (utiliser `readDocument` / `updateDocument`). Elle prend un `ctx: CommandContext` (T006) et rend `{ ok: true, … } | { ok: false, error: string }`.
- Un route handler fait seulement : `withApi` (T010) → lire le corps → appeler la commande → `apiJson` / `apiError`. Pas de règle métier dans `app/` (AGENTS.md).
- Quand une tranche migre une server action vers une commande, l'action garde exactement ses redirections, ses cookies et ses paramètres `?e=` / `?ok=` actuels (FR-006, SC-007). Lancer `npm test` après chaque migration.
- Les tests qui touchent le store suivent `tests/domain/accounts.test.ts` : `mkdtemp`, `process.env.WISHLIST_DATA_PATH`, nettoyage dans `finally`. Les données sont fictives (`@example.test`).
- Statuts et codes d'erreur : ceux de [contracts/openapi.yaml](contracts/openapi.yaml) et de [research.md R7](research.md).

---

## Phase 1: Setup

**Purpose**: préparer le routage et la configuration.

- [X] T001 Exclure `/api/` du `matcher` de `proxy.ts` (ajouter `api/` à la négation du `source`, à côté de `_next/static`), pour que l'API ne soit ni réécrite par langue ni dotée du cookie `NEXT_LOCALE` (research R2). Vérifier que `app/u/[...path]` n'est pas concerné (chemin `/u/`).
- [X] T002 [P] Ajouter la variable optionnelle `API_ALLOWED_ORIGINS` (liste d'origines séparées par des virgules, ex. `capacitor://localhost,https://localhost`) : commentée dans `.env.example`, `API_ALLOWED_ORIGINS: ${WHISHLIST_API_ALLOWED_ORIGINS:-}` dans `deploy/compose.prod.yml`, une ligne dans le tableau des variables de `README.md` (« sans elle : seuls le site et les clients natifs appellent l'API »).

---

## Phase 2: Foundational (bloque toutes les User Stories)

**Purpose**: socle HTTP de l'API, erreurs traduites, versions, et rate-limit utilisable hors requête Next.

### Tests du socle

- [X] T003 [P] Écrire `tests/domain/api-http.test.ts` : (a) `apiStatusFor(code)` rend `400` pour un code de validation inconnu de la table, `401 unauthorized`, `403 mustChangePassword`, `403 originNotAllowed`, `404 listMissing`, `404` pour `notMember` **réécrit en `listMissing`**, `409 itemAlreadyReserved`, `410 apiVersionUnsupported`, `413 payloadTooLarge`, `415 unsupportedMediaType`, `422 pageLoadFailed` / `enrichEmpty` / `enrichEmptyNoLlm`, `423 readPasswordRequired`, `429 rateLimited`, `503 mailNotConfigured` ; (b) `originDecision({ origin, siteOrigin, allowed })` : pas d'`Origin` → `allow`, `Origin` = site → `allow`, origine listée → `allow-cors`, autre → `deny`, liste vide → seules les deux premières passent ; (c) `apiLocaleFrom("en-US,en;q=0.9")` → `en`, `"de"` → `fr`, absent → `fr` ; (d) `parseAllowedOrigins(" capacitor://localhost , https://localhost ,")` ignore les vides et les entrées invalides.
- [X] T004 [P] Ajouter à `tests/domain/rate-limit.test.ts` un test de `rateLimitForIp(scope, ip, limit, windowMs)` : même seau que `rateLimitOrThrow` pour une même clé `scope:ip`, `ip = null` → refus en production et passage en dev (règle `missingIpPolicy`).

### Implémentation du socle

- [X] T005 Dans `src/server/rate-limit.ts`, extraire `export function rateLimitForIp(scope: string, ip: string | null, limit: number, windowMs: number): void` (lève `RateLimitError`), et faire de `rateLimitOrThrow` un appel `rateLimitForIp(scope, await clientIp(), limit, windowMs)`. Comportement du site inchangé.
- [X] T006 Créer `src/server/commands/context.ts` : `export type CommandContext = { user: User | null; ip: string | null; locale: Locale; origin: string }` et `export type CommandResult<T> = ({ ok: true } & T) | { ok: false; error: string }`. Ajouter dans `src/server/actions.ts` une fonction interne `actionContext()` qui construit ce contexte depuis `currentUser()`, `clientIp()`, `getLocale()` et `origin()`.
- [X] T007 [P] Dans `src/i18n/server.ts`, ajouter `export async function translateErrorFor(locale: Locale, code: string): Promise<string>` (utilise `i18nFor(locale)`, namespace `errors`, retombe sur le code) et réécrire `translateError` pour l'appeler avec `await getLocale()`.
- [X] T008 [P] Ajouter à `locales/fr/errors.json` et `locales/en/errors.json` (mêmes clés, vouvoiement en français) : `unauthorized`, `invalidCredentials`, `mustChangePassword`, `readPasswordRequired`, `invalidJson`, `payloadTooLarge`, `unsupportedMediaType`, `originNotAllowed`, `apiVersionUnsupported`, `notFound`, `badPassword`, `fieldTooLong`, `serverError` (l'annulation d'une réservation d'autrui garde le code du domaine `accessDenied`). Ne pas toucher aux clés existantes.
- [X] T009 Créer `src/server/api/errors.ts` : table unique code → statut (research R7), `export function apiStatusFor(code: string): number`, et `export function publicErrorCode(code: string): string` qui rend `listMissing` pour `notMember`. Les codes absents de la table valent `400`.
- [X] T010 Créer `src/server/api/http.ts` :
  - `parseAllowedOrigins(raw: string | undefined): string[]` (lit `process.env.API_ALLOWED_ORIGINS` par défaut ; garde seulement les entrées qui passent `new URL()`, normalisées `protocol//host`) ;
  - `originDecision(...)` ; `apiLocaleFrom(acceptLanguage: string | null): Locale` ;
  - `readJsonBody<T>(req: NextRequest): Promise<{ ok: true; body: T } | { ok: false; error: "unsupportedMediaType" | "payloadTooLarge" | "invalidJson" }>` : `Content-Type` doit commencer par `application/json`, corps de **64 Ko au plus** (lire `arrayBuffer()` puis vérifier `byteLength`), JSON objet ;
  - `apiJson(data, status = 200, cors?)`, `apiNoContent(cors?)` (204), `apiError(code, locale, cors?, extra?)` → `{ error: { code: publicErrorCode(code), message: await translateErrorFor(locale, publicErrorCode(code)) }, ...extra }` avec `apiStatusFor` ;
  - toutes les réponses portent `Cache-Control: private, no-store` et, en `allow-cors`, `Access-Control-Allow-Origin: <origine>` + `Vary: Origin`, jamais `Access-Control-Allow-Credentials` ;
  - `withApi(handler)` : calcule la décision d'origine (`siteOrigin()` de `src/site/seo.ts`), répond `403 originNotAllowed` si `deny`, construit `ApiRequestContext = { req, locale, ip: await clientIp(), cors }`, attrape `RateLimitError` → `429 rateLimited` et toute autre erreur → `500` sans détail (log serveur) ;
  - `apiPreflight(req)` pour `OPTIONS` : `204` avec `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`, `Access-Control-Allow-Headers: Authorization, Content-Type, Accept-Language, X-Read-Unlock, X-Reservation-Claims`, `Access-Control-Max-Age: 600`, seulement pour une origine `allow-cors`, sinon `403`.
- [X] T011 Créer `app/api/v1/capabilities/route.ts` (`runtime = "nodejs"`, `dynamic = "force-dynamic"`, `GET` + `OPTIONS`) : `{ apiVersion: "1.0.0", enrich: llmConfigured(), mail: mailConfigured() }`.
- [X] T012 Créer `app/api/[version]/[...path]/route.ts` : pour toutes les méthodes, `410 apiVersionUnsupported` si `version` n'est pas `v1`, sinon `404 notFound` (chemin v1 inconnu). Vérifier que Next résout les routes statiques `app/api/v1/**` avant ce segment dynamique.
- [X] T013 Lancer `npm run lint`, `npm run typecheck`, `npm test` ; vérifier à la main qu'une page du site (`/` et `/en`) s'affiche toujours avec sa CSP et sa langue.

**Checkpoint** : `GET /api/v1/capabilities` répond, `/api/v0/x` répond `410`, le site est inchangé.

---

## Phase 3: User Story 1 - Consulter une liste et réserver sans compte (Priority: P1) 🎯 MVP

**Goal**: un client sans compte lit une liste par son lien, la déverrouille si besoin, réserve une idée et annule sa propre réservation.

**Independent Test**: [quickstart.md, US1](quickstart.md) étapes 1 à 11.

### Tests US1

- [X] T014 [P] [US1] Écrire `tests/domain/guest-proofs.test.ts` : `signReservationClaim` / `verifyReservationClaims` (forme `<iat>.<reservationId>.<mac>`, HMAC du `readToken.iat.reservationId`, **90 jours**) : claim valide accepté ; MAC faux, autre `readToken`, `iat` dans le futur de plus de 60 s, plus vieux que 90 jours → ignorés ; **au plus 50 claims lus, les suivants ignorés**. `signReadUnlock` / `verifyReadUnlock` (forme `<iat>.<mac>` sur `readToken.readPasswordHash`, **14 jours**) : valide accepté ; refusé après changement ou retrait du mot de passe de lecture ; refusé après 14 jours.
- [X] T015 [P] [US1] Écrire `tests/domain/commands-public-list.test.ts` sur fichier temporaire : `readPublicList` rend les idées de `listPublicVisibleItems` (libres + les siennes avec `mine: true` et `reservationId`), aucune clé `email`, `userId`, `inviteToken`, `readPasswordHash`, `fromName`, `note` dans le résultat sérialisé ; `readToken` inconnu → `listMissing` ; liste protégée sans unlock → `readPasswordRequired` avec `title` ; membre connecté → accès sans unlock. `unlockPublicList` : bon mot de passe → `unlockToken` + `expiresAt` ; mauvais → `badPassword`. `reserve` : rend `reservationId` + `claim` ; idée déjà réservée → `itemAlreadyReserved` ; idée archivée ou supprimée → `itemNotInList`. **20 `reserve` lancés en `Promise.all` sur la même idée → exactement 1 succès** (SC-003). `cancelOwn` : avec claim → ok ; sans claim ni compte → `accessDenied` ; avec le compte qui a réservé → ok.

### Implémentation US1

- [X] T016 [US1] Dans `src/auth/reservation-claim.ts`, extraire les fonctions pures `signReservationClaim(readToken, reservationId, secret, nowMs?)` et `verifyReservationClaims(readToken, claims: string[], secret, nowMs?): Set<string>` (format par réservation de data-model.md, 50 au plus). Garder le cookie du site tel quel (il garde son format multi-ids) en réutilisant `macClaims` et la même constante `TTL_SEC`.
- [X] T017 [US1] Dans `src/auth/read-unlock.ts`, extraire `signReadUnlock(list, secret, nowMs?)` et `verifyReadUnlock(list, raw, secret, nowMs?)`, et faire de `grantReadUnlock` / `hasReadUnlock` des adaptateurs cookie qui les appellent. Ajouter à `src/auth/public-list.ts` une variante pure `canAccessPublicListWith(doc, list, user, unlocked: boolean)` utilisée par `canAccessPublicList`.
- [X] T018 [US1] Créer `src/server/api/views.ts` avec `toPublicListView(doc, wishlist, locale, mineIds)` au format `PublicList` du contrat : `title`, `subtitle`, `coverImageUrl`, `theme`, `categories` (`id`, `label`, `sortOrder`, triées comme le site), `people`, `items` (`id`, `name`, `typeId`, `personId`, `url`, `imageUrl`, `priceCents`, `priceLabel` via `formatPrice(…, intlLocale(locale))`, `priority`, `mine`, `reservationId` **seulement si `mine`**). Réutiliser `listPublicVisibleItems` et `mineReservationIdsFor` de `src/domain/read.ts`.
- [X] T019 [US1] Créer `src/server/commands/public-list.ts` : `readPublicList(ctx, { readToken, unlockToken?, claims })`, `unlockPublicList(ctx, { readToken, password })` (rate-limit `read-unlock:${readToken.slice(0, 12)}`, 20 / 15 min, via `rateLimitForIp`), `reserve(ctx, { readToken, itemId, typeId?, fromName?, note? })` (rate-limit `reserve:${readToken.slice(0, 12)}`, 15 / h ; vérification d'accès puis `reserveItem` dans `updateDocument` ; `fromName` **200 caractères au plus**, `note` **2000 au plus** sinon `400`), `cancelOwn(ctx, { readToken, reservationId, claims })` (`cancelOwnReservation` ; refus → `accessDenied` du domaine). Mêmes clés de rate-limit que le site.
- [X] T020 [US1] Faire passer `reserveAction`, `cancelMyReservationAction` et `unlockPublicListAction` de `src/server/actions.ts` par ces commandes (le honeypot `website` reste dans l'action ; les cookies `grantReservationClaim` / `revokeReservationClaim` / `grantReadUnlock` restent dans l'action).
- [X] T021 [US1] Créer `src/server/api/auth.ts` avec `optionalApiUser(req): Promise<User | null>` qui lit `Authorization: Bearer` ; jusqu'à US2, il rend toujours `null` (la vérification arrive en T030), et `guestProofs(req)` qui lit `X-Read-Unlock` et `X-Reservation-Claims` (séparés par des virgules, espaces retirés).
- [X] T022 [P] [US1] Créer `app/api/v1/public/lists/[readToken]/route.ts` (`GET`, `OPTIONS`) : `200 PublicList` ; `423` avec `title` dans le corps (paramètre `extra` de `apiError`).
- [X] T023 [P] [US1] Créer `app/api/v1/public/lists/[readToken]/unlock/route.ts` (`POST`, `OPTIONS`) : corps `{ password }` → `200 { unlockToken, expiresAt }`.
- [X] T024 [P] [US1] Créer `app/api/v1/public/lists/[readToken]/reservations/route.ts` (`POST`, `OPTIONS`) : corps `{ itemId, typeId?, fromName?, note? }` → `201 { reservationId, claim }`.
- [X] T025 [P] [US1] Créer `app/api/v1/public/lists/[readToken]/reservations/[reservationId]/route.ts` (`DELETE`, `OPTIONS`) → `204`.
- [X] T026 [US1] Lancer lint, typecheck, test ; dérouler [quickstart.md US1](quickstart.md) (les étapes 10–11 avec un mot de passe posé depuis le site) et refaire une réservation et une annulation sur le site.

**Checkpoint** : une app « invité » est possible. Livrable seul.

---

## Phase 4: User Story 2 - Se connecter et retrouver ses listes (Priority: P2)

**Goal**: connexion par jeton révocable, liste de ses listes, vue membre, déconnexion.

**Independent Test**: [quickstart.md, US2](quickstart.md) étapes 1 à 7 (l'étape 7 demande US6-2 ; sinon la vérifier avec `changePassword` dans le test T028).

### Tests US2

- [X] T027 [P] [US2] Écrire `tests/domain/api-session.test.ts` (fonctions pures sur `Database`) : `issueApiSession(doc, user, nowMs)` rend un jeton de 32 octets base64url et une entrée dont `tokenHash` = SHA-256 base64url du jeton, **sans le jeton en clair dans `doc`** ; `findApiSessionUser(doc, token, nowMs)` : valide → user ; jeton inconnu, `expiresAt` dépassé (**30 jours**, `SESSION_TTL_SEC`), user supprimé, `sessionVersion` différente → `null` ; `revokeApiSession(doc, token)` supprime l'entrée ; `pruneApiSessions(doc, nowMs)` retire les expirées et les périmées. Ajouter à `tests/domain/accounts.test.ts` (ou un nouveau test store) : un `wishlist.json` **sans clé `apiSessions`** se lit avec `apiSessions = []`.
- [X] T028 [P] [US2] Écrire `tests/domain/commands-auth.test.ts` sur fichier temporaire : `login` bon mot de passe → session ; mauvais mot de passe et e-mail inconnu → même code `invalidCredentials` ; 21e tentative en 15 min depuis la même IP → `RateLimitError` ; `logout` → le jeton ne marche plus ; après `changePassword` du domaine (`sessionVersion` + 1), les jetons émis avant → refusés (SC-006). Écrire `tests/domain/commands-lists.test.ts` : `listMine` ne rend que les listes du compte ; `readMemberList` d'un non-membre → `notMember` (rendu `404 listMissing` par l'API) ; la vue membre contient `reservations` (`fromName`, `note`), `members` (`userId`, `displayName`, `role`) et **aucun `email` de membre**, ni `readPasswordHash` ; un compte `mustChangePassword` → `mustChangePassword`.

### Implémentation US2

- [X] T029 [US2] Ajouter `ApiSession` (`id`, `userId`, `tokenHash`, `sessionVersion`, `createdAt`, `expiresAt`, voir data-model.md) et `apiSessions: ApiSession[]` à `Database` dans `src/domain/types.ts` et à `emptyDatabase()` ; dans `normalizeDocument` de `src/store/db.ts`, `if (!doc.apiSessions) doc.apiSessions = []`. Vérifier que `tests/domain/demo-seed.test.ts` et `scripts/create-demo-data.mjs` passent toujours.
- [X] T030 [US2] Créer `src/auth/api-session.ts` : `issueApiSession`, `findApiSessionUser`, `revokeApiSession`, `pruneApiSessions`, `hashApiToken` (`createHash("sha256")`, base64url), jeton `randomBytes(32).toString("base64url")`. Compléter `optionalApiUser` dans `src/server/api/auth.ts` (lecture via `readDocument` + `findApiSessionUser`) et ajouter `requireApiUser(req, { allowMustChangePassword? })` qui rend `{ ok: false, error: "unauthorized" | "mustChangePassword" }` ou le user.
- [X] T031 [US2] Créer `src/server/commands/auth.ts` avec `login(ctx, { email, password })` (rate-limit `login`, 20 / 15 min ; `authenticate` ; dans un seul `updateDocument` : `pruneApiSessions` puis `issueApiSession`) → `{ token, expiresAt, user: Me }`, et `logout(ctx, { token })`. Faire passer `loginAction` par la partie commune (authentification + rate-limit) sans changer son cookie.
- [X] T032 [US2] Ajouter à `src/server/api/views.ts` `toMe(user)` (`id`, `email`, `displayName`, `mustChangePassword`) et `toMemberListView(doc, wishlist, actorId, locale, origin)` au format `MemberList` du contrat (`role` du compte, `readUrl` / `inviteUrl` construits avec `withLocale(locale, …)` comme la page admin, `hasReadPassword`, items archivés compris triés par `sortOrder`, `reservations` via `listOffrir`, `members` avec `displayName` seulement), et `toListSummary`.
- [X] T033 [US2] Créer `src/server/commands/lists.ts` avec `listMine(ctx)` et `readMemberList(ctx, { wishlistId })` (`findMembership` avant toute lecture ; `mustChangePassword` refusé).
- [X] T034 [P] [US2] Créer `app/api/v1/auth/login/route.ts` (`POST` → `200 Session`, `401 invalidCredentials`) et `app/api/v1/auth/logout/route.ts` (`POST` → `204`, jeton requis).
- [X] T035 [P] [US2] Créer `app/api/v1/me/route.ts` (`GET` → `200 Me`, autorisé même si `mustChangePassword`).
- [X] T036 [P] [US2] Créer `app/api/v1/lists/route.ts` (`GET` → `{ lists: ListSummary[] }`) et `app/api/v1/lists/[listId]/route.ts` (`GET` → `MemberList`).
- [X] T037 [US2] Faire accepter le bearer à la lecture publique et à la réservation (T022, T024) : `optionalApiUser` donne l'accès membre sans unlock, le `mine` par compte, et `userId` sur la réservation.
- [X] T038 [US2] Lancer lint, typecheck, test ; dérouler [quickstart.md US2](quickstart.md) avec `alex@example.test` et `camille@example.test`.

**Checkpoint** : US1 + US2 marchent seules.

---

## Phase 5: User Story 3 - Gérer les idées d'une liste (Priority: P3)

**Goal**: un membre crée, modifie, archive, recatégorise, supprime des idées, préremplit depuis un lien, annule une réservation de sa liste.

**Independent Test**: [quickstart.md, US3](quickstart.md) étapes 1 à 7.

### Tests US3

- [X] T039 [P] [US3] Écrire `tests/domain/commands-items.test.ts` sur fichier temporaire : `saveItem` crée puis modifie une idée avec les validations du domaine (`priceInvalid` pour `"abc"`, nom vide refusé, `typeId` / `personId` d'une autre liste refusés) ; avec `imageUrl` fourni, pas d'appel réseau (passer un `fetchOgImage` injecté ou vérifier que l'image manuelle prime, comme `resolveImageUrl`) ; `setItemArchived`, `setItemType`, `deleteItem` ; chacune par un non-membre → `notMember` et le fichier est inchangé ; `cancelReservationAsMember` d'un membre → l'idée redevient libre ; d'un non-membre → `notMember` ; `enrichFromUrl` : URL sans `http(s)://` → `urlInvalid`, non-membre → `notMember`, 31e appel en 1 h → `RateLimitError`.

### Implémentation US3

- [X] T040 [US3] Créer `src/server/commands/items.ts` : déplacer depuis `src/server/actions.ts` `resolveImageUrl`, `blankUrl` et le cœur de `saveItemAction` dans `saveItem(ctx, { wishlistId, itemId?, name, typeId, personId, url, imageUrl, price, priority })` (prix via `parsePrice`), plus `setItemType`, `setItemArchived`, `deleteItem`, `enrichFromUrl(ctx, { wishlistId, url })` (rate-limit `enrich:${userId}`, 30 / h ; `fetchPageHtml`, `extractProductHints`, `refineProductWithLlm` si `llmConfigured()`), et `cancelReservationAsMember(ctx, { wishlistId, reservationId })`. Chaque commande exige un user sans `mustChangePassword`.
- [X] T041 [US3] Faire passer `saveItemAction`, `enrichFromUrlAction`, `setItemTypeAction`, `setItemArchivedAction`, `deleteItemAction` et `cancelReservationAction` de `src/server/actions.ts` par ces commandes (le brouillon `ItemFormDraft` en cas d'erreur reste dans `saveItemAction`).
- [X] T042 [P] [US3] Créer `app/api/v1/lists/[listId]/items/route.ts` (`POST` → `201 MemberItem`) et `app/api/v1/lists/[listId]/items/[itemId]/route.ts` (`PUT` → `200 MemberItem` ; `PATCH` `{ archived?, typeId? }`, au moins un champ, sinon `400` → `200 MemberItem` ; `DELETE` → `204`). Ajouter `toMemberItem` à `src/server/api/views.ts`.
- [X] T043 [P] [US3] Créer `app/api/v1/lists/[listId]/enrich/route.ts` (`POST { url }` → `200 { name, price, imageUrl, typeId, usedLlm }` ; `422` pour `pageLoadFailed`, `enrichEmpty`, `enrichEmptyNoLlm`).
- [X] T044 [P] [US3] Créer `app/api/v1/lists/[listId]/reservations/[reservationId]/route.ts` (`DELETE` → `204`).
- [X] T045 [US3] Lancer lint, typecheck, test ; dérouler [quickstart.md US3](quickstart.md) et, sur le site, ajouter, modifier, archiver une idée et utiliser « Récupérer les infos ».

**Checkpoint** : un membre gère ses idées depuis le client.

---

## Phase 6: User Story 4 - Créer une liste et l'organiser (Priority: P4)

**Goal**: créer une liste, gérer catégories et « qui », réordonner, modifier les réglages.

**Independent Test**: [quickstart.md, US4](quickstart.md) étapes 1 à 4.

### Tests US4

- [X] T046 [P] [US4] Écrire `tests/domain/commands-labels.test.ts` sur fichier temporaire : `createList` sans `category` → `listNeedsCategory`, sans `person` → `listNeedsPerson`, sinon liste + 1 catégorie + 1 « qui » et le créateur `owner` ; `addLabel` / `renameLabel` / `deleteLabel` pour `type` et `person`, retrait d'un libellé utilisé par une idée → refusé avec le code du domaine ; `reorderTypes` ; `updateSettings` (titre vide refusé comme sur le site) ; non-membre → `notMember` partout.

### Implémentation US4

- [X] T047 [US4] Ajouter à `src/server/commands/lists.ts` `createList(ctx, { title, category, person })` (le `updateDocument` composé de `createListAction`) et `updateSettings(ctx, { wishlistId, title?, subtitle?, coverImageUrl?, theme? })` ; créer `src/server/commands/labels.ts` avec `manageLabel(ctx, { kind: "type" | "person", op: "add" | "rename" | "delete", wishlistId, id?, label? })` (le corps actuel de `manageLabelAction`) et `reorderTypes`.
- [X] T048 [US4] Faire passer `createListAction`, `updateWishlistSettingsAction`, `manageLabelAction`, `addTypeAction`, `renameTypeAction`, `deleteTypeAction`, `addPersonAction`, `renamePersonAction`, `deletePersonAction` et `reorderTypesAction` par ces commandes.
- [X] T049 [P] [US4] Ajouter `POST` à `app/api/v1/lists/route.ts` (`201 MemberList`) et `PATCH` à `app/api/v1/lists/[listId]/route.ts` (`200 MemberList`).
- [X] T050 [P] [US4] Créer `app/api/v1/lists/[listId]/types/route.ts` (`POST` → `201 Label`), `app/api/v1/lists/[listId]/types/order/route.ts` (`PUT { typeIds }` → `204`), `app/api/v1/lists/[listId]/types/[typeId]/route.ts` (`PATCH` → `200 Label`, `DELETE` → `204`).
- [X] T051 [P] [US4] Créer `app/api/v1/lists/[listId]/people/route.ts` (`POST` → `201 Label`) et `app/api/v1/lists/[listId]/people/[personId]/route.ts` (`PATCH` → `200 Label`, `DELETE` → `204`).
- [X] T052 [US4] Lancer lint, typecheck, test ; dérouler [quickstart.md US4](quickstart.md) et, sur le site, créer une liste, gérer les chips de Réglages et réordonner les catégories.

---

## Phase 7: User Story 5 - Partager une liste et gérer ses membres (Priority: P5)

**Goal**: lien d'invitation, invitation par e-mail, mot de passe de lecture, membres, quitter, supprimer, rejoindre.

**Independent Test**: [quickstart.md, US5](quickstart.md) étapes 1 à 5.

### Tests US5

- [X] T053 [P] [US5] Écrire `tests/domain/commands-sharing.test.ts` sur fichier temporaire : `regenerateInvite` → l'ancien `inviteToken` ne permet plus `joinInvite` ; `joinInvite` valide → membre ; `setReadPassword` trop court → code du domaine (`MIN_READ_PASSWORD_LENGTH` = 8) ; après `setReadPassword` puis `clearReadPassword`, `readPublicList` sans unlock repasse ; un `unlockToken` émis avant un changement de mot de passe de lecture est refusé ; `deleteList` par un membre non créateur → refus ; `removeMember`, `leave` ; `sendInvite` sans e-mail configuré → `mailNotConfigured`, e-mail vide → `emailRequired`, 9e invitation en 1 h → `RateLimitError` ; non-membre → `notMember` partout.

### Implémentation US5

- [X] T054 [US5] Créer `src/server/commands/sharing.ts` : `regenerateInvite`, `sendInvite(ctx, { wishlistId, email })` (rate-limit `invite:${userId}`, 8 / h ; lien `${ctx.origin}${withLocale(ctx.locale, "/inviter/" + token)}` ; `sendInviteMail`), `setReadPassword`, `clearReadPassword`, `removeMember`, `leave`, `deleteList`, `joinInvite(ctx, { token })`.
- [X] T055 [US5] Faire passer `regenerateInviteAction`, `sendInviteAction`, `setReadPasswordAction`, `clearReadPasswordAction`, `removeMemberAction`, `leaveAction`, `deleteListAction` et `joinInviteAction` par ces commandes.
- [X] T056 [P] [US5] Créer `app/api/v1/lists/[listId]/invite-link/route.ts` (`POST` → `200 { inviteUrl, inviteToken }`) et `app/api/v1/lists/[listId]/invitations/route.ts` (`POST { email }` → `202` ; `502 inviteSendFailed` ; `503 mailNotConfigured`).
- [X] T057 [P] [US5] Créer `app/api/v1/lists/[listId]/read-password/route.ts` (`PUT { password }` → `204`, `DELETE` → `204`).
- [X] T058 [P] [US5] Créer `app/api/v1/lists/[listId]/members/[userId]/route.ts` (`DELETE` → `204`), `app/api/v1/lists/[listId]/leave/route.ts` (`POST` → `204`), et `DELETE` dans `app/api/v1/lists/[listId]/route.ts` (`204` ; `403` pour un non-créateur).
- [X] T059 [P] [US5] Créer `app/api/v1/invitations/[inviteToken]/accept/route.ts` (`POST` → `200 MemberList`).
- [X] T060 [US5] Lancer lint, typecheck, test ; dérouler [quickstart.md US5](quickstart.md) avec Alex et Camille, puis l'onglet Partage du site.

---

## Phase 8: User Story 6 - Gérer son compte (Priority: P6)

**Goal**: inscription, nom affiché, changement de mot de passe, réinitialisation.

**Independent Test**: [quickstart.md, US6](quickstart.md) étapes 1 à 4.

### Tests US6

- [X] T061 [P] [US6] Compléter `tests/domain/commands-auth.test.ts` : `register` nouvel e-mail → session (`201`) ; e-mail déjà inscrit → `{ status: "checkEmail" }` **sans jeton** et pas d'erreur `emailTaken` (research R11) ; mot de passe trop court → `passwordTooShort` ; 6e inscription en 1 h → `RateLimitError`. `changePassword` : mauvais `currentPassword` → `wrongCurrentPassword` ; succès → nouveau jeton valide, anciens jetons (API) refusés ; avec `mustChangePassword`, `currentPassword` non demandé. `updateDisplayName` vide → code du domaine. `requestPasswordReset` : même résultat pour un e-mail connu et inconnu ; le lien n'apparaît jamais dans le résultat.

### Implémentation US6

- [X] T062 [US6] Ajouter à `src/server/commands/auth.ts` `register`, `changePassword` (émet un nouveau jeton après `sessionVersion` + 1, dans le même `updateDocument`), `updateDisplayName`, `requestPasswordReset` (rate-limit `password-reset`, 5 / h ; lien `${ctx.origin}${withLocale(ctx.locale, "/reinitialiser/" + token)}` ; journal `data/password-reset.log` sans e-mail, comme le site). Faire passer `registerAction`, `changePasswordAction`, `updateDisplayNameAction` et `requestPasswordResetAction` par la partie commune sans changer leurs redirections ni leur affichage du lien en dev.
- [X] T063 [P] [US6] Créer `app/api/v1/auth/register/route.ts` (`201 Session` ou `202 { status: "checkEmail" }`) et `app/api/v1/auth/password-reset/route.ts` (`202` toujours, sauf `429`).
- [X] T064 [P] [US6] Ajouter `PATCH` à `app/api/v1/me/route.ts` (`200 Me`) et créer `app/api/v1/me/password/route.ts` (`POST { currentPassword?, password }` → `200 Session` ; autorisé si `mustChangePassword`).
- [X] T065 [US6] Lancer lint, typecheck, test ; dérouler [quickstart.md US6](quickstart.md), puis inscription, changement de mot de passe et « mot de passe oublié » sur le site.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T066 [P] Écrire `tests/domain/api-contract.test.ts` : lire les chemins et méthodes de `specs/004-mobile-api/contracts/openapi.yaml` (lecture ligne par ligne, sans dépendance YAML) et vérifier que chaque chemin a un fichier `app/api/v1/<chemin>/route.ts` qui exporte chaque méthode déclarée (les `{param}` deviennent `[param]`).
- [X] T067 [P] Ajouter au `README.md` une section courte « API » : préfixe `/api/v1`, lien vers `specs/004-mobile-api/contracts/openapi.yaml`, authentification bearer, variable `API_ALLOWED_ORIGINS`.
- [X] T068 [P] Mettre à jour `AGENTS.md` : dans « Couches », `src/server/commands/` (orchestration partagée par les server actions et l'API) et `app/api/v1/` (adaptateurs JSON, pas de règle) ; une route d'API se décrit d'abord dans le contrat OpenAPI.
- [X] T069 Dérouler la partie « Sécurité transverse » de [quickstart.md](quickstart.md) (origine refusée, préflight, `415`, `413`, `410`) et vérifier `Cache-Control: private, no-store` sur une réponse de chaque groupe.
- [X] T070 Vérification finale SC-007 : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, puis le parcours du guide sur le site (lire, réserver, ajouter une idée, partager) en FR et en EN.

---

## Dependencies & Execution Order

### Phases

- **Setup (Phase 1)** : aucune dépendance.
- **Foundational (Phase 2)** : après Setup ; bloque toutes les User Stories.
- **US1 (P1)** : après Phase 2. Aucune autre dépendance.
- **US2 (P2)** : après Phase 2. T037 touche les routes de US1 : à faire après US1 si US1 est livrée, sinon à sauter.
- **US3, US4, US5, US6** : après US2 (elles ont besoin de `requireApiUser`, T030). Entre elles, indépendantes.
- **Polish** : après les User Stories livrées.

### Dans chaque User Story

- Tests d'abord (ils échouent), puis fonctions pures (`src/auth`), puis commandes, puis migration des server actions, puis routes, puis vérification quickstart.
- La migration des actions (T020, T031, T041, T048, T055, T062) touche toujours `src/server/actions.ts` : jamais deux en parallèle.

### Graphe

```text
Setup → Foundational → US1 ─┐
                     └→ US2 ─┼→ US3
                             ├→ US4
                             ├→ US5
                             └→ US6 → Polish
```

## Parallel Example

```text
# Phase 2 : en même temps
T003 tests/domain/api-http.test.ts
T004 tests/domain/rate-limit.test.ts
T007 src/i18n/server.ts
T008 locales/{fr,en}/errors.json

# US1 : tests, puis routes
T014 tests/domain/guest-proofs.test.ts   |  T015 tests/domain/commands-public-list.test.ts
T022 … T025 (quatre route.ts distincts, après T019 et T021)

# Après US2 : une personne par story
US3 (T039–T045) | US4 (T046–T052) | US5 (T053–T060) | US6 (T061–T065)
— en sérialisant seulement les tâches qui modifient src/server/actions.ts
```

## Implementation Strategy

### MVP : US1 seule

1. Phase 1 + Phase 2.
2. Phase 3 (US1).
3. **Stop et vérifier** : quickstart US1. Une app invité peut déjà lire et réserver.
4. Commit, revue (`wishlist-feature-review`), éventuellement déploiement.

### Livraison incrémentale

1. MVP (US1) → US2 (comptes) → déployable à chaque étape.
2. US3 (idées) donne l'usage membre quotidien.
3. US4, US5, US6 complètent la parité avec le site.
4. Chaque story ajoute des routes sans casser les précédentes ; le contrat v1 ne change pas de façon incompatible pendant la feature.

## Notes

- `[P]` = autre fichier et pas de dépendance ouverte.
- Commit après chaque tâche ou groupe logique, en français, préfixé `feat:` / `fix:` / `chore:`.
- Si une tâche découvre un écart avec le contrat, corriger d'abord `contracts/openapi.yaml`, puis le code.
