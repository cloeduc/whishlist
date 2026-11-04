# Implementation Plan: Code et commentaires du code en anglais

**Branch**: `014-english-code-comments` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-english-code-comments/spec.md`

## Summary

Faire de « tout le code est en anglais » une règle écrite et vérifiée, puis mettre le dépôt en conformité. Trois tranches :

- **US1** : la règle est écrite dans AGENTS.md, le README et le skill de revue.
- **US2** : environ 1 500 lignes de commentaires, dans 389 fichiers, sont traduites, et un test garde-fou bloque tout nouveau commentaire en français.
- **US3** : descriptions de tests, noms de parcours Maestro, messages techniques et 7 noms de composants de pages passent en anglais, et le garde-fou couvre aussi les descriptions de tests.

Aucun comportement, texte du produit ni adresse publique ne change.

## Technical Context

**Language/Version**: TypeScript 5 / Node 20+ (site, scripts), TypeScript (Expo, `mobile/`), YAML (Maestro, CI, compose), shell (`deploy/`), CSS

**Primary Dependencies**: aucune nouvelle. Le garde-fou utilise `node:test`, `git ls-files` (`node:child_process`) et des expressions régulières.

**Storage**: N/A (aucune donnée ni migration)

**Testing**: `npm test` (`tests/domain/*.test.ts`, dont le nouveau `code-language.test.ts`), `npm --prefix mobile test`, lint, typecheck, build. Les parcours Maestro et le site se vérifient à la main sur la base de démo ([quickstart.md](quickstart.md)).

**Target Platform**: dépôt (site Next.js, app Expo, scripts d'exploitation)

**Project Type**: web app + app mobile, monodépôt

**Performance Goals**: le garde-fou parcourt environ 550 fichiers en moins de 2 s dans `npm test`.

**Constraints**: diff de US2 limité aux commentaires, contrôlé par une comparaison de jetons (research R4). Ne pas toucher aux fichiers générés, aux migrations versionnées, ni au contrat OpenAPI (sinon `mobile/__tests__/api/schema.test.ts` casse).

**Scale/Scope**: environ 1 500 lignes de commentaires (389 fichiers), environ 400 descriptions de tests, 22 noms de parcours, une vingtaine de messages techniques, 7 identifiants ([research.md](research.md) R1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Évaluation |
| -------- | ---------- |
| I. Données personnelles hors dépôt | ✅ Aucune donnée ajoutée. Les commentaires traduits ne contiennent aucun identifiant réel. |
| II. Lecture sans compte, écriture par les membres | ✅ Aucun accès modifié. |
| III. Réservation sans collision | ✅ Aucune règle de réservation touchée. |
| IV. Tranches testables | ✅ Chaque story se vérifie seule (US1 : relire et lancer la revue ; US2 : garde-fou et suites vertes ; US3 : garde-fou étendu et messages). Le parcours réel est décrit dans le quickstart (§4). |
| V. Simplicité | ✅ Pas de dépendance ajoutée. Le garde-fou est un test de quelques dizaines de lignes, sans dictionnaire ni service externe. |
| Hébergement Docker | ✅ Image, variables et volume inchangés. Seuls les commentaires du `Dockerfile` et de `deploy/compose.prod.yml` changent, et les messages des scripts de sauvegarde. |
| Workflow | ✅ Spec sans framework ; spec → plan → tâches. |

Re-check après la Phase 1 : inchangé, aucune violation.

## Project Structure

### Documentation (this feature)

```text
specs/014-english-code-comments/
├── plan.md
├── research.md            # R1 inventaire, R2 exceptions, R3 garde-fou, R4 méthode, R5 lieux de la règle, R6 commits
├── data-model.md          # catégories de texte, glossaire FR → EN, renommages
├── quickstart.md
├── contracts/
│   └── language-rule.md   # textes cibles (AGENTS.md, README, skill) et comportement du garde-fou
├── checklists/requirements.md
└── tasks.md               # /speckit-tasks
```

### Source Code (repository root)

```text
AGENTS.md                                   # US1 : convention « Langue du code »
README.md                                   # US1 : section « Contribuer »
.claude/skills/wishlist-feature-review/SKILL.md  # US1 : contrôles 1 et 2

tests/domain/code-language.test.ts          # US2 (commentaires), étendu en US3 (descriptions de tests)

# US2 : commentaires, par zone (une zone = un lot traduit seul)
src/{domain,server,store,site,auth,i18n}/   app/   components/{site,ui}/
mobile/{src,app,scripts,__tests__,.maestro}/   tests/domain/
scripts/   deploy/*.sh deploy/compose.prod.yml   .github/workflows/
Dockerfile   .env.example   .gitignore   proxy.ts   instrumentation.ts

# US3
tests/domain/*.test.ts, mobile/__tests__/**     # descriptions de tests
mobile/.maestro/flows/*.yaml                    # name:
scripts/db-check.ts, mobile/scripts/e2e*.{mjs,cjs}, mobile/scripts/e2e/*.cjs,
deploy/backup-whishlist.sh, deploy/notify.sh    # messages techniques
mobile/__tests__/e2e/runner.test.ts             # messages attendus du lanceur e2e
app/{connexion,inscription,changer-mot-de-passe,mot-de-passe-oublie,compte}/page.tsx,
app/reinitialiser/[token]/page.tsx, app/l/[readToken]/reserver/page.tsx   # noms de composants
```

**Structure Decision**: aucun nouveau module. Le seul fichier de code ajouté est le garde-fou, dans `tests/domain/` comme `api-contract.test.ts`, autre test qui porte sur le dépôt plutôt que sur le domaine. Les zones de US2 servent d'unités de travail parallélisables. Elles finissent toutes dans le même commit de story.

## Risques

- **Sens perdu à la traduction** : le glossaire ([data-model.md](data-model.md)) et la relecture par zone le limitent. Les références (`FR-…`, `US…`, `R…`, chemins) et les citations restent intactes.
- **Code touché par erreur** : la comparaison de jetons (R4) et les suites complètes (site, mobile, build) l'attrapent avant le commit.
- **Faux positifs du garde-fou** : il est réglé sur l'arbre traduit. Une exception éventuelle est listée et justifiée dans le test.
- **Conflits avec des branches futures** : pas de PR ouverte aujourd'hui. Squasher sur `main` vite après la revue.

## Complexity Tracking

Aucune violation de la constitution à justifier.
