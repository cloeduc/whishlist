# Implementation Plan: Mode surprise, ne pas voir ce qui est réservé sur sa propre liste

**Branch**: `staging` (dossier `020-surprise-mode`) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/020-surprise-mode/spec.md` (ticket WISH-17)

## Summary

Chaque membre d'une liste peut cocher « Ne pas voir les cadeaux réservés » dans l'onglet Partage (site et app). Pour lui, les idées réservées restent dans « Idées » sans marque, « Archives » ne contient que ce qu'un membre a archivé, et « Réservations » n'a ni compteur ni contenu tant qu'il ne confirme pas « Voir les réservations ». Supprimer ou déplacer une idée réservée reste refusé, avec un message neutre. Les invités ne voient pas de changement.

Approche : le drapeau `archived` d'une idée ne veut plus dire que « archivée par un membre » ; une réservation ne l'écrit plus (research R1, migration). Le réglage est une colonne de `memberships` (R2). Un module pur `src/domain/surprise.ts` décide où se range une idée pour un membre (R3) ; la page du site, les vues de l'API et l'assistant l'utilisent. L'API ajoute `surpriseMode` à `MemberList`, deux routes (régler, révéler) et un code d'erreur (contracts/api.md), en gardant les valeurs actuelles hors mode surprise pour les apps déjà installées (R7).

## Technical Context

**Language/Version**: TypeScript 6 ; site Next.js (App Router, version du dépôt, lire `node_modules/next/dist/docs/` avant d'écrire du code) ; app Expo SDK 58 (React Native 0.88, React 19.3), Expo Router

**Primary Dependencies**: Drizzle (SQLite, WAL), i18next / react-i18next, composants `components/ui/` (Base UI, `checkbox`, `dialog`) et `mobile/src/ui/` (`Checkbox`, `ConfirmDialog`, `NetworkNote`), `openapi-fetch` dans l'app. Aucune dépendance nouvelle.

**Storage**: SQLite `data/wishlist.db` : colonne `memberships.surprise_mode`, et `UPDATE` des idées réservées (`drizzle/0006_*.sql`, data-model.md). Dans l'app : aucune migration locale ; les réservations révélées ne sont jamais écrites dans la base du téléphone.

**Testing**: `node:test` + `tsx` (`tests/domain/surprise.test.ts` nouveau ; `reserve`, `items`, `read`, `api-views`, `mcp`, `legacy-json`, `api-contract` complétés) ; jest-expo dans `mobile/__tests__/` ; Maestro `mobile/.maestro/flows/020-us3-surprise-mode.yaml` ; parcours du site à la main (quickstart.md).

**Target Platform**: serveur Docker existant ; iOS (iPhone 17 Pro Max, iOS 26.5) et Android.

**Project Type**: application web + API JSON + app mobile cliente.

**Performance Goals**: pas d'appel en plus pour afficher une liste ; la révélation est un appel à la demande.

**Constraints**: aucune donnée de réservation dans le HTML ni dans la réponse `MemberList` d'un membre en mode surprise ; valeurs inchangées hors mode surprise pour les apps 1.0/1.1 ; chaînes FR/EN ; pas de style en dur dans les écrans de l'app.

**Scale/Scope**: 1 colonne + 1 migration de données ; 1 module de domaine ; 2 routes API ; 3 composants du site ; 4 écrans de l'app touchés ; ~16 clés i18n par langue ; 1 parcours Maestro.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | Démo et e2e sur comptes `@example.test`. Aucune donnée réelle. | ✅ |
| II. Lecture sans compte, écriture par les membres | Le réglage s'écrit par un membre pour lui-même. Lecture publique inchangée. | ✅ |
| III. Réservation sans collision | Aucune règle de réservation ne change (`item_id` unique, refus `itemAlreadyReserved`). L'annulation reste une action de membre. Le statut « réservé » n'est caché qu'au membre qui le demande ; les invités ne voyaient déjà pas les idées réservées par d'autres. Clarification PATCH du libellé du principe à proposer à Cloé (R11), sans bloquer. | ✅ |
| IV. Tranches testables | US1 (site), US2 (révéler), US3 (app) se vérifient chacune seules (quickstart.md). | ✅ |
| V. Simplicité | Un booléen par appartenance, pas de notification, pas de nouvelle page. Le mécanisme sert à lire sa liste sans être spoilé. | ✅ |
| Hébergement Docker | Une migration Drizzle de plus, appliquée au démarrage ; aucune variable d'environnement ni service. | ✅ |

**Re-check après Phase 1** : inchangé. Le seul écart de comportement hors mode surprise (bouton « Remettre dans la liste » remplacé par une phrase sur une idée réservée, R1) ne touche aucun principe.

## Project Structure

### Documentation (this feature)

```text
specs/020-surprise-mode/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md          # changements à reporter dans specs/004-mobile-api/contracts/openapi.yaml
│   └── screens.md      # écrans, clés i18n, testID
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── surprise.ts            # nouveau : surpriseModeOf, memberShelf, setSurpriseMode
│   ├── types.ts               # Membership.surpriseMode
│   ├── reserve.ts             # reserveItem n'archive plus
│   ├── items.ts               # removeReservation ne désarchive plus ; refus itemLockedSurprise
│   └── read.ts                # vue publique : inchangée, test de non-régression
├── store/
│   ├── schema.ts              # memberships.surprise_mode
│   └── legacy-json.ts         # normalisation d'un ancien JSON
├── server/
│   ├── commands/lists.ts      # setSurpriseMode, revealReservations
│   ├── api/views.ts           # MemberList.surpriseMode, archived projeté, itemCount par membre
│   ├── api/errors.ts          # itemLockedSurprise
│   ├── actions.ts             # setSurpriseModeAction, revealReservationsAction
│   └── mcp/server.ts          # description de get_list
drizzle/0006_*.sql             # colonne + UPDATE des idées réservées
app/
├── lists/[id]/page.tsx        # placement via memberShelf, onglets, carte, révélation
└── api/v1/lists/[listId]/
    ├── surprise-mode/route.ts # PUT
    └── reservations/route.ts  # GET
components/site/
├── surprise-mode-form.tsx
├── reservations-reveal.tsx
└── reservation-card.tsx    # « Voir comme invité » : `confirm-form.tsx` avec `href` (revue)
locales/{fr,en}/list.json, errors.json
specs/004-mobile-api/contracts/openapi.yaml
mobile/
├── src/api/schema.d.ts        # api:types
├── src/data/sharing.ts        # setSurpriseMode, revealReservations
├── src/features/lists/ListScreen.tsx
├── src/features/sharing/SurpriseCard.tsx
├── app/(app)/lists/[listId]/{share,reservations,archives}.tsx
├── __tests__/…
└── .maestro/flows/020-us3-surprise-mode.yaml
tests/domain/surprise.test.ts (+ tests existants complétés)
```

**Structure Decision**: couches habituelles du projet (AGENTS.md) : règle dans `src/domain/`, orchestration dans `src/server/commands/`, adaptateurs site (`actions.ts`) et API (`app/api/v1/`), écrans sans règle métier.

## Ordre conseillé

1. **Fondation (avant US1)** : R1 (découplage + migration + legacy-json) et R2/R3 (`surprise.ts`), tests de domaine ; hors mode surprise, tout se comporte comme avant (sauf la phrase des Archives).
2. **US1** : carte du site, placement Idées/Archives, onglet Réservations caché, refus neutres, « Voir comme invité ».
3. **US2** : révélation sur le site.
4. **US3** : contrat + routes API, `api:types`, écrans de l'app, Maestro, assistant.

## Complexity Tracking

Aucune violation de la constitution.
