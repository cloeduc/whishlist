# Data Model: Pages légales, données et suppression du compte

Aucune nouvelle collection dans `wishlist.json`, et aucun nouveau champ. La feature ajoute deux lectures (aperçu, export) et une écriture (suppression) sur les collections existantes de `Database` (`src/domain/types.ts`).

## Aperçu de la suppression (`AccountDeletionPreview`)

Calculé par `previewAccountDeletion(doc, userId)`, sans rien modifier.

| Champ | Type | Règle |
|-------|------|-------|
| `deletedLists` | `{ id, title }[]` | Listes où la personne est la seule adhésion. |
| `transferredLists` | `{ id, title, newOwnerName: string \| null }[]` | Listes avec d'autres membres ; `newOwnerName` = nom affiché de l'héritier si elle est owner, sinon `null`. |
| `reservationsKept` | `number` | Réservations avec `userId` = elle, sur des listes qui ne sont pas supprimées. |

L'app et le site affichent les nombres, et les titres jusqu'à 5 par groupe (cas limite « dizaines de listes »).

## Suppression (`deleteAccount`)

Entrée : `{ userId }`, appelée après la vérification du mot de passe. Effet en une seule écriture (`updateDocument`), dans cet ordre :

1. Pour chaque `Membership` de `userId` :
   - seule adhésion de la liste → `wipeWishlist` (wishlists, memberships, types, people, views, items, reservations de la liste) ;
   - sinon → retirer l'adhésion ; si `role === "owner"`, l'adhésion restante la plus ancienne (`joinedAt`, puis `userId`) devient `owner`. Règle partagée avec `leaveWishlist` (`pickHeir`).
2. `reservations` restantes avec `userId === userId` → `userId: null` (`fromName`, `note` inchangés).
3. `apiSessions` et `passwordResets` avec ce `userId` → supprimés.
4. `users` → l'utilisateur retiré.

**Invariants** (testés) :
- après la suppression, aucun objet de `Database` ne référence ce `userId` ;
- chaque liste restante a exactement un `owner`, et ce n'est pas elle ;
- les réservations des listes restantes sont toutes encore là ;
- un compte inexistant → `accountMissing`, document inchangé.

**Erreurs de la commande** : `unauthorized`, `mustChangePassword` (via `activeUser`), `wrongCurrentPassword`, `rateLimited`.

## Export (`AccountExport`, version 1)

Construit par `exportAccount(doc, userId, now)`. Chaque champ est copié par son nom : un champ qui n'est pas dans ce tableau ne part pas.

```text
AccountExport
├── format: "ohyoushouldnt-export"
├── version: 1
├── exportedAt: ISO date
├── account: { email, displayName, createdAt }
├── lists[]                                   # listes dont elle est membre
│   ├── title, subtitle, createdAt, role, joinedAt
│   ├── theme, coverImageUrl, publicUrl, readPasswordProtected: boolean
│   ├── members[]: { displayName, role, joinedAt }
│   ├── categories[]: { label, sortOrder }
│   ├── people[]: { label }
│   ├── items[]: { name, category, person, priceCents, url, imageUrl, priority, archived }
│   └── reservations[]: { item, fromName, note, createdAt, byMe: boolean }
└── myReservations[]                          # faites connectée sur des listes dont elle n'est pas membre
    └── { listTitle, item, fromName, note, createdAt }
```

- `publicUrl` est le lien public de lecture, que la personne peut déjà partager. `inviteToken` n'est jamais exporté.
- Les catégories et les « qui » sont rendus par leur libellé, pas par leur id.

**Jamais exportés** (FR-022, un test par élément) : `passwordHash`, `sessionVersion`, `mustChangePassword`, `inviteToken`, `readPasswordHash`, `apiSessions`, `passwordResets`, l'e-mail ou l'`id` d'un autre compte.

## Côté app (téléphone)

Aucune nouvelle table SQLite. La suppression réutilise l'effacement de la déconnexion :

| Donnée | Où | Après une suppression |
|--------|----|-----------------------|
| Jeton, expiration, `userId` | stockage sécurisé | effacés (`forgetToken`) |
| Copie des listes, `me`, file de changements | SQLite | effacées (`clearAll`) |
| `capabilities` (prestataires configurés) | SQLite (snapshot) | effacées avec le reste, puis relues à l'ouverture de « Données personnelles » ; sans réseau et sans copie, la page affiche les paragraphes toujours vrais et ceux des prestataires « s'ils sont configurés » |
| Fichier d'export | cache de l'app | supprimé au partage suivant |

`SessionState` gagne une variante `{ status: "signedOut"; expired: false; deleted: true }`, pour que l'écran de connexion affiche « Votre compte a été supprimé. »

## Contenu légal (textes)

Namespace `content`, mêmes clés en `fr` et `en` :

- `legal.*` : existant ; la partie hébergeur est réécrite (FR-035), la partie données devient un lien vers `privacy`.
- `privacy.*` : nouveau ; une clé par section de R8. Les paragraphes des prestataires optionnels gardent leurs clés actuelles (`mailBody`, `aiBody`, `audienceBody`), déplacées dans `privacy`.

Namespace `auth` : `account.dataTitle`, `account.export*`, `account.delete*` (site et app).
Namespace `mobile` : `account.version`, `account.licenses`, `account.contact`, `legal.*` (titres de la page licences).
