# Modèle de données : gérer le partage d'une liste dans l'app mobile (017)

Aucune donnée nouvelle côté serveur ni dans la base SQLite du serveur : la feature lit et écrit des données qui existent depuis les features 001 et 004. Ce document décrit ce que l'app lit, ce qu'elle garde sur le téléphone, et ce qui change dans sa base locale.

## Ce que l'app lit (vue membre `MemberList`, contrat 004)

| Champ | Sert à | Remarque |
|-------|--------|----------|
| `role` (`owner` \| `member`) | afficher ou cacher les cartes et boutons du propriétaire (FR-004) | rôle du compte connecté |
| `readUrl` | carte « Partager avec vos proches » (inchangée) | |
| `inviteUrl` | carte « Gérer la liste à plusieurs » : copie et partage | dans la langue de la requête ; change après « Remplacer le lien » |
| `hasReadPassword` | carte « Protéger l'accès » (propriétaire), avis (autres membres) | le mot de passe n'est jamais lu |
| `members[]` : `userId`, `displayName`, `role` | carte « Gérer les membres » | ordre du serveur = ordre du site ; nom vide → libellé « Membre » |

## Ce qui est gardé sur le téléphone

- **Copie de la liste** (`snapshot`, clé `list:<listId>`) : déjà gardée par la 005 avec tous les champs ci-dessus. Hors ligne, les cartes s'affichent depuis cette copie (FR-041).
- **File des changements** (`outbox`) : inchangée dans sa forme. Les actions de partage n'y passent pas (research R2).

## Transitions

| Action | Effet serveur | Effet sur le téléphone |
|--------|---------------|------------------------|
| Inviter par e-mail | e-mail envoyé, rien d'écrit | aucun ; champ vidé, message « Invitation envoyée. » |
| Remplacer le lien | nouveau jeton d'invitation | liste rechargée (`inviteUrl` nouveau) |
| Définir / remplacer / retirer le mot de passe | empreinte posée ou effacée | liste rechargée (`hasReadPassword`) |
| Retirer un membre | adhésion supprimée | liste rechargée (`members`) |
| Quitter | adhésion supprimée ; si propriétaire, le membre le plus ancien devient propriétaire | changements en attente de la liste retirés de la file, copie retirée, « Mes listes » rechargée, retour à « Mes listes » |
| Supprimer la liste | liste, idées, réservations, adhésions supprimées | idem « Quitter » |

## Règles appliquées par le serveur (rappel, non dupliquées dans l'app)

- Mot de passe de lecture : 8 caractères au moins (`MIN_READ_PASSWORD_LENGTH`), propriétaire seul.
- Remplacer le lien, retirer un membre, supprimer la liste : propriétaire seul ; le propriétaire ne se retire pas lui-même.
- Quitter : refusé si la personne est seule (`aloneMustDelete`).
- Inviter par e-mail : adresse confirmée, adresse non vide avec « @ », 8 invitations par heure et par compte.

L'app ne vérifie rien de cela elle-même : elle affiche le refus traduit (FR-040). Seul l'affichage dépend du rôle.

## Base locale de l'app : nouvelles fonctions, pas de migration

- `discardList(listId)` (`mobile/src/offline/outbox.ts`) : supprime de la file toutes les lignes de la liste.
- `forgetList(listId)` (`mobile/src/data/store.ts`) : retire la copie et l'état en mémoire de la liste, sans la marquer « introuvable ».
- `usePendingCountFor(listId)` (`mobile/src/data/store.ts`) : nombre de changements en attente pour la liste.
