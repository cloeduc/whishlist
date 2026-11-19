# Modèle de données : noms d'une liste suivie (024)

## Subscription (modifiée)

Table `subscriptions` (`src/store/schema.ts`), type `Subscription` (`src/domain/types.ts`).

| Champ | Type | Nouveau | Règle |
|-------|------|---------|-------|
| `wishlistId` | texte | | inchangé |
| `userId` | texte | | inchangé |
| `readPasswordHash` | texte ou null | | inchangé |
| `createdAt` | date ISO | | inchangé |
| `customTitle` | texte ou null | ✓ | nom de la liste choisi par l'abonné ; `trim()`, vide → `null`, 80 caractères au plus |
| `customOwnerName` | texte ou null | ✓ | nom de la personne choisi par l'abonné ; mêmes règles |

Colonnes SQLite : `custom_title`, `custom_owner_name`, `NULL` par défaut. Migration `drizzle/0007_*.sql` (générée par `npm run db:generate`, relue et versionnée). Import JSON historique : champs facultatifs, `null` si absents.

Cycle de vie : créés à `null` par `subscribeWishlist` ; un réabonnement « déjà abonné » ne les touche pas ; supprimés avec l'abonnement (désabonnement, adhésion à la liste, suppression de la liste ou du compte).

## Valeurs dérivées (lecture seule)

- `ownerName(doc, wishlistId)` : `displayName` du membre de rôle `owner`, sinon du premier membre par `joinedAt`, `null` si vide. Jamais stocké.
- `followedDisplay({ title, customTitle, ownerName, customOwnerName })` → `{ title: customTitle ?? title, person: customOwnerName ?? ownerName }`. Module pur partagé par le site et l'app.

## Règles

| Règle | Erreur |
|-------|--------|
| Abonnement inexistant (pas abonné, ou membre) | `listMissing` |
| Un nom de plus de 80 caractères (après `trim()`) | `followedNameTooLong` (nouveau code, FR/EN) |
| Visiteur qui ne suit pas la liste | ne reçoit ni les noms ni `ownerName` |

## Export des données (`ExportedSubscription`)

Ajoute `customTitle` et `customOwnerName` (valeurs brutes, `null` si non choisis).
