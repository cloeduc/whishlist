# Quickstart : noms d'une liste suivie (024)

## Contrôles automatiques

```sh
npm run lint && npm run typecheck && npm test
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
DEMO_PASSWORD=… npm --prefix mobile run e2e -- --platform ios .maestro/flows/024-us1-rename-followed.yaml
```

## Préparation

Base de démo (`npm run demo:data -- tmp/demo-wishlist.json`, puis le serveur sur `WISHLIST_DATA_PATH=tmp/demo-wishlist.json`). Camille (`camille@example.test`) suit une liste d'Alex dont elle n'est pas membre (sinon : suivre `demo-list` par son lien public depuis le compte d'une troisième personne de démo).

## US1 : renommer une liste suivie

1. Site, compte abonné, « Mes listes » : la carte suivie montre le titre de la liste et, dessous, le nom d'affichage du propriétaire.
2. « Renommer » → « Noël d'Alex » → « Enregistrer » : la carte affiche « Noël d'Alex ».
3. Ouvrir la liste (page publique) : l'en-tête affiche « Noël d'Alex ».
4. Se connecter comme membre de la liste : titre d'origine, aucun nom de personne. Ouvrir le lien public en navigation privée : idem.
5. Un membre change le titre de la liste : l'abonné garde « Noël d'Alex ».
6. « Revenir aux noms de la liste » : le titre (à jour) revient.
7. Nom de 81 caractères : message « Ce nom est trop long (80 caractères au plus). », rien d'enregistré.
8. App, même compte : la carte et l'écran de la liste affichent les mêmes noms ; « Renommer » sur l'écran de la liste, même résultat ; en mode avion, « Renommer » est désactivé avec l'explication, les noms restent affichés.

## US2 : à qui est la liste

1. Sans nom choisi : la carte et l'en-tête montrent le nom d'affichage du propriétaire.
2. « À qui est cette liste » → « Mon frère » : remplace le nom du propriétaire, sur le site et dans l'app.
3. L'effacer : le nom du propriétaire revient.
4. Le propriétaire change son nom d'affichage (page Compte) : l'abonné sans nom choisi voit le nouveau nom.
5. « Télécharger mes données » de l'abonné : chaque liste suivie porte `customTitle` et `customOwnerName`.
6. Se désabonner puis se réabonner : les noms choisis ont disparu.
