# Research: Nouveau favicon du site

## État actuel

- `app/layout.tsx` déclare dans ses métadonnées `icons` : `/favicon.png` comme icône, icône Apple et raccourci.
- `public/favicon.png` et `app/icon.png` sont deux images JPEG de 1024 × 1024 nommées `.png`, sur fond blanc opaque. `app/icon.png` est aussi annoncée par Next (convention de fichier) : la page déclare donc deux icônes, celle des métadonnées et celle du fichier.
- `/favicon.ico` n'existe pas. Le proxy (`proxy.ts`) l'exclut déjà de son `matcher`, comme tous les `.png` et `.svg`.
- L'icône de l'app est produite par `mobile/scripts/make-icons.mjs` : un SVG (cadre blanc à ombre noire, cadeau de `components/site/gift-mark.tsx`, couleurs de `src/domain/theme.ts`) rendu en PNG par `sharp`. `icon.png` (iOS) pose ce cadre sur le fond `#e8f0ff`.

## Décisions

### 1. Source du dessin : la géométrie SVG de l'app, partagée

- **Decision** : sortir `gift()`, `frame` et `svg()` de `mobile/scripts/make-icons.mjs` dans un module `scripts/gift-icon.mjs`, importé par le script de l'app et par un nouveau script du site, `scripts/make-icons.mjs`.
- **Rationale** : spec Q1 (même icône partout). Un seul dessin évite que le site et l'app divergent encore. Partir du vectoriel donne des petites tailles nettes, au lieu de réduire un JPEG.
- **Alternatives considered** : réduire `mobile/assets/images/icon.png`, mais le fond bleu clair occupe le carré et le cadeau devient minuscule à 16 px. Copier les fonctions dans le script du site dupliquerait le dessin.

### 2. Fichiers servis : conventions de fichiers de Next, sans métadonnées `icons`

D'après `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md` (Next 16.4) :

| Fichier | Contenu | Rôle |
|---|---|---|
| `app/favicon.ico` | 16, 32 et 48 px, cadre sur fond transparent | adresse classique `/favicon.ico` (FR-006), navigateurs et outils qui ne lisent pas la page |
| `app/icon1.svg` | cadre vectoriel, fond transparent | onglet des navigateurs récents, net à toute taille (FR-002, FR-003) |
| `app/icon2.png` | 192 px, cadre sur fond transparent | Chrome Android et les navigateurs sans SVG : la plus grande icône sert au raccourci |
| `app/apple-icon.png` | 180 px, opaque, fond `#e8f0ff`, comme l'icône iOS de l'app | écran d'accueil iPhone (FR-004 : iOS remplit le carré ; la transparence y devient noire) |

- **Decision** : supprimer `public/favicon.png`, `app/icon.png` et le bloc `icons` de `generateMetadata` (FR-007). Next annonce alors les quatre fichiers sur toutes les pages, en ajoutant à `icon` et `apple-icon` un paramètre de version qui change avec le contenu : les navigateurs rechargent la nouvelle icône (SC-004).
- **Rationale** : une seule déclaration au lieu de deux qui se contredisent ; tailles exactes (`sizes`) calculées par Next.
- **Alternatives considered** : `app/icon.tsx` avec `ImageResponse`, qui dessine à chaque requête ce qui ne change jamais. Un manifeste d'application web est hors périmètre (spec, Assumptions).

### 3. Écriture du `.ico` sans outil système

- **Decision** : le script assemble le `.ico` lui-même : en-tête ICONDIR, puis une entrée par taille contenant un PNG (format admis depuis Windows Vista et par tous les navigateurs). Une quinzaine de lignes.
- **Rationale** : `sharp` n'écrit pas d'ICO ; ImageMagick existe sur le Mac de dev mais pas forcément ailleurs.
- **Alternatives considered** : une dépendance `png-to-ico`, refusée pour quinze lignes.

### 4. Lisibilité aux petites tailles

- **Decision** : à 16 et 32 px, l'icône d'onglet garde le cadre et l'ombre (même icône que l'app, Q1), en remplissant presque tout le carré (échelle ~0,95, contre 0,78 pour l'icône iOS qui a son fond). Le cadre blanc cerné de noir reste visible sur un onglet clair comme sur un onglet sombre.
- **Alternatives considered** : le cadeau seul, sans cadre, mais c'est une autre icône que l'app, ce que Q1 écarte.

### 5. Vérification

- **Decision** : un test de domaine `tests/domain/site-icons.test.ts` lit les fichiers : signatures PNG/ICO, tailles annoncées dans les en-têtes, coins transparents pour `icon2.png`, coin opaque pour `apple-icon.png`, absence de `public/favicon.png` et `app/icon.png`, absence de bloc `icons` dans `app/layout.tsx`. Le rendu dans les onglets et sur téléphone se vérifie à la main (quickstart).
- **Rationale** : principe IV, et les règles FR-002 à FR-007 portent sur des fichiers.
- L'app ne doit pas changer (FR-008) : relancer `node mobile/scripts/make-icons.mjs` après le partage du module ne doit rien modifier dans `mobile/assets/images/` (`git status` propre).
