# Implementation Plan: Cadeau commun, plusieurs participants sur une même idée

**Branch**: `028-group-gift` (à créer depuis `staging` avant le premier commit) | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/028-group-gift/spec.md` (ticket WISH-23)

## Summary

En réservant une idée, un invité choisit « Réserver seul » ou « Lancer un cadeau commun ». D'autres participent, avec un nom, un message et un montant facultatifs ; l'application affiche ce qu'il reste à réunir. Une page propre au cadeau (`/g/<token>`, et son écran dans l'app) réunit tout : participants, participer, se retirer, complet/rouvrir, lien à partager, et, pour les participants avec un compte, changer son montant et un fil de messages. Pour les membres de la liste, un cadeau commun se comporte comme une idée réservée, regroupé en une entrée dans l'onglet Réservations, sans montants ni fil.

Approche : **une participation est une réservation** (colonnes `group_gift_id`, `amount_cents`), ce qui garde sans changement les refus, le mode surprise, l'assistant, les preuves sans compte et la suppression de compte (research R1). Deux tables nouvelles : `group_gifts` (idée, état, jeton du lien) et `group_gift_messages`. Les règles vivent dans un module pur `src/domain/group-gift.ts`. L'API ajoute un jeu de routes `/public/group-gifts/{token}` et ne montre les cadeaux communs qu'aux clients qui le demandent, pour que les apps déjà installées ne les voient jamais comme libres (R9).

## Technical Context

**Language/Version**: TypeScript 6 ; site Next.js (App Router, version du dépôt : lire `node_modules/next/dist/docs/` avant d'écrire du code) ; app Expo SDK 58 (React Native 0.88, React 19.3), Expo Router

**Primary Dependencies**: Drizzle (SQLite, WAL), i18next / react-i18next, `components/ui/` (Base UI : `dialog`, `input`, `textarea` ; `radio-group` à ajouter, shadcn sur Base UI, avec son pendant `mobile/src/ui/RadioGroup.tsx`), `mobile/src/ui/`, `openapi-fetch` dans l'app, `expo-secure-store` (preuves), feuille de partage native (déjà utilisée par l'écran Partage). Aucune dépendance nouvelle.

**Storage**: SQLite `data/wishlist.db` : migration `drizzle/0008_*.sql` (2 tables, 2 colonnes, reconstruction de `reservations` pour remplacer l'unicité de `item_id` par un index partiel) ; `legacy-json.ts` normalise un ancien JSON. App : aucune donnée locale nouvelle hors des preuves (`guest.claims`, + `claimKey`) ; le cadeau commun reste en ligne seulement, comme la réservation.

**Testing**: `node:test` + `tsx` : `tests/domain/group-gift.test.ts` (nouveau : chaque règle de data-model.md, concurrence seul/commun, invariant de suppression, montants et reste, fil, droits) ; `reserve`, `read`, `offrir`, `items`, `account`, `surprise`, `api-views`, `mcp`, `legacy-json`, `api-contract`, `store` complétés. jest-expo dans `mobile/__tests__/` (écran du cadeau, carte, stockage des preuves par `claimKey`). Maestro `028-us7-group-gift.yaml`. Parcours du site à la main (quickstart.md).

**Target Platform**: serveur Docker existant ; iOS et Android.

**Project Type**: application web + API JSON + app mobile cliente.

**Performance Goals**: pas d'appel de plus pour afficher une liste (le résumé est dans la réponse de la liste) ; la page du cadeau est un appel.

**Constraints**: jamais le `readToken` ni les autres idées dans la page ou la réponse du cadeau (FR-014) ; jamais de montant ni de fil dans les vues des membres (FR-023) ; anciennes apps : un cadeau commun jamais libre (FR-026) ; chaînes FR/EN ; pas de style en dur dans les écrans de l'app ; aucune notification ni e-mail (FR-018) ; pas de paiement.

**Scale/Scope**: 2 tables + 2 colonnes ; 1 module de domaine ; ~9 routes API ; 1 page du site + 4 composants touchés ; 1 écran nouveau + 3 touchés dans l'app ; ~45 clés i18n par langue ; 1 parcours Maestro.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | Démo et e2e sur comptes `@example.test`, montants et messages fictifs. | ✅ |
| II. Lecture sans compte, écriture par les membres | Participer, se retirer, déclarer complet se font sans compte, comme réserver. Seuls le fil et le changement de montant demandent un compte (choix de la spec). Les membres seuls modifient la liste et annulent. | ✅ |
| III. Réservation sans collision | **Écart** : plusieurs personnes confirment la même idée dans un cadeau commun. Garde-fous : pas de mélange seul/commun (domaine + index partiel, R2), complet = plus proposable, statut visible, annulation par un membre. **Amendement MINOR requis** (R12). | ⚠️ amendement |
| IV. Tranches testables | US1 à US7 se vérifient chacune (quickstart.md) ; US1 + US2 forment le premier livrable. | ✅ |
| V. Simplicité | « Pas de paiement » respecté (montant annoncé seulement). **Écart** : montant annoncé et fil de messages sont des mécanismes nouveaux ; justifiés par la spec (clarifications du 2026-11-18). **Amendement** (R12). Pas de notification, pas de temps réel. | ⚠️ amendement |
| Hébergement Docker | Une migration appliquée au démarrage ; aucune variable d'environnement ni service. | ✅ |

**Gate** : les deux écarts sont justifiés (Complexity Tracking) et ne bloquent pas le plan. **L'implémentation ne commence pas avant l'amendement daté de la constitution par Cloé** (texte proposé : research R12). Première tâche de `tasks.md`.

**Re-check après Phase 1** : inchangé. Le design ne crée aucun autre écart : la page du cadeau est une lecture sans compte (II), elle ne révèle pas la liste (pas d'annuaire, V).

## Project Structure

### Documentation (this feature)

```text
specs/028-group-gift/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md          # à reporter dans specs/004-mobile-api/contracts/openapi.yaml
│   └── screens.md      # écrans, clés i18n, testID
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
.specify/memory/constitution.md          # amendement III et V (Cloé)
src/
├── domain/
│   ├── group-gift.ts          # nouveau : start, join, leave, setAmount, setStatus, cancelAsMember,
│   │                          #   postMessage, deleteMessage, pruneGroupGifts, summary/detail views
│   ├── types.ts               # Reservation.groupGiftId/amountCents, GroupGift, GroupGiftMessage, Database
│   ├── reserve.ts             # refus d'une réservation seule sur un cadeau commun ; mode group
│   ├── read.ts                # visibilité publique (R4), résumé GroupGiftSummary
│   ├── items.ts               # removeReservation → pruneGroupGifts
│   ├── membership.ts          # suppression de liste : cadeaux et messages
│   ├── offrir.ts              # regroupement des participations (R10), listMyOffers + montant
│   └── account.ts             # export (participations, messages), suppression (messages anonymisés)
├── store/
│   ├── schema.ts              # 2 tables, 2 colonnes, index partiel
│   ├── rows.ts                # COLLECTIONS / COLLECTION_NAMES / readAll
│   └── legacy-json.ts         # normalisation
├── auth/
│   ├── reservation-claim.ts   # claimKey (condensé du nom de cookie), lecture par wishlist
│   └── public-list.ts         # déverrouillage retrouvé depuis le cadeau
├── server/
│   ├── commands/group-gift.ts # nouveau : orchestration (CommandContext, rateLimitForIp)
│   ├── commands/public-list.ts# reserve(mode, amount)
│   ├── commands/items.ts      # cancelGroupGiftAsMember
│   ├── actions.ts             # actions du site (participer, retirer, montant, statut, messages, annuler)
│   ├── api/views.ts           # PublicItem.groupGift, GroupGift, MemberReservation.groupGiftId
│   ├── api/errors.ts          # 5 codes
│   └── mcp/server.ts          # inchangé, test de non-régression
├── site/
│   ├── app-link-routes.json   # /g/:token → /gift/:token
│   └── analytics-public.ts    # masquer /g/<token>
drizzle/0008_*.sql
app/
├── g/[token]/page.tsx         # nouveau
├── l/[readToken]/page.tsx     # résumé sur la carte
├── l/[readToken]/reserve/page.tsx
├── lists/[id]/page.tsx        # onglet Réservations regroupé
├── account/page.tsx           # Mes réservations
├── robots.ts                  # Disallow /g/
└── api/v1/
    ├── public/lists/[readToken]/route.ts, reservations/route.ts
    ├── public/group-gifts/[token]/{route.ts, unlock, participations, participations/[reservationId], status, messages, messages/[messageId]}/route.ts
    └── lists/[listId]/group-gifts/[groupGiftId]/route.ts
components/site/
├── reservation-form.tsx       # choix seul / commun, montant
├── public-item-card.tsx       # résumé, liens
├── group-gift-*.tsx           # nouveaux : résumé, participants, formulaire, ma participation, fil, lien
└── reservation-card.tsx       # carte de cadeau commun
locales/{fr,en}/public.json, list.json, auth.json, errors.json, mobile.json
specs/004-mobile-api/contracts/openapi.yaml
mobile/
├── src/api/schema.d.ts        # api:types
├── src/features/guest/{api.ts, storage.ts, GuestItemCard.tsx}
├── src/features/group-gift/   # nouveau : api, écran, sections
├── app/gift/[token].tsx       # nouveau
├── app/guest/[readToken]/reserve.tsx
├── app/(app)/lists/[listId]/reservations.tsx
├── __tests__/…
└── .maestro/flows/028-us7-group-gift.yaml
tests/domain/group-gift.test.ts (+ tests existants complétés)
```

**Structure Decision**: couches habituelles (AGENTS.md) : règles dans `src/domain/`, orchestration dans `src/server/commands/`, adaptateurs site (`actions.ts`) et API (`app/api/v1/`, route décrite d'abord dans le contrat), écrans sans règle métier ; l'app reprend `price.ts` et `src/i18n/`.

## Ordre conseillé

0. **Amendement de la constitution** (Cloé), puis branche `028-group-gift` depuis `staging`.
1. **Fondation** : schéma + migration (relue) + `legacy-json`, types, `group-gift.ts` (règles, invariant, vues), tests de domaine ; les réservations seules se comportent exactement comme avant (tests existants verts).
2. **US1** (site) : formulaire à deux modes, carte, page `/g/<token>` (participer, se retirer), « Mes réservations ».
3. **US2** : complet / rouvrir, visibilité publique.
4. **US6** : vue des membres, annulation du cadeau entier, surprise, assistant (non-régression).
5. **US3** : lien, déverrouillage par le cadeau, robots, mesure d'audience.
6. **US4** : changer son montant.
7. **US5** : fil de messages, export, suppression de compte.
8. **US7** : contrat + routes API (`?groupGifts=true`, `claimKey`), `api:types`, écrans de l'app, lien `/g/`, Maestro, vérification avec une ancienne app.

Sortie : comme la 026, publier la version de l'app avant de merger sur `main` (research R9) ; la 028 peut partir avec la 026.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principe III : plusieurs personnes confirment la même idée | C'est le besoin de WISH-23 (cadeau offert à plusieurs). | Réserver seul puis s'organiser hors de l'application : c'est la situation actuelle que la feature corrige. |
| Principe V : montant annoncé | Demandé en clarification (« je mets tant », reste déduit) ; sans paiement. | Noms seuls : les participants ne savent pas ce qu'il manque. |
| Principe V : fil de messages entre participants | Demandé en clarification (participants avec compte). Réservé au cadeau, sans notification ni temps réel. | Messages de participation seuls : figés, pas d'échange ; messagerie générale : hors du produit. |
| Reconstruction de la table `reservations` | L'unicité de `item_id` doit devenir partielle (seules les réservations seules sont uniques). | Table `participations` séparée : il faudrait doubler les refus, le mode surprise, l'assistant et les preuves (R1). |
