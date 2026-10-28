# Implementation Plan: API pour une app mobile

**Branch**: `004-mobile-api` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-mobile-api/spec.md`

## Summary

Exposer les parcours du site à un client autre que le navigateur (future app mobile), sous `/api/v1`, dans la même app Next.js. Les routes JSON et les server actions appellent les mêmes commandes serveur, extraites de `src/server/actions.ts`, qui elles-mêmes appellent `src/domain/` et `src/store/db.ts`. Le client s'authentifie avec un jeton opaque révocable (stocké haché dans `apiSessions`), et garde les preuves invité (réservation, déverrouillage) que le site met en cookie. Le contrat est un fichier OpenAPI 3.1 versionné. Livraison par tranches : P1 (lecture et réservation sans compte) seule permet déjà une app invité.

## Technical Context

**Language/Version**: TypeScript 5.8, Node.js ≥ 20.9 (image `node:22`)

**Primary Dependencies**: Next.js 16.4 (App Router, route handlers), i18next 26, proper-lockfile. Aucune nouvelle dépendance.

**Storage**: fichier JSON `wishlist.json` via `src/store/db.ts` (`readDocument` / `updateDocument` sous verrou). Nouvelle collection `apiSessions` ([data-model.md](data-model.md)).

**Testing**: `node:test` + `tsx` dans `tests/domain/`, store sur fichier temporaire (`mkdtemp`). Parcours `curl` dans [quickstart.md](quickstart.md).

**Target Platform**: conteneur Docker Linux (Mac mini, tunnel Cloudflare), un seul process.

**Project Type**: application web (Next.js) qui expose en plus une API JSON.

**Performance Goals**: lire une liste de 100 idées en moins d'une seconde (SC-005) ; usage familial, quelques requêtes par seconde au plus.

**Constraints**: un seul process (verrou fichier, rate-limit en mémoire) ; pas de cookie dans l'API ; services externes optionnels ; site inchangé (FR-006).

**Scale/Scope**: une dizaine de comptes et de listes ; 28 opérations dans le contrat, couvrant 6 User Stories.

Toutes les inconnues sont résolues dans [research.md](research.md) (R1 à R11).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Règle | Statut | Pourquoi |
|-------|--------|----------|
| I. Données personnelles hors dépôt | ✅ | Les jetons et les sessions vivent dans le volume `/data`. Quickstart et tests n'utilisent que `@example.test`. |
| II. Lecture sans compte, écriture par les membres | ✅ | `/public/...` sans compte ; chaque route membre passe par une commande qui vérifie `findMembership` ; non-membre → `404`. Pas d'opération qui liste les listes d'autrui. |
| III. Réservation sans collision | ✅ | `reserveItem` dans `updateDocument` (même verrou que le site) ; test de 20 réservations parallèles. Annulation : membre ou réservant (règle existante `cancelOwnReservation`). |
| IV. Tranches testables | ✅ | 6 User Stories livrables seules ; chaque tranche a son parcours dans quickstart.md. |
| V. Simplicité | ✅ justifié | Un mécanisme en plus (l'API), au service de lire, partager et créer des listes ; justifié par la spec (Assumptions, « Constitution »). Pas de nouvelle dépendance, pas de second service, pas de JWT ni de refresh token. |
| Hébergement Docker | ✅ | Même conteneur ; une variable optionnelle `API_ALLOWED_ORIGINS` (`WHISHLIST_API_ALLOWED_ORIGINS`), documentée dans README, `.env.example`, `deploy/compose.prod.yml`. Sans elle, l'API marche pour les clients natifs et le site. |
| Workflow | ✅ | La spec ne nomme pas le framework ; les choix techniques sont ici. |

**Re-check après Phase 1** : ✅. Le design n'ajoute ni service, ni dépendance, ni donnée personnelle au dépôt. Point d'attention : l'extraction des commandes touche `src/server/actions.ts` ; le site doit garder son comportement (SC-007), d'où une migration par tranche et `npm test` à chaque étape.

## Project Structure

### Documentation (this feature)

```text
specs/004-mobile-api/
├── spec.md
├── plan.md              # ce fichier
├── research.md          # décisions R1–R11
├── data-model.md        # ApiSession, preuves invité, vues
├── quickstart.md        # parcours curl par User Story
├── contracts/
│   └── openapi.yaml     # contrat v1, source de vérité
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/api/
├── v1/
│   ├── capabilities/route.ts
│   ├── public/lists/[readToken]/route.ts
│   ├── public/lists/[readToken]/unlock/route.ts
│   ├── public/lists/[readToken]/reservations/route.ts
│   ├── public/lists/[readToken]/reservations/[reservationId]/route.ts
│   ├── auth/{register,login,logout,password-reset}/route.ts
│   ├── me/route.ts, me/password/route.ts
│   ├── lists/route.ts, lists/[listId]/route.ts
│   ├── lists/[listId]/{items,enrich,types,people,invite-link,invitations,read-password,leave}/…
│   ├── lists/[listId]/{reservations,members}/[id]/route.ts
│   └── invitations/[inviteToken]/accept/route.ts
└── [version]/[...path]/route.ts      # versions inconnues → 410

src/server/
├── actions.ts            # devient adaptateur : FormData → commande → redirect/cookies
├── commands/             # NOUVEAU : orchestration partagée (auth, public-list, lists, items, labels, sharing)
└── api/                  # NOUVEAU : http.ts (lecture JSON, limites, réponses, CORS, no-store),
                          #           errors.ts (code → statut), auth.ts (bearer → User), views.ts (PublicList, MemberList)

src/auth/
├── api-session.ts        # NOUVEAU : émettre / vérifier / révoquer / purger (fonctions pures sur Database)
├── reservation-claim.ts  # sign/verify extraits en fonctions pures + adaptateur cookie
└── read-unlock.ts        # idem

src/domain/types.ts       # + ApiSession, Database.apiSessions
src/store/db.ts           # normalizeDocument : apiSessions = []
src/i18n/server.ts        # + translateErrorFor(locale, code)
locales/{fr,en}/errors.json  # + codes d'API
proxy.ts                  # matcher exclut /api/

tests/domain/
├── api-session.test.ts
├── guest-proofs.test.ts      # claims + unlock
├── api-http.test.ts          # origine, code → statut, limites de corps
└── commands-*.test.ts        # une par fichier de commandes, sur fichier temporaire
```

**Structure Decision**: une seule app Next.js. L'API est une couche d'adaptation mince (`app/api/v1`, `src/server/api`) au-dessus de commandes partagées (`src/server/commands`) ; `src/domain` et `src/store` ne changent que pour `apiSessions`. Ordre de réalisation : socle (http, erreurs, proxy, versions, capabilities) → US1 → US2 → US3 → US4 → US5 → US6, chaque tranche migrant d'abord les actions concernées vers des commandes.

## Complexity Tracking

| Ajout | Pourquoi | Alternative plus simple rejetée parce que |
|-------|----------|-------------------------------------------|
| Collection `apiSessions` stockée | Une déconnexion doit tuer le jeton de l'appareil, sans déconnecter les autres (FR-021) | Le jeton signé sans état du site ne se révoque qu'en bloc (`sessionVersion`) |
| Dossier `src/server/commands/` | Une règle écrite une fois pour le site et l'API (FR-004) | Faire appeler les server actions par les routes : elles redirigent et lisent les cookies |
