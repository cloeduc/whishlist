# Data Model: API pour une app mobile

Les entités métier ne changent pas : User, Wishlist, Membership, WishType, Person, View, Item, Reservation, PasswordReset (`src/domain/types.ts`). La feature ajoute une collection stockée et deux preuves sans état.

## ApiSession (stockée)

Nouvelle collection `apiSessions: ApiSession[]` dans `Database`. Voir [research.md R3](research.md).

| Champ | Type | Règle |
|-------|------|-------|
| `id` | string | `newId()` |
| `userId` | string | compte existant |
| `tokenHash` | string | SHA-256 base64url du jeton ; le jeton en clair n'est jamais écrit |
| `sessionVersion` | number | `user.sessionVersion` au moment de l'émission |
| `createdAt` | string (ISO) | |
| `expiresAt` | string (ISO) | `createdAt` + `SESSION_TTL_SEC` (30 jours) |

**Validation** : un jeton est accepté si son empreinte correspond à une entrée, `expiresAt` est dans le futur, l'utilisateur existe et `user.sessionVersion === sessionVersion`. Toute autre situation donne `401 unauthorized`, sans détail.

**Cycle de vie** :

```text
login / register / reset → émise (le jeton en clair n'est rendu qu'une fois)
logout                    → supprimée
changement de MDP         → toutes périmées (sessionVersion +1), une nouvelle émise pour ce client
expirée ou périmée        → purgée à la prochaine connexion
suppression d'un compte   → (pas de suppression de compte aujourd'hui)
```

**Compatibilité** : `normalizeDocument` ajoute `apiSessions = []` quand la clé manque. Un `wishlist.json` existant se lit sans migration ; `emptyDatabase()` ajoute la clé. Un test le couvre.

**Volume** : une entrée par appareil connecté ; les purges à la connexion gardent la collection petite.

## ReservationClaim (sans état)

Preuve qu'une réservation a été faite depuis ce client, l'équivalent du cookie `wl_rc_*`.

- Forme : `<iat>.<reservationId>.<mac>`, `mac` = HMAC-SHA256(`SESSION_SECRET`, `readToken.iat.reservationId`), base64url.
- Durée : 90 jours (même constante que le cookie).
- Émise : dans la réponse d'une réservation réussie.
- Lue : en-tête `X-Reservation-Claims: <claim>,<claim>…` (au plus 50 claims ; au-delà, les suivants sont ignorés).
- Effet : les ids valides alimentent `mineReservationIdsFor` (lecture) et `cancelOwnReservation` (annulation). Une réservation annulée rend son claim inutile ; le client l'oublie.

## ReadUnlock (sans état)

Preuve qu'un client a donné le mot de passe de lecture, l'équivalent du cookie `wl_ru_*`.

- Forme : `<iat>.<mac>`, `mac` = HMAC-SHA256(`SESSION_SECRET`, `readToken.readPasswordHash`), comme le cookie actuel.
- Durée : 14 jours.
- Invalide dès que le mot de passe de lecture change ou est retiré (le MAC porte sur le hash).
- Lue : en-tête `X-Read-Unlock`.
- Un membre connecté de la liste n'en a pas besoin (règle de `canAccessPublicList`).

Les fonctions de signature et de vérification de ces deux preuves sortent de `src/auth/reservation-claim.ts` et `src/auth/read-unlock.ts` en fonctions pures ; les cookies du site et les en-têtes de l'API les partagent.

## Vues renvoyées par l'API

Formes détaillées dans [contracts/openapi.yaml](contracts/openapi.yaml). Règles de visibilité :

| Vue | Qui | Contient | Ne contient jamais |
|-----|-----|----------|--------------------|
| `PublicList` | quiconque a le `readToken` (et l'unlock si besoin) | titre, sous-titre, image, thème, catégories, « qui », idées de `listPublicVisibleItems` avec `mine` | e-mails, ids de compte, `inviteToken`, hash, `fromName`/`note` d'une réservation qui n'est pas « mine », idées réservées par d'autres |
| `MemberList` | membre connecté | tout `PublicList`, plus idées archivées, réservations (`listOffrir` : `fromName`, `note`), membres (`userId`, `displayName`, `role`), lien de lecture, lien d'invitation, `hasReadPassword` | e-mails des autres membres, hash du mot de passe de lecture |
| `Me` | le compte connecté | `id`, `email`, `displayName`, `mustChangePassword` | `passwordHash`, `sessionVersion` |

Les prix sont rendus en centimes (`priceCents`) et en libellé formaté selon la langue (`priceLabel`), comme le site.

## Commandes partagées

Pas une entité stockée, mais le nouveau découpage du code serveur ([research.md R5](research.md)) :

```text
src/server/commands/
├── auth.ts        register, login, logout, requestPasswordReset, changePassword, updateDisplayName
├── public-list.ts readPublicList, unlockPublicList, reserve, cancelOwnReservation
├── lists.ts       listMine, readMemberList, createList, updateSettings, deleteList
├── items.ts       saveItem, setItemType, setItemArchived, deleteItem, enrichFromUrl
├── labels.ts      add/rename/delete type et person, reorderTypes
└── sharing.ts     regenerateInvite, sendInvite, set/clearReadPassword, removeMember, leave, joinInvite, cancelReservation
```

Chaque commande prend un `actor` (`{ user: User | null, ip: string | null }` ou équivalent), une entrée typée, et rend `{ ok: true, … } | { ok: false, error: string }`.
