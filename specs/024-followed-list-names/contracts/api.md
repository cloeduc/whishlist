# Contrat d'API : changements de la 024

À reporter dans `specs/004-mobile-api/contracts/openapi.yaml` avant d'écrire la route (guide des agents), puis `npm --prefix mobile run api:types`. `tests/domain/api-contract.test.ts` vérifie que chaque opération a sa route.

Historique de version : `1.10.0 : noms d'une liste suivie (feature 024). customTitle, customOwnerName et ownerName dans SubscribedListSummary ; follow dans PublicList ; PUT /subscriptions/{readToken}.`

## Schéma `SubscribedListSummary` (modifié)

```yaml
SubscribedListSummary:
  required: [..., customTitle, customOwnerName, ownerName]   # ajoutés à la liste existante
  properties:
    title: { type: string, description: Titre choisi par les membres (inchangé). }
    customTitle: { type: [string, "null"], description: Nom donné à la liste par le compte connecté. Depuis 1.10.0. }
    customOwnerName: { type: [string, "null"], description: Nom donné à la personne par le compte connecté. Depuis 1.10.0. }
    ownerName: { type: [string, "null"], description: Nom d'affichage du propriétaire actuel de la liste. Depuis 1.10.0. }
```

## Schéma `FollowNames` (nouveau) et `PublicList` (modifié)

```yaml
FollowNames:
  type: object
  required: [customTitle, customOwnerName, ownerName]
  properties:
    customTitle: { type: [string, "null"] }
    customOwnerName: { type: [string, "null"] }
    ownerName: { type: [string, "null"] }

PublicList:
  required: [..., follow]
  properties:
    follow:
      description: >
        Depuis 1.10.0. Noms de la liste pour le compte connecté s'il la suit ; null sinon
        (visiteur, membre, non connecté). Le nom du propriétaire n'est jamais donné à qui ne suit pas.
      oneOf:
        - $ref: "#/components/schemas/FollowNames"
        - type: "null"
```

## `PUT /subscriptions/{readToken}` (nouveau)

- Tag : `lists`. Résumé : « Nommer une liste suivie et la personne à qui elle est ».
- Corps (requis) : `{ customTitle: string | null, customOwnerName: string | null }`. Une chaîne vide ou faite d'espaces vaut `null`.
- `200` : `SubscribedListSummary` à jour.
- `400` : `followedNameTooLong` (plus de 80 caractères), ou corps invalide.
- `401` : non connecté. `403` : compte à mot de passe à changer, clé d'API. `404` : `listMissing` (liste inconnue, ou compte qui ne la suit pas).
- Limite de débit : celle des actions d'abonnement.

## Erreur (nouvelle)

`followedNameTooLong` : « Ce nom est trop long (80 caractères au plus). » / « This name is too long (80 characters at most). »
