# Data Model: Champ mot de passe

Aucune donnée stockée, aucune migration, aucun changement de l'API. Le seul état est local au champ.

## État d'un champ mot de passe

| Champ | Type | Défaut | Règle |
|-------|------|--------|-------|
| `visible` | booléen | `false` | Propre à chaque champ (FR-005, US2-3). |

### Transitions

| De | Événement | Vers | Spec |
|----|-----------|------|------|
| masqué | toucher / clic / Entrée / Espace sur l'œil | visible | FR-002, FR-006 |
| visible | toucher / clic / Entrée / Espace sur l'œil | masqué | FR-002 |
| visible | formulaire envoyé avec refus (site : formulaire remonté) | masqué, champ vide | cas limite « Erreur au retour du serveur » |
| visible | fenêtre ou carte fermée (contenu démonté) | masqué | FR-005 |
| visible | écran quitté (app : perte du focus) | masqué | FR-005 |
| visible | champ vidé par l'écran après un envoi (app) | masqué | FR-005 |

Basculer ne change ni la valeur ni le focus (FR-004). Le libellé de l'œil se déduit de l'état : masqué → « Afficher le mot de passe », visible → « Masquer le mot de passe ».

## Champs concernés

| Formulaire | Site (`id` du champ, `autoComplete`) | App (`testID`, `autoComplete` / `textContentType`) |
|------------|--------------------------------------|----------------------------------------------------|
| Connexion | `password`, current-password | `login.password`, current-password / password |
| Inscription | `password`, new-password | `register.password`, new-password / newPassword |
| Réinitialisation | `password`, new-password | `reset-password.password`, new-password |
| Mot de passe du compte | `currentPassword`, `password`, `confirm` | `<testID>-current`, `-next`, `-confirm` |
| E-mail du compte | `email-current-password`, current-password | `account.email-password`, current-password |
| Suppression du compte | `delete-password`, current-password | `delete-account.password`, current-password / password |
| Protéger l'accès à la liste | `read-password`, new-password | — |
| Liste protégée | `read-password`, current-password | `guest.password` (off), `follow.password` |
