# Data Model: Cadeau commun (028)

Voir research.md R1-R3, R8.

## Types du domaine (`src/domain/types.ts`)

```text
Reservation (existant, deux champs en plus)
  id, wishlistId, itemId, fromName, note, userId, createdAt
  groupGiftId: string | null     # null = réservation seule
  amountCents: number | null     # participation seulement ; null = non précisé

GroupGift (nouveau)
  id: string
  wishlistId: string
  itemId: string                 # unique
  token: string                  # lien /g/<token>, unique
  status: "open" | "complete"
  createdAt: string
  completedAt: string | null     # dernière déclaration « complet »

GroupGiftMessage (nouveau)
  id: string
  groupGiftId: string
  userId: string | null          # null après suppression du compte
  authorName: string | null      # figé à l'écriture ; null → « Ancien participant »
  body: string                   # 1..2000 caractères (MAX_NOTE)
  createdAt: string

Database : + groupGifts: GroupGift[], + groupGiftMessages: GroupGiftMessage[]
```

## Tables SQLite (`src/store/schema.ts`, migration `drizzle/0008_*.sql`)

| Table | Colonnes | Contraintes |
|-------|----------|-------------|
| `reservations` | + `group_gift_id` TEXT NULL → `group_gifts.id` ; + `amount_cents` INTEGER NULL | `item_id` n'est plus `UNIQUE` en colonne ; `UNIQUE INDEX reservations_item_single ON reservations(item_id) WHERE group_gift_id IS NULL` ; `UNIQUE INDEX reservations_gift_user ON reservations(group_gift_id, user_id)` ; index `reservations_group_gift_id` |
| `group_gifts` | `id` PK, `wishlist_id` → wishlists, `item_id` → items UNIQUE, `token` UNIQUE, `status` TEXT NOT NULL DEFAULT 'open', `created_at`, `completed_at` NULL | index `group_gifts_wishlist_id` |
| `group_gift_messages` | `id` PK, `group_gift_id` → group_gifts, `user_id` NULL → users, `author_name` NULL, `body` NOT NULL, `created_at` | index `group_gift_messages_group_gift_id` |

Ordre dans `COLLECTION_NAMES` (`src/store/rows.ts`) : `groupGifts` avant `reservations` (clé étrangère), `groupGiftMessages` après. `writeDiff` supprime avant d'insérer : retirer la dernière participation et le cadeau dans la même écriture reste valide (`defer_foreign_keys`).

La migration `drizzle/0008_group_gifts.sql` n'a pas besoin de reconstruire `reservations` : l'unicité de `item_id` était un index (`reservations_item_id_unique`), supprimé puis remplacé par l'index partiel ; les deux colonnes s'ajoutent par `ALTER TABLE`. Aucune donnée à transformer : les réservations existantes ont `group_gift_id = NULL` (test « migration 0008 » de `tests/domain/store-import.test.ts`).

`src/store/legacy-json.ts` : un ancien JSON n'a ni `groupGifts` ni `groupGiftMessages` ni les deux champs : normalisés à `[]` et `null`. `scripts/db-backup.mjs` n'est pas concerné (copie du fichier).

## Règles (`src/domain/group-gift.ts`)

| Règle | Erreur |
|-------|--------|
| Lancer : idée de la liste, non archivée, sans réservation seule ni cadeau commun | `itemAlreadyReserved`, `itemNotInList` |
| Participer : cadeau `open` | `groupGiftComplete` |
| Participer : pas déjà participant (compte, ou preuve sur une participation de ce cadeau) | `groupGiftAlreadyJoined` |
| Nom ≤ 200, message ≤ 2000 (comme la réservation) | `fieldTooLong` |
| Montant : vide, ou `parsePrice` valide, 1 … 10 000 000 centimes | `invalidAmount` |
| Changer son montant : participation liée au compte de l'acteur | `accessDenied` |
| Complet / rouvrir : acteur participant (compte ou preuve) | `accessDenied` |
| Écrire / lire le fil : participant avec compte | `accessDenied` |
| Supprimer un message : son auteur (`userId`) | `accessDenied` |
| Réserver seul une idée qui a un cadeau commun | `itemAlreadyReserved` (existant) |
| Annuler le cadeau entier : membre de la liste | `notMember` (existant) |
| Cadeau introuvable (jeton) | `groupGiftMissing` |

Invariant : après toute écriture, chaque `GroupGift` a au moins une réservation qui le référence ; sinon il est supprimé avec ses messages (`pruneGroupGifts`).

## États

```text
           participer (n ≥ 1)
 (libre) ──lancer──▶ open ◀──rouvrir── complete
    ▲                 │ ──complet──▶     │
    └── dernier retrait / annulation membre (depuis open ou complete)
```

## Vues calculées

```text
GroupGiftSummary (liste publique, tout visiteur qui voit l'idée)
  token, status, participantCount, totalCents, remainingCents | null, goalReached, mine

GroupGiftDetail (page du cadeau)
  token, listTitle, item (nom, image, prix, description, url, secondHandOk, catégorie),
  status, participantCount, participantNames[], totalCents, remainingCents | null, goalReached,
  me: { reservationId, fromName, note, amountCents, editable } | null
  participations: [{ name, amountCents, note, mine }]         # participants seulement
  thread: { messages: [{ id, authorName | null, body, createdAt, mine }] } | null   # participants avec compte
  threadAvailableWithAccount: boolean                          # participant sans compte : phrase d'explication

MemberGroupGiftEntry (onglet Réservations)
  groupGiftId, itemName, typeLabel, status, participants: [{ reservationId, fromName, note }]
```

## Export et suppression de compte (`src/domain/account.ts`)

- `myReservations` : chaque ligne gagne `groupGift: { status, amountCents } | null`.
- Nouveau `groupGiftMessages: [{ item, body, createdAt }]` (messages écrits par le compte).
- Export d'une liste par un membre (`reservations`) : inchangé, sans montant.
- `deleteAccount` : les participations restent, `userId = null` (règle actuelle) ; les messages : `userId = null`, `authorName = null`.
