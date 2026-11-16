# Implementation Plan: Prévenir qu'une mise à jour de l'app est disponible

**Branch**: `staging` (dossier `021-app-update-prompt`) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/021-app-update-prompt/spec.md` (ticket WISH-19)

## Summary

L'app vérifie, au démarrage et au plus une fois par jour au retour au premier plan, si une version plus récente est publiée sur le store. Sur iPhone, elle affiche une fenêtre « Nouvelle version disponible » (« Mettre à jour » ouvre la fiche App Store dans l'app, « Plus tard » reporte de 7 jours). Sur Android, elle lance la mise à jour flexible de Google Play : téléchargement en arrière-plan, puis installation et redémarrage automatiques ; un refus reporte de 7 jours. Tout échec reste silencieux.

Approche : la lib `expo-in-app-updates` 0.13 (research R1, R2), une règle pure de fréquence et de report (`mobile/src/update/policy.ts`, R4, R5), l'état dans la table `meta` locale (R6), un composant `UpdatePrompt` monté à la racine (R3). Aucun changement du serveur ni de l'API.

## Technical Context

**Language/Version**: TypeScript 6 ; app Expo SDK 58 (React Native 0.88, React 19.3, nouvelle architecture), Expo Router

**Primary Dependencies**: `expo-in-app-updates` 0.13.x (nouvelle, native : Play Core app-update 2.1.0 sur Android, StoreKit et recherche iTunes sur iOS) ; `react-native` `AppState` ; composants `mobile/src/ui/` (`ConfirmDialog`).

**Storage**: table `meta` de la base SQLite locale (`device.update.lastCheckAt`, `device.update.snooze`), gardée à la déconnexion. Rien côté serveur.

**Testing**: jest-expo + Testing Library (`mobile/__tests__/`), la lib simulée par `jest.mock` ; pas de parcours Maestro (exclusions) ; vérification manuelle sur les stores (quickstart.md).

**Target Platform**: iOS 16.4+ (exigence de la lib), Android 5.0+ avec Google Play.

**Project Type**: app mobile.

**Performance Goals**: fenêtre affichée en moins de 5 s après l'ouverture (SC-001) ; aucun ralentissement de l'ouverture (la vérification ne bloque rien, SC-004).

**Constraints**: silencieux hors ligne et en cas d'erreur ; rien en build de développement ; pas de style en dur ; textes FR/EN.

**Scale/Scope**: 1 dépendance native, 1 module de règles, 1 composant, 4 clés i18n par langue, 1 changement de `clearAll`, configuration iOS (`AppStoreID`, `AppStoreCountry`), nouveaux builds EAS (1.2.0).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | `AppStoreID` est un identifiant public de fiche, pas un secret. | ✅ |
| II. Lecture sans compte, écriture par les membres | Non touché ; la fenêtre s'affiche aussi sans compte. | ✅ |
| III. Réservation sans collision | Non touché. | ✅ |
| IV. Tranches testables | US1 (iPhone) et US2 (Android) se vérifient chacune seule (quickstart.md), sur les stores. | ✅ |
| V. Simplicité | Une lib, pas de serveur ; mise à jour seulement conseillée. Le mécanisme sert à garder l'app capable de lire et créer les listes avec les dernières fonctions. | ✅ |
| Hébergement Docker | Rien côté serveur. Les stores sont des services externes optionnels : sans eux, l'app marche (FR-007). | ✅ |

**Re-check après Phase 1** : inchangé.

## Project Structure

### Documentation (this feature)

```text
specs/021-app-update-prompt/
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
├── package.json                     # expo-in-app-updates (npx expo install)
├── app.config.ts                    # ios.infoPlist : AppStoreID, AppStoreCountry ; version 1.2.0
├── app/_layout.tsx                  # monte <UpdatePrompt />
├── src/update/policy.ts             # shouldCheck, shouldPrompt (pures)
├── src/update/state.ts              # lecture / écriture de device.update.* dans meta
├── src/features/update/UpdatePrompt.tsx
├── src/offline/snapshot.ts          # clearAll garde device.*
├── __tests__/update/policy.test.ts
├── __tests__/features/update-prompt.test.tsx
├── __tests__/offline/…              # clearAll
├── __tests__/e2e/coverage.test.ts   # feature 021
└── .maestro/exclusions.md           # 021-us1, 021-us2 : story entière
locales/{fr,en}/mobile.json          # update.*
```

**Structure Decision**: tout est dans l'app (`mobile/`), sans règle métier du produit : la règle de fréquence est une règle d'affichage propre à l'app, gardée pure et testée.

## Ordre conseillé

1. **Fondation** : installer la lib, configuration iOS, `policy.ts` et `state.ts` avec leurs tests, `clearAll`.
2. **US1 (iPhone)** : `UpdatePrompt` (fenêtre, « Mettre à jour », « Plus tard »), textes, tests.
3. **US2 (Android)** : branche Android de `UpdatePrompt` (proposition flexible, report sur refus), tests.
4. **Polish** : exclusions Maestro et couverture, version 1.2.0, note de publication.

## Complexity Tracking

Aucune violation de la constitution.
