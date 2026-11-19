---

description: "Tâches de la feature 027 : montée de Next.js en 16.4.6"
---

# Tasks: Montée de Next.js en 16.4.6 (vulnérabilités modérées)

**Input**: Design documents from `/specs/027-next-security-upgrade/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md (pas de data-model ni de contracts : rien ne change)

**Tests**: pas de nouveau test de domaine. La montée ne change aucune règle métier. Les suites existantes (site et app) sont la vérification, avec les parcours du [quickstart.md](quickstart.md).

**Organization**: deux user stories P1. US1 : la montée et les contrôles. US2 : la vérification du comportement en prod, plus l'adaptation MCP si la compression la rend nécessaire.

## Un commit par user story (règle du projet)

- Les phases Setup et Foundational n'ont pas de commit propre : elles entrent dans le commit de US1, avec les documents de la feature (`specs/027-next-security-upgrade/`).
- Chaque commit est vert (lint, types, tests). Message en anglais, préfixé `feat:`, `fix:` ou `chore:`, terminé par `(USn)`. Créé sans demander ; seuls le push et le squash sur `main` attendent l'utilisateur.
- `next-env.d.ts` n'entre dans aucun commit s'il ne contient que le chemin `.next/dev/types/…` écrit par `next dev` (research.md, R6).
- `.specify/feature.json` reste local.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: état de départ connu avant la montée

- [X] T001 Relever l'état avant montée et le noter en tête d'une section « Constat après montée » à ajouter à la fin de `specs/027-next-security-upgrade/research.md` : sortie de `npm audit --omit=dev` (les deux avis sur `next` 16.4.2) et de `npm audit` complet (avis des dépendances de dev, à lister sans les traiter), et `npm ls next @next/env eslint-config-next`.

---

## Phase 2: Foundational

Aucune : la montée elle-même est l'objet de US1.

---

## Phase 3: User Story 1 - Le site tourne sur une version sans vulnérabilité connue (Priority: P1) 🎯 MVP

**Goal**: `next`, `@next/env` et `eslint-config-next` en 16.4.6 exact, lockfile compatible npm 10, audit propre, tous les contrôles verts, `next dev` qui démarre du premier coup.

**Independent Test**: étapes 1 et 2 du [quickstart.md](quickstart.md).

### Implementation for User Story 1

- [X] T002 [US1] Dans `package.json`, passer `"next"`, `"@next/env"` (dependencies) et `"eslint-config-next"` (devDependencies) de `"16.4.2"` à `"16.4.6"`, en version exacte, sans `^` (research.md, R3). Ne toucher à aucune autre dépendance.
- [X] T003 [US1] Régénérer `package-lock.json` avec `npx npm@10 install --package-lock-only`, puis `npm ci`. Vérifier avec `npx npm@10 ci --dry-run` que l'installation passe sans modifier le lockfile, et avec `npm ls next @next/env eslint-config-next` que les trois sont en 16.4.6 sans doublon (research.md, R5 ; FR-001, FR-002, FR-004).
- [X] T004 [US1] Lire la documentation livrée avec le paquet monté (`node_modules/next/dist/docs/`, en commençant par les guides d'upgrade et de `proxy.ts`), et le bloc AGENTS.md éventuellement réécrit par `node_modules/next/dist/server/lib/generate-agent-files.js`. Si `next dev` réécrit le bloc « This is NOT the Next.js you know » de `AGENTS.md`, garder la nouvelle version. Noter dans `specs/027-next-security-upgrade/research.md` (« Constat après montée ») toute nouveauté ou dépréciation qui touche le site (FR-008).
- [X] T005 [US1] Lancer `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` (avec son `postbuild`) et `npm --prefix mobile run test`. Corriger uniquement les erreurs dues à la montée, dans les fichiers qu'elles désignent. Noter dans `research.md` les avertissements de dépréciation de `next build` et ce qui a été corrigé. Si une correction dépasse une simple adaptation, s'arrêter et le signaler à l'utilisateur (spec, Edge Cases).
- [X] T006 [US1] Lancer `npm audit --omit=dev` : plus aucun avis sur `next`, en particulier ni GHSA-mfr8-8qww-v76h ni GHSA-vc7v-qv4w-wrv8 (FR-003). Lancer `npm run dev` 3 fois de suite, en l'arrêtant entre chaque : il démarre sans s'arrêter ni afficher d'avertissement de vulnérabilité (SC-002). Consigner les deux résultats dans `research.md`.
- [X] T007 [US1] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `fix: upgrade Next.js to 16.4.6 for the November security advisories (US1)`. Il contient `package.json`, `package-lock.json`, les fichiers corrigés en T005, `AGENTS.md` s'il a changé, et `specs/027-next-security-upgrade/` (spec, plan, research, quickstart, checklists, tasks). Pas `next-env.d.ts` (sauf version `next build`), pas `.specify/feature.json`, pas `specs/019-site-favicon/review.md`. Sans demander.

**Checkpoint**: le dépôt est en 16.4.6, l'audit est propre, tous les contrôles sont verts.

---

## Phase 4: User Story 2 - Le site en production se comporte comme avant (Priority: P1)

**Goal**: l'image se construit et démarre, et les parcours visiteur et membre, l'API, l'app mobile, le MCP et le relais Umami donnent le même résultat qu'avant.

**Independent Test**: étapes 3 à 7 du [quickstart.md](quickstart.md).

### Implementation for User Story 2

- [X] T008 [US2] Construire l'image (`docker build -t whishlist:027 .`), préparer la démo (`npm run demo:data -- tmp/demo-wishlist.json`) et lancer le conteneur sur ces données selon l'étape 3 du quickstart. Les variables sont celles du tableau du `README.md` et de `deploy/compose.prod.yml`. Vérifier que l'image démarre, répond et lit les données (FR-006).
- [X] T009 [US2] Dérouler les étapes 4 et 5 du quickstart sur le conteneur :
  - Visiteur : liste publique sans compte, réservation, redirection d'une ancienne adresse française.
  - CSP : en-tête `Content-Security-Policy` avec nonce, aucun script bloqué dans la console.
  - Membre : connexion avec `alex@example.test`, création d'une liste et d'une idée, changement de langue, images de `/guide` et `/about`.

  Consigner le résultat dans `research.md` (FR-007).
- [X] T010 [US2] Dérouler l'étape 6 du quickstart (research.md, R4) :
  - `curl` sur `/api/v1/capabilities`, avec et sans `Accept-Encoding: gzip`.
  - App mobile pointée sur le conteneur (`EXPO_PUBLIC_API_URL`) : connexion, ouverture d'une liste, ajout d'une idée.
  - `initialize` MCP sur `/api/mcp` avec une clé d'API de démo.

  Consigner dans `research.md` si les réponses sont compressées et si l'app et le MCP fonctionnent.
- [X] T011 [US2] *Non nécessaire : le flux MCP passe compressé (research.md, « Image Docker et parcours »).* Seulement si T010 montre que la compression bloque ou casse la réponse MCP en flux : dans `app/api/mcp/route.ts`, empêcher la compression de cette seule réponse, par le moyen documenté dans `node_modules/next/dist/docs/` pour 16.4.6 (option ou en-tête prévu pour les route handlers). Ajouter un commentaire en anglais qui cite le changement de 16.4.6. Vérifier de nouveau l'étape 6. Sinon, marquer la tâche « non nécessaire » avec la raison.
- [X] T012 [US2] Dérouler l'étape 7 du quickstart (relais Umami `/u/script.js` et `/u/api/send` si la variable Umami est définie, `404` sinon), et consigner le résultat dans `research.md`.
- [X] T013 [US2] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit des fichiers de cette story sans demander :
  - `fix: keep the MCP stream uncompressed after the Next.js 16.4.6 upgrade (US2)`, avec `app/api/mcp/route.ts` et `research.md`, si T011 a changé du code ;
  - sinon `chore: verify the site after the Next.js 16.4.6 upgrade (US2)`, avec `research.md` seul.

**Checkpoint**: les deux stories sont vérifiées ; la branche est prête pour la revue.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 Relire `specs/027-next-security-upgrade/research.md` (« Constat après montée ») : il répond à FR-008 (changements notés avec leur décision) et à FR-009 (pas de mise en cache de fonctions, exposition nulle ; relais Umami, exposition faible). Passer `**Status**` de `spec.md` à `Implemented`. Commit `chore: close the 027 feature docs` s'il y a un changement, sans demander.

Ensuite, le hook `after_implement` lance `wishlist-feature-review`.

---

## Dependencies & Execution Order

- T001 → T002 → T003 → T004 → T005 → T006 → T007 (US1, séquentiel : chaque étape dépend de l'installation précédente).
- US2 dépend de US1 : elle vérifie l'état monté. T008 → T009, T010, T012 (sur le même conteneur) → T011 (conditionnel, après T010) → T013.
- Polish après US2.

### Parallel Opportunities

Peu nombreuses, la feature est une suite de vérifications sur un même état :

- T004 (lecture de la doc) peut se faire pendant que T005 tourne.
- Une fois le conteneur de T008 lancé, T009, T010 et T012 sont indépendantes (navigateur, `curl`/app, relais).

## Parallel Example: User Story 2

```bash
# Conteneur de T008 lancé sur le port 3011 :
Task: "T009 parcours visiteur et membre dans le navigateur"
Task: "T010 curl /api/v1/capabilities, app mobile, initialize MCP"
Task: "T012 relais Umami /u/script.js et /u/api/send"
```

## Implementation Strategy

1. **MVP = US1** : à elle seule, elle ferme les avis et rend l'audit propre. Elle se déploie déjà sur `staging`.
2. **US2** : à faire avant toute PR vers `main`, car un merge sur `main` déploie la prod.
3. Livraison : la feature part de `staging`, indépendamment de la 026 (qui attend la prochaine version de l'app). Push et squash sur `main` seulement à la demande de l'utilisateur.
