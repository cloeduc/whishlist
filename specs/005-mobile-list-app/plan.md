# Implementation Plan: App mobile pour gérer ses listes

**Branch**: `005-mobile-list-app` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-mobile-list-app/spec.md`

## Summary

Une app Expo (iOS et Android) dans `mobile/`, cliente de l'API `/api/v1` de la feature 004, pour les membres : connexion et compte, mes listes, création et remplissage d'une liste, partage public par QR code et feuille de partage, et mode hors ligne (copie locale en SQLite + file de changements envoyés au retour du réseau). Le design reproduit le site écran par écran, à partir de [design-reference.md](design-reference.md) et des captures du site en largeur mobile ; les valeurs de design et les textes sont lus ou vérifiés à la source (`app/globals.css`, `locales/`). Côté serveur, une seule extension compatible du contrat v1 : le client peut choisir l'identifiant de ce qu'il crée, pour qu'un renvoi ne crée pas de doublon.

## Technical Context

**Language/Version**: TypeScript strict. App : React Native 0.88 via Expo SDK 58. Serveur : inchangé (Node ≥ 20.9, Next 16.4).

**Primary Dependencies** (app) : expo 58, expo-router 58, expo-secure-store, expo-sqlite, expo-localization, expo-font + @expo-google-fonts/geist, expo-clipboard, @react-native-community/netinfo 12, react-native-svg 15, react-native-qrcode-svg 6.3, i18next + react-i18next (mêmes que le site), openapi-fetch 0.17 ; dev : openapi-typescript 7.13, jest-expo 58, @testing-library/react-native 14. Serveur : aucune nouvelle dépendance.

**Storage**: app — stockage sécurisé (jeton) et SQLite (copie locale, file de changements), voir [data-model.md](data-model.md). Serveur — `wishlist.json` inchangé.

**Testing**: app — jest-expo + Testing Library (moteur hors ligne, composants, cohérence des tokens et des textes) ; serveur — `node:test` dans `tests/domain/` pour l'extension `id` ; parcours réels dans [quickstart.md](quickstart.md) sur simulateur iOS et émulateur Android.

**Target Platform**: iOS et Android encore maintenus, téléphones, portrait. Client de développement et builds EAS (pas Expo Go).

**Project Type**: application mobile + extension d'une API web existante.

**Performance Goals**: réouverture vers « Mes listes » en moins de 2 s (SC-004) ; envoi de l'outbox en moins de 30 s au retour du réseau (SC-009) ; défilement fluide d'une liste de 100 idées.

**Constraints**: design identique au site (US6, P1) ; aucune règle métier dans l'app (FR-041) ; hors ligne sans perte ni doublon (SC-008) ; aucune permission système demandée ; choix compatibles avec une publication future sur les stores.

**Scale/Scope**: 13 écrans ([contracts/screens.md](contracts/screens.md)), 6 User Stories, une dizaine de comptes et de listes.

Toutes les inconnues sont résolues dans [research.md](research.md) (R1 à R12).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Règle | Statut | Pourquoi |
|-------|--------|----------|
| I. Données personnelles hors dépôt | ✅ | Captures et tests sur la base de démo (`@example.test`). L'app ne stocke rien dans le dépôt ; la copie locale vit sur le téléphone. |
| II. Lecture sans compte, écriture par les membres | ✅ | L'app sert les membres connectés ; lecture et réservation sans compte restent sur le site, via le lien partagé. L'extension `id` exige un compte membre comme une création normale. |
| III. Réservation sans collision | ✅ | L'app ne réserve pas. Elle affiche les réservations ; annulation par un membre via la route existante. |
| IV. Tranches testables | ✅ | 6 User Stories, chacune avec son parcours dans quickstart.md. US1 + US2 + US6 forment un premier livrable utilisable. |
| V. Simplicité | ✅ justifié | Un nouveau client qui sert à créer, remplir et partager une liste. Le mode hors ligne est demandé explicitement ; il est fait avec une file locale simple plutôt qu'un système de synchronisation (voir Complexity Tracking). Pas de paiement, d'annuaire ni de synchro continue avec un document source. |
| Hébergement Docker | ✅ | Le serveur ne change pas d'hébergement ni de variables. `mobile/` est exclu de l'image (`.dockerignore`). Aucun service externe nouveau côté serveur ; EAS ne sert qu'à construire l'app. |
| Workflow | ✅ | La spec ne nomme pas la technologie ; Expo est choisi ici. |

**Re-check après Phase 1** : ✅. Point d'attention : l'extension du contrat v1 touche `src/server/commands/lists.ts` et `items.ts` ; elle reste compatible (champs optionnels) et ne change aucune règle du domaine.

## Project Structure

### Documentation (this feature)

```text
specs/005-mobile-list-app/
├── spec.md
├── plan.md                 # ce fichier
├── research.md             # R1–R12
├── data-model.md           # stockage sécurisé, SQLite (snapshot, outbox), vue optimiste
├── design-reference.md     # valeurs et composants du site, correspondance des écrans
├── design/web-mobile/      # captures du site en 390 × 844 (référence visuelle)
├── quickstart.md           # parcours sur simulateur, grille de comparaison du design
├── contracts/
│   ├── api-v1-additions.md # extension compatible du contrat de la 004
│   └── screens.md          # écrans, routes, modèles, appels, hors ligne
├── checklists/requirements.md
└── tasks.md                # /speckit-tasks
```

### Source Code (repository root)

```text
mobile/                              # NOUVEAU — app Expo, package séparé
├── app.config.ts                    # nom, identifiants, icône, EXPO_PUBLIC_API_URL
├── eas.json                         # profils development / preview / production
├── metro.config.js                  # watchFolders: ../locales (textes du site)
├── package.json, tsconfig.json, jest.config.js
├── app/                             # routes Expo Router (contracts/screens.md)
│   ├── _layout.tsx                  # polices, i18n, thème, session, synchro
│   ├── (auth)/login.tsx, register.tsx, forgot-password.tsx
│   ├── change-password.tsx
│   └── (app)/index.tsx (Mes listes + barre du haut), account.tsx
│       └── lists/new.tsx, lists/[listId]/{index,archives,reservations,share,settings}.tsx,
│           lists/[listId]/items/{new,[itemId]}.tsx
├── src/
│   ├── api/          client.ts (openapi-fetch + en-têtes + erreurs), schema.d.ts (généré)
│   ├── auth/         session.ts (secure-store, /me, logout)
│   ├── offline/      db.ts (SQLite), snapshot.ts, outbox.ts (ajout, compaction, dépendances),
│   │                 optimistic.ts (vue = snapshot + outbox), sync.ts (envoi ordonné, réponses), ids.ts
│   ├── i18n/         index.ts (i18next sur ../locales, expo-localization)
│   ├── theme/        tokens.ts (valeurs de globals.css), ListTheme.tsx (thème de liste)
│   ├── ui/           Button, Card, Field, Input, Select, Badge, PillTabs, Stars, Alert, Empty,
│   │                 GiftMark, Shadow (ombre néo-brutaliste), OfflineBanner, PendingBadge, QrCard
│   └── features/     lists/, items/, share/, account/ (écrans composés)
└── __tests__/        offline/*, ui/*, tokens.test.ts (↔ app/globals.css), i18n.test.ts

# Serveur — extension compatible du contrat v1
specs/004-mobile-api/contracts/openapi.yaml   # champs optionnels id / categoryId / personId, version 1.1.0
src/server/commands/lists.ts                  # createList : id client + renvoi
src/server/commands/items.ts                  # saveItem (création) : id client + renvoi
src/server/api/errors.ts, locales/{fr,en}/errors.json   # idInvalid, idConflict
src/i18n/config.ts, locales/{fr,en}/mobile.json         # namespace des textes propres à l'app
app/api/v1/lists/route.ts, app/api/v1/lists/[listId]/items/route.ts   # 200 sur renvoi
tests/domain/commands-client-ids.test.ts

# Outillage
scripts/capture-demo.mjs        # + mode --mobile (390 × 844) → specs/005-mobile-list-app/design/web-mobile/
tsconfig.json, eslint.config.mjs, .dockerignore   # exclure mobile/
AGENTS.md, README.md            # commandes de l'app, couche mobile/
```

**Structure Decision**: un dossier `mobile/` autonome dans le dépôt, qui réutilise à la source le contrat d'API, les textes et les valeurs de design du site. Ordre de réalisation : socle (projet Expo, tokens, police, composants UI, i18n, client d'API) → US6 sur les composants → US1 → US2 → US3 → US4 → extension serveur `id` → US5 → finitions (captures, comparaison du design, docs).

## Complexity Tracking

| Ajout | Pourquoi | Alternative plus simple rejetée parce que |
|-------|----------|-------------------------------------------|
| Moteur hors ligne (copie locale SQLite + file ordonnée) | Demandé (US5) : créer et modifier sans réseau, sans perte ni doublon | Désactiver l'app hors ligne : ne répond pas à la demande ; un système de synchronisation complet (WatermelonDB, PowerSync) demanderait un protocole serveur |
| Composants UI maison au lieu d'une bibliothèque | Design identique au site (US6, P1) | Une bibliothèque de composants impose ses styles et son ombre native, différents du site |
| Extension `id` du contrat v1 | Pas de doublon au renvoi (FR-029) | Un en-tête d'idempotence demanderait de stocker les réponses côté serveur |
