# Quickstart: Aide sur la page « Accès refusé » d'une liste

## Préparer

```sh
npm run demo:data -- tmp/demo-wishlist.json
WISHLIST_DATA_PATH=tmp/demo-wishlist.json DEMO_PASSWORD=… npm run dev -- -p 3010
```

Deux comptes de démo : A (propriétaire d'une liste L) et B (aucun lien avec L). Noter l'id de L (adresse de sa page de gestion) et son lien de la liste (onglet « Partage »).

## US1 — Site : page d'aide

1. Connecté avec B, ouvrir `http://localhost:3010/lists/<id de L>`.
   Attendu : « Cette adresse sert à gérer la liste », l'explication, le lien à demander (onglet « Partage »), le bouton « Mes listes ». Ni le titre de L ni le nom de A.
2. Se déconnecter, ouvrir `http://localhost:3010/connexion?next=/listes/<id de L>`, se connecter avec B.
   Attendu : la même page d'aide.
3. Passer en anglais (`/en/lists/<id de L>`) : mêmes informations.
4. Avec A : `/lists/<id de L>` ouvre toujours la page de gestion.

## US2 — App : adresse de gestion

Simulateur iOS de référence, app pointée sur `http://localhost:3010` (`EXPO_PUBLIC_API_URL`).

1. App connectée avec A : `xcrun simctl openurl booted "ohyoushouldnt://lists/<id de L>"` → la liste L s'ouvre ; `…lists/<id de L>?tab=sharing` → l'écran « Partager ».
2. App connectée avec B : `…lists/<id de L>` → écran d'aide, bouton « Mes listes » → accueil.
3. Forme ancienne : `…listes/<id de L>` avec B → écran d'aide.
4. App déconnectée : `…lists/<id de L>` → connexion avec B → écran d'aide.
5. `…lists/inconnu` → écran d'aide.
6. Mode avion, connectée avec A : la liste s'ouvre depuis la copie locale.

Suite e2e : `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/026-us2-management-link.yaml`.

## US3 — Abonné

1. Avec B, ouvrir le lien de la liste de L et la suivre.
2. Site : `/lists/<id de L>` → page d'aide avec « Voir la liste », qui ouvre `/l/<readToken>`.
3. App : `…lists/<id de L>` → écran d'aide avec « Voir la liste », qui ouvre la liste suivie.
4. A met un mot de passe de lecture sur L : « Voir la liste » demande le mot de passe (site).

## US4 — Propriétaire

1. Avec A, sur chaque onglet de L : bouton « Partager » visible dans l'en-tête (sauf sur l'onglet Partage), qui ouvre l'onglet Partage.
2. Onglet Partage : la note sur l'adresse de la page est lisible sous la description.

## Contrôles

```sh
npm run lint && npm run typecheck && npm test
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
```
