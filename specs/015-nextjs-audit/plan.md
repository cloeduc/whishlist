# Implementation Plan: Suites de l'audit du site (formulaires, erreurs, garde-fous)

**Branch**: `015-nextjs-audit` | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-nextjs-audit/spec.md`

## Summary

Cette feature traite les points (a) à (f) de l'audit Next.js du 2026-11-03 ; le point (g) reste au backlog. Elle touche le site seulement, sans changer la base, l'API JSON ni l'app mobile.

- **US1** : les 13 formulaires de l'US1 passent de la redirection `?e=code` à `useActionState`. L'action rend `{ error, values }` sans les mots de passe, sur le modèle de `item-form.tsx`.
- **US2** : un `app/global-error.tsx` traduit, et `retry()` à la place de `reset()`.
- **US3** : `refresh()` de `next/cache` dans trois actions, et `useOptimistic` pour les libellés.
- **US4** : `server-only` sur `src/store`, `src/auth` et `src/server` (tests et scripts sous `--conditions=react-server`), retrait des `force-dynamic` redondants contrôlé par le tableau du build, `npm start` et l'image Docker sur le même `server.js` standalone, et suppression de `app.js`.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 22 (image), 20+ en dev

**Primary Dependencies**: Next.js 16.4.2 (App Router), React 19.1, i18next / react-i18next, shadcn (Base UI) ; nouvelle dépendance `server-only`

**Storage**: SQLite (Drizzle, WAL), inchangé

**Testing**: `node:test` + `tsx` (`tests/domain/`), désormais avec `--conditions=react-server` ; vérification à la main par [quickstart.md](quickstart.md) (le site n'a pas de test e2e)

**Target Platform**: conteneur Docker Linux (Mac mini de prod), navigateurs récents, avec et sans JavaScript pour les formulaires

**Project Type**: application web (Next.js), plus une app mobile Expo séparée, non touchée

**Performance Goals**: une seule demande au serveur par action de l'US3 (SC-004)

**Constraints**:

- CSP avec nonce, donc rendu à la demande partout, inchangé.
- Aucun mot de passe dans l'état rendu, l'adresse ou l'historique.
- Aucun nouveau texte, sauf `common:error.home`.
- Aucune nouvelle variable d'environnement.

**Scale/Scope**: 13 formulaires, 3 actions, 1 page d'erreur, environ 45 fichiers marqués `server-only`, 62 fichiers `force-dynamic` relus, 1 script de démarrage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / section | Effet de la feature | Statut |
|--------------------|---------------------|--------|
| I. Données personnelles hors dépôt | Aucune donnée ajoutée. Le quickstart n'utilise que la démo `@example.test`. | OK |
| II. Lecture sans compte, écriture par les membres | Les contrôles d'accès restent dans les commandes. Les actions migrées gardent `memberId()` et `currentUser()`, avec leurs redirections. | OK |
| III. Réservation sans collision | `reserveAction` garde sa commande et son refus `itemTaken`. Seul l'affichage du refus change, et il garde le nom et le petit mot. | OK |
| IV. Tranches testables | 4 stories indépendantes, chacune avec son parcours dans le quickstart, et un commit par story. | OK |
| V. Simplicité | Aucun mécanisme nouveau. `useActionState` existe déjà dans `item-form.tsx`, et `server-only` est un marqueur sans code. | OK |
| Hébergement Docker | L'image garde `node server.js`, `PORT`, `HOSTNAME`, `/data` et le contrôle de santé. Il n'y a pas de nouvelle variable, et `scripts/start.mjs` n'est pas dans l'image. | OK |
| Workflow (« une spec ne nomme pas le framework ») | La spec reste neutre, et le framework n'est nommé que dans le plan. | OK |

**Re-check après la phase 1** : OK. Les seuls écarts de conception sont des corrections de la spec, faites avec ce plan :

- l'inscription avec une adresse déjà prise reste silencieuse (non-divulgation) ;
- les `force-dynamic` restants se comptent par le build, pas par un nombre fixe.

## Project Structure

### Documentation (this feature)

```text
specs/015-nextjs-audit/
├── plan.md
├── research.md               # R1–R7
├── data-model.md             # FormState (pas de changement de base)
├── quickstart.md
├── contracts/
│   └── form-states.md        # 13 formulaires : champs gardés, jamais rendus, succès
├── checklists/requirements.md
└── tasks.md                  # /speckit-tasks
```

### Source Code (repository root)

```text
src/server/
├── actions.ts                # US1 : 13 actions (prev, formData) → FormState | redirect ; US3 : refresh()
├── form-state.ts             # US1 (nouveau) : FormState, keptValues(), listes de champs gardés
├── commands/ api/ mcp/ *.ts  # US4 : import "server-only"
src/store/*.ts                # US4 : import "server-only"
src/auth/*.ts                 # US4 : import "server-only"

app/
├── global-error.tsx          # US2 (nouveau)
├── error.tsx                 # US2 : retry()
├── inscription/ connexion/ mot-de-passe-oublie/ reinitialiser/[token]/
│   compte/ listes/new/ listes/[id]/ l/[readToken]/reserver/   # US1 : le formulaire passe dans un composant client
├── layout.tsx, */page.tsx    # US4 : retrait de force-dynamic
├── api/**/route.ts, compte/export, u/[...path]   # US4 : retrait si le build garde ƒ
├── robots.ts, sitemap.ts, .well-known/*          # US4 : gardés et commentés

components/site/
├── register-form.tsx, login-form.tsx, forgot-password-form.tsx, reset-password-form.tsx,
│   display-name-form.tsx, password-form.tsx, email-change-form.tsx, new-list-form.tsx,
│   reservation-form.tsx, invite-email-form.tsx, read-password-form.tsx   # US1 (nouveaux)
├── appearance-form.tsx, read-unlock-form.tsx      # US1 : passent à useActionState
├── label-chips.tsx                                # US3 : useOptimistic, sans router.refresh()
├── ideas-accordion.tsx, api-keys-card.tsx         # US3 : sans router.refresh()

locales/{fr,en}/common.json   # US2 : error.home
tests/domain/form-state.test.ts                    # US1 (nouveau)
scripts/start.mjs, scripts/prepare-standalone.mjs   # US4 (nouveaux, postbuild + start) ; app.js supprimé
package.json                  # US4 : start, postbuild, --conditions=react-server, server-only
Dockerfile                    # US4 : copie le standalone complet
README.md                     # US4 : npm start
```

**Structure Decision** : on reste dans les couches d'AGENTS.md.

- La saisie gardée est construite dans `src/server/form-state.ts`, un module pur, sans Next, et testé.
- Les actions restent des adaptateurs : FormData → commande → état ou redirection.
- Les formulaires sont des composants métier de `components/site/`, qui composent les primitives existantes (`Field`, `Input`, `Alert`, `Button`).
- Les pages restent des composants serveur, qui passent au formulaire les valeurs de départ et les champs cachés.

## Ordre et dépendances

1. **US1** (P1) : commencer par l'inscription, pour valider le maintien des valeurs après le reset de React 19 (research R1), puis faire les 12 autres formulaires.
2. **US2** et **US3** (P2) sont indépendantes de l'US1.
3. **US4** (P3) : faire `server-only` en dernier, après les changements de fichiers des autres stories. Faire le retrait des `force-dynamic` avec le tableau du build de `main` sous la main.

## Risques

- **Reset des formulaires par React 19** : les valeurs pourraient être perdues malgré `defaultValue`. Le repli est une `key` par refus (R1).
- **Langue de `global-error` au rendu serveur** : `usePathname` pourrait renvoyer le chemin réécrit. Le texte se corrige à l'hydratation, et le quickstart le vérifie (R3).
- **Un `force-dynamic` retiré qui rendrait une route statique** : le tableau du build le détecte, et la déclaration est alors gardée avec un commentaire (R5).
- **Lockfile** : après `npm install server-only`, vérifier avec `npx npm@10 ci --dry-run`, puisque la CI est en npm 10.

## Complexity Tracking

Aucune violation de la constitution à justifier.
