# Implementation Plan: Fenêtre « Quoi de neuf » après une mise à jour de l'app

**Branch**: `staging` (dossier `022-whats-new`) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/022-whats-new/spec.md`

## Summary

Au premier lancement d'une version plus récente que la dernière vue, l'app affiche une fenêtre « Quoi de neuf » avec les nouveautés de chaque version manquée ; « C'est noté » la ferme pour de bon. Rien après une installation neuve. Un écran « Nouveautés », ouvert depuis « Mon compte », reprend les mêmes textes.

Approche : la liste des versions annoncées dans `mobile/src/whats-new/releases.ts`, leurs phrases dans `locales/{fr,en}/mobile.json` (research R2) ; une règle pure (`policy.ts`, R3, R4) ; la dernière version vue dans `meta` avec le préfixe `device.` de la 021 (R6) ; la fenêtre montée à la racine avant celle de la 021, qui attend son tour (R7). Aucune dépendance nouvelle, aucun changement côté serveur.

## Technical Context

**Language/Version**: TypeScript 6 ; app Expo SDK 58 (React Native 0.88, React 19.3), Expo Router

**Primary Dependencies**: `expo-constants` (version installée, déjà utilisé), react-i18next (`returnObjects`), composants `mobile/src/ui/` (fenêtre, `ContentPage`, `ContentSection`, `ScreenList`). Aucune dépendance nouvelle.

**Storage**: clé `device.whatsNew.lastSeenVersion` dans la table `meta` locale. Rien côté serveur.

**Testing**: jest-expo + Testing Library (`mobile/__tests__/`) ; Maestro `022-us1` (installation neuve : rien) et `022-us2` (écran) ; vraie mise à jour à la main (quickstart.md).

**Target Platform**: iOS et Android.

**Project Type**: app mobile.

**Performance Goals**: fenêtre dans les 2 s après l'ouverture (SC-004), sans réseau.

**Constraints**: textes FR/EN complets pour chaque version ; au plus 5 phrases par version ; pas de style en dur ; une fenêtre à la fois avec la 021.

**Scale/Scope**: 1 module de règles, 1 liste de versions, 1 composant de fenêtre, 1 écran, 1 entrée dans « Mon compte », 1 prop sur `UpdatePrompt`, ~8 clés i18n par langue, 2 parcours Maestro.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | Aucune donnée ; des textes du produit. | ✅ |
| II. Lecture sans compte, écriture par les membres | Non touché. La fenêtre s'affiche connecté ou non ; l'écran « Nouveautés » est dans « Mon compte » (connecté). | ✅ |
| III. Réservation sans collision | Non touché. | ✅ |
| IV. Tranches testables | US1 et US2 se vérifient seules (quickstart.md, Maestro, jest). | ✅ |
| V. Simplicité | Pas de serveur, pas de dépendance ; les textes sont des fichiers de langue. | ✅ |
| Hébergement Docker | Rien côté serveur. | ✅ |

**Re-check après Phase 1** : inchangé.

## Project Structure

### Documentation (this feature)

```text
specs/022-whats-new/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/screens.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
mobile/
├── src/whats-new/releases.ts          # RELEASES
├── src/whats-new/policy.ts            # compareVersions, whatsNewFor (pures)
├── src/whats-new/state.ts             # device.whatsNew.lastSeenVersion, traces d'usage
├── src/features/whats-new/WhatsNew.tsx
├── src/features/update/UpdatePrompt.tsx   # prop paused
├── app/_layout.tsx                    # WhatsNew puis UpdatePrompt
├── app/(app)/whats-new.tsx            # écran « Nouveautés »
├── app/(app)/account.tsx              # entrée « Nouveautés »
├── __tests__/whats-new/…              # policy, releases, state
├── __tests__/features/whats-new.test.tsx
├── __tests__/screens/whats-new.test.tsx
└── .maestro/flows/022-us1-fresh-install.yaml, 022-us2-whats-new-screen.yaml
locales/{fr,en}/mobile.json            # whatsNew.*
```

**Structure Decision**: même découpage que la 021 (`src/update/`, `src/features/update/`).

## Ordre conseillé

1. **Fondation** : `releases.ts`, `policy.ts`, `state.ts` et leurs tests ; textes de la 1.1.1 (à faire valider).
2. **US1** : fenêtre, montage à la racine, pause de `UpdatePrompt`, tests, Maestro `022-us1`.
3. **US2** : écran « Nouveautés », entrée dans « Mon compte », tests, Maestro `022-us2`.
4. **Polish** : couverture e2e et exclusion de la vraie mise à jour.

## Complexity Tracking

Aucune violation de la constitution.
