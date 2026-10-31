# Implementation Plan: Pages légales, données et suppression du compte

**Branch**: `006-mobile-legal-account` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-mobile-legal-account/spec.md`

## Summary

Tout en bas de « Mon compte » dans l'app : les mentions légales, une nouvelle page « Données personnelles », le téléchargement de ses données, les licences, le contact, la version, et la suppression du compte.

Côté serveur :

- deux règles pures dans `src/domain/account.ts` : la suppression (listes seules effacées, listes partagées transmises, réservations détachées) et l'export (liste blanche de champs) ;
- des commandes partagées par le site et l'API ;
- trois routes v1 (`GET`/`POST /me/deletion`, `GET /me/export`) et `capabilities.analytics`.

Le site gagne la même suppression et le même export en bas de `/compte`, et une page publique `/donnees-personnelles`, qui servira de lien de politique de confidentialité. Les textes légaux, partagés par le site et l'app dans `content`, sont mis à jour : hébergeur Cloudflare, nouveaux prestataires et durées.

## Technical Context

**Language/Version**: TypeScript strict. Serveur : Node ≥ 20.9, Next 16.4 (inchangé). App : Expo SDK 58, React Native 0.88 (inchangé).

**Primary Dependencies**: serveur — aucune nouvelle. App — `expo-file-system` et `expo-sharing` (SDK 58, sans permission, R10).

**Storage**: `wishlist.json` sans changement de schéma ; une écriture `updateDocument` pour la suppression. App : stockage sécurisé et SQLite existants, effacés comme à la déconnexion (R9).

**Testing**: `node:test` dans `tests/domain/account.test.ts` (suppression : invariants ; aperçu ; export : contenu et absence de chaque secret) et `tests/domain/api-contract.test.ts` (nouvelles routes). App : jest-expo (section de « Mon compte », écran de suppression avec faux `fetch`, effacement local après `204`, couverture de `licenses.json`, clés `content`/`auth`/`mobile` identiques en fr et en en). Parcours : [quickstart.md](quickstart.md).

**Target Platform**: site (navigateurs) ; iOS et Android (comme la 005).

**Project Type**: application web + API + app mobile existantes.

**Performance Goals**: pages légales affichées en moins d'1 s, hors ligne compris (SC-005) ; suppression d'un compte avec 50 listes en une écriture de moins d'1 s.

**Constraints**: suppression définitive, sans état intermédiaire : une seule écriture, après la vérification du mot de passe ; aucun secret dans l'export ; textes identiques au site ; aucune permission système ; publiable sur les stores.

**Scale/Scope**: 5 écrans d'app (« Mon compte » modifié ; `delete-account`, `legal/mentions`, `legal/privacy`, `legal/licenses` nouveaux), 3 pages du site (`/donnees-personnelles` nouvelle, `/mentions-legales` et `/compte` modifiées), 3 routes d'API.

Aucune inconnue restante : voir [research.md](research.md) (R1 à R13).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Règle | Statut | Pourquoi |
|-------|--------|----------|
| I. Données personnelles hors dépôt | ✅ | Tests sur des fichiers temporaires ; parcours sur la base de démo (`@example.test`). L'export est fabriqué à la demande et n'est jamais écrit dans le dépôt. `licenses.json` ne contient que des métadonnées de paquets. |
| II. Lecture sans compte, écriture par les membres | ✅ | Pages légales sans compte. Suppression et export exigent le compte connecté et actif ; l'export ne contient que des listes dont la personne est membre. |
| III. Réservation sans collision | ✅ | Les réservations faites par le compte supprimé restent sur les listes qui restent : le cadeau reste réservé, sans doublon possible. |
| IV. Tranches testables | ✅ | US1 (suppression) et US2 (pages légales) se livrent seules ; US3 et US4 s'ajoutent sans dépendre l'une de l'autre. Chacune a son parcours dans quickstart.md. |
| V. Simplicité | ⚠️ justifié | La suppression et l'export ne servent ni à créer, ni à partager, ni à lire une liste. Voir Complexity Tracking. Pas de délai de grâce, pas d'e-mail, pas de nouveau service. |
| Hébergement Docker | ✅ | Aucune variable, aucun service. L'hébergeur affiché (Cloudflare) correspond à la section hébergement. La durée des sauvegardes affichée vient de `deploy/backup-whishlist.sh` (`WHISHLIST_BACKUP_KEEP`, 14 j par défaut). |
| Workflow | ✅ | Spec sans framework ; choix techniques ici. |

**Re-check après Phase 1** : ✅. Point d'attention : la règle de transmission de propriété est extraite de `leaveWishlist` dans une fonction partagée. Le test existant de `leaveWishlist` doit continuer de passer sans modification.

## Project Structure

### Documentation (this feature)

```text
specs/006-mobile-legal-account/
├── spec.md
├── plan.md                    # ce fichier
├── research.md                # R1–R13
├── data-model.md              # aperçu, suppression, export, effacement local, textes
├── quickstart.md              # parcours site + app
├── contracts/
│   ├── api-v1-additions.md    # /me/deletion, /me/export, capabilities.analytics
│   └── screens.md             # écrans de l'app ajoutés ou modifiés
├── checklists/requirements.md
└── tasks.md                   # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── account.ts                   # NOUVEAU — previewAccountDeletion, deleteAccount, exportAccount
│   └── membership.ts                # wipeWishlist et pickHeir exportés, réutilisés par account.ts
├── server/
│   ├── commands/account.ts          # NOUVEAU — previewOwnDeletion, deleteOwnAccount, exportOwnAccount
│   ├── actions.ts                   # + deleteAccountAction
│   └── analytics.ts                 # (lecture) analyticsConfigured pour capabilities
├── site/contact.ts                  # NOUVEAU — CONTACT_EMAIL (module pur, aussi lu par l'app)
app/
├── api/v1/me/deletion/route.ts      # NOUVEAU — GET aperçu, POST suppression
├── api/v1/me/export/route.ts        # NOUVEAU
├── api/v1/capabilities/route.ts     # + analytics, apiVersion 1.2.0
├── compte/page.tsx                  # + carte « Vos données » et carte « Supprimer mon compte »
├── compte/export/route.ts           # NOUVEAU — export par cookie
├── donnees-personnelles/page.tsx    # NOUVEAU — ContentPage
├── mentions-legales/page.tsx        # hébergeur Cloudflare, lien vers données personnelles
└── sitemap.ts                       # + /donnees-personnelles
components/site/
└── delete-account-dialog.tsx        # NOUVEAU — aperçu + mot de passe (Dialog de components/ui)
locales/{fr,en}/
├── content.json                     # legal.* réécrit, privacy.* nouveau
├── auth.json                        # account.data*, account.export*, account.delete*
└── mobile.json                      # account.version, licenses, contact ; legal.*
specs/004-mobile-api/contracts/openapi.yaml   # ajouts de contracts/api-v1-additions.md
tests/domain/
├── account.test.ts                  # NOUVEAU
└── api-contract.test.ts             # (inchangé, couvre les nouvelles routes)

mobile/
├── app/
│   ├── (app)/account.tsx            # + section du bas
│   ├── (app)/delete-account.tsx     # NOUVEAU
│   ├── (auth)/login.tsx, register.tsx  # + liens légaux, message « compte supprimé »
│   └── legal/mentions.tsx, privacy.tsx, licenses.tsx   # NOUVEAUX
├── src/
│   ├── auth/session.ts              # + deleteAccount() : POST, puis effacement local, état deleted
│   ├── features/account/
│   │   ├── LegalLinks.tsx           # NOUVEAU — liens de connexion / création
│   │   └── exportData.ts            # NOUVEAU — GET /me/export, fichier, partage
│   ├── legal/licenses.json          # GÉNÉRÉ — scripts/licenses.mjs
│   └── ui/ContentPage.tsx, ContentSection.tsx   # NOUVEAUX — un par composant du site
├── scripts/licenses.mjs             # NOUVEAU
└── __tests__/                       # account-section, delete-account, licenses, legal-texts
AGENTS.md                            # + mobile/src/legal/licenses.json dans « Fichiers générés » ; commande licences
specs/005-mobile-list-app/design-reference.md   # + lignes 13 et 14 de la correspondance
```

**Structure Decision**: même découpage que les features 004 et 005 : règle pure dans `src/domain/`, orchestration dans `src/server/commands/`, adaptateurs site (`actions.ts`, route `compte/export`) et API (`app/api/v1/`), écrans de l'app qui composent `mobile/src/ui/`.

## Ordre de livraison

1. **Socle** : `account.ts` et ses tests, commandes, contrat, routes API, `api:types`.
2. **US1** : suppression sur le site (`/compte`) puis dans l'app.
3. **US2** : textes `content` (hébergeur, `privacy.*`), page du site, écrans `legal/` de l'app, liens de connexion.
4. **US3** : export site puis app.
5. **US4** : licences, version, contact.
6. Captures 13 et 14, grille de design, quickstart complet.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principe V : suppression du compte et export, qui ne servent ni à créer, ni à partager, ni à lire une liste | Droits de la personne sur ses données (effacement, accès, portabilité). Une app qui crée des comptes doit en permettre la suppression depuis l'app. | « Écrire au contact » : l'éditeur devrait modifier le fichier JSON à la main, sans règle testée sur les listes partagées et les réservations, et l'app ne pourrait pas proposer la suppression elle-même. La spec sert de justification explicite ; un amendement de la constitution reste la décision de Cloé. |
