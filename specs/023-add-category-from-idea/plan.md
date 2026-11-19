# Implementation Plan: Ajouter une catégorie depuis le formulaire d'idée

**Branch**: `023-add-category-from-idea` (depuis `staging`) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/023-add-category-from-idea/spec.md` (origine : bug `idea-category-locked`)

## Summary

Dans le formulaire d'idée (ajout et modification), le choix de catégorie se termine par « + Nouvelle catégorie » ; la choisir ouvre un petit bloc « Nouvelle catégorie » sous le champ ; « Ajouter la catégorie » crée la catégorie par le même chemin que Réglages et la sélectionne, sans toucher aux autres champs. App (US1) et site (US2). Aucune règle ni route nouvelle : l'ajout existant (`manageLabel` côté serveur, `POST /lists/{listId}/types` pour l'app) rend désormais la catégorie créée jusqu'au formulaire (research R1).

## Technical Context

**Language/Version**: TypeScript 6 ; site Next.js (App Router) ; app Expo SDK 58, React Native 0.88

**Primary Dependencies**: composants existants (`components/ui/` : `native-select`, `input`, `button`, `field` ; `mobile/src/ui/` : `Select`, `Input`, `Button`, `Field`, `NetworkNote`). Aucune dépendance nouvelle.

**Storage**: rien de nouveau ; la catégorie est créée comme dans Réglages.

**Testing**: `node:test` (`tests/domain/commands-labels.test.ts`) ; jest-expo (`mobile/__tests__/`) ; Maestro `023-us1` ; site à la main (quickstart.md).

**Target Platform**: site, iOS, Android.

**Project Type**: application web + app mobile.

**Performance Goals**: un appel au serveur pour créer la catégorie, puis un rechargement de la liste (app) ou un `refresh()` (site).

**Constraints**: aucune saisie perdue (SC-002) ; hors ligne, l'entrée est désactivée dans l'app (FR-007) ; mêmes règles et messages que Réglages (SC-003) ; textes FR/EN.

**Scale/Scope**: 1 prop sur `Select`, 1 bloc dans chaque `ItemForm`, 1 valeur de retour élargie (`addLabel`, `manageLabelAction`), 1 clé i18n par langue, 1 parcours Maestro.

## Constitution Check

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | Rien de nouveau. | ✅ |
| II. Lecture sans compte, écriture par les membres | Création réservée aux membres, par la commande existante (`activeUser`, `findMembership` via `addType`). | ✅ |
| III. Réservation sans collision | Non touché. | ✅ |
| IV. Tranches testables | US1 (app, Maestro) et US2 (site, quickstart) indépendantes. | ✅ |
| V. Simplicité | Réutilise l'ajout de Réglages ; pas de nouvelle route. | ✅ |
| Hébergement Docker | Rien. | ✅ |

**Re-check après Phase 1** : inchangé.

## Project Structure

### Documentation (this feature)

```text
specs/023-add-category-from-idea/
├── plan.md
├── research.md
├── quickstart.md
├── contracts/screens.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

Pas de `data-model.md` : aucune donnée nouvelle (la catégorie existe déjà).

### Source Code (repository root)

```text
src/server/actions.ts                    # manageLabelAction rend { ok, label }
components/site/item-form.tsx            # option « + Nouvelle catégorie » + bloc
mobile/src/data/labels.ts                # addLabel rend la Label créée
mobile/src/ui/Select.tsx                 # prop action
mobile/src/features/items/ItemForm.tsx   # action + bloc
locales/{fr,en}/list.json                # form.newTypeOption
tests/domain/commands-labels.test.ts     # la première catégorie créée est rendue
mobile/__tests__/ui/…, screens/item-form.test.tsx
mobile/.maestro/flows/023-us1-new-category.yaml
```

**Structure Decision**: couches habituelles ; aucune règle dans les écrans (la règle reste `addType`).

## Ordre conseillé

1. **Fondation** : `addLabel` et `manageLabelAction` rendent la catégorie créée ; test de commande ; clé i18n.
2. **US1 (app)** : `Select.action`, bloc dans `ItemForm`, tests jest, Maestro.
3. **US2 (site)** : option et bloc dans `components/site/item-form.tsx`, vérification à la main.
4. **Polish** : couverture e2e (`023` dans `coverage.test.ts`, exclusion `023-us2` site) ; clôturer l'évaluation du bug.

## Complexity Tracking

Aucune violation de la constitution.
