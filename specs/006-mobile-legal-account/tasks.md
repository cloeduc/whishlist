---

description: "Tâches de la feature Pages légales, données et suppression du compte"
---

# Tasks: Pages légales, données et suppression du compte

**Input**: Design documents from `specs/006-mobile-legal-account/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-v1-additions.md](contracts/api-v1-additions.md), [contracts/screens.md](contracts/screens.md), [quickstart.md](quickstart.md)

**Tests**: inclus. `AGENTS.md` exige un test de domaine par règle et par cas limite, et la feature touche à la suppression définitive et à la fuite de secrets.

**Organization**: une phase par User Story, dans l'ordre de priorité de la spec. US1 (suppression) puis US2 (pages légales), toutes deux P1 ; US3 (export) P2 ; US4 (version, licences, contact) P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (autre fichier, pas de dépendance sur une tâche non finie)
- **[Story]** : User Story de la spec (US1 à US4)

## Règles communes à toutes les tâches

- **Couches** (AGENTS.md) : règle pure dans `src/domain/`, orchestration dans `src/server/commands/` (sans `cookies()` ni `redirect()`), adaptateurs dans `src/server/actions.ts` et `app/api/v1/`. Écriture uniquement par `updateDocument`.
- **Design de l'app** : un écran compose les composants de `mobile/src/ui/`, sans style en dur. Modèles dans [contracts/screens.md](contracts/screens.md).
- **Textes** : toute chaîne passe par i18next ; mêmes clés dans `locales/fr/*.json` et `locales/en/*.json` ; vouvoiement et lexique du produit. Un texte qui existe sur le site est lu avec sa clé, jamais recopié.
- **Commandes** : site `npm run lint && npm run typecheck && npm test` ; app `npm --prefix mobile run lint|typecheck|test`.
- **Données** : base de démo et comptes `@example.test` seulement (principe I).

---

## Phase 1: Setup

**Purpose**: dépendances et constantes partagées.

- [X] T001 Installer dans `mobile/` avec `npx expo install expo-file-system expo-sharing` (R10). Vérifier que `mobile/app.config.ts` ne gagne aucune permission (`android.permissions: []`).
- [X] T002 [P] Créer `src/site/contact.ts` avec `export const CONTACT_EMAIL = "contact@ohyoushouldnt.app";` (module pur, sans import de Next, R12). Remplacer l'adresse en dur de `app/mentions-legales/page.tsx` par `mailto:${CONTACT_EMAIL}`.

---

## Phase 2: Foundational (bloquant)

**Purpose**: règles pures, commandes, contrat et routes d'API utilisés par US1 et US3.

**⚠️ CRITICAL**: aucune User Story ne commence avant la fin de cette phase.

### Tests (écrits avant, ils doivent échouer)

- [X] T003 [P] Écrire `tests/domain/account-deletion.test.ts` (`node:test`, `Database` construit en mémoire), un test par règle de [data-model.md](data-model.md) :
  - liste dont elle est la seule adhésion → la liste et toutes ses `types`, `people`, `views`, `items`, `reservations` disparaissent ;
  - liste partagée dont elle est `owner` → « l'adhésion restante la plus ancienne (`joinedAt`, puis `userId`) devient `owner` » ;
  - liste partagée dont elle est `member` → seule son adhésion disparaît, l'`owner` ne change pas ;
  - ses réservations sur une liste qui reste → `userId: null`, `fromName` et `note` inchangés ;
  - `apiSessions` et `passwordResets` du compte supprimés, ceux des autres comptes intacts ;
  - invariant : aucun objet ne référence plus ce `userId`, et chaque liste restante a exactement un `owner` ;
  - compte inexistant → `accountMissing`, document inchangé ;
  - `previewAccountDeletion` : `deletedLists`, `transferredLists` (avec `newOwnerName` = nom de l'héritier si elle est owner, sinon `null`) et `reservationsKept` correspondent à ce que fait `deleteAccount`.
- [X] T004 [P] Écrire `tests/domain/account-export.test.ts` :
  - le document a `format: "ohyoushouldnt-export"`, `version: 1`, `exportedAt` ;
  - `account` = `{ email, displayName, createdAt }` ;
  - chaque liste dont elle est membre est présente, avec `role`, `members` (noms affichés seulement), catégories et « qui » par libellé, idées, réservations (`byMe`) ;
  - `myReservations` ne contient que ses réservations sur des listes dont elle n'est pas membre ;
  - le JSON sérialisé ne contient aucune des valeurs suivantes du jeu de test : `passwordHash`, `sessionVersion`, `mustChangePassword`, `inviteToken`, `readPasswordHash`, un `tokenHash` d'`apiSessions` ou de `passwordResets`, l'e-mail ou l'`id` d'un autre compte (un `assert` par élément) ;
  - `readPasswordProtected` vaut `true` si `readPasswordHash` n'est pas null.
- [X] T005 [P] Écrire `tests/domain/commands-account.test.ts` (store sur fichier temporaire `mkdtemp`, comme `tests/domain/commands-auth.test.ts`) :
  - `deleteOwnAccount` : sans compte → `unauthorized` ; `mustChangePassword` → `mustChangePassword` ; mot de passe faux → `wrongCurrentPassword` et fichier inchangé ; bon mot de passe → compte absent du fichier ;
  - 11e tentative en 15 min → erreur de limite (`rateLimitForIp("delete-account:<userId>", ip, 10, 15 min)`) ;
  - `exportOwnAccount` : 6e demande en 1 h → erreur de limite (`"export:<userId>"`, 5, 60 min) ;
  - après suppression, `findApiSessionUser` avec l'ancien jeton → `null`.

### Implémentation

- [X] T006 Dans `src/domain/membership.ts`, exporter `wipeWishlist` et extraire de `leaveWishlist` une fonction exportée `pickHeir(doc, wishlistId, leavingUserId): Membership | null` (tri `joinedAt`, puis `userId`). `leaveWishlist` l'utilise. `tests/domain/membership.test.ts` doit passer sans modification.
- [X] T007 Créer `src/domain/account.ts` :
  - `previewAccountDeletion(doc, userId): AccountDeletionPreview` ;
  - `deleteAccount(doc, { userId }): { ok: true; doc } | { ok: false; error }`, dans l'ordre de data-model.md (adhésions, réservations, sessions et resets, puis `users`), sur un `clone(doc)` ;
  - `exportAccount(doc, userId, now = new Date()): AccountExport`, qui copie chaque champ par son nom (liste blanche, R5) et calcule `publicUrl` avec `withLocale` sur l'origine passée en argument.
  T003 et T004 passent.
- [X] T008 Créer `src/server/commands/account.ts` :
  - `previewOwnDeletion(ctx)` (`activeUser`) ;
  - `deleteOwnAccount(ctx, { password })` : `activeUser`, `rateLimitForIp("delete-account:<userId>", ctx.ip, 10, 15 * 60 * 1000)`, puis dans un seul `updateDocument` : `verifyPassword` (sinon `wrongCurrentPassword`, document inchangé), puis `deleteAccount` ;
  - `exportOwnAccount(ctx)` : `activeUser`, `rateLimitForIp("export:<userId>", ctx.ip, 5, 60 * 60 * 1000)`, `exportAccount(await readDocument(), …, ctx.origin)`.
  T005 passe.
- [X] T009 Ajouter au contrat `specs/004-mobile-api/contracts/openapi.yaml` ce que décrit [contracts/api-v1-additions.md](contracts/api-v1-additions.md) :
  - `GET` et `POST /me/deletion`, `GET /me/export` ;
  - les schémas `AccountDeletionPreview` et `AccountExport` (ce dernier écrit champ par champ, `additionalProperties: false`) ;
  - `analytics` dans `capabilities`, `apiVersion` `"1.2.0"`.
  Puis `npm --prefix mobile run api:types`.
- [X] T010 [P] Créer `app/api/v1/me/deletion/route.ts` : `GET` → `apiJson(preview)` ; `POST` → `readJsonBody`, `deleteOwnAccount(ctx, { password: text(body.password) })`, `apiNoContent`. Même forme que `app/api/v1/me/password/route.ts`, avec `OPTIONS = apiPreflight`.
- [X] T011 [P] Créer `app/api/v1/me/export/route.ts` : `GET` → `exportOwnAccount`, réponse JSON avec `Content-Disposition: attachment; filename="ohyoushouldnt-donnees-AAAA-MM-JJ.json"` (cors conservé).
- [X] T012 [P] Dans `app/api/v1/capabilities/route.ts` : `analytics: analyticsConfigured()` et `API_VERSION = "1.2.0"`. `tests/domain/api-contract.test.ts` passe.

**Checkpoint**: `npm test` vert ; avec `curl` sur la démo, `GET /api/v1/me/deletion` rend l'aperçu.

---

## Phase 3: User Story 1 — Supprimer son compte (Priority: P1) 🎯 MVP

**Goal**: supprimer son compte depuis le bas de « Mon compte », dans l'app et sur le site.

**Independent Test**: [quickstart.md](quickstart.md), « US1 », étapes 1 à 14.

### Tests

- [X] T013 [P] [US1] Écrire `mobile/__tests__/screens/delete-account.test.tsx` (faux `fetch` de `__tests__/helpers/fetch.ts`, base de `memory-db.ts`) :
  - l'aperçu affiche les nombres et au plus 5 titres par groupe ;
  - avec des changements en attente, l'alerte FR-016 est visible ;
  - `400 wrongCurrentPassword` → message traduit, champ vidé, session toujours `signedIn` ;
  - `204` → stockage sécurisé vide, SQLite vide (copie et file), état `signedOut` avec `deleted: true` ;
  - hors ligne → pas de formulaire, message hors ligne.
- [X] T014 [P] [US1] Écrire `mobile/__tests__/screens/account.test.tsx` : ordre de la section du bas (FR-001) — carte « Vos données et informations », « Se déconnecter », « Supprimer mon compte » en dernier, variante `destructive` ; hors ligne, « Supprimer mon compte » désactivé.

### Implémentation — textes

- [X] T015 [P] [US1] Ajouter dans `locales/fr/auth.json` et `locales/en/auth.json` les clés `account.deleteTitle`, `account.deleteHint`, `account.deleteAction`, `account.deleteWarning` (« Cette action est définitive. »), `account.deleteRemoved`, `account.deleteRemovedLists_one/_other`, `account.deleteKept`, `account.deleteKeptLists_one/_other`, `account.deleteNewOwner`, `account.deleteKeptReservations_one/_other`, `account.deletePassword`, `account.deleteConfirm` (« Supprimer définitivement mon compte »), `account.deleteCancel`, `account.deleted` (« Votre compte a été supprimé. »). Dans `locales/{fr,en}/mobile.json` : `offline.deletePending_one/_other` (« N changements jamais envoyés seront perdus »).

### Implémentation — site

- [X] T016 [US1] Ajouter `deleteAccountAction` dans `src/server/actions.ts` :
  - `actionContext()`, puis `deleteOwnAccount(ctx, { password: String(formData.get("password") ?? "") })` ;
  - en cas d'erreur, `localeRedirect("/compte?d=<code>#supprimer")` ;
  - en cas de succès, supprimer le cookie `SESSION_COOKIE` puis `localeRedirect("/connexion?deleted=1")`.
- [X] T017 [US1] Créer `components/site/delete-account-dialog.tsx` (client) avec `Dialog` de `components/ui/dialog.tsx` :
  - reçoit l'aperçu (calculé côté serveur par `previewAccountDeletion`) ;
  - affiche l'alerte destructive, « Ce qui sera supprimé », « Ce qui reste » (5 titres au plus par groupe), puis le champ `password` (`autoComplete="current-password"`) et le bouton destructif ;
  - le formulaire appelle `deleteAccountAction`.
- [X] T018 [US1] Dans `app/compte/page.tsx`, ajouter tout en bas (hors mode `forced`) une `Card` `id="supprimer"` avec `account.deleteTitle`, `account.deleteHint` et le bouton qui ouvre `DeleteAccountDialog`. Afficher l'erreur `?d=` traduite (`translateError`) dans cette carte quand l'ancre est `supprimer`.
- [X] T019 [US1] Dans `app/connexion/page.tsx`, afficher `Alert` `account.deleted` quand `?deleted=1`.

### Implémentation — app

- [X] T020 [US1] Dans `mobile/src/auth/session.ts`, ajouter `deleted?: boolean` à l'état `signedOut`, et `deleteAccount(password)` : `ok(api.POST("/me/deletion", { body: { password } }))`, puis `forgetToken()`, `clearAll()`, `resetStore()`, `setState({ status: "signedOut", expired: false, deleted: true })`. Pas d'appel à `/auth/logout` (R9).
- [X] T021 [US1] Créer `mobile/app/(app)/delete-account.tsx` selon [contracts/screens.md](contracts/screens.md), « Supprimer mon compte » :
  - `GET /me/deletion` à l'ouverture ;
  - `Alert` destructive, deux `Card` (supprimé / reste), `Alert` FR-016 si `usePendingCount() > 0` ;
  - `Field` + `Input` mot de passe ; `Button` `destructive` pleine largeur ; `Button` `link` « Annuler » ;
  - action via `useServerAction` ; mot de passe vidé en cas d'erreur ; `NetworkNote` hors ligne.
  T013 passe.
- [X] T022 [US1] Dans `mobile/app/(app)/account.tsx`, après la carte du mot de passe et le bouton « Se déconnecter », ajouter le séparateur et le `Button` `destructive` « Supprimer mon compte » (`router.push("/delete-account")`, désactivé hors ligne). La carte « Vos données et informations » est ajoutée vide ici et remplie en US2 à US4.
- [X] T023 [US1] Dans `mobile/app/(auth)/login.tsx`, afficher `Alert` `auth:account.deleted` quand `session.status === "signedOut" && session.deleted`. T014 passe.

**Checkpoint**: US1 du quickstart validée sur le site et sur un simulateur.

---

## Phase 4: User Story 2 — Mentions légales et données personnelles (Priority: P1)

**Goal**: lire les mentions légales et la page « Données personnelles », avec ou sans compte, avec ou sans réseau.

**Independent Test**: [quickstart.md](quickstart.md), « US2 », étapes 1 à 7.

### Tests

- [X] T024 [P] [US2] Écrire `mobile/__tests__/screens/legal.test.tsx` :
  - `legal/mentions` et `legal/privacy` s'affichent déconnecté, et hors ligne ;
  - avec `capabilities` `{ mail: false, enrich: false, analytics: false }` → aucun paragraphe Resend, IA, Umami ; avec `true` → présents ;
  - le paragraphe Cloudflare est toujours présent.
- [X] T025 [P] [US2] Compléter `mobile/__tests__/i18n.test.ts` : chaque clé `content.legal.*` et `content.privacy.*` existe en `fr` et en `en`.

### Implémentation — textes

- [X] T026 [US2] Réécrire `legal.*` dans `locales/fr/content.json` et `locales/en/content.json` :
  - `hostName` = « Serveur personnel de l'éditeur » ;
  - `hostAddress` = « Diffusé via Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis » ;
  - `hostWebsite` = `www.cloudflare.com` ;
  - `publisherLaw` conservé (FR-035) ;
  - `contact` interpole `{{email}}` ;
  - la partie données devient `privacyLink` (« Comment vos données sont traitées »).
  Mettre à jour `metaDescription`.
- [X] T027 [US2] Ajouter `privacy.*` dans `locales/{fr,en}/content.json`, une clé par section de [research.md R8](research.md) :
  - `metaTitle`, `metaDescription`, `eyebrow`, `title`, `intro` ;
  - `accountTitle/Body`, `listsTitle/Body`, `reservationsTitle/Body` ;
  - `retentionTitle/Body` (« jusqu'à la suppression du compte ; connexions 30 jours ; liens de réinitialisation 1 heure ; sauvegardes chiffrées gardées 14 jours ») ;
  - `cookiesTitle` + `cookiesBody` (déplacé de `legal`) ;
  - `appTitle/Body` (stockage sécurisé, copie des listes, changements en attente, effacés à la déconnexion ou à la suppression ; aucune mesure d'audience dans l'app) ;
  - `providersTitle`, `cloudflareBody` (adresses IP et trafic, transfert hors de l'Union européenne, FR-036) ;
  - `mailBody`, `aiBody`, `audienceBody`, `optOut`, `optOutOn` (déplacés de `legal`) ;
  - `rightsTitle/Body` (télécharger, supprimer depuis « Mon compte », écrire à `{{email}}`).
  Mettre à jour toutes les lectures des clés déplacées (`grep -rn "legal\.\(cookies\|mail\|ai\|audience\|optOut\)" app components src`).

### Implémentation — site

- [X] T028 [US2] Créer `app/donnees-personnelles/page.tsx` : `ContentPage` (`privacy.eyebrow/title/intro`) et une `ContentSection` par section ; paragraphes `mailBody`, `aiBody`, `audienceBody` conditionnés comme aujourd'hui (`mailConfigured`, `llmConfigured`, `analyticsConfigured`) ; `generateMetadata` via `publicPageMetadata({ path: "/donnees-personnelles" })`.
- [X] T029 [US2] Dans `app/mentions-legales/page.tsx`, remplacer la section données par un lien `withLocale(locale, "/donnees-personnelles")` (`legal.privacyLink`), et le lien PlanetHoster par `https://www.cloudflare.com`. Ajouter `/donnees-personnelles` à `PATHS` dans `app/sitemap.ts`. Ajouter un lien « Données personnelles » dans `components/site/site-footer.tsx` (clé `common.footer.privacy` en fr et en en).

### Implémentation — app

- [X] T030 [P] [US2] Créer `mobile/src/ui/ContentPage.tsx` et `mobile/src/ui/ContentSection.tsx`, qui reproduisent `components/site/content-page.tsx` :
  - sur-titre en majuscules, `text-main`, interlettrage 0.16em ;
  - titre `font-black` ; intro `muted` ;
  - section = carte à bordure de 2 px et ombre décalée, avec les valeurs de `mobile/src/theme/tokens.ts`.
  Les ajouter au catalogue `mobile/app/dev/catalog.tsx`.
- [X] T031 [US2] Exposer la dernière `capabilities` connue : déplacer `useCapabilities` de `mobile/src/data/items.ts` vers `mobile/src/data/capabilities.ts` (même snapshot `"capabilities"`), et ajouter `analytics`. Mettre à jour l'import dans `mobile/src/features/items/ItemForm.tsx`.
- [X] T032 [US2] Créer `mobile/app/legal/_layout.tsx` (`Stack` sans en-tête, sans garde de session), `mobile/app/legal/mentions.tsx` et `mobile/app/legal/privacy.tsx` :
  - `BackLink`, `ContentPage`, une `ContentSection` par section, textes `content` ;
  - paragraphes optionnels selon `useCapabilities()` ; sans aucune valeur connue, ces paragraphes s'affichent avec leur tournure « quand … est configuré » ;
  - lien `link` « Voir sur le site » → `Linking.openURL(apiUrl + withLocale(locale, path))`.
  T024 passe.
- [X] T033 [P] [US2] Créer `mobile/src/features/account/LegalLinks.tsx` (deux `Button` `link` petite taille, « Mentions légales » · « Données personnelles ») et l'ajouter sous le formulaire de `mobile/app/(auth)/login.tsx` et `mobile/app/(auth)/register.tsx` (FR-002).
- [X] T034 [US2] Dans la carte « Vos données et informations » de `mobile/app/(app)/account.tsx`, ajouter les liens « Mentions légales » et « Données personnelles » (`router.push("/legal/mentions")`, `"/legal/privacy"`), actifs hors ligne.

**Checkpoint**: US2 du quickstart validée ; `/donnees-personnelles` publique et dans le sitemap.

---

## Phase 5: User Story 3 — Récupérer ses données (Priority: P2)

**Goal**: télécharger un fichier de ses données depuis l'app et depuis le site.

**Independent Test**: [quickstart.md](quickstart.md), « US3 », étapes 1 à 6.

### Tests

- [X] T035 [P] [US3] Écrire `mobile/__tests__/features/export-data.test.ts` (mocks `expo-file-system` et `expo-sharing`) :
  - `GET /me/export` → fichier `ohyoushouldnt-donnees-AAAA-MM-JJ.json` écrit dans le cache avec le corps reçu, puis `shareAsync` appelé avec `mimeType: "application/json"` ;
  - `429` → erreur traduite, pas de partage ;
  - l'ancien fichier du cache est supprimé avant d'écrire le nouveau.

### Implémentation

- [X] T036 [P] [US3] Ajouter dans `locales/{fr,en}/auth.json` : `account.dataTitle` (« Vos données et informations »), `account.exportAction` (« Télécharger mes données »), `account.exportHint`.
- [X] T037 [US3] Créer `app/compte/export/route.ts` : `GET`, contexte construit comme `actionContext` (exporter une fonction partagée depuis `src/server/actions.ts` ou la déplacer dans `src/server/action-context.ts`), `exportOwnAccount`. Sans compte → redirection vers `withLocale(locale, "/connexion")`. Succès → JSON avec `Content-Disposition: attachment`. Erreur de limite → redirection `/compte?x=rateLimited#donnees`.
- [X] T038 [US3] Dans `app/compte/page.tsx`, ajouter avant la carte de suppression une `Card` `account.dataTitle` avec un lien de téléchargement (`LinkButton`, `href={withLocale(locale, "/compte/export")}`, attribut `download`) et `account.exportHint`.
- [X] T039 [US3] Créer `mobile/src/features/account/exportData.ts` :
  - `api.GET("/me/export")`, puis `File` dans `Paths.cache` (API `expo-file-system` du SDK 58) nommé `ohyoushouldnt-donnees-<date>.json` ;
  - suppression de l'ancien fichier, puis `Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle })`.
  T035 passe.
- [X] T040 [US3] Dans la carte « Vos données et informations » de `mobile/app/(app)/account.tsx`, ajouter « Télécharger mes données » (désactivé hors ligne, `NetworkNote`, erreur affichée par `useServerAction`).

**Checkpoint**: US3 du quickstart validée ; le fichier ne contient aucun secret.

---

## Phase 6: User Story 4 — Version, licences et contact (Priority: P3)

**Goal**: version de l'app, licences des logiciels libres, lien de contact.

**Independent Test**: [quickstart.md](quickstart.md), « US4 », étapes 1 à 3.

### Tests

- [X] T041 [P] [US4] Écrire `mobile/__tests__/legal/licenses.test.ts` : chaque clé de `dependencies` de `mobile/package.json` a une entrée dans `mobile/src/legal/licenses.json`, avec `name`, `version`, `license` non vides.

### Implémentation

- [X] T042 [US4] Créer `mobile/scripts/licenses.mjs` :
  - lancer `npm ls --omit=dev --all --json` dans `mobile/` et dédoublonner par `name@version` ;
  - pour chaque paquet, lire `node_modules/<name>/package.json` (`license`) et le premier fichier `LICENSE*` / `LICENCE*` trouvé ;
  - écrire `mobile/src/legal/licenses.json`, trié par nom : `{ name, version, license, text }[]`.
  Ajouter le script `"licenses": "node scripts/licenses.mjs"` à `mobile/package.json`, puis le lancer. T041 passe.
- [X] T043 [P] [US4] Ajouter dans `locales/{fr,en}/mobile.json` : `account.version` (« Version {{version}} »), `account.licenses` (« Licences »), `account.contact` (« Nous écrire »), `legal.licensesEyebrow`, `legal.licensesTitle`, `legal.licensesIntro`.
- [X] T044 [US4] Créer `mobile/app/legal/licenses.tsx` : `ContentPage`, une `ContentSection` par paquet (nom, version, licence), texte affiché au toucher ; liste virtualisée (`FlatList`) pour tenir des centaines de paquets.
- [X] T045 [US4] Dans la carte « Vos données et informations » de `mobile/app/(app)/account.tsx`, ajouter :
  - « Licences » → `/legal/licenses` ;
  - « Nous écrire » → `Linking.openURL("mailto:" + CONTACT_EMAIL)`, en important `src/site/contact.ts` comme `price.ts` ;
  - le texte `mobile:account.version` avec `Constants.expoConfig?.version`.
  Compléter T014 avec l'ordre complet de FR-001.

**Checkpoint**: US4 du quickstart validée.

---

## Phase 7: Polish & Cross-Cutting Concerns

- ~~T046~~ Abandonnée : pas de capture de référence pour les pages légales ; on compare aux pages du site ouvertes sur téléphone.
- [X] T047 [P] Mettre à jour `AGENTS.md` :
  - « Fichiers générés » : `mobile/src/legal/licenses.json` ;
  - « Commandes » : `npm --prefix mobile run licenses` après un changement de dépendances de l'app.
- [X] T048 [P] Régénérer `public/guide/{fr,en}` avec `npm run demo:capture` si une capture du guide montre `/compte` ou le pied de page. Rien à refaire : aucune capture du guide ne montre `/compte`, et le script masque le pied de page.
- [X] T049 Lancer `npm run lint && npm run typecheck && npm test && npm run build`, puis `npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test`.
- [X] T050 Dérouler tout [quickstart.md](quickstart.md), sur simulateur iOS et émulateur Android, en français et en anglais, avec la grille de design de la 005 pour les écrans de la section « Design ».

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dépendance.
- **Foundational (Phase 2)** : après Setup ; bloque US1 et US3 (routes, commandes). US2 et US4 n'en dépendent pas, sauf T031 (`capabilities.analytics`, qui suit T009 et T012).
- **US1 (Phase 3)** : après Phase 2.
- **US2 (Phase 4)** : après Phase 1 ; T031 après T012.
- **US3 (Phase 5)** : après Phase 2.
- **US4 (Phase 6)** : après Phase 1 (T002 pour `CONTACT_EMAIL`) ; T045 après T022 (même fichier).
- **Polish (Phase 7)** : après les stories livrées.

### Within Each User Story

- Les tests sont écrits avant et échouent d'abord.
- Les textes viennent avant les écrans qui les lisent.
- Le site vient avant l'app pour US1 et US3 : le parcours du site valide la commande sans le téléphone.
- `mobile/app/(app)/account.tsx` est modifié par T022, T034, T040 et T045, sans [P] entre eux.

### Parallel Opportunities

- T003, T004, T005 (trois fichiers de test).
- T010, T011, T012 (trois routes) après T008 et T009.
- Dans US1 : T013, T014, T015 ensemble.
- Dans US2 : T024, T025, T030, T033.
- US2 et US4 peuvent avancer pendant que la Phase 2 se termine.

---

## Parallel Example: Phase 2

```bash
Task: "Écrire tests/domain/account-deletion.test.ts"
Task: "Écrire tests/domain/account-export.test.ts"
Task: "Écrire tests/domain/commands-account.test.ts"
# puis, après T006–T009 :
Task: "Créer app/api/v1/me/deletion/route.ts"
Task: "Créer app/api/v1/me/export/route.ts"
Task: "capabilities : analytics et apiVersion 1.2.0"
```

## Parallel Example: User Story 2

```bash
Task: "Écrire mobile/__tests__/screens/legal.test.tsx"
Task: "Compléter mobile/__tests__/i18n.test.ts"
Task: "Créer mobile/src/ui/ContentPage.tsx et ContentSection.tsx"
Task: "Créer mobile/src/features/account/LegalLinks.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phases 1 et 2.
2. Phase 3 (US1) : supprimer son compte, site puis app. Valider le quickstart US1.
3. Phase 4 (US2) : pages légales. Valider le quickstart US2.
4. **STOP** : l'app permet de supprimer son compte et de lire comment ses données sont traitées.

### Incremental Delivery

1. MVP (US1 + US2).
2. US3 : l'export ; droit d'accès sans passer par l'e-mail.
3. US4 : version, licences, contact.
4. Polish : captures, AGENTS.md, quickstart complet.

---

## Notes

- La suppression est définitive : chaque parcours de suppression du quickstart repart d'une base de démo neuve.
- La règle de transmission vient de `leaveWishlist` (T006) ; ne pas la réécrire.
- Une durée affichée dans `privacy.retentionBody` doit changer si la constante du code change (`SESSION_TTL_SEC`, `TTL_MS` de `password-reset.ts`, `WHISHLIST_BACKUP_KEEP`).
- Commits en français, préfixés `feat:`.
