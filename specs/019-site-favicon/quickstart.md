# Quickstart: Nouveau favicon du site

## Prérequis

- `npm ci`
- Base de démo : `DEMO_PASSWORD=… npm run demo:data -- tmp/demo-wishlist.json`

## Générer les icônes

```sh
node scripts/make-icons.mjs          # écrit app/favicon.ico, app/icon1.svg, app/icon2.png, app/apple-icon.png
node mobile/scripts/make-icons.mjs   # ne doit rien changer
git status mobile/assets/images      # attendu : aucun fichier modifié (FR-008)
```

## Contrôles automatiques

```sh
npm run lint && npm run typecheck && npm test   # dont tests/domain/site-icons.test.ts
```

## Parcours 1 : onglets et favoris (US1)

1. `WISHLIST_DATA_PATH=tmp/demo-wishlist.json PORT=3010 npm run dev`, puis ouvrir http://localhost:3010 dans une fenêtre privée.
2. Regarder l'onglet sur l'accueil, une liste publique de la démo, `/account` (connecté), une adresse inconnue (page introuvable) et une ancienne adresse française (redirigée). Attendu : l'icône de l'app partout, nette.
3. Passer le système en thème sombre et refaire l'étape 2 dans Chrome, Safari et Firefox. Attendu : l'icône reste lisible, sans carré blanc autour du cadre.
4. Ouvrir http://localhost:3010/favicon.ico. Attendu : la nouvelle icône (FR-006). Ouvrir http://localhost:3010/favicon.png. Attendu : page introuvable (FR-007).
5. Dans le code source de la page : une seule série de balises d'icône (`favicon.ico`, `icon1.svg`, `icon2.png`, `apple-icon.png`), plus aucune vers `favicon.png`.

## Parcours 2 : écran d'accueil d'un téléphone (US2)

Avec le site sur une adresse joignable depuis le téléphone (staging après déploiement, ou l'adresse IP locale du Mac) :

1. iPhone, Safari : Partager → Sur l'écran d'accueil. Attendu : l'icône de l'app, fond bleu clair, qui remplit le carré (SC-003).
2. Android, Chrome : menu → Ajouter à l'écran d'accueil. Attendu : l'icône sans dessin coupé.

## Après la mise en production (SC-004)

Ouvrir le site de prod dans un navigateur qui l'avait déjà visité. Attendu : la nouvelle icône au plus tard au deuxième chargement.
