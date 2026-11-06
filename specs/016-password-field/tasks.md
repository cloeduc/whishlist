---

description: "Task list for feature 016 — password field"
---

# Tasks: Champ mot de passe (sans majuscule automatique, avec un œil)

**Input**: Design documents from `/specs/016-password-field/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/password-input.md, quickstart.md

**Tests**: demandés par AGENTS.md (chaque règle et chaque cas limite a son test ; une story de l'app a son parcours Maestro ou une ligne d'exclusion).

**Organization**: une phase par user story, chacune close par son commit.

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`/`chore:`, terminé par `(USn)`), sans demander. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

Aucune tâche : pas de dépendance nouvelle (`lucide-react` et `lucide-react-native` ont déjà `Eye` / `EyeOff`), pas de configuration.

## Phase 2: Foundational

Aucune tâche bloquante : les composants naissent dans l'US1 et s'enrichissent dans l'US2.

---

## Phase 3: User Story 1 - Taper son mot de passe sans que le clavier le modifie (Priority: P1) 🎯 MVP

**Goal**: un composant de champ mot de passe de chaque côté, sans majuscule ni correction automatique, utilisé par tous les champs du tableau de la spec.

**Independent Test**: quickstart, section US1 (clavier en minuscules, connexion du premier coup, feuille iOS « mot de passe robuste » toujours là).

### Tests for User Story 1

- [ ] T001 [P] [US1] Test de rendu serveur du `PasswordInput` du site dans `tests/domain/password-input.test.ts` (`react-dom/server`) : `type="password"`, `autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"`, `autoComplete` reçu conservé, un `type` passé par l'appelant ignoré
- [ ] T002 [P] [US1] Tests du `PasswordInput` de l'app dans `mobile/__tests__/ui/password-input.test.tsx` : `secureTextEntry`, `autoCapitalize="none"`, `autoCorrect={false}`, `spellCheck={false}`, `testID` / `accessibilityLabel` / `autoComplete` / `textContentType` transmis au `TextInput`, même boîte que `Input` (bordure, ombre)

### Implementation for User Story 1

- [ ] T003 [P] [US1] Créer `components/ui/password-input.tsx` (`"use client"`) : `PasswordInput`, props d'`Input` sans `type`, rend `Input` avec `type="password"`, `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}` (contract `contracts/password-input.md`)
- [ ] T004 [US1] Remplacer les champs mot de passe du site par `PasswordInput`, `autoComplete` inchangé : `components/site/login-form.tsx`, `register-form.tsx`, `reset-password-form.tsx`, `password-form.tsx` (3 champs), `email-change-form.tsx`, `delete-account-dialog.tsx`, `read-password-form.tsx`, `read-unlock-form.tsx`
- [ ] T005 [P] [US1] Créer `mobile/src/ui/PasswordInput.tsx` : props d'`Input` sans `secureTextEntry`, `autoCapitalize`, `autoCorrect`, `spellCheck`, qu'il fixe (`secureTextEntry`, `"none"`, `false`, `false`)
- [ ] T006 [US1] Remplacer les 10 champs de l'app par `PasswordInput`, testID, `accessibilityLabel`, `autoComplete`, `textContentType`, `editable`, `invalid` inchangés : `mobile/app/(auth)/login.tsx`, `mobile/app/(auth)/register.tsx`, `mobile/app/links/reset-password/[token].tsx`, `mobile/src/features/account/PasswordForm.tsx` (3), `mobile/src/features/account/EmailCard.tsx`, `mobile/app/(app)/delete-account.tsx`, `mobile/app/guest/[readToken]/index.tsx`, `mobile/app/(app)/shared/follow.tsx`
- [ ] T007 [US1] Vérifier que les tests d'écrans existants (`mobile/__tests__/screens/*.test.tsx`) passent sans changement de testID
- [ ] T008 [US1] Commit de la story : contrôles verts, puis `feat: password fields without auto-capitalisation or auto-correction (US1)`, sans demander

**Checkpoint**: US1 livrable seule (pas encore d'œil).

---

## Phase 4: User Story 2 - Afficher ou masquer le mot de passe tapé (Priority: P2)

**Goal**: l'œil dans chaque champ, libellé traduit selon l'état, état propre au champ et remis à « masqué » (FR-002 à FR-006).

**Independent Test**: quickstart, section US2 ; parcours Maestro `016-us2-show-password.yaml`.

### Tests for User Story 2

- [ ] T009 [P] [US2] Compléter `tests/domain/password-input.test.ts` : bouton `type="button"` avec `aria-controls` = `id` du champ, `aria-label` « Afficher le mot de passe » (FR) et « Show password » (EN) à l'état initial, icône `aria-hidden`, champ `pr-11`
- [ ] T010 [P] [US2] Compléter `mobile/__tests__/ui/password-input.test.tsx` : œil `<testID>-reveal`, rôle bouton, libellés FR/EN selon l'état, bascule sans changer la valeur, deux champs indépendants, zone de toucher ≥ 44 × 44, œil utilisable avec `editable={false}`, re-masqué au départ de l'écran (nettoyage de `useFocusEffect`) et quand l'écran vide la valeur, pas re-masqué quand la personne efface elle-même
- [ ] T011 [P] [US2] Test d'écran : après un changement de mot de passe réussi dans `PasswordForm`, le champ affiché redevient masqué (`mobile/__tests__/screens/account.test.tsx`)

### Implementation for User Story 2

- [ ] T012 [P] [US2] Ajouter `passwordField.show` / `passwordField.hide` à `locales/fr/common.json` (« Afficher le mot de passe » / « Masquer le mot de passe ») et `locales/en/common.json` (« Show password » / « Hide password »)
- [ ] T013 [US2] Site : état `visible` dans `components/ui/password-input.tsx`, conteneur `relative`, `Input` en `pr-11`, `<button type="button">` à droite avec `Eye` / `EyeOff` (`lucide-react`), `aria-label` traduit (`common`), `aria-controls`
- [ ] T014 [P] [US2] Site : masquer le bouton natif d'Edge, `input::-ms-reveal { display: none }`, dans `app/globals.css`
- [ ] T015 [US2] App : prop `trailing` dans `mobile/src/ui/Input.tsx` (élément à droite du `TextInput`, dans la boîte, ligne `flexDirection: "row"`, `TextInput` en `flex: 1`)
- [ ] T016 [US2] App : état `visible` dans `mobile/src/ui/PasswordInput.tsx`, `secureTextEntry={!visible}`, œil `Pressable` 44 × 44 (`EyeIcon` / `EyeOffIcon`), testID `<testID>-reveal`, libellé traduit ; re-masquage par `useFocusEffect` (expo-router) et quand la valeur passe à `""` sans saisie
- [ ] T017 [US2] Ajouter `useFocusEffect: jest.fn()` aux simulations d'`expo-router` des tests d'écrans qui rendent un champ mot de passe (`mobile/__tests__/screens/*.test.tsx`)
- [ ] T018 [US2] Accepter le suffixe `-reveal` dans `mobile/__tests__/e2e/test-ids.test.ts`
- [ ] T019 [US2] Parcours Maestro `mobile/.maestro/flows/016-us2-show-password.yaml` (tag `016-us2`) : Connexion, saisie masquée, œil → saisie lisible et libellé « Masquer… », œil → masquée, re-masquée au retour d'Inscription ; ajouter `"016"` aux specs de `mobile/__tests__/e2e/coverage.test.ts`
- [ ] T020 [US2] Exclusions de la story dans `mobile/.maestro/exclusions.md` : annonce VoiceOver / TalkBack, œil hors ligne (mode avion)
- [ ] T021 [US2] Commit de la story : contrôles verts, puis `feat: show or hide the password with an eye button (US2)`, sans demander

**Checkpoint**: US1 et US2 marchent.

---

## Phase 5: User Story 3 - Même champ partout, même apparence (Priority: P3)

**Goal**: garantir que tout champ mot de passe passe par le composant, et que les deux composants se ressemblent (FR-009).

**Independent Test**: quickstart, section US3.

- [ ] T022 [P] [US3] Site : dans `tests/domain/password-input.test.ts`, parcourir `components/` et `app/` : aucun `type="password"` hors de `components/ui/password-input.tsx`
- [ ] T023 [P] [US3] App : `mobile/__tests__/ui/password-fields.test.ts` parcourt `mobile/app/` et `mobile/src/` : aucun `secureTextEntry` hors de `mobile/src/ui/PasswordInput.tsx`, et 10 usages de `<PasswordInput` exactement
- [ ] T024 [P] [US3] App : test d'apparence dans `mobile/__tests__/ui/password-input.test.tsx` : icône de 16 (`size-4` du site), couleur `tokens.colors.black`, même hauteur que `Input`
- [ ] T025 [US3] Exclusions `016-us1` et `016-us3` (« story entière ») dans `mobile/.maestro/exclusions.md`, avec lien vers les sections du quickstart
- [ ] T026 [US3] Commit de la story : contrôles verts, puis `feat: one password field everywhere, on the site and in the app (US3)`, sans demander

---

## Phase 6: Polish

- [ ] T027 Vérifier à la main le site (navigateur de la tâche) : connexion en largeur de téléphone, œil, Tab / Entrée / Espace sans envoi, erreur → champ vide et masqué ; captures pour la preuve
- [ ] T028 Lancer le parcours `016-us2` et la suite e2e (inscription comprise) sur le simulateur iPhone 17 Pro Max iOS 26.5 si l'environnement le permet ; sinon le noter
- [ ] T029 Commit Polish (si des fichiers ont changé) : `chore: …`

---

## Dependencies & Execution Order

- US1 → US2 (l'œil s'ajoute au composant de l'US1) → US3 (les gardes portent sur le composant final). Polish en dernier.
- Dans une story : tests et composants en parallèle ([P]), puis remplacement dans les écrans, puis commit.

## Parallel Example: User Story 2

```text
T009 tests/domain/password-input.test.ts   | T010 mobile/__tests__/ui/password-input.test.tsx
T012 locales/*/common.json                 | T014 app/globals.css
```

## Implementation Strategy

MVP = US1 (clavier sans majuscule ni correction). Puis US2 (l'œil), puis US3 (gardes et apparence). Chaque story est commitée verte.
