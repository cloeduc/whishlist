# Implementation Plan: Adresses du site en anglais

**Branch**: `018-english-urls` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-english-urls/spec.md`

## Summary

Les dossiers de pages de `app/` prennent leur nom anglais (`listes` → `lists`, `compte` → `account`…) et tous les liens produits suivent. Une table versionnée, `src/site/legacy-paths.json` ([data-model](./data-model.md)), décrit chaque ancienne adresse et chaque paramètre renommé (`onglet` → `tab`, `suite` → `next`). Une fonction pure, `canonicalSitePath()`, l'applique partout où une adresse entre :

- **US1 (site)** : `decideLocaleRoute` (appelée par `proxy.ts`) redirige en 301 toute ancienne adresse vers la nouvelle, en un seul saut avec la langue ; un `POST` sur une ancienne adresse est réécrit, pas redirigé ([research R1, R3](./research.md)). Les valeurs de renvoi (`next`) et les champs envoyés par une page restée ouverte (`onglet`) sont traduits côté serveur (R4).
- **US2 (app)** : `app-link-routes.json` passe aux nouvelles adresses ; `appPathForSiteUrl` traduit une ancienne adresse avant de chercher l'écran ; le fichier Apple et les filtres Android déclarent les deux formes (R5). Les liens que l'app ouvre vers le site utilisent les nouvelles adresses.

Aucune variable d'environnement, aucune migration, aucune route d'API nouvelle. Le risque des versions de l'app déjà installées est traité par une règle de livraison (R6) : la version qui porte cette feature est la première version publique avec liens universels.

Détail des choix : [research.md](./research.md). Contrat des adresses : [contracts/addresses.md](./contracts/addresses.md). Parcours : [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript 5.8, Node.js 20+ en dev, `node:22` dans l'image ; app Expo SDK 58 (`mobile/`).

**Primary Dependencies**: Next.js 16 (App Router, `proxy.ts`), i18next ; Expo Router (`+native-intent.tsx`). Aucune nouvelle dépendance.

**Storage**: aucun changement (SQLite inchangé). La table des adresses est un fichier JSON versionné.

**Testing**:

- `node:test` + `tsx` :
  - nouveau `tests/domain/legacy-paths.test.ts` : chaque ligne de la table, préfixes et segments `:param`, paramètres (`onglet` et valeurs, `suite`, `next` traduit, `next` externe laissé), invariants (pas de chaîne, chaque `to` est un dossier de `app/`, aucun `from` n'est servi par une page) ;
  - `locale-path.test.ts` : un saut avec `/fr`, `?lang=`, `/en` ; `POST` → réécriture ; adresses inchangées → `continue` ;
  - `app-links.test.ts` (US2) : nouvelles et anciennes formes → même écran, fichier Apple avec les deux formes, préfixes Android ;
  - mise à jour des tests qui citent les anciennes adresses (`commands-email`, `commands-sharing`, `commands-lists`, `analytics`, `dev-link`, `form-state`, `mail-config`, `subscription`, `commands-subscription`, `helpers/api-fixtures.ts`).
- jest-expo (US2) : `mobile/__tests__/links/native-intent.test.ts` (deux formes), écrans `links-confirm-email` (`next`), `login`, `guest-reserve`, `incoming-share` ; test de `app.config.ts` (préfixes = `androidPathPrefixes()`).
- Maestro (US2) : `011-us1`, `011-us2`, `011-us4` passent aux nouvelles adresses ; nouveau `018-us2-legacy-links.yaml` (anciennes formes). `018-us1` (site) va dans `exclusions.md` comme « story entière » ; `018` est ajouté à `mobile/__tests__/e2e/coverage.test.ts`.

**Target Platform**: conteneur Linux (prod macbuntu derrière Cloudflare) ; iOS et Android pour l'app (nouveau build EAS).

**Project Type**: application web + API JSON + app mobile cliente.

**Performance Goals**: une ancienne adresse coûte une seule redirection ; la traduction compare des segments sur une table de 13 lignes, dans le proxy déjà exécuté à chaque requête.

**Constraints**:

- Une seule redirection par ancienne adresse (FR-004), sans date de fin (FR-006) : la table ne perd jamais de ligne.
- `proxy.ts` exclut `/api/` et `/.well-known/` : ces chemins ne sont pas concernés.
- Les filtres Android sont fixés au build : l'ajout des nouvelles adresses demande un build de store.

**Scale/Scope**: 15 dossiers de `app/` renommés (12 premiers segments, `listes/new`, `compte/export`, `l/[readToken]/reserver`) ; ~25 fichiers de code qui écrivent une adresse ; 8 lignes de la table des liens de l'app ; 3 parcours Maestro modifiés, 1 nouveau.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | Statut |
|----------|--------------|--------|
| I. Données personnelles hors dépôt | Aucune donnée ; les exemples utilisent des jetons fictifs. | ✅ |
| II. Lecture sans compte, écriture par les membres | Les droits ne changent pas : les pages renommées gardent leurs gardes, le lien public `/l/<jeton>` est inchangé. La redirection ne révèle rien de plus que la page cible. | ✅ |
| III. Réservation sans collision | `/l/<jeton>/reserve` garde le même formulaire et la même commande ; un `POST` sur l'ancienne adresse est réécrit, pas perdu. | ✅ |
| IV. Tranches testables | US1 se livre seule (site) ; US2 suit avec le build de l'app. Chacune a son parcours dans `quickstart.md`, l'US2 son parcours Maestro. | ✅ |
| V. Simplicité | Une table et une fonction pure ; ni service, ni variable, ni bascule par date. Les anciennes versions iOS sont réglées par l'ordre de livraison plutôt que par un mécanisme (R6). | ✅ |
| Hébergement Docker | Rien à ajouter à l'image ni à `deploy/compose.prod.yml`. | ✅ |
| Workflow | La spec ne nomme pas de framework ; les choix techniques sont ici et dans `research.md`. | ✅ |

**Re-check après Phase 1** : inchangé. Le contrat n'ajoute ni route ni variable ; la table est un fichier de données.

## Project Structure

### Documentation (this feature)

```text
specs/018-english-urls/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── addresses.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/site/
├── legacy-paths.json        # NOUVEAU (US1) : anciennes adresses et paramètres
├── legacy-paths.ts          # NOUVEAU (US1) : canonicalSitePath() ; (US2) legacySitePatterns() ; formerPathsUnder()
├── app-link-routes.json     # (US2) nouvelles adresses, keepQuery `next`
├── app-links.ts             # (US2) traduction avant recherche ; Apple et Android : deux formes
└── analytics-public.ts      # nouveaux préfixes
src/i18n/locale-path.ts      # decideLocaleRoute : méthode, renommage, un seul saut
proxy.ts                     # passe la méthode ; réécriture pour POST
src/server/actions.ts        # `tab` (puis `onglet`), `next` (puis `suite`), adresses de redirection
src/server/commands/{auth,email,sharing}.ts, src/server/api/views.ts, src/auth/guard.ts
src/domain/read-link.ts      # `/l/<jeton>/reserve` (et l'ancien `reserver`)

app/
├── lists/{[id],new}/        # ← listes/
├── account/{page,export}/   # ← compte/
├── register/  login/  forgot-password/  change-password/
├── reset-password/[token]/  confirm-email/[token]/  invite/[token]/
├── legal-notice/  privacy/  about/
├── l/[readToken]/reserve/   # ← reserver/
├── sitemap.ts  robots.ts
components/site/             # liens (nav, pied de page, bandeau, cartes, accordéon, formulaires `tab`)
locales/{fr,en}/content.json # adresses citées dans le contenu

mobile/                      # US2
├── app.config.ts            # préfixes Android : nouvelles + anciennes formes
├── app/(app)/lists/[listId]/share.tsx, app/legal/{mentions,privacy}.tsx
├── app/links/confirm-email/[token].tsx   # lit `next`
├── src/links/pending.ts     # invitation dans `next`, deux formes
├── .maestro/flows/011-us{1,2,4}-*.yaml, 018-us2-legacy-links.yaml, exclusions.md, README.md
└── __tests__/…

tests/domain/                # legacy-paths.test.ts + mises à jour
scripts/capture-demo.mjs, scripts/test-reset-mail.ts
specs/004-mobile-api/contracts/openapi.yaml  # exemples d'adresses de site
README.md, AGENTS.md (exception des segments français retirée), docs/
```

**Structure Decision** : on renomme les dossiers de `app/` (`git mv`, l'historique suit) plutôt que d'ajouter des réécritures : le dossier est l'adresse. Le module de la table vit dans `src/site/`, à côté de `app-links.ts`, parce que l'app le reprend comme module pur (règle « sans règle métier propre » d'AGENTS.md).

## Ordre de livraison

1. **US1** (commit de story) : table, proxy, dossiers renommés, liens, e-mails, sitemap/robots, contenu, docs. `app-link-routes.json` n'y change pas : le fichier Apple et l'app gardent les anciennes formes. Les nouveaux liens d'e-mail ouvrent donc le site (dans le navigateur) sur un téléphone avec l'app, et les anciens ouvrent l'app comme avant. Les parcours Maestro `011-us1/us2` échouent entre les deux commits (les e-mails du serveur portent les nouvelles adresses, que l'app ne connaît pas encore) ; ils ne font pas partie de la porte de commit (lint, types, tests).
2. **US2** (commit de story) : table des liens de l'app aux nouvelles adresses, traduction des anciennes, fichier Apple et filtres Android avec les deux formes, liens de l'app vers le site, parcours Maestro, puis build de l'app. Le site qui contient l'US2 se déploie avec ou après la publication de ce build (R6).

## Complexity Tracking

Aucune violation de la constitution à justifier.
