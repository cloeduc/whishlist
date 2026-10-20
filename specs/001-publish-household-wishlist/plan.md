# Implementation Plan: Wishlists personnelles et communes

**Branch**: `001-publish-household-wishlist` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-publish-household-wishlist/spec.md`

## Summary

Application web en français. Un compte crée plusieurs wishlists, seules ou communes (autres comptes invités par lien, tous peuvent éditer). Le lien de lecture se consulte et se réserve sans compte. Il n'y a pas d'annuaire. Le doc Alex / Sam est un modèle importable (79 idées), pas la page d'accueil. Next.js 15 sert les pages. L'état tient dans `data/wishlist.json`. Les mots de passe passent par `crypto.scrypt`. Passenger démarre `app.js`, qui écoute `process.env.PORT`. Pas d'e-mail sortant.

Le dépôt git est sur `main`. Le nom de branche ci-dessus est l'identifiant de feature renvoyé par Spec Kit (pas de branche git créée : l'extension git n'est pas installée).

## Technical Context

**Language/Version**: TypeScript sur Node.js 20 (`engines.node: >=20`)

**Primary Dependencies**: Next.js 15 (App Router), React 19, `proper-lockfile`. `tsx` pour lancer `node:test`. Pas de module natif.

**Storage**: `data/seed.json` versionné (modèle d'import uniquement). `data/wishlist.json` ignoré par git, vide au premier lancement. Écriture atomique sous lock.

**Testing**: `node:test` via `tsx` sur `src/domain` et le store (catalogue, filtres, course de réservation). Parcours navigateur décrits dans [quickstart.md](quickstart.md), pas de Playwright.

**Target Platform**: Navigateur (téléphone compris). Prod : PlanetHoster N0C, Phusion Passenger, process Node unique.

**Project Type**: Application web, un seul package, rendu serveur.

**Performance Goals**: La liste de 79 idées est lisible tout de suite pour un visiteur sur le mutualisé. Trouver « The Gang » en moins de 30 secondes. Réserver en moins de deux minutes. Pas d'objectif de débit.

**Constraints**: Ne jamais fixer `PORT`. Démarrage prod = `node app.js`. `SESSION_SECRET` uniquement dans `.env` serveur. `data/` inscriptible sur l'hôte, hors git. Pas de service annexe, pas de SMTP. Build SSH : `npm install && npm run build`. Deux confirmations simultanées → une seule réservation. Deux inscriptions du même e-mail → un seul compte.

**Scale/Scope**: Des dizaines de comptes, quelques listes chacun, environ 100 idées par liste importée. Sept parcours. Lecture publique, comptes, invitation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Avant Phase 0 | Après Phase 1 |
|----------|---------------|---------------|
| I. Fidélité du modèle importé | L'annexe n'est plus la seule liste du site | `data/seed.json` copié seulement à l'import. Vues du doc limitées à cette liste |
| II. Lecture sans compte, écriture par les membres | Pas d'annuaire. Invitation ≠ lien de lecture | `readToken` public. `inviteToken` exige une session. Rôle `owner` pour retirer et supprimer |
| III. Réservation sans collision | Une réservation active, annulation par un membre | Lock + suppression de la ligne. Item réservé toujours listé. « Je veux offrir » publique par lien |
| IV. Tranches testables | Domaine testable sans UI | `npm test` couvre import, e-mail unique, invitation, filtres, course. Quickstart couvre les parcours |
| V. Simplicité | Pas de paiement, pas d'e-mail, pas d'annuaire | Un JSON. Pas de reset de mot de passe. Pas d'historique de réservation |
| Hébergement | `app.js`, Node 20, `.env`, `data/`, pas de SMTP | `scrypt` natif Node. Pas d'addon. Pas de `standalone`. `start` = `node app.js` |

Aucune violation. Pas de ligne dans Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-publish-household-wishlist/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui.md
└── tasks.md              # /speckit-tasks, pas cette commande
```

### Source Code (repository root)

```text
app.js                      # shim Passenger, next({ dev: false })
package.json
next.config.ts
.env.example
app/
├── layout.tsx
├── page.tsx                          # GET /
├── inscription/page.tsx
├── connexion/page.tsx
├── listes/[id]/page.tsx              # édition membre
├── inviter/[token]/page.tsx
└── l/[readToken]/
    ├── page.tsx                      # lecture
    ├── types/page.tsx
    ├── offrir/page.tsx
    └── reserver/page.tsx
src/
├── domain/                 # filtres, validation, transitions, zéro import Next
└── store/                  # lock, seed, JSON
data/
├── seed.json               # versionné
└── wishlist.json           # gitignoré, runtime
tests/
├── domain/
└── store/
```

**Structure Decision**: Un seul package Next. Comptes, memberships, import et réservation vivent dans `src/domain` pour que `npm test` prouve les règles sans démarrer Passenger. `app/` lit le store et rend le contrat UI. Pas de routes `/admin` : l'édition est sous la session, scopée à la liste.

## Complexity Tracking

Aucune violation de la constitution.
