# Extension compatible du contrat API v1

La source de vérité reste [specs/004-mobile-api/contracts/openapi.yaml](../../004-mobile-api/contracts/openapi.yaml). Cette feature y ajoute des champs **optionnels** : un client qui ne les envoie pas a exactement le comportement actuel. La version du contrat passe de `1.0.0` à `1.1.0` (`GET /capabilities` → `apiVersion`).

Pourquoi : un changement fait hors ligne peut être envoyé deux fois si la réponse se perd (spec FR-029). Le client choisit donc l'identifiant de ce qu'il crée, et le serveur reconnaît un renvoi. Voir [research.md R5](../research.md).

## Format d'un identifiant client

`ClientId` : chaîne de **16 à 32 caractères** `[A-Za-z0-9_-]` (le format de `newId()` du serveur est 16 caractères base64url). Un identifiant hors format → `400 idInvalid`.

## `POST /lists`

Corps, champs ajoutés (optionnels) :

| Champ | Type | Effet |
|-------|------|-------|
| `id` | ClientId | identifiant de la liste créée |
| `categoryId` | ClientId | identifiant de la première catégorie |
| `personId` | ClientId | identifiant du premier « qui » |

Réponses :

- `201 MemberList` : liste créée (comme aujourd'hui).
- `200 MemberList` : **renvoi** — une liste avec cet `id` existe déjà et le compte connecté en est membre ; rien n'est créé, la vue membre actuelle est rendue.
- `409 idConflict` : l'`id` (ou `categoryId`, `personId`) est déjà utilisé par un objet auquel le compte n'a pas accès, ou d'un autre type. Le message ne dit pas à qui il appartient.

## `POST /lists/{listId}/items`

Corps, champ ajouté (optionnel) :

| Champ | Type | Effet |
|-------|------|-------|
| `id` | ClientId | identifiant de l'idée créée |

Réponses :

- `201 MemberItem` : idée créée.
- `200 MemberItem` : **renvoi** — une idée avec cet `id` existe déjà dans cette liste ; rien n'est créé ni modifié, l'idée actuelle est rendue.
- `409 idConflict` : l'`id` existe dans une autre liste.
- Les autres refus sont inchangés (`404 listMissing` pour un non-membre, validations du domaine).

## `GET /lists` : carte de « Mes listes »

`ListSummary` gagne trois champs de réponse, ajoutés pour que la carte de l'app reprenne celle du site (couverture, titre, sous-titre ; US6) :

| Champ | Type | Contenu |
|-------|------|---------|
| `subtitle` | string \| null | sous-titre de la liste |
| `coverImageUrl` | string \| null | image de couverture ; sinon le cadeau aux couleurs du thème |
| `theme` | Theme | couleurs de la liste |

Un client qui ne les lit pas n'est pas concerné.

## Opérations déjà sûres en cas de renvoi

| Opération | Pourquoi un renvoi est sans effet |
|-----------|-----------------------------------|
| `PUT /lists/{listId}/items/{itemId}` | remplace tous les champs par les mêmes valeurs |
| `PATCH /lists/{listId}/items/{itemId}` | pose `archived` / `typeId` aux mêmes valeurs |
| `DELETE /lists/{listId}/items/{itemId}` | le second appel répond `404 itemMissing` ; le client le traite comme un succès |

## Nouveaux codes d'erreur

Ajoutés à `locales/{fr,en}/errors.json` et à la table des statuts (`src/server/api/errors.ts`) :

| Code | Statut | FR | EN |
|------|--------|----|----|
| `idInvalid` | 400 | « Identifiant invalide. » | « Invalid identifier. » |
| `idConflict` | 409 | « Cet identifiant est déjà utilisé. » | « This identifier is already in use. » |

## Règles côté serveur

- La reconnaissance d'un renvoi se fait **dans le même `updateDocument`** que la création, pour qu'une création et son renvoi simultanés ne donnent qu'un objet.
- Elle vit dans les commandes (`createList`, `saveItem`) et s'appuie sur les fonctions du domaine qui acceptent déjà `id` (`createWishlist`, `createItem`, `addType`, `addPerson`). Aucune règle métier existante ne change.
- Un renvoi ne contourne aucun droit : il exige un compte actif membre de la liste, comme une création.
