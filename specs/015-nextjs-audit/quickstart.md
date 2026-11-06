# Quickstart : vérifier la feature 015 à la main

Prérequis : `npm ci`, la base de démo `npm run demo:data -- tmp/demo-wishlist.json`, puis `WISHLIST_DATA_PATH=tmp/demo-wishlist.json DEMO_PASSWORD=… npm run dev` (<http://localhost:3000>). Les comptes de démo sont en `@example.test`.

## US1 : un formulaire refusé garde la saisie

Pour chaque ligne de [contracts/form-states.md](contracts/form-states.md), provoquer le refus indiqué ci-dessous et vérifier trois choses : le message s'affiche à côté du formulaire, les champs gardés ont leur valeur, et les champs secrets sont vides. L'adresse ne doit porter ni `?e=` ni la saisie.

| # | Refus à provoquer |
|---|-------------------|
| 1 | Inscription : un nom, une adresse et un mot de passe de 5 caractères (retirer `minLength` dans l'inspecteur) |
| 2 | Connexion : une adresse de démo et un mauvais mot de passe |
| 3 | Mot de passe oublié : six envois de suite, jusqu'à « trop de tentatives » |
| 4 | Réinitialisation : un mot de passe trop court sur un lien valide (lien de dev affiché par la page 3) |
| 5 | Compte, mot de passe : deux nouveaux mots de passe différents |
| 6 | Compte, nom affiché : un nom vide (retirer `required`) |
| 7 | Compte, adresse : la même adresse que l'actuelle, ou un mauvais mot de passe actuel |
| 8 | Nouvelle liste : pas de refus possible depuis le formulaire (un titre vide prend un nom par défaut, rien d'autre n'est validé) ; vérifier seulement qu'un envoi ouvre la nouvelle liste |
| 9 | Réglages d'une liste : un nouveau titre et une couverture en `ftp://` |
| 10 | Réservation : un nom de plus de 200 caractères et un petit mot (ou la même idée réservée entre-temps depuis une autre fenêtre) |
| 11 | Liste protégée : un mauvais mot de passe de lecture |
| 12 | Partage, invitation : une adresse invalide |
| 13 | Partage, mot de passe de lecture : moins de 8 caractères |

Refaire les lignes 1, 2 et 10 avec JavaScript désactivé (DevTools, « Disable JavaScript ») : le résultat doit être le même. **Constat du 2026-11-06** : sans JavaScript, aucune page du site ne s'affiche (dev comme prod), parce que `app/loading.tsx` met tout le contenu dans un bloc de streaming que seul JavaScript insère. Voir research R1.

Vérifier aussi trois cas qui ne changent pas :

- Inscription avec une adresse de démo déjà prise : le même écran « e-mail envoyé » qu'avec une nouvelle adresse, sans erreur.
- Une ancienne adresse `/inscription?e=fields` s'ouvre sans planter.
- Chaque formulaire accepté mène à la même page qu'avant.

## US2 : page d'erreur générale

1. Ajouter temporairement `throw new Error("test")` au début de `RootLayout` (`app/layout.tsx`).
2. Ouvrir `/` : la page d'erreur du site s'affiche en français, aux couleurs du site, avec « Réessayer » et « Revenir à l'accueil ».
3. Ouvrir `/en` : la même page en anglais, sans avertissement d'hydratation lié à la langue dans la console. Sinon, noter l'écart (research R3).
4. Retirer le `throw`, puis cliquer « Réessayer » : la page normale revient.
5. Sur une page seule (p. ex. un `throw` temporaire dans `app/compte/page.tsx`), la page d'erreur existante s'affiche dans la mise en page du site, et « Réessayer » recharge les données.

## US3 : une demande par action

Dans DevTools, Réseau, avec le débit « Slow 4G », filtrer sur les requêtes vers la page (en-tête `Next-Action` ou `RSC`) :

1. Copier une idée vers une autre liste : une seule requête, puis le message de confirmation et la page à jour.
2. Réglages d'une liste, ajouter une catégorie au nom déjà pris : la puce apparaît, puis disparaît avec le message « nom déjà utilisé ». Une seule requête.
3. Renommer et supprimer un « qui » : une requête chacun, la page est à jour.
4. Compte, clés d'API : révoquer une clé (l'adresse prend `?k=revoked`), puis en créer une. La clé s'affiche une fois, l'avis disparaît de l'adresse, et une seule requête part pour la création.

## US4 : garde-fous et démarrage

1. **server-only** : ajouter `import "@/src/store/db";` dans un composant client (p. ex. `components/site/label-chips.tsx`), lancer `npm run build`. La construction échoue, avec un message qui cite `server-only` et le module. Retirer l'import.
2. **Rendu à la demande** : `npm run build` ; dans le tableau des routes, chaque page et chaque route d'API reste `ƒ` comme avant la feature (comparer à la sortie de `main`). `grep -rl force-dynamic app` ne liste que `robots.ts`, `sitemap.ts`, les routes `.well-known` et celles que le build a obligé à garder, chacune avec un commentaire.
3. **Démarrage** : `npm run build && PORT=3020 npm start`. Le site répond sur <http://localhost:3020> avec les données de `data/wishlist.db` du dépôt. Puis `docker build -t whishlist:local . && docker run --rm -p 3021:3000 -e SESSION_SECRET=x whishlist:local` : le site répond sur <http://localhost:3021> et le contrôle de santé passe (`docker ps` affiche `healthy`).
4. **`robots.txt` et `.well-known`** : relancer le conteneur avec `-e APP_ORIGIN=https://exemple.test -e APPLE_TEAM_ID=ABCDE12345`. `/robots.txt` cite `https://exemple.test/sitemap.xml`, et `/.well-known/apple-app-site-association` contient `ABCDE12345`. Leurs déclarations, déjà commentées, restent.

## Contrôles automatiques

`npm run lint`, `npm run typecheck`, `npm test` et `npm run build` passent. `npm --prefix mobile test` passe aussi (modules partagés inchangés).
