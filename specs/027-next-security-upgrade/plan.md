# Implementation Plan: Montée de Next.js en 16.4.6 (vulnérabilités modérées)

**Branch**: `027-next-security-upgrade` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/027-next-security-upgrade/spec.md`

## Summary

Faire passer `next`, `@next/env` et `eslint-config-next` de 16.4.2 à 16.4.6, en version exacte. Régénérer le lockfile avec npm 10. Vérifier que le site, l'image Docker, l'API et le serveur MCP se comportent comme avant.

La version 16.4.5 ferme sept avis modérés. Le site est exposé à aucun d'eux, sauf GHSA-pc58 où l'exposition est faible, par le relais Umami ([research.md](research.md), R1).

La seule nouveauté de comportement à surveiller : depuis 16.4.6, les réponses des route handlers sont compressées automatiquement (R4).

Pas de code métier, pas de données, pas de changement de contrat.

## Technical Context

**Language/Version**: TypeScript, Node.js ≥ 20.9 (image `node:22-bookworm-slim`)

**Primary Dependencies**: Next.js 16.4.2 → 16.4.6 (App Router, `output: "standalone"`, `proxy.ts`), `@next/env` et `eslint-config-next` alignés ; React 19 inchangé

**Storage**: SQLite (Drizzle), non touché

**Testing**: `node:test` + `tsx` (`npm test`), lint, `tsc`, `next build` ; jest-expo pour `mobile/` ; parcours manuels du [quickstart.md](quickstart.md)

**Target Platform**: conteneur Docker Linux (prod Dokploy, derrière Cloudflare), dev macOS

**Project Type**: application web (site Next.js + API JSON + MCP), app Expo cliente, non touchée

**Performance Goals**: aucun nouvel objectif ; la compression automatique peut réduire la taille des réponses JSON

**Constraints**: lockfile compatible npm 10 (CI et image) ; versions épinglées exactement ; CSP par nonce inchangée

**Scale/Scope**: 3 lignes de `package.json`, le lockfile, et au plus une adaptation si la compression gêne le flux MCP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | Statut |
|----------|--------------|--------|
| I. Données personnelles hors dépôt | Aucune donnée ajoutée ; le quickstart utilise les comptes `@example.test` de la démo. | ✅ |
| II. Lecture sans compte, écriture par les membres | Aucun changement de droits ; le quickstart revérifie la lecture et la réservation sans compte. | ✅ |
| III. Réservation sans collision | Store non touché. | ✅ |
| IV. Tranches testables | US1 se vérifie par les commandes (audit, contrôles, dev) ; US2 par les parcours du quickstart sur l'image et la démo. | ✅ |
| V. Simplicité | Aucun mécanisme ajouté. | ✅ |
| Hébergement Docker | Même image `standalone`, même `node:22`, aucune nouvelle variable d'environnement. | ✅ |

Re-check après la Phase 1 : inchangé. Pas de violation, donc pas de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/027-next-security-upgrade/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 : avis, exposition, version cible, changements 16.4.3 → 16.4.6
├── quickstart.md        # Phase 1 : vérifications et parcours
├── checklists/
│   └── requirements.md  # Qualité de la spec
└── tasks.md             # Phase 2 (/speckit-tasks)
```

Pas de `data-model.md` : aucune donnée ne change. Pas de `contracts/` : le contrat `specs/004-mobile-api/contracts/openapi.yaml` ne change pas. La compression est négociée par HTTP (`Accept-Encoding`) et ne modifie ni les routes, ni les corps, ni les codes.

### Source Code (repository root)

```text
package.json             # next, @next/env, eslint-config-next → 16.4.6 (exact)
package-lock.json        # régénéré avec npm 10 (fichier généré)
app/api/mcp/route.ts     # seulement si la compression bloque le flux MCP (R4)
```

**Structure Decision**: aucun nouveau fichier de code. Les fichiers touchés se limitent à ceux ci-dessus. `next-env.d.ts` reste hors du commit s'il ne contient que le chemin écrit par `next dev` (R6).

## Démarche

1. Monter les trois paquets en exact, puis régénérer le lockfile avec `npx npm@10 install --package-lock-only` et vérifier avec `npx npm@10 ci --dry-run` (R3, R5).
2. Lire `node_modules/next/dist/docs/` dans la nouvelle version et relever les dépréciations affichées par `next build` / `next dev` (FR-008).
3. Lancer lint, types, tests du site et de l'app, et build ; corriger les seules erreurs dues à la montée.
4. Dérouler le [quickstart.md](quickstart.md) : audit, dev ×3, image Docker, parcours visiteur et membre, API compressée, MCP, relais Umami.
5. Noter dans `research.md` (section « Constat après montée ») ce qui a été observé : dépréciations, effet de la compression, autres avis de l'audit (FR-008, FR-009).

Une seule user story porte du code (US1). US2 est une vérification sans code, sauf l'adaptation MCP éventuelle. Le découpage en commits revient à `/speckit-tasks`.
