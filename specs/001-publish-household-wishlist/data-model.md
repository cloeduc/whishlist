# Data model: Wishlists personnelles et communes

Source de vérité runtime : `data/wishlist.json`. Il démarre sans compte et sans liste.

`data/seed.json` est un fixture de test générique (types, personnes, vues, idées). Il n'est plus importable depuis le produit ; seuls les tests l'utilisent via `createWishlist(..., { importTemplate: true, seed })`.

```json
{
  "users": [],
  "wishlists": [],
  "memberships": [],
  "types": [],
  "people": [],
  "views": [],
  "items": [],
  "reservations": []
}
```

Toute entité sauf `users` porte `wishlistId`.

## User

| Champ | Règle |
|-------|--------|
| id | Stable, unique |
| email | Unique, comparé sans tenir compte de la casse, trimé |
| passwordHash | Sel + hash scrypt. Jamais le mot de passe en clair |
| displayName | Non vide après trim |
| createdAt | ISO-8601 |

Inscription simultanée du même e-mail : une seule ligne.

Pas de suppression de compte dans cette version.

## Wishlist

| Champ | Règle |
|-------|--------|
| id | Stable, unique |
| title | Non vide |
| readToken | Non devinable, unique. C'est le lien de lecture |
| inviteToken | Non devinable, distinct de `readToken`. Régénérer remplace la valeur |
| fromTemplate | `true` si import du modèle |
| createdAt | ISO-8601 |

Supprimer la wishlist supprime ses memberships, types, people, views, items et reservations.

## Membership

| Champ | Règle |
|-------|--------|
| wishlistId | Doit exister |
| userId | Doit exister. Unique par couple (wishlist, user) |
| role | `owner` ou `member`. Exactement un `owner` par liste |
| joinedAt | ISO-8601. Sert à choisir le prochain owner |

Tous les rôles éditent les idées, types, Qui, réservations.

Seul l'`owner` retire un membre, régénère `inviteToken`, ou supprime la liste.

L'owner qui quitte alors qu'il reste des membres : le `member` au `joinedAt` le plus ancien devient `owner`, puis l'ancienne ligne owner est supprimée. S'il est seul, quitter est refusé : il supprime la liste.

Accepter une invitation : session obligatoire, puis insertion `role=member`. Déjà membre : pas de doublon.

## Type, Person, View, Item, Reservation

Mêmes champs que précédemment, plus `wishlistId`.

Ids du modèle, une fois importés : préfixe de la wishlist + id stable (`{wishlistId}:item-001`, `{wishlistId}:livres`, `{wishlistId}:cloe`). Deux imports ne collisionnent pas.

Vues épinglées : copiées seulement si `fromTemplate`. Sinon une vue `kind=types` ou `kind=person` est créée en même temps que le type ou le Qui. Sur un modèle importé, `couple` ne reçoit pas de vue. Un Qui ajouté ensuite sur ce modèle en reçoit une, y compris un second « Couple » qui serait une autre ligne — le seed `couple` reste sans vue.

La vue épinglée `maison` a le libellé « Maison », `kind=types` et `typeIds: ["divers"]`. Il n'existe pas de type `maison`.

Item : pas de suppression s'il a une réservation dans cette liste.

Réservation : au plus une par `itemId`. Annuler supprime la ligne. La seconde confirmation simultanée est refusée.

Prix : `priceCents` entier ≥ 0 ou `null`. Affichage `€` + deux décimales avec point.

Priorité : texte ou `null`, hors tri. Tri des idées : `sortOrder`, puis id.

## Écriture

Lock, lire, modifier, fichier temporaire dans `data/`, rename par-dessus `wishlist.json`.
