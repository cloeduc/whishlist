# Contrat des écrans : noms d'une liste suivie (024)

## Textes

Nouvelles clés, FR et EN, au vouvoiement.

| Clé | FR | EN |
|-----|----|----|
| `home:followed.rename` | Renommer | Rename |
| `home:followed.renameAria` | Renommer « {{title}} » | Rename “{{title}}” |
| `public:subscription.rename` | Renommer | Rename |
| `public:followNames.title` | Renommer cette liste | Rename this list |
| `public:followNames.body` | Ces noms ne sont visibles que par vous. | Only you can see these names. |
| `public:followNames.listName` | Nom de la liste | List name |
| `public:followNames.listNameHint` | Titre choisi par la liste : « {{title}} » | Title chosen by the list: “{{title}}” |
| `public:followNames.person` | À qui est cette liste | Whose list this is |
| `public:followNames.personHint` | Par défaut : {{name}} | By default: {{name}} |
| `public:followNames.save` | Enregistrer | Save |
| `public:followNames.reset` | Revenir aux noms de la liste | Use the list’s names |
| `errors:followedNameTooLong` | Ce nom est trop long (80 caractères au plus). | This name is too long (80 characters at most). |

`personHint` n'est affiché que si `ownerName` existe. Les textes du dialogue sont dans `public` parce que l'app les affiche sur l'écran de la liste suivie (namespace déjà chargé) et le site dans « Mes listes ».

## Affichage (site et app)

Fonction pure `followedDisplay` (`src/domain/followed-display.ts`, reprise par l'app comme `price.ts`) : titre = `customTitle ?? title`, personne = `customOwnerName ?? ownerName`.

- **Carte « Listes suivies »** : titre affiché ; dessous, la personne (texte discret, préfixe aucun) quand elle existe ; puis le sous-titre de la liste comme aujourd'hui.
- **En-tête de la liste** quand le compte connecté la suit (`follow` non nul) : même titre et même personne. Pour un visiteur, un membre ou un compte non connecté, rien ne change.

## Site

- `app/page.tsx` (« Mes listes ») : chaque carte de liste suivie reçoit le titre et la personne affichés, et un bouton « Renommer » à côté de « Ne plus suivre », qui ouvre `components/site/follow-names-dialog.tsx` (`Dialog` de `components/ui/`) : deux `Field` + `Input` préremplis avec `customTitle` et `customOwnerName` (placeholder : titre de la liste, nom du propriétaire), « Enregistrer », « Revenir aux noms de la liste » (envoie deux `null`), `FormRefusal` pour l'erreur.
- Server action `renameFollowedListAction` (`src/server/actions.ts`) → commande `renameFollowedList` (`src/server/commands/public-list.ts`, à côté du désabonnement) → `refresh()`.
- `app/l/[readToken]/page.tsx` : en-tête avec titre et personne pour un abonné.

## App

- `mobile/app/(app)/index.tsx` : carte de liste suivie avec titre et personne (`followedDisplay` sur `SubscribedListSummary`).
- `mobile/src/features/guest/GuestListHeader.tsx` : titre et personne quand `list.follow` existe ; `testID="guest.title"` inchangé, `testID="guest.person"` pour la personne.
- `mobile/src/features/guest/GuestFollow.tsx` : quand la liste est suivie, bouton « Renommer » (`testID="guest.rename"`, `variant="neutral"`) à côté de « Ne plus suivre » ; désactivé hors ligne avec `mobile:offline.needsNetwork`.
- Nouvel écran `mobile/app/guest/[readToken]/names.tsx` : deux champs (`guest-names.list-name`, `guest-names.person`), « Enregistrer » (`guest-names.save`), « Revenir aux noms de la liste » (`guest-names.reset`), erreur (`guest-names.error`). Succès : `renameFollowedList` (`mobile/src/data/subscriptions.ts`, `PUT /subscriptions/{readToken}`, puis `refreshLists()`) et retour à la liste rechargée.
- `testID` des cartes de « Mes listes » inchangés (`lists.shared-card-<readToken>`) ; la personne : `lists.shared-person-<readToken>`.
