# Data model : Mode surprise (020)

## Membership (modifiée)

| Champ | Type | Défaut | Nouveau | Règle |
|-------|------|--------|:---:|-------|
| wishlistId | string | — | | |
| userId | string | — | | |
| role | `owner` \| `member` | — | | |
| joinedAt | string ISO | — | | |
| **surpriseMode** | boolean | `false` | ✓ | Propre à ce membre dans cette liste (FR-002). Écrit par `setSurpriseMode` ; seul le membre lui-même le change. Disparaît avec l'appartenance (quitter, être retiré, suppression de la liste ou du compte). |

Colonne SQLite : `memberships.surprise_mode integer NOT NULL DEFAULT false` (mode booléen, comme `items.second_hand_ok`).

## Item (sens d'un champ changé)

| Champ | Avant la 020 | Après la 020 |
|-------|--------------|--------------|
| archived | archivée par un membre **ou** réservée | archivée par un membre seulement (research R1) |

`reserveItem` ne touche plus `archived` ; annuler une réservation non plus. Une idée est réservée si une ligne de `reservations` porte son `id` (inchangé, `item_id` unique).

## Migration `drizzle/0006_*.sql`

1. `ALTER TABLE memberships ADD surprise_mode integer DEFAULT false NOT NULL;` (généré par `npm run db:generate`)
2. Ajouté à la main dans le même fichier : `UPDATE items SET archived = 0 WHERE id IN (SELECT item_id FROM reservations);`

Le second ordre est sûr : avant la 020, `reserveItem` refusait une idée archivée, donc une idée réservée n'était archivée que par sa réservation. Il est idempotent.

`src/store/legacy-json.ts` (import d'un ancien `wishlist.json`) applique les deux mêmes règles : `surpriseMode` absent → `false`, idée réservée → `archived = false`.

## Placement d'une idée pour un membre (dérivé, `src/domain/surprise.ts`)

| Idée | Hors mode surprise | En mode surprise |
|------|--------------------|------------------|
| libre, non archivée | Idées | Idées |
| libre, archivée | Archives | Archives |
| réservée, non archivée | Archives (avec la phrase « annulez la réservation… » à la place de « Remettre dans la liste ») | **Idées**, sans marque |
| réservée, archivée par un membre | Archives (même phrase) | Archives, sans marque, « Remettre dans la liste » disponible |

Compteurs : « Idées (N) » et « Archives (N) » comptent selon ce tableau ; « Réservations (N) » n'a pas de compteur en mode surprise. Le nombre d'idées d'une liste dans « Mes listes » (`itemCount`) suit la colonne du membre qui regarde.

## Règles de domaine nouvelles ou changées

| Règle | Fonction | Erreur |
|-------|----------|--------|
| Changer son mode surprise : membre de la liste | `setSurpriseMode` | `notMember` |
| Supprimer une idée réservée, acteur en mode surprise | `deleteItem` | `itemLockedSurprise` (au lieu de `itemHasReservation`) |
| Déplacer une idée réservée, acteur en mode surprise | déplacement (`items.ts`, l. 223) | `itemLockedSurprise` (au lieu de `itemReservedCannotMove`) |
| Réserver une idée | `reserveItem` | inchangé (`itemAlreadyReserved`, `itemNotInList`) ; n'archive plus |
| Annuler une réservation | `cancelReservation`, `cancelOwnReservation` | inchangé ; ne désarchive plus |

## Vue publique (inchangée)

`listPublicVisibleItems` cache déjà toute idée archivée ou réservée par un autre, et montre celle du visiteur. Après R1, une idée réservée n'est plus archivée : la condition « réservée » suffit à la cacher, comme aujourd'hui. Un test de domaine le vérifie (FR-014).
