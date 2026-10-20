# Quickstart: Wishlists personnelles et communes

Parcours de `spec.md`. Champs dans [contracts/ui.md](contracts/ui.md). Modèle dans [data-model.md](data-model.md).

Déploiement Docker / variables / licence : voir le [README racine](../../README.md). Évolutions i18n / réglages / enrichissement : [003](../003-i18n-admin-enrich/spec.md).

## Prérequis

- Node.js 20 ou plus
- `.env` avec `SESSION_SECRET` (voir `.env.example`). Ne pas committer `.env`.

```bash
npm ci
npm test
npm run dev
```

Prod Docker : `deploy/compose.prod.yml` (voir README).

Le premier lancement crée `data/wishlist.json` vide. Effacer ce fichier remet à zéro comptes et listes. `data/seed.json` est un **fixture de test** uniquement (pas d’import produit).

## 1. Lire sans compte

- `/` sans session ne montre aucune wishlist, seulement inscription et connexion.
- Créer une liste, y ajouter une idée, ouvrir son lien en navigation privée : l’idée est visible sans compte.
- Largeur ~390 px : chaque idée se lit.

## 2. Compte et liste

- S’inscrire. « Mes wishlists » est vide.
- Le même e-mail une seconde fois est refusé.
- Créer « Anniversaire ». Son lien, en navigation privée, montre une liste vide puis les idées ajoutées.
- Une seconde liste ne mélange pas ses idées avec la première.

## 3. Liste commune

- Sur une liste, copier le lien d’invitation (pas le lien de lecture).
- Autre navigateur : s’inscrire avec un autre e-mail, ouvrir l’invitation, devenir membre.
- Ce second compte ajoute une idée. Le premier la voit.
- Le lien de lecture, sans session, montre l’idée et ne propose pas l’édition.
- Régénérer l’invitation : l’ancien lien ne recrute plus.
- Retirer le second membre : il ne peut plus éditer, le lien de lecture marche encore.

## 4. Filtres et réservation

- Ajouter catégories et « qui », vérifier les boutons publics.
- Réserver une idée (prénom + mot optionnels). Elle disparaît de la liste publique ; un second envoi est refusé.
- Un membre annule la réservation : l’idée redevient publique.

## 5. Automatisé

`npm test` couvre : seed de test préfixé par liste, e-mail unique, invitation, filtres, réservation unique, refus de suppression d’une idée réservée.
