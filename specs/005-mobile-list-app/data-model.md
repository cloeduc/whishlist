# Data Model: App mobile pour gérer ses listes

Côté serveur, aucune donnée nouvelle : la forme de `wishlist.json` ne change pas. L'extension du contrat ([contracts/api-v1-additions.md](contracts/api-v1-additions.md)) permet seulement au client de choisir l'identifiant de ce qu'il crée.

Côté téléphone, l'app garde trois choses : la connexion, une copie des réponses du serveur, et les changements en attente. Voir [research.md R3 et R4](research.md).

## Connexion (stockage sécurisé)

| Clé | Contenu |
|-----|---------|
| `session.token` | jeton bearer rendu par `/auth/login`, `/auth/register` ou `/me/password` |
| `session.expiresAt` | date d'expiration (ISO) |
| `session.userId` | id du compte, pour lier la copie locale à ce compte |

Effacée à la déconnexion, sur `401`, ou à l'expiration.

## Base locale (SQLite)

### `meta`

| Colonne | Type | Règle |
|---------|------|-------|
| `key` | text, clé | `userId` |
| `value` | text | |

Si le compte qui se connecte n'est pas celui de `meta.userId`, `snapshot` et `outbox` sont vidés (on ne montre jamais les listes d'un autre compte).

### `snapshot`

La dernière réponse du serveur, telle quelle.

| Colonne | Type | Règle |
|---------|------|-------|
| `key` | text, clé | `lists` (réponse de `GET /lists`) ou `list:<listId>` (réponse de `GET /lists/{listId}`, vue `MemberList`) |
| `body` | text (JSON) | corps de la réponse, au format du contrat |
| `fetchedAt` | text (ISO) | date de la réponse ; affichée hors ligne (« dernière mise à jour à … ») |

Une liste supprimée côté serveur (`404`) est retirée de `snapshot`.

### `outbox`

Les changements faits dans l'app et pas encore acceptés par le serveur, dans l'ordre.

| Colonne | Type | Règle |
|---------|------|-------|
| `seq` | integer, clé auto-incrémentée | ordre d'envoi |
| `kind` | text | `createList`, `createItem`, `updateItem`, `patchItem`, `deleteItem` |
| `listId` | text | liste concernée (créée hors ligne ou non) |
| `targetId` | text | id de la liste ou de l'idée concernée, connu à l'avance (R5) |
| `payload` | text (JSON) | corps de la requête, au format du contrat |
| `state` | text | `pending`, `sending`, `rejected` |
| `errorCode` | text, null | code d'erreur du serveur si `rejected` |
| `attempts` | integer | nombre d'envois tentés |
| `createdAt` | text (ISO) | |

**Cycle de vie** :

```text
pending ──envoi──▶ sending ──succès──▶ (supprimé)
   ▲                  │
   │                  ├─ réseau / 5xx ──▶ pending (attente croissante, max 1 min)
   │                  ├─ 401 ──▶ pending (connexion demandée)
   │                  └─ 4xx métier ──▶ rejected (errorCode)
   │                                         │
   └──────── corriger (payload modifié) ◀────┤
                                abandonner ──▶ (supprimé)
```

Un `sending` trouvé au démarrage (app tuée pendant l'envoi) repasse `pending` : le renvoi est sans risque (R5).

**Dépendances** : un changement dépend des changements plus anciens qui ont le même `targetId`, ou qui créent sa liste (`createList` avec `targetId = listId`). Si l'un d'eux est `rejected`, ceux qui en dépendent passent `rejected` avec le même code (FR-029a).

**Compaction** (avant l'envoi, sur les seuls `pending`) :
- plusieurs `updateItem` / `patchItem` de la même idée → le dernier garde l'état final ;
- `createItem` puis `deleteItem` de la même idée → les deux disparaissent ;
- `createItem` puis `updateItem` de la même idée → un seul `createItem` avec les valeurs finales.

## Vue optimiste

Ce qu'affiche un écran = `snapshot` + application, dans l'ordre, des changements `pending`, `sending` et `rejected` de `outbox` :

| `kind` | Effet affiché |
|--------|---------------|
| `createList` | une carte de liste « en attente », avec sa catégorie et son « qui » |
| `createItem` | l'idée dans sa catégorie, badge « En attente » |
| `updateItem` / `patchItem` | l'idée avec les nouvelles valeurs, badge « En attente » |
| `deleteItem` | l'idée masquée |
| (`rejected`) | l'idée ou la liste avec une alerte rouge, la raison traduite, et les actions « Corriger » / « Abandonner » |

Une liste dont le `createList` n'est pas encore accepté n'a pas de lien public : le partage est indisponible avec une explication (US5-9).

## Validations côté app

L'app ne réécrit pas les règles du serveur (FR-041). Elle vérifie seulement ce qui permet de construire une requête valide : champs obligatoires remplis (nom, catégorie, « qui », titre), prix lisible par la même règle que le site (`parsePrice`, recopiée et testée contre les mêmes cas). Toute autre erreur vient du serveur, à l'envoi.

## Vues lues dans l'API

Formes du contrat de la 004 ([openapi.yaml](../004-mobile-api/contracts/openapi.yaml)) : `Session`, `Me`, `ListSummary`, `MemberList` (avec `items`, `reservations`, `members`, `readUrl`, `hasReadPassword`, `theme`), `MemberItem`, `Label`, `Category`, et `capabilities` (`enrich` pour afficher ou non le préremplissage, FR-015).
