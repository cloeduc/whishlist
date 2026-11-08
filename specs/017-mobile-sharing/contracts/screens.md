# Contrat des écrans : onglets Partage et Réglages d'une liste (017)

Pas de changement du contrat d'API (`specs/004-mobile-api/contracts/openapi.yaml`) : voir research R1. Ce contrat décrit ce que montrent les deux onglets de l'app, rôle par rôle, et les `testID` que visent les parcours e2e (`<écran>.<élément>`). Les libellés sont ceux du site (namespace et clé entre parenthèses).

## Onglet Partage (`mobile/app/(app)/lists/[listId]/share.tsx`)

En-tête de l'onglet, comme le site : titre « Partager votre liste » (`list:share.title`) et description (`list:share.description`).

| # | Carte | Propriétaire | Membre | Contenu | `testID` |
|---|-------|:---:|:---:|---------|----------|
| 1 | « Partager avec vos proches » (`list:share.readTitle`) | ✓ | ✓ | inchangée (005) : avis « liste protégée » pour tous les membres, à jour dès que la carte 4 change la protection (story 3, scénario 8), QR code, « Partager », champ lien + copier | `share.read-link`, `copy-link`, `share.share`, `share.copied`, `password-notice` (existants) |
| 2 | « Gérer la liste à plusieurs » (`list:share.collabTitle`) | ✓ | ✓ | description d'avertissement ; champ « Lien d'invitation à modifier » + copier ; « Lien copié. » ; bouton « Envoyer le lien d'invitation » (`mobile:sharing.shareInvite`) | `share.invite-link`, `share.copy-invite`, `share.invite-copied`, `share.share-invite` |
| 3 | « Inviter par e-mail » (`list:share.inviteEmailTitle`) | ✓ | ✓ | champ e-mail (clavier e-mail, pas de majuscule auto) ; « Envoyer l'invitation » ; message « Invitation envoyée. » ou erreur | `share.invite-email`, `share.send-invite`, `share.invite-sent`, `share.invite-error` |
| 3b | dans la carte 3 : « Remplacer le lien d'invitation » + aide (`list:share.regenerateHint`) | ✓ | — | confirmation `list:confirm.regen*` ; le refus reste affiché hors de la partie du propriétaire (rôle changé ailleurs) | `share.regenerate`, `share.regenerate-confirm`, `share.regenerate-error` |
| 4 | « Protéger l'accès à votre liste » (`list:share.readPassword`) | ✓ | — | état (`readPasswordSet` / `readPasswordUnset`) ; champ mot de passe (composant 016) ; « Enregistrer le mot de passe » ; « Retirer le mot de passe » si protégée (confirmation `list:confirm.clearPassword*`) ; messages `readPasswordSaved` / `readPasswordCleared` ; après un refus parce que le rôle a changé ailleurs, la carte disparaît et le message reste | `share.read-password`, `share.save-password`, `share.password-state`, `share.clear-password`, `share.clear-password-confirm`, `share.password-saved`, `share.password-cleared`, `share.password-error` |
| 5 | « Gérer les membres » (`list:share.members`) | ✓ | ✓ | une ligne par membre : nom — « Propriétaire » / « Membre » ; « Retirer de la liste » sur les autres (propriétaire seul, confirmation `list:confirm.removeMember*` avec le nom) ; « Quitter cette liste » (confirmation `list:confirm.leave*`, + `mobile:sharing.pendingLost` s'il y a des changements en attente) | `share.member-<userId>`, `share.remove-<userId>`, `share.remove-confirm`, `share.leave`, `share.leave-confirm`, `share.members-error` |
| 5b | dans la carte 5, après un refus `aloneMustDelete` | ✓ | — | alerte avec le message du serveur + bouton « Supprimer la liste » (`list:settings.delete`, désactivé hors ligne) qui ouvre la confirmation de suppression ; refus de la suppression sous le bouton | `share.alone-delete`, `share.delete-confirm`, `share.alone-delete-error` |

Le lien « Gérer le partage sur le site » (`mobile:share.manageOnSite`) disparaît.

## Onglet Réglages (`mobile/app/(app)/lists/[listId]/settings.tsx`)

Après les éditeurs de catégories et de « qui » (inchangés) :

| Carte | Propriétaire | Membre | Contenu | `testID` |
|-------|:---:|:---:|---------|----------|
| « Supprimer la liste » (`list:settings.danger`, aide `list:settings.dangerHint`) | ✓ | — | bouton destructif « Supprimer la liste » ; confirmation `list:confirm.deleteList*` avec le titre, + `mobile:sharing.pendingLost` s'il y a des changements en attente ; refus sous le bouton, qui reste affiché si le rôle a changé ailleurs (la carte disparaît) | `settings.delete-list`, `settings.delete-confirm`, `settings.delete-error` |

## États communs

- **Liste pas encore envoyée** (`localOnly`) : seul le message actuel `mobile:share.pendingList` ; aucune carte.
- **Hors ligne** : une alerte en tête de l'onglet (`mobile:sharing.offline`, `testID` `share.offline`) ; cartes affichées depuis la copie ; champs de saisie et boutons d'écriture désactivés ; copie des liens et partage par le téléphone toujours actifs. Même chose pour la carte « Supprimer la liste » (alerte existante `mobile:settings.offline` de l'onglet Réglages).
- **Pendant un envoi** : le bouton de l'action est occupé (pas de double envoi).
- **Après un succès** : la liste est rechargée ; « Quitter » et « Supprimer » ramènent à « Mes listes » (`router.replace("/")`).
- **Après un refus** : message traduit sous la carte concernée ; refus de droits (`owner*`, `notMember`) → la liste est rechargée.

## Textes propres à l'app (`locales/{fr,en}/mobile.json`, clé `sharing`)

| Clé | FR | EN |
|-----|----|----|
| `sharing.shareInvite` | Envoyer le lien d'invitation | Send invitation link |
| `sharing.inviteMessage` | Rejoignez-moi pour gérer la liste « {{title}} » : {{url}} | Join me to manage the list "{{title}}": {{url}} |
| `sharing.pendingLost` | {{count}} changement(s) pas encore envoyé(s) sur cette liste sera/seront perdu(s). (pluriel i18next `_one` / `_other`) | {{count}} unsent change(s) on this list will be lost. (`_one` / `_other`) |
| `sharing.offline` | Vous êtes hors ligne : les invitations, les membres et le mot de passe se gèrent quand le réseau revient. | You are offline: invitations, members and the password can be managed once you are back online. |

Libellés exacts relus à l'implémentation ; le français vouvoie et garde le lexique du produit.
