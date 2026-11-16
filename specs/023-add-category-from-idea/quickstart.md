# Quickstart : nouvelle catégorie depuis le formulaire d'idée (023)

## Contrôles automatiques

```sh
npm run lint && npm run typecheck && npm test
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
DEMO_PASSWORD=… npm --prefix mobile run e2e -- --platform ios .maestro/flows/023-us1-new-category.yaml
```

## US1 : app

1. Créer une liste dans l'app avec la seule catégorie « Livres ».
2. Ajouter une idée, saisir un nom et un prix ; « Catégorie » → « + Nouvelle catégorie » → « Jeux » → « Ajouter la catégorie » : « Jeux » est choisie, le nom et le prix sont toujours là.
3. Enregistrer : l'idée est dans « Jeux » ; « Jeux » est dans l'onglet Réglages.
4. Recommencer avec « livres » : message « Cette catégorie existe déjà dans cette liste. », rien de créé.
5. Nom vide : message, rien de créé. « Annuler » : le bloc se ferme, la catégorie choisie avant reste.
6. Modifier une idée existante : même entrée, même résultat.
7. Mode avion : « + Nouvelle catégorie » est désactivée avec l'explication ; ajouter une idée dans « Livres » marche toujours hors ligne.

## US2 : site

1. Liste à une catégorie, onglet Idées, « Ajouter une idée cadeau » : la liste « Catégorie » se termine par « + Nouvelle catégorie ».
2. La choisir : le champ garde « Livres », le bloc s'ouvre ; « Jeux » → « Ajouter la catégorie » : « Jeux » est choisie, les autres champs gardent leur saisie.
3. Enregistrer : l'idée est dans « Jeux ».
4. Doublon et nom vide : messages, rien de créé. Modifier une idée : même entrée.
