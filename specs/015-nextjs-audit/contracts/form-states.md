# Contrat : état des 13 formulaires du site (US1)

Chaque action prend `(prev: FormState | null, formData: FormData)`. Sur un refus, elle rend un `FormState` ([data-model.md](../data-model.md)) au lieu de rediriger avec `?e=`. Sur un succès, elle garde sa redirection actuelle. Les champs cachés (`next`, `token`, `wishlistId`, `onglet`, `readToken`, `typeId`, `itemId`, `subscribe`) sont rendus par la page elle-même et n'ont pas besoin d'être gardés. Le champ anti-robot `website` ne l'est jamais.

| # | Formulaire | Action | Page / composant actuel | Champs gardés | Jamais rendus | Succès (inchangé) |
|---|------------|--------|-------------------------|---------------|---------------|-------------------|
| 1 | Inscription | `registerAction` | `app/inscription/page.tsx` | `displayName`, `email` | `password` | `/inscription?ok=1…` (session ouverte) |
| 2 | Connexion | `loginAction` | `app/connexion/page.tsx` | `email` | `password` | `next`, ou `/compte` si le mot de passe doit changer |
| 3 | Mot de passe oublié | `requestPasswordResetAction` | `app/mot-de-passe-oublie/page.tsx` | `email` | — | page d'envoi actuelle |
| 4 | Réinitialisation | `resetPasswordAction` | `app/reinitialiser/[token]/page.tsx` | — | `password` | redirection actuelle |
| 5 | Changement de mot de passe | `changePasswordAction` | `app/compte/page.tsx` | — | `currentPassword`, `password`, `confirm` | `/compte?ok=…` |
| 6 | Nom affiché | `updateDisplayNameAction` | `app/compte/page.tsx` | `displayName` | — | `/compte?ok=…` |
| 7 | Changement d'adresse | `requestEmailChangeAction` | `app/compte/page.tsx` | `email` | `currentPassword` | `/compte…#email` |
| 8 | Nouvelle liste | `createListAction` | `app/listes/new/page.tsx` | `title`, `category`, `person` | — | `/listes/<id>` |
| 9 | Réglages de la liste | `updateWishlistSettingsAction` | `components/site/appearance-form.tsx` | `title`, `subtitle`, `coverImageUrl`, `primary`, `accent`, `highlight`, `background` | — | `redirectToList` |
| 10 | Réservation | `reserveAction` | `components/site/reservation-form.tsx` | `itemId` (liste de choix), `fromName`, `note` | `website` | `/l/<readToken>?ok=1` (preuve posée) |
| 11 | Déverrouillage d'une liste | `unlockPublicListAction` | `components/site/read-unlock-form.tsx` | — | `password` | redirection actuelle |
| 12 | Invitation par e-mail | `sendInviteAction` | `app/listes/[id]/page.tsx` (onglet Partage) | `email` | — | `redirectToList(…, ok)` |
| 13 | Mot de passe de lecture | `setReadPasswordAction` | `app/listes/[id]/page.tsx` (onglet Partage) | — | `password` | `redirectToList(…, ok)` |

## Règles communes

- **Codes d'erreur** : ce sont les codes rendus aujourd'hui par la commande, ou `rateLimited` / `rate` pour une limite de débit, avec la même traduction qu'aujourd'hui. Pour l'inscription et la connexion, les codes de page actuels restent (`password`, `fields`, `rate`, `1`).
- **Redirections qui restent des redirections** : un compte absent ou qui doit changer son mot de passe (`memberId()`, `currentUser()`) ; `reserveAction` avec `listMissing` (vers `/`) ou `readPasswordRequired` (vers la liste) ; le champ anti-robot rempli (`/l/<readToken>?ok=1`, sans réservation).
- **Inscription avec une adresse déjà utilisée** : c'est toujours un succès apparent, sans message d'erreur (non-divulgation des comptes, voir [research.md](../research.md) R1).
- **Réservation refusée** : l'action appelle aussi `refresh()`, pour qu'une idée prise entre-temps disparaisse des choix ; l'idée choisie n'est gardée que si elle est encore proposée.
- **Remise à zéro** : chaque formulaire prend `key={state?.attempt}` et se reconstruit à chaque refus à partir de `values` ; les mots de passe reviennent donc vides. Seul le formulaire des réglages (n° 9), aux champs contrôlés, n'a pas de `key` : il garde ses brouillons.
- **Liste des champs** : chaque formulaire déclare la liste de ses champs gardés dans une constante exportée. Un test vérifie qu'aucune de ces listes ne contient un nom de champ qui ressemble à un mot de passe (`/password|confirm/i`) ni `website`.
