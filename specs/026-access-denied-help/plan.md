# Implementation Plan: Aide sur la page « Accès refusé » d'une liste

**Branch**: `026-access-denied-help` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/026-access-denied-help/spec.md` (ticket WISH-30)

## Summary

Une personne qui ouvre l'adresse de gestion d'une liste (`/lists/<id>`) sans en être membre doit comprendre pourquoi elle est refusée, quel lien demander, et pouvoir repartir, sur le site comme dans l'app.

Approche :

- **Site** : la branche « pas membre » de `app/lists/[id]/page.tsx` est remplacée par un composant d'aide (`components/site/list-access-help.tsx`). La relation au compte vient de `viewerRelation` (`src/domain/subscription.ts`, existant) : abonné → bouton « Voir la liste » vers `/l/<readToken>`, sinon explication + retour à « Mes listes ». Côté propriétaire, un bouton « Partager » dans l'en-tête de la page de gestion et une note dans l'onglet « Partage » (R6).
- **App** : la table des liens de l'app (`src/site/app-link-routes.json`) reçoit `/lists/:listId` → `/links/list/:listId` (garde `tab`). Le nouvel écran `mobile/app/links/list/[listId].tsx` tranche avec la copie locale de `GET /lists` (rafraîchie si en ligne) : membre → écran de la liste (ou de l'onglet), abonné → écran d'aide avec « Voir la liste » (`/guest/<readToken>`), sinon écran d'aide. La décision est une fonction pure testée (R3). Sans session, l'adresse est gardée pendant la connexion comme le lien d'invitation (R4).
- Aucune donnée, aucune route d'API, aucune migration.

## Technical Context

**Language/Version**: TypeScript 6 ; site Next.js (App Router, version du dépôt, lire `node_modules/next/dist/docs/` avant d'écrire du code) ; app Expo SDK 58 (React Native 0.88), Expo Router

**Primary Dependencies**: i18next / react-i18next ; `components/ui/` (`card`, `button`, `empty`), `components/site/link-button` ; `mobile/src/ui/` (`Text`, `Button`, `Alert`), `AuthLayout` ou équivalent existant pour l'écran d'aide. Aucune dépendance nouvelle.

**Storage**: aucun changement. Site : `memberships`, `subscriptions` lus via `viewerRelation`. App : copie locale de `GET /lists` (`lists` + `subscriptions`, `mobile/src/data/store.ts`).

**Testing**: `node:test` + `tsx` : `tests/domain/app-links.test.ts` (nouvelle route, formes anciennes, `/lists/new`, préfixes Android et motifs Apple), `tests/domain/subscription.test.ts` si `viewerRelation` est étendu ; jest-expo : `mobile/__tests__/links/linked-list.test.ts` (fonction de décision), `mobile/__tests__/screens/links-list.test.tsx` (écran : membre, abonné, refus, hors ligne, sans session), `mobile/__tests__/links/pending.test.tsx` (connexion avec `next=/lists/<id>`), `mobile/__tests__/links/app-config.test.ts` (intent filter `/lists/`) ; Maestro `mobile/.maestro/flows/026-us2-management-link.yaml` ; site à la main (quickstart.md).

**Target Platform**: serveur Docker existant ; iOS et Android (nouvelle version de l'app pour les intent filters Android et la route de l'app).

**Project Type**: application web + API JSON + app mobile cliente.

**Performance Goals**: aucun appel en plus sur le site ; dans l'app, au plus un `GET /lists` (déjà fait au lancement) à l'ouverture d'une adresse.

**Constraints**: rien sur la liste (titre, propriétaire, liens) pour qui n'est ni membre ni abonné (FR-003) ; l'app ne distingue pas « inexistante » de « pas membre » ; chaînes FR/EN avec les mêmes clés ; pas de style en dur dans l'écran de l'app ; la table `legacy-paths.json` ne perd aucune ligne.

**Scale/Scope**: 1 composant site + 2 retouches de page ; 1 ligne dans la table des liens ; 1 écran + 1 module pur dans l'app ; ~12 clés par langue ; 1 parcours Maestro.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | Démo et e2e sur comptes `@example.test`. | ✅ |
| II. Lecture sans compte, écriture par les membres | Le refus de modification reste entier ; la page d'aide n'ouvre rien (FR-005). Seul un abonné, qui a déjà le lien de la liste, se voit proposer la lecture. | ✅ |
| III. Réservation sans collision | Non touché. | ✅ |
| IV. Tranches testables | US1 (site), US2 (app), US3 (abonné), US4 (propriétaire) se vérifient chacune seules (quickstart.md). | ✅ |
| V. Simplicité | Des textes et un écran ; pas de demande d'accès ni de notification. Sert à partager et lire une liste. | ✅ |
| Hébergement Docker | Aucune variable, aucun service. | ✅ |

**Re-check après Phase 1** : inchangé. Point de vigilance (R2) : dès le déploiement du site, iOS relit le fichier d'association et les versions installées de l'app reçoivent `/lists/*` sans savoir l'ouvrir (écran d'accueil). Accepté dans la spec ; voir R2 pour l'ordre de mise en prod.

## Project Structure

### Documentation (this feature)

```text
specs/026-access-denied-help/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── screens.md      # page d'aide, écran de l'app, table des liens, clés i18n, testID
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
app/lists/[id]/page.tsx                 # branche « pas membre » → <ListAccessHelp>, bouton « Partager » (US4), note de l'onglet Partage
components/site/list-access-help.tsx    # nouveau : aide (US1) + « Voir la liste » pour l'abonné (US3)
locales/{fr,en}/list.json               # accessHelp.*, share.addressNote, share.action

src/site/app-link-routes.json           # + { site: "/lists/:listId", app: "/links/list/:listId", keepQuery: ["tab"] }
src/site/app-links.ts                   # commentaire « No /lists/:id » retiré
tests/domain/app-links.test.ts          # nouvelle route, formes anciennes, /lists/new, AASA, préfixes Android

mobile/src/links/linked-list.ts         # nouveau, pur : (listId, tab, lists, subscriptions) → cible
mobile/src/links/pending.ts             # useNextLink garde aussi /links/list/
mobile/app/links/list/[listId].tsx      # nouveau : écran d'aide / redirection
mobile/src/features/lists/ListAccessHelp.tsx  # nouveau : contenu de l'écran d'aide (composants de mobile/src/ui/)
mobile/__tests__/links/linked-list.test.ts
mobile/__tests__/screens/links-list.test.tsx
mobile/__tests__/links/pending.test.tsx
mobile/__tests__/links/app-config.test.ts
mobile/.maestro/flows/026-us2-management-link.yaml
```

**Structure Decision**: structure existante (site Next.js + `mobile/`). Le site garde sa règle d'accès dans le domaine (`viewerRelation`) ; l'app décide sur ses données locales avec un module pur, comme les autres écrans de `mobile/app/links/`.

## Complexity Tracking

Aucune violation.
