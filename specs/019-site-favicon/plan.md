# Implementation Plan: Nouveau favicon du site

**Branch**: `staging` (dossier de feature `019-site-favicon`) | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-site-favicon/spec.md` (ticket Plane WISH-14)

## Summary

Le site reprend l'icône de l'app mobile (Q1). Le dessin SVG de `mobile/scripts/make-icons.mjs` passe dans un module partagé, `scripts/gift-icon.mjs`. Un nouveau script, `scripts/make-icons.mjs`, en tire quatre fichiers que Next annonce de lui-même : `app/favicon.ico`, `app/icon1.svg`, `app/icon2.png` et `app/apple-icon.png`. Les anciennes images JPEG (`public/favicon.png`, `app/icon.png`) et le bloc `icons` de `app/layout.tsx` disparaissent. Détails : [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript / Node.js 22 (image), scripts en JS module (`.mjs`)

**Primary Dependencies**: Next.js 16.4 (conventions de fichiers `favicon`, `icon`, `apple-icon`), `sharp` (déjà en dépendance du site, utilisé par le script de l'app)

**Storage**: N/A (fichiers statiques versionnés dans `app/`)

**Testing**: `node:test` + `tsx`, nouveau `tests/domain/site-icons.test.ts` ; parcours manuel du `quickstart.md`

**Target Platform**: navigateurs (Chrome, Safari, Firefox, clair et sombre), écran d'accueil iOS et Android

**Project Type**: application web (Next.js App Router) avec app mobile Expo séparée, inchangée

**Performance Goals**: N/A. Les icônes sont des fichiers statiques de quelques Ko, versionnés par Next.

**Constraints**: le dessin de l'app ne change pas (FR-008) ; pas d'outil système requis pour générer les icônes (ImageMagick absent de la CI)

**Scale/Scope**: 1 module partagé, 1 script, 4 fichiers générés, 3 fichiers supprimés ou modifiés, 1 test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Verdict |
|---|---|
| I. Données personnelles hors dépôt | OK : aucune donnée, seulement des images dessinées. |
| II. Lecture sans compte, écriture par les membres | Non concerné. |
| III. Réservation sans collision | Non concerné. |
| IV. Tranches testables | OK : US1 (onglets) livrable seule ; US2 (écran d'accueil) vient des mêmes fichiers mais se vérifie séparément. Parcours réels dans `quickstart.md`. |
| V. Simplicité | OK : pas de manifeste, pas de génération à la volée, pas de nouvelle dépendance. |
| Hébergement Docker | OK : fichiers dans `app/`, embarqués par le build `standalone` ; pas de variable d'environnement. |

Re-check après la phase 1 : inchangé.

## Project Structure

### Documentation (this feature)

```text
specs/019-site-favicon/
├── plan.md
├── research.md
├── data-model.md        # aucune donnée
├── quickstart.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

Pas de `contracts/` : ni l'API (`specs/004-mobile-api/contracts/openapi.yaml`) ni aucune interface ne changent.

### Source Code (repository root)

```text
scripts/
├── gift-icon.mjs          # nouveau : gift(), frame, svg() sortis du script de l'app
└── make-icons.mjs         # nouveau : écrit les icônes du site (.ico assemblé à la main)

mobile/scripts/
└── make-icons.mjs         # importe ../../scripts/gift-icon.mjs, même sortie qu'avant

app/
├── layout.tsx             # bloc `icons` retiré de generateMetadata
├── favicon.ico            # nouveau (16/32/48)
├── icon1.svg              # nouveau
├── icon2.png              # nouveau (192, transparent)
├── apple-icon.png         # nouveau (180, fond #e8f0ff)
└── icon.png               # supprimé

public/
└── favicon.png            # supprimé

tests/domain/
└── site-icons.test.ts     # nouveau

AGENTS.md                  # commande `node scripts/make-icons.mjs` ajoutée à « Commandes »
```

**Structure Decision**: les icônes sont des fichiers versionnés, générés par un script lancé à la main quand le dessin change, comme ceux de l'app. Le module de dessin vit dans `scripts/` parce que les deux scripts (site et app) l'importent, et que l'app lit déjà des modules du site.

## Complexity Tracking

Aucune violation.
