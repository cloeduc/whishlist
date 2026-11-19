# Contrat d'API : changements de la 020

À reporter dans `specs/004-mobile-api/contracts/openapi.yaml` avant d'écrire les routes (règle du guide des agents), puis `npm --prefix mobile run api:types`. `tests/domain/api-contract.test.ts` vérifie que chaque opération a sa route.

## Schéma `MemberList` (modifié)

```yaml
MemberList:
  required: [..., surpriseMode]          # ajouté à la liste existante
  properties:
    surpriseMode:
      type: boolean
      description: >
        Mode surprise du compte connecté pour cette liste. Quand il vaut true,
        `reservations` est vide et `items[].archived` ne dit que si un membre a
        archivé l'idée ; une idée réservée y figure comme une idée libre.
        Quand il vaut false, `items[].archived` est vrai aussi pour une idée réservée.
    items:
      description: Archivées comprises. Voir `surpriseMode` pour le sens de `archived`.
    reservations:
      description: Vide quand `surpriseMode` vaut true ; `GET /lists/{listId}/reservations` les donne sur demande.
```

## `PUT /lists/{listId}/surprise-mode` (nouveau)

- Tag : `lists`. Résumé : « Activer ou désactiver le mode surprise du compte connecté ».
- Corps : `{ enabled: boolean }` (requis).
- `200` : `MemberList` relue (avec le nouveau `surpriseMode`).
- `400` : corps invalide. `401` : non connecté. `404` : liste inconnue ou compte non membre (comme les autres routes membres).

## `GET /lists/{listId}/reservations` (nouveau)

- Tag : `lists`. Résumé : « Voir les réservations de la liste (révélation volontaire en mode surprise) ».
- `200` : `{ reservations: MemberReservation[] }`, quel que soit le mode surprise.
- `401`, `404` : comme ci-dessus.
- Le chemin `/lists/{listId}/reservations/{reservationId}` (DELETE) existe déjà et ne change pas.

## Erreur nouvelle

| Code | Où | Sens |
|------|----|------|
| `itemLockedSurprise` | `DELETE /lists/{listId}/items/{itemId}`, `POST /lists/{listId}/items/{itemId}/move` (400, le même statut que `itemHasReservation` et `itemReservedCannotMove` aujourd'hui, absents de `src/server/api/errors.ts`) | L'idée est réservée et le compte est en mode surprise ; le message ne le dit pas. |

## Compatibilité

Hors mode surprise, les réponses existantes ne changent pas de valeur (`archived` compris, research R7). Une app sans `surpriseMode` ne spoile pas : elle reçoit une liste sans réservation.
