# Implementation Plan: Renommer une liste suivie et nommer la personne qui l'a créée

**Branch**: `024-followed-list-names` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/024-followed-list-names/spec.md` (ticket WISH-15)

## Summary

Un abonné peut donner son propre nom à une liste suivie et voir à qui elle est : par défaut le nom d'affichage du propriétaire, qu'il peut remplacer. Ces noms s'affichent sur la carte de « Mes listes » et en tête de la liste quand il l'ouvre, sur le site et dans l'app, et ne sont visibles que de lui.

Approche : deux colonnes facultatives sur `subscriptions` (research R1), une règle pure `renameSubscription` et une valeur dérivée `ownerName` (R2, R3), un module d'affichage pur `followedDisplay` partagé par le site et l'app. L'API ajoute des champs à `SubscribedListSummary` et `PublicList` et une route `PUT /subscriptions/{readToken}` (contracts/api.md, version 1.10.0), sans changer les valeurs existantes pour les apps déjà installées (R8). On modifie les noms là où l'on se désabonne déjà : la carte de « Mes listes » sur le site, l'écran de la liste suivie dans l'app (R5).

## Technical Context

**Language/Version**: TypeScript 6 ; site Next.js (App Router, version du dépôt, lire `node_modules/next/dist/docs/` avant d'écrire du code) ; app Expo SDK 58 (React Native 0.88), Expo Router

**Primary Dependencies**: Drizzle (SQLite, WAL), i18next / react-i18next, `components/ui/` (`dialog`, `field`, `input`), `mobile/src/ui/` (`Field`, `Input`, `Button`, `Alert`), `openapi-fetch` dans l'app. Aucune dépendance nouvelle.

**Storage**: SQLite : colonnes `subscriptions.custom_title`, `subscriptions.custom_owner_name` (`drizzle/0007_*.sql`, data-model.md). App : aucune migration locale ; les noms arrivent par les copies hors ligne existantes (`subscriptions`, `PublicList`).

**Testing**: `node:test` + `tsx` (`tests/domain/subscription.test.ts`, `followed-display.test.ts` nouveau, `account` pour l'export, `api-views`, `legacy-json`, `api-contract` complétés) ; jest-expo dans `mobile/__tests__/` (carte, en-tête, écran des noms, hors ligne) ; Maestro `mobile/.maestro/flows/024-us1-rename-followed.yaml` ; site à la main (quickstart.md).

**Target Platform**: serveur Docker existant ; iOS et Android.

**Project Type**: application web + API JSON + app mobile cliente.

**Performance Goals**: aucun appel en plus pour afficher « Mes listes » ou une liste ; `ownerName` se calcule avec les données déjà lues.

**Constraints**: le nom du propriétaire et les noms choisis ne sortent jamais pour qui ne suit pas la liste (FR-007, FR-011) ; valeurs existantes inchangées pour les apps 1.0/1.1 ; chaînes FR/EN ; pas de style en dur dans les écrans de l'app.

**Scale/Scope**: 2 colonnes + 1 migration ; 2 fonctions de domaine + 1 module d'affichage ; 1 route ; 1 dialogue et 2 pages du site ; 3 composants et 1 écran de l'app ; ~13 clés par langue ; 1 parcours Maestro.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | Démo et e2e sur comptes `@example.test`. | ✅ |
| II. Lecture sans compte, écriture par les membres | L'abonné n'écrit que sur son propre abonnement ; la liste elle-même n'est pas modifiée. Lecture sans compte inchangée (aucun nom ajouté). | ✅ |
| III. Réservation sans collision | Aucune règle de réservation touchée. | ✅ |
| IV. Tranches testables | US1 (renommer) et US2 (à qui) se vérifient chacune seules (quickstart.md). | ✅ |
| V. Simplicité | Deux champs texte sur un abonnement existant, pas de nouvelle page sur le site (un dialogue). Sert à lire les listes suivies. | ✅ |
| Hébergement Docker | Une migration de plus, appliquée au démarrage ; aucune variable ni service. | ✅ |

**Re-check après Phase 1** : inchangé. Le nom d'affichage du propriétaire devient visible de ses abonnés (clarification acceptée), jamais des visiteurs.

## Project Structure

### Documentation (this feature)

```text
specs/024-followed-list-names/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md          # changements à reporter dans specs/004-mobile-api/contracts/openapi.yaml
│   └── screens.md      # écrans, clés i18n, testID
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
src/domain/types.ts                 # Subscription : customTitle, customOwnerName
src/domain/subscription.ts          # renameSubscription, ownerName
src/domain/followed-display.ts      # nouveau, pur, repris par l'app
src/domain/account.ts               # export : customTitle, customOwnerName
src/store/schema.ts, rows.ts, legacy-json.ts
drizzle/0007_*.sql                  # généré
src/server/commands/public-list.ts  # renameFollowedList, à côté du désabonnement
src/server/api/views.ts             # SubscribedListSummary, PublicList.follow
src/server/actions.ts               # renameFollowedListAction
app/api/v1/subscriptions/[readToken]/route.ts   # PUT
app/page.tsx                        # cartes « Listes suivies »
app/l/[readToken]/page.tsx          # en-tête pour un abonné
components/site/follow-names-dialog.tsx         # nouveau
locales/{fr,en}/{home,public,errors}.json
specs/004-mobile-api/contracts/openapi.yaml     # 1.10.0
mobile/src/api/schema.d.ts          # généré (api:types)
mobile/src/data/subscriptions.ts    # renameFollowedList
mobile/app/(app)/index.tsx          # cartes
mobile/src/features/guest/GuestListHeader.tsx, GuestFollow.tsx
mobile/app/guest/[readToken]/names.tsx          # nouveau
mobile/.maestro/flows/024-us1-rename-followed.yaml
tests/domain/*.test.ts, mobile/__tests__/**
```

**Structure Decision**: couches habituelles du guide des agents ; aucune nouvelle couche.

## Complexity Tracking

Aucune violation de la constitution.
