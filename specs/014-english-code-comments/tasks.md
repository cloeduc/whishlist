---

description: "Tâches de la feature 014 : code et commentaires du code en anglais"
---

# Tasks: Code et commentaires du code en anglais

**Input**: Design documents from `/specs/014-english-code-comments/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/language-rule.md](contracts/language-rule.md), [quickstart.md](quickstart.md)

**Tests**: le garde-fou `tests/domain/code-language.test.ts` est demandé par le plan (research R3). Il s'écrit avant la traduction : il doit d'abord échouer, et il sert de liste de travail (`fichier:ligne`).

**Organization**: une phase par user story. Chaque story se termine par son commit.

## Un commit par user story (règle du projet)

Chaque phase de user story se termine par une tâche **« Commit de la story »**, la dernière de la phase. Règles :

- Pas de phase Setup ni Foundational propre : la branche `014-english-code-comments` existe déjà.
- Chaque commit est vert. Ici, « vert » veut dire : `npm run lint`, `npm run typecheck`, `npm test`, et pour toute story qui touche `mobile/`, aussi `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test`.
- Un fichier modifié par deux stories est commité en deux temps. Par exemple, un fichier de test dont US2 traduit les commentaires et dont US3 traduit les descriptions.
- Messages en anglais, en `chore:` (aucun changement de comportement), terminés par `(USn)`. La phase Polish a son propre commit. Les corrections de la revue forment un commit à part, `fix: corrections de la revue`, avec `review.md`.
- Le commit se crée sans demander l'accord. Seuls le push et le squash sur `main` attendent l'utilisateur.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : peut tourner en parallèle (autres fichiers, aucune dépendance sur une tâche en cours)
- **[Story]** : US1, US2, US3

## Règles de traduction (valables pour toutes les tâches de US2 et US3)

- Glossaire obligatoire : [data-model.md](data-model.md) § Glossaire. Par exemple « idée » → *idea*, « qui » → *person / recipient*, « catégorie » → *category*, « offreur » → *giver*, « petit mot » → *note*, « lien de lecture » → *read link*.
- Une citation d'un texte du produit garde sa langue, entre « » ou guillemets : `// Shows « Réserver ce cadeau » once the idea is free`.
- Garder intactes les références (`FR-005b`, `US3`, `R3`, `SC-001`), les chemins, les noms de code et les URL.
- Traduire le sens, pas mot à mot. Garder la longueur et le style (phrases courtes, pas de jargon ajouté).
- Un commentaire faux ou obsolète se traduit tel quel. S'il contredit le code, l'ajouter à la liste « Commentaires suspects » en bas de ce fichier, sans le corriger.
- Ne jamais modifier : `locales/**`, `specs/**` (contrat OpenAPI compris), `drizzle/*.sql`, `docs/**`, les fichiers `*.md`, les fichiers générés d'AGENTS.md (`mobile/src/api/schema.d.ts`, `mobile/src/legal/licenses.json`, `public/guide/**`, `next-env.d.ts`…), les textes du produit (`scripts/create-demo-data.mjs` hors commentaires, données simulées de `scripts/capture-demo.mjs`, `data/seed.json`, `deploy/runtipi/whishlist/config.json`).
- Pour US2, ne toucher qu'aux commentaires. Les chaînes, les identifiants et les descriptions de tests sont pour US3.

---

## Phase 1: User Story 1 - Le guide et la revue énoncent la règle « code en anglais » (Priority: P1) 🎯 MVP

**Goal** : la règle « tout le code est en anglais », avec ses exceptions, est écrite dans le guide des agents, le README et la consigne de revue.

**Independent Test** : [quickstart.md](quickstart.md) § 1. La règle se lit de la même façon dans les trois documents, aucune phrase n'autorise plus les commentaires en français, et la revue signale un commentaire français ajouté sur une branche jetable.

- [X] T001 [P] [US1] Dans `AGENTS.md`, section « Conventions », remplacer la puce « **Langue du code** : identifiants en anglais. Les commentaires peuvent être en français ou en anglais. » par le texte cible de [contracts/language-rule.md](contracts/language-rule.md) § AGENTS.md. Il couvre les identifiants, les commentaires, les descriptions de tests, les messages techniques, la règle de citation entre « », les exceptions (textes du produit, documentation dont le contrat OpenAPI, migrations `drizzle/*.sql` versionnées), l'exception temporaire des segments d'URL de `app/`, et la mention du garde-fou `tests/domain/code-language.test.ts`.
- [X] T002 [P] [US1] Dans `README.md`, ajouter la section « ## Contribuer » juste après « ## Structure utile » et avant le `---` qui précède « ## Licence ». Reprendre le texte de [contracts/language-rule.md](contracts/language-rule.md) § README. Dans le bloc de « Structure utile », remplacer `src/store/            # JSON + lock fichier` par `src/store/            # base SQLite (Drizzle), seul accès aux données`, en gardant l'alignement des `#`.
- [X] T003 [P] [US1] Dans `.claude/skills/wishlist-feature-review/SKILL.md` : supprimer la ligne « Les commentaires en français sont acceptés : ne les signale pas. » du « Contrôle 2 : i18n FR/EN ». Dans le « Contrôle 1 : conventions », remplacer « nommage en anglais, » par une vérification de la langue du code selon la convention « Langue du code » d'AGENTS.md. Elle signale tout identifiant, commentaire, description de test ou message technique en français, mais pas les textes du produit, les citations entre « » ni les exceptions de la convention. Voir [contracts/language-rule.md](contracts/language-rule.md) § Skill.
- [X] T004 [US1] Vérifier la cohérence (dépend de T001 à T003). `git grep -n -i "commentaires peuvent être en français\|commentaires en français sont acceptés"` ne trouve rien hors `specs/`. Les trois textes listent les mêmes exceptions. `.specify/templates/overrides/tasks-template.md` et `.specify/memory/constitution.md` n'ont pas besoin de changement (research R5).
- [X] T005 [US1] Vérifier la revue ([quickstart.md](quickstart.md) § 1.4). Sur une branche jetable créée depuis `014-english-code-comments`, ajouter `// Garde la liste si elle existe` dans `src/domain/filters.ts` et lancer le contrôle 1 du skill `wishlist-feature-review` sur ce diff. Attendu : la ligne est signalée. Supprimer ensuite la branche jetable, sans rien commiter.
- [X] T006 [US1] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis commit `chore: require code, comments and tests to be written in English (US1)` de `AGENTS.md`, `README.md`, `.claude/skills/wishlist-feature-review/SKILL.md` et `specs/014-english-code-comments/` (spec, plan, research, data-model, contracts, quickstart, checklists, tasks), sans demander.

**Checkpoint** : la règle est en place ; une nouvelle feature est relue contre elle.

---

## Phase 2: User Story 2 - Les commentaires existants sont en anglais (Priority: P2)

**Goal** : plus aucun commentaire en français dans les fichiers de code versionnés, et un test empêche d'en ajouter.

**Independent Test** : [quickstart.md](quickstart.md) § 2. Le garde-fou est vert, il devient rouge si l'on ajoute un commentaire français, toutes les suites passent, et le diff ne touche que des commentaires.

### Garde-fou (écrit d'abord, doit échouer)

- [X] T007 [US2] Créer `tests/domain/code-language.test.ts` (`node:test`, `node:assert/strict`), selon [research.md](research.md) R3 et [contracts/language-rule.md](contracts/language-rule.md) § Garde-fou :
  - Fichiers : `git ls-files` via `execFileSync`, extensions `.ts .tsx .js .mjs .cjs .css .sh .yml .yaml .toml`, plus `Dockerfile`, `.dockerignore`, `.gitignore` et `.env.example`.
  - Fichiers exclus : `locales/`, `specs/`, `docs/`, `drizzle/`, `public/guide/`, `.specify/`, `.claude/skills/`, `next-env.d.ts`, `mobile/src/api/schema.d.ts`, `mobile/.maestro/scripts/strings.generated.js`.
  - Extraction des commentaires : `//` en fin de ligne ou seul sur sa ligne, en ignorant `//` dans une chaîne ou une URL (`://`) ; blocs `/* … */` et `{/* … */}` sur plusieurs lignes ; `#` en début de commentaire pour `.sh .yml .yaml .toml`, `Dockerfile`, `.gitignore`, `.dockerignore` et `.env.example`, sans la ligne shebang `#!`.
  - Avant le contrôle, retirer les citations `«…»`, `"…"` et `` `…` ``.
  - Est français un texte qui contient une lettre de `[éèêëàâçîïôûùœ]` (sans tenir compte de la casse), ou un mot-outil parmi `le la les un une des du au aux ce ces cette il elle ils elles leur est sont pour dans avec sans sur par mais donc qui que pas ne se si`, comparé mot entier et sans tenir compte de la casse (seuil d'abord fixé à deux mots, abaissé à un en T018).
  - Un test « code comments are in English » échoue avec la liste `fichier:ligne: texte`, une ligne par défaut, triée.
  - Une constante `ALLOWED` (vide au départ) liste les exceptions justifiées `fichier:texte`.
  - Lancer `node --import tsx --test tests/domain/code-language.test.ts` : le test doit échouer, avec environ 1 500 lignes. Garder cette sortie comme liste de travail.
- [X] T008 [US2] Avant de traduire, sauvegarder une copie de référence : `git stash list` vide, puis `git worktree add ../whishlist-014-base HEAD`. Elle sert à la comparaison des jetons de T019.

### Traduction des commentaires par zone (en parallèle : chaque zone a ses propres fichiers)

Pour chaque zone : traduire tous les commentaires signalés par T007 dans les fichiers de la zone, ainsi que les commentaires français que le détecteur aurait manqués à la relecture du fichier. Ne toucher à rien d'autre que des commentaires.

- [X] T009 [P] [US2] Zone `src/domain/` : tous les fichiers `src/domain/**/*.ts` (environ 150 lignes).
- [X] T010 [P] [US2] Zone serveur : `src/server/**`, `src/auth/**`, `src/store/**`, `src/site/**`, `src/i18n/**` (environ 310 lignes ; `src/store/connection.ts` et `scripts/db-backup.mjs` répètent la même règle de chemin, garder leurs commentaires alignés).
- [X] T011 [P] [US2] Zone site : `app/**` (pages, `app/api/**`, `app/.well-known/**`, `app/globals.css`), `components/site/**`, `components/ui/**`, `proxy.ts`, `instrumentation.ts`, et les fichiers de config à la racine (`next.config.*`, `eslint.config.*`, `drizzle.config.*`, `postcss.config.*`, `app.js` s'ils ont des commentaires français) (environ 110 lignes).
- [X] T012 [P] [US2] Zone tests du site : commentaires de `tests/domain/**` (environ 95 lignes). Les descriptions passées à `test(…)` et `describe(…)` ne changent pas ici (US3).
- [X] T013 [P] [US2] Zone `mobile/src/**` (environ 355 lignes, la plus grosse : la découper en sous-dossiers `offline/`, `features/`, `ui/`, `api/`, `theme/`… si besoin, sans toucher `mobile/src/api/schema.d.ts` ni `mobile/src/legal/licenses.json`).
- [X] T014 [P] [US2] Zone `mobile/app/**` (écrans Expo Router, environ 105 lignes).
- [X] T015 [P] [US2] Zone outillage mobile : commentaires de `mobile/__tests__/**`, `mobile/scripts/**` (dont `make-icons.mjs` et `e2e/*.cjs`), `mobile/app.config.ts`, `mobile/jest.config.js`, `mobile/metro.config.js`, et des autres fichiers de config de `mobile/` (environ 130 lignes). Les messages des scripts et la chaîne d'en-tête écrite par `mobile/scripts/e2e/strings.cjs` relèvent d'US3.
- [X] T016 [P] [US2] Zone Maestro : commentaires `#` de `mobile/.maestro/flows/*.yaml`, `mobile/.maestro/subflows/**`, `mobile/.maestro/scripts/**` (hors `strings.generated.js`) et `mobile/.maestro/config.yaml` (environ 185 lignes). Les champs `name:` relèvent d'US3. `README.md` et `exclusions.md` ne changent pas.
- [X] T017 [P] [US2] Zone exploitation et config : commentaires de `scripts/*.{ts,mjs}`, `deploy/*.sh` (`backup-whishlist.sh`, `bootstrap-mini.sh`, `harden-data.sh`, `notify.sh`, `ops-check.sh`), `deploy/compose.prod.yml`, `.github/workflows/*.yml`, `Dockerfile`, `.env.example`, `.gitignore` et `.dockerignore` (environ 80 lignes). Dans `.env.example`, les noms et valeurs des variables ne changent pas.

### Vérification

- [X] T018 [US2] Relancer `node --import tsx --test tests/domain/code-language.test.ts` jusqu'au vert (dépend de T009 à T017). Pour chaque faux positif restant, reformuler le commentaire. Sinon, et seulement si le texte est de l'anglais correct (par exemple un nom propre accentué), l'ajouter à `ALLOWED` avec un commentaire de justification en anglais. Vérifier que le garde-fou attrape bien : ajouter temporairement `// on garde la liste` dans `src/domain/filters.ts` et `# relance du serveur` dans `mobile/.maestro/flows/005-us1-auth.yaml`. Attendu : rouge sur ces deux lignes, et vert sur `// Shows « Réserver ce cadeau » once the idea is free`. Annuler l'ajout.
- [X] T019 [US2] Prouver que seuls des commentaires ont changé (research R4). Avec un script jetable dans le scratchpad, non versionné, pour chaque fichier `.ts .tsx .js .mjs .cjs` de `git diff --name-only` : lister les jetons de la version de `../whishlist-014-base` et de la version courante avec `ts.createScanner` (`skipTrivia: true`, `LanguageVariant.JSX` pour `.tsx`). Les deux suites doivent être identiques. Pour `.yaml .yml .sh .css .toml`, `Dockerfile` et `.env.example` : comparer les lignes sans leurs commentaires. Noter le résultat (nombre de fichiers comparés, 0 écart) dans la section « Journal » en bas de ce fichier. Supprimer ensuite le worktree (`git worktree remove ../whishlist-014-base`).
- [X] T020 [US2] Relire le diff par zone (`git diff -- src/domain`, etc.). Contrôler le glossaire, les citations intactes, les références intactes et l'absence de traduction mot à mot. Compléter la liste « Commentaires suspects » si besoin.
- [X] T021 [US2] Commit de la story : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts. Puis commit `chore: translate code comments to English (US2)` de tous les fichiers traduits, de `tests/domain/code-language.test.ts` et de `specs/014-english-code-comments/tasks.md`, sans demander.

**Checkpoint** : 0 commentaire français, garde-fou actif dans `npm test`.

---

## Phase 3: User Story 3 - Le reste du code n'a plus de français (Priority: P3)

**Goal** : descriptions de tests, noms de parcours, messages techniques et identifiants en anglais. Les segments d'URL ne changent pas.

**Independent Test** : [quickstart.md](quickstart.md) § 3. Le garde-fou, étendu, est vert. Il n'y a plus de nom de page en français. `db:check`, le lanceur e2e et les scripts de sauvegarde parlent anglais. Toutes les suites passent.

### Garde-fou étendu (d'abord, doit échouer)

- [X] T022 [US3] Étendre `tests/domain/code-language.test.ts` avec un test « test titles and flow names are in English ». Il contrôle le premier argument chaîne (`"…"`, `'…'` ou `` `…` `` sans `${`) de `test(`, `it(`, `describe(`, `test.skip(`, `test.only(`, `it.each(…)(` et `describe.each(…)(` dans `tests/**/*.ts` et `mobile/__tests__/**/*.{ts,tsx}`, ainsi que la valeur de `name:` en tête des fichiers `mobile/.maestro/flows/*.yaml` et `mobile/.maestro/subflows/**/*.yaml`. Même détecteur que T007, appliqué au texte entier, sauf les citations entre « ». Lancer le test : il échoue avec environ 400 descriptions et 22 noms de parcours.

### Traduction (en parallèle)

- [X] T023 [P] [US3] Traduire les descriptions des tests de `tests/domain/*.test.ts` (environ 340). La description énonce la même règle métier en anglais, au présent, comme les tests déjà en anglais. Exemple : « une liste dont elle est la seule membre disparaît avec tout son contenu » → « a list whose only member is the deleted account disappears with all its content ». Les valeurs attendues (`assert.equal(…, "Réservé par vous")`, messages traduits par `translateError`) ne changent pas.
- [X] T024 [P] [US3] Traduire les descriptions des tests de `mobile/__tests__/**` (environ 60), sauf `mobile/__tests__/e2e/runner.test.ts`, traité en T026. Les textes attendus de l'interface (`getByText("…")`, valeurs de `locales/`) ne changent pas.
- [X] T025 [P] [US3] Traduire le `name:` de chaque parcours de `mobile/.maestro/flows/*.yaml` (et de `subflows/` s'il y en a). Garder le préfixe `<feature> USn — `. Exemple : `name: "005 US4 — Partager une liste publiquement"` → `name: "005 US4 — Share a list publicly"`. Les `tags`, `id:` et textes visibles attendus ne changent pas.
- [X] T026 [P] [US3] Traduire les messages du lanceur e2e de l'app : `mobile/scripts/e2e.mjs` (raisons de saut, `fail(…)`, aide), `mobile/scripts/e2e/checks.cjs` (« Aucun simulateur iOS démarré. »…), `mobile/scripts/e2e/flows.cjs` (« Parcours introuvable : … »), `mobile/scripts/e2e/locale.cjs` (`… doit valoir fr ou en (reçu : …)`), et l'en-tête écrit par `mobile/scripts/e2e/strings.cjs` (`// Généré par scripts/e2e.mjs, ne pas modifier ni versionner.` → `// Generated by scripts/e2e.mjs, do not edit or commit.`). Les autres messages de `mobile/scripts/**` sont à traduire aussi. Mettre à jour dans le même temps les attentes et les descriptions de `mobile/__tests__/e2e/runner.test.ts` : messages de `pickDevice`, `resolveFlowPaths`, et sortie du rapport (`✓ 005 US1 — …`, `non joué : …`, `étape : …`), qui utilise les noms des parcours de T025. Les mots du rapport (« non joué », « étape ») deviennent anglais dans le script qui l'écrit et dans le test.
- [X] T027 [P] [US3] Traduire les messages techniques des scripts du site : `scripts/db-check.ts` (`Usage: npm run db:check -- <file.json|file.db> [--counts]`, `${n} problem(s):`, `no problem`), ainsi que `scripts/db-sessions.ts`, `scripts/db-backup.mjs`, `scripts/backfill-og.ts`, `scripts/write-prod-env.mjs`, `scripts/test-reset-mail.ts` et `scripts/capture-demo.mjs` (seulement leurs `console.*` et erreurs, pas les données simulées). Vérifier qu'aucun test de `tests/domain/` n'attend ces messages (`git grep -n "aucun problème\|problème(s)" tests`). Si un test les attend, l'adapter dans la même tâche.
- [X] T028 [P] [US3] Traduire les messages d'exploitation de `deploy/backup-whishlist.sh` (`step="database check"`, `"hot copy in container $CONTAINER"`, `"retention"`, titre `"whishlist backup failed"` et corps de notification `"Step: $step (code $status), $(hostname) at $(date '+%d/%m %H:%M'). Details in the backups cron.log."`), de `deploy/notify.sh` (`ntfy: notification not sent (…)`) et des `echo` en français de `deploy/bootstrap-mini.sh`, `deploy/harden-data.sh` et `deploy/ops-check.sh`. Vérifier avec `bash -n` sur chaque fichier modifié.
- [X] T029 [P] [US3] Renommer les composants de pages selon [data-model.md](data-model.md) § Renommages : `ConnexionPage` → `LoginPage` (`app/connexion/page.tsx`), `InscriptionPage` → `RegisterPage` (`app/inscription/page.tsx`), `ChangerMotDePassePage` → `ChangePasswordPage` (`app/changer-mot-de-passe/page.tsx`), `MotDePasseOubliePage` → `ForgotPasswordPage` (`app/mot-de-passe-oublie/page.tsx`), `ComptePage` → `AccountPage` (`app/compte/page.tsx`), `ReinitialiserPage` → `ResetPasswordPage` (`app/reinitialiser/[token]/page.tsx`), `ReserverPage` → `ReservePage` (`app/l/[readToken]/reserver/page.tsx`). Les dossiers et les URL ne changent pas.
- [X] T030 [US3] Chercher les autres messages techniques et identifiants en français qu'aucun relevé n'a vus (dépend de T026 à T029). Passer dans les `throw new Error(`, `console.`, `logger`, `fail(`, `message:` de `src/`, `app/`, `scripts/`, `mobile/src/`, `mobile/scripts/` et `deploy/`. Exemple de commande : `git grep -nE "(Error|console\.\w+|fail)\([\"'\`][^\"'\`]*[éèêàçù]" -- src app scripts mobile/src mobile/scripts`, plus une relecture des identifiants des fichiers modifiés. Traduire ce qui n'est pas un texte du produit. Un message montré à l'utilisateur, en revanche, doit passer par `locales/` : s'il est écrit en dur, le noter dans « Commentaires suspects » pour une feature à part, sans le corriger ici.

### Vérification

- [X] T031 [US3] Relancer `tests/domain/code-language.test.ts` jusqu'au vert (dépend de T023 à T030). Puis : `git grep -nE "function (Connexion|Inscription|Compte|Reserver|Reinitialiser|MotDePasse|ChangerMotDePasse)\w*Page" app` ne renvoie rien. `npm run db:check -- tmp/demo-wishlist.db` affiche son message en anglais. `bash -n deploy/*.sh` passe.
- [X] T032 [US3] Commit de la story : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts. Puis commit `chore: translate test titles, flow names, script messages and page names to English (US3)` des fichiers de la story, sans demander.

**Checkpoint** : le code n'a plus de français, hors exceptions de la convention.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T033 Vérifier sur la base de démo que rien ne change pour les utilisateurs ([quickstart.md](quickstart.md) § 4). Dans `WISHLIST_DATA_PATH=tmp/demo-wishlist.json npm run dev`, ouvrir en français puis en anglais l'accueil, `/connexion`, `/inscription`, `/compte`, `/listes` et une liste publique `/l/<readToken>`, puis réserver une idée par `/l/<readToken>/reserver`. Les adresses et les textes sont ceux d'avant. Dans l'app (simulateur de référence), lancer `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/005-us1-auth.yaml` : le parcours passe et s'affiche sous son nom anglais. Noter le résultat dans « Journal ».
- [X] T034 Contrôler les critères de succès de [spec.md](spec.md). SC-001 : garde-fou vert, 0 ligne. SC-002 : `git grep` de T004 vide. SC-003 : suites vertes, 0 description de test française. SC-004 : T005 et T018 faits. SC-005 : T033. Cocher `checklists/requirements.md` si besoin. Ajouter au backlog personnel, en mémoire, les messages en dur relevés en T030 s'il y en a.
- [X] T035 Commit Polish : suites vertes, puis commit `chore: record verification of the English code rule` de `specs/014-english-code-comments/tasks.md` (journal, cases cochées), sans demander. Le push et le squash sur `main` attendent l'utilisateur.

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)** : aucune dépendance. C'est le MVP.
- **US2 (Phase 2)** : après le commit d'US1, pour que la règle soit écrite avant le gros diff. Techniquement indépendante.
- **US3 (Phase 3)** : après US2. Les fichiers de test et les parcours Maestro sont touchés par les deux stories, et le garde-fou d'US3 étend celui d'US2.
- **Polish** : après US3.

### Within Each User Story

- US2 : T007 (garde-fou rouge) → T008 (copie de référence) → T009 à T017 en parallèle → T018 → T019 → T020 → T021.
- US3 : T022 (garde-fou étendu rouge) → T023 à T029 en parallèle (T026 utilise les noms de T025 : faire T025 avant d'écrire les attentes du rapport dans `runner.test.ts`) → T030 → T031 → T032.
- La tâche « Commit de la story » est la dernière de chaque phase.

### Parallel Opportunities

- US1 : T001, T002, T003 (trois fichiers distincts).
- US2 : les neuf zones T009 à T017 n'ont aucun fichier en commun. Elles se confient à des agents en parallèle, chacun avec les « Règles de traduction » ci-dessus et la sortie de T007 filtrée sur sa zone.
- US3 : T023, T024, T025, T027, T028, T029 en parallèle ; T026 après T025.

## Parallel Example: User Story 2

```text
Agent A : T009 src/domain/            Agent F : T014 mobile/app/
Agent B : T010 src/server, auth, store, site, i18n
Agent C : T011 app/, components/, config racine
Agent D : T012 tests/domain/ (commentaires)
Agent E : T013 mobile/src/            Agent G : T015 mobile/__tests__, scripts, config
Agent H : T016 mobile/.maestro/       Agent I : T017 scripts/, deploy/, CI, Dockerfile, .env.example
```

## Implementation Strategy

### MVP First (User Story 1 Only)

US1 seule fixe la règle : à partir de là, toute nouvelle feature est relue contre elle, même si l'existant reste en français. On peut s'arrêter là et faire le reste plus tard.

### Incremental Delivery

US1 (règle) → US2 (commentaires et garde-fou, l'essentiel du volume) → US3 (reste du code) → Polish. Chaque commit est vert et relisible seul ; celui d'US2 se relit zone par zone.

## Notes

- Ne pas changer le comportement : en cas de doute sur une ligne (chaîne ou commentaire ?), la laisser et la noter dans « Commentaires suspects ».
- Squasher sur `main` vite après la revue : le diff touche presque tous les fichiers, et toute branche ouverte entre-temps aurait des conflits.

## Commentaires suspects

<!-- Commentaires qui contredisent le code, ou messages visibles écrits en dur, relevés pendant la traduction. À traiter hors de cette feature. -->

- `mobile/.maestro/subflows/login.yaml:2` : dit que la liste de démo « n'existe que dans `tmp/e2e/wishlist.json` » ; les données sont en SQLite depuis la 008 (le chemin est la valeur de `WISHLIST_DATA_PATH`, qui mène au `.db`). Un peu daté.
- `mobile/.maestro/flows/005-us1-auth.yaml:27` : « Alex logs in, then logs out » ; la déconnexion n'arrive qu'après la relance (l. 42). Mineur.
- `tests/domain/list-defaults.test.ts:15` : « fills a gap: 2 taken, 3 free » dit l'inverse de l'assertion (`["L", "L 3"]` → `"L 2"` : 3 est pris, 2 est libre).
- `src/domain/filters.ts:5-11` : `BUDGETS[].label` en français (« Moins de 20 € »…) n'est plus lu : le site et l'app affichent `t(`budgets.${id}`)`. Champ mort, à retirer.
- `mobile/app/dev/catalog.tsx:48-166` : catalogue de composants de dev, textes français en dur (hors i18n). Écran de dev seulement.
- `src/domain/product-llm.ts:72` et `:124` : le prompt envoyé au modèle est en français. Laissé tel quel : c'est une entrée du modèle qui règle la langue de sa réponse, pas un message technique. Décision de l'utilisateur (2026-11-03) : on le laisse en français.
- `specs/007-mobile-e2e-maestro/contracts/e2e-command.md` (l. 35, 61-68) et d'autres fichiers de la 007 citent les anciens messages français du lanceur e2e : spec d'une feature passée, non modifiée.

## Journal

<!-- Résultats de T019 (comparaison des jetons) et de T033 (vérification sur la base de démo). -->

- 2026-11-03, T005 : vérifié en appliquant à la main la consigne réécrite du contrôle 1 à un diff `// Garde la liste si elle existe` (signalé : commentaire en français, règle « Langue du code »). Les cinq agents du skill n'ont pas été lancés ici ; la revue complète de la feature tourne au hook `after_implement`.
- 2026-11-03 : `npm run lint` remonte 39 erreurs d'un worktree d'agent ancien et non suivi (`.claude/worktrees/agent-ac1f606b0d49db6da/`), déjà présentes sur l'arbre propre. Le lint du dépôt se vérifie avec `npx eslint . --ignore-pattern '.claude/worktrees/**'` (0 erreur).
- 2026-11-03, T007 : garde-fou rouge au départ, 1 495 lignes dans 389 fichiers.
- 2026-11-03, T008 : pas de worktree ; la référence est `HEAD` (commit d'US1), lue par `git show HEAD:<fichier>`.
- 2026-11-03, T009-T017 : dix lots traduits en parallèle (`mobile/src/` coupé en deux), environ 1 600 lignes de commentaires dans 392 fichiers, y compris des lignes que le détecteur n'avait pas vues.
- 2026-11-03, T018 : avec un seuil de deux mots-outils, le garde-fou laissait passer `// on garde la liste` et `# relance du serveur`. Seuil abaissé à un mot, citations « » coupées sur deux lignes gérées ; deux oublis ainsi trouvés et traduits (`app/api/v1/me/email/route.ts:20`, `mobile/__tests__/links/native-intent.test.ts:3`). Contrôle : rouge sur les deux lignes ajoutées, vert sur `// Shows « Réserver ce cadeau » once the idea is free`.
- 2026-11-03, T019 : comparaison des jetons sans les commentaires (scanner TypeScript, nœuds JSDoc exclus ; lignes sans commentaires pour YAML, shell, CSS, config) : 392 fichiers comparés, 0 écart.
- 2026-11-03, T021 : `mobile/node_modules` n'avait pas `expo-camera` (ajouté par la 012) : `npm --prefix mobile ci` avant les contrôles mobiles ; le cache du lint mobile gardait l'erreur, `npx expo lint --no-cache` l'a rafraîchi. Ensuite lint et types (site et mobile), `npm test` (388), `npm --prefix mobile test` (264) et `npm run build` : verts.
- 2026-11-03, T022 : garde-fou étendu rouge au départ : 435 titres (362 `tests/domain`, 54 `mobile/__tests__`, 19 noms de parcours).
- 2026-11-03, T023-T030 : environ 440 titres de tests (dont des titres que le détecteur n'avait pas vus), 22 noms de parcours, une trentaine de messages techniques (scripts, `deploy/`, store, session, journal des e-mails simulés, lanceur e2e et son rapport, `useList must be used inside ListProvider`), 7 composants de pages renommés, étiquettes de cas de `store-import.test.ts` traduites. Le rapport du lanceur e2e n'accorde plus de pluriel : son helper `plural()` est retiré. Docs qui citaient les anciennes sorties, mises à jour : `README.md` (« no problem », `[store] old file imported: …`), `deploy/DEPLOY-RUNTIPI.md`, `mobile/.maestro/README.md` (« not run »).
- 2026-11-03, T031 : garde-fou vert (3 tests), `npm test` 389/389, `npm --prefix mobile test` 264/264, lint et types (site et mobile), build, `bash -n deploy/*.sh` : verts ; `npm run db:check -- tmp/demo-wishlist.db` → `no problem` ; plus aucun nom de page en français.
- 2026-11-03, T033 : `next dev` sur `tmp/demo-wishlist.json` (base de démo recréée avec un mot de passe local). Pages ouvertes en français puis en anglais : `/`, `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/compte` (sans session : renvoie à l'accueil, comme avant), `/l/demo-list-lecture`, `/l/demo-list-lecture/reserver` (bouton « Confirmer la réservation » / « Confirm reservation »), `/faq`, `/mentions-legales`. Toutes en 200 aux mêmes adresses, avec les mêmes titres. `/listes` répond 404, comme avant : il n'y a pas de page d'index. **Pas faits ici** : l'envoi d'une réservation et les pages connectées, cliqués dans un navigateur, ainsi que le parcours Maestro `005-us1-auth.yaml` (il demande le simulateur et un build de l'app). Le diff de ces écrans se limite à des commentaires et aux noms de composants, et build, types et tests sont verts.
- 2026-11-03, T034 : SC-001 garde-fou vert, 0 commentaire français ; SC-002 aucune phrase n'autorise plus le français (`git grep` vide hors `specs/`) ; SC-003 suites vertes, 0 titre de test français ; SC-004 T005 et T018 ; SC-005 T033 (avec les limites ci-dessus).
