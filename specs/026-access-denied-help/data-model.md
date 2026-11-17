# Data Model: Aide sur la page « Accès refusé » d'une liste

Aucune table, colonne ni migration. Aucun champ d'API nouveau.

## Données lues

| Où | Donnée | Usage |
|----|--------|-------|
| Site | `memberships (wishlist_id, user_id)` | membre → page de gestion (inchangé) |
| Site | `subscriptions (wishlist_id, user_id)` + `wishlists.read_token` | abonné → bouton « Voir la liste » (`/l/<readToken>`) ; lu seulement pour un abonné (FR-003) |
| App | copie locale de `GET /lists` : `lists[].id` | membre → écran de la liste |
| App | copie locale de `GET /lists` : `subscriptions[].id`, `subscriptions[].readToken` | abonné → `/guest/<readToken>` |

## Décision (pure)

```text
relation(compte, liste) =
  liste inexistante               → site : page introuvable (inchangé) ; app : aide simple
  membre                          → page / écran de gestion (onglet demandé si l'app l'a)
  abonné, non membre              → aide + « Voir la liste »
  ni l'un ni l'autre              → aide simple
```

Site : `viewerRelation` (`src/domain/subscription.ts`). App : `linkedListTarget` (`mobile/src/links/linked-list.ts`, research R3), qui traite aussi `listId = "new"` (R5).

## Correspondance des onglets (app)

| `tab` (site, après `parseListTab`) | Écran de l'app |
|---|---|
| `ideas` (ou absent, inconnu) | `/lists/<id>` |
| `archive` | `/lists/<id>/archives` |
| `reservations` | `/lists/<id>/reservations` |
| `sharing` | `/lists/<id>/share` |
| `settings` | `/lists/<id>/settings` |
