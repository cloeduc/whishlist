# Implementation Plan: Champ mot de passe (sans majuscule automatique, avec un œil)

**Branch**: `016-password-field` (worktree Herdr `task/1-champ-mot-de-passe-016`) | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-password-field/spec.md`

## Summary

Un composant de champ mot de passe de chaque côté, qui remplace tous les champs du tableau de la spec :

- **Site** : `components/ui/password-input.tsx` (`PasswordInput`), composant client. Il rend l'`Input` existant (`type="password"` par défaut, `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`) dans un conteneur relatif, plus un bouton œil `type="button"` à droite (icônes `Eye` / `EyeOff` de `lucide-react`), avec un `aria-label` traduit qui suit l'état. Sans JavaScript, le rendu serveur est un champ masqué normal. Le bouton natif d'Edge est masqué (`::-ms-reveal`). Les 10 champs des 8 formulaires l'utilisent.
- **App** : `mobile/src/ui/PasswordInput.tsx`. Il reprend l'`Input` existant (même boîte, même ombre) avec `autoCapitalize="none"`, `autoCorrect={false}`, `spellCheck={false}`, `secureTextEntry` qui suit l'état, et un `Pressable` œil de 44 × 44 à droite (`EyeIcon` / `EyeOffIcon` de `lucide-react-native`), testID `<testID>-reveal`. L'état revient à « masqué » quand l'écran perd le focus et quand le formulaire vide le champ après un envoi. Les 10 champs l'utilisent.
- **Textes** : `common:passwordField.show` / `common:passwordField.hide`, en FR et en EN.
- **Tests** : tests du composant et de chaque écran (app, jest) ; test de rendu serveur du composant et test qui interdit un `type="password"` hors du composant (site, `node:test`) ; parcours Maestro `016-us2` ; US1 et US3 en exclusions (vérification à la main).

## Technical Context

**Language/Version**: TypeScript 5 ; Node.js 22 (image), 20+ en dev

**Primary Dependencies**: site : Next.js 16.4.2, React 19.1, Base UI (`Input`), `lucide-react`, react-i18next ; app : Expo 58, React Native 0.88, `lucide-react-native`, expo-router. Aucune nouvelle dépendance.

**Storage**: N/A (aucune donnée, aucune migration)

**Testing**: `node:test` + `tsx` (`tests/domain/password-input.test.ts`, rendu par `react-dom/server`) ; jest-expo + Testing Library (`mobile/__tests__/ui/password-input.test.tsx` et tests d'écrans) ; Maestro (`mobile/.maestro/flows/016-us2-show-password.yaml`) ; [quickstart.md](quickstart.md) à la main

**Target Platform**: navigateurs récents (mobile et bureau, avec et sans JavaScript), iOS et Android

**Project Type**: application web Next.js + app mobile Expo cliente de l'API

**Performance Goals**: N/A

**Constraints**:

- Aucun changement de l'API, des règles de mot de passe ni de la base.
- Indications de remplissage conservées champ par champ (`autoComplete`, `textContentType`), pour le trousseau iOS et les gestionnaires.
- La feuille iOS « mot de passe robuste » et sa croix, tapée par position dans `submit-register.yaml`, restent utilisables.
- Les testID existants restent sur le champ (`TextInput`) ; l'œil a le sien.

**Scale/Scope**: site : 8 formulaires, 10 champs ; app : 8 écrans ou cartes, 10 champs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / section | Effet de la feature | Statut |
|--------------------|---------------------|--------|
| I. Données personnelles hors dépôt | Aucune donnée ajoutée. Le parcours e2e tape un mot de passe fictif, le quickstart utilise la démo `@example.test`. | OK |
| II. Lecture sans compte, écriture par les membres | Aucun contrôle d'accès touché : seule la saisie change. | OK |
| III. Réservation sans collision | Non concerné. | OK |
| IV. Tranches testables | 3 stories, chacune vérifiable seule (US1 sans l'œil, US2 avec), chacune décrite dans le quickstart ; un commit par story. | OK |
| V. Simplicité | Un composant de chaque côté, sans dépendance nouvelle ; pas d'« appuyer pour voir », pas de masquage par délai. | OK |
| Hébergement Docker | Aucun changement d'image ni de variable. | OK |
| Workflow | La spec ne nomme pas le framework ; les choix techniques sont ici et dans [research.md](research.md). | OK |

**Re-check après la phase 1** : OK, aucun écart.

## Project Structure

### Documentation (this feature)

```text
specs/016-password-field/
├── plan.md              # ce fichier
├── research.md          # décisions techniques (phase 0)
├── data-model.md        # état du champ (phase 1)
├── quickstart.md        # vérification à la main (phase 1)
├── contracts/
│   └── password-input.md  # interface des deux composants
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
components/ui/password-input.tsx        # nouveau : PasswordInput du site
app/globals.css                         # ::-ms-reveal masqué
components/site/login-form.tsx          # ┐
components/site/register-form.tsx       # │
components/site/reset-password-form.tsx # │ Input type="password" → PasswordInput
components/site/password-form.tsx       # │ (3 champs)
components/site/email-change-form.tsx   # │
components/site/delete-account-dialog.tsx
components/site/read-password-form.tsx  # │
components/site/read-unlock-form.tsx    # ┘
locales/{fr,en}/common.json             # passwordField.show / hide
tests/domain/password-input.test.ts     # rendu serveur + aucun type="password" hors du composant

mobile/src/ui/PasswordInput.tsx         # nouveau : PasswordInput de l'app
mobile/app/(auth)/login.tsx             # ┐
mobile/app/(auth)/register.tsx          # │
mobile/app/links/reset-password/[token].tsx
mobile/src/features/account/PasswordForm.tsx  # │ Input secureTextEntry → PasswordInput
mobile/src/features/account/EmailCard.tsx     # │ (3 champs dans PasswordForm)
mobile/app/(app)/delete-account.tsx     # │
mobile/app/guest/[readToken]/index.tsx  # │
mobile/app/(app)/shared/follow.tsx      # ┘
mobile/__tests__/ui/password-input.test.tsx   # nouveau
mobile/__tests__/ui/password-fields.test.ts   # nouveau : aucun secureTextEntry hors du composant
mobile/__tests__/e2e/test-ids.test.ts         # suffixe -reveal
mobile/__tests__/e2e/coverage.test.ts         # feature 016
mobile/.maestro/flows/016-us2-show-password.yaml  # nouveau
mobile/.maestro/exclusions.md           # 016-us1, 016-us3
```

**Structure Decision**: la structure existante. `PasswordInput` du site va dans `components/ui/` (primitive sans règle métier, à côté d'`input.tsx`) ; celui de l'app dans `mobile/src/ui/` (un composant par composant de `components/ui/`, AGENTS.md).

## Complexity Tracking

Aucun écart à justifier.
