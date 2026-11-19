# Contrat des écrans : Cadeau commun (028)

Clés i18n indicatives (FR / EN), à créer dans les deux langues avec les mêmes clés. `testID` de l'app : `<écran>.<élément>`.

## Site

### Formulaire de réservation (`components/site/reservation-form.tsx`, `/l/<t>/reserve`)

- Choix : nouvelle primitive `components/ui/radio-group.tsx` (shadcn, Base UI ; aucune n'existe encore) : `public:reserve.modeSingle` « Réserver seul » / « Reserve on my own » ; `public:reserve.modeGroup` « Lancer un cadeau commun » / « Start a group gift », avec `public:reserve.modeGroupHint` « D'autres personnes pourront participer avec vous. » / « Others can chip in with you. ».
- Mode cadeau commun : champ `public:groupGift.amount` « Montant que vous mettez (facultatif) » / « Amount you're putting in (optional) », et la phrase `public:groupGift.privacyHint` « Les autres participants et les personnes qui ont le lien du cadeau verront votre nom ; les participants verront aussi votre montant et votre message. Les personnes qui gèrent la liste voient votre nom et votre message, jamais votre montant. »
- Après envoi en mode cadeau commun : redirection vers `/g/<token>?ok=1`.

### Carte de la liste publique (`components/site/public-item-card.tsx`)

- Badge `public:groupGift.badge` « Cadeau commun » / « Group gift ».
- Résumé `public:groupGift.summary` « {{count}} participant(s) · il reste {{amount}} » (pluriels i18next) ou `public:groupGift.goalReached` « Montant atteint » / « Goal reached » ; sans prix : `public:groupGift.total` « {{amount}} annoncés ».
- Non-participant : bouton-lien `public:groupGift.join` « Participer » / « Chip in » → `/g/<token>`.
- Participant : badge `public:groupGift.mine` « Vous participez » / « You're chipping in », `public:groupGift.complete` « Complet » si complet, lien `public:groupGift.open` « Voir le cadeau commun » → `/g/<token>`.

### Page du cadeau (`app/g/[token]/page.tsx`, nouveau)

Sections, de haut en bas (composants de `components/site/`, primitives de `components/ui/`) :

1. En-tête : nom de l'idée, image, prix, description, lien marchand ; `public:groupGift.fromList` « Dans la liste « {{title}} » ».
2. État et résumé : badge ouvert/complet, nombre, total, reste.
3. Participants : non-participant → noms seulement ; participant → nom, montant (`public:groupGift.amountUnknown` « montant non précisé »), message.
4. Non-participant, cadeau ouvert : formulaire « Participer » (nom, message, montant, `privacyHint`, piège `website` comme la réservation).
5. Ma participation : montant modifiable (compte) ou `public:groupGift.noAccountHint` « Avec un compte, vous pourriez changer votre montant et échanger avec les autres participants. » ; `public:groupGift.leave` « Retirer ma participation » (`ConfirmForm`).
6. `public:groupGift.markComplete` « Le cadeau est complet » / `public:groupGift.reopen` « Rouvrir le cadeau » (participant).
7. `public:groupGift.invite` « Inviter à participer » : lien à copier (`public:groupGift.copyLink`).
8. Fil : `public:groupGift.thread` « Messages entre participants », liste, champ, `public:groupGift.send` « Envoyer », `public:groupGift.deleteMessage` « Supprimer », `public:groupGift.formerParticipant` « Ancien participant ».
- Cadeau disparu : `public:groupGift.missing` « Ce cadeau commun n'existe plus. »
- Complet vu par un non-participant : `public:groupGift.closed` « Ce cadeau commun est complet. »
- Mot de passe : même formulaire que la liste (`public:` existant), action de déverrouillage par le cadeau.

### Onglet Réservations d'un membre (`components/site/reservation-card.tsx`, `reservations-reveal.tsx`)

- Une carte par cadeau commun : `list:reservations.groupGift` « Cadeau commun · {{count}} participant(s) », état, puis chaque participant (« De la part de … », message) avec « Annuler la participation » ; bouton `list:reservations.cancelGroupGift` « Annuler le cadeau commun » (confirmation `list:reservations.cancelGroupGiftBody` « Toutes les participations et les messages seront supprimés. L'idée redeviendra disponible. »).

### Mes réservations (`app/account/page.tsx`)

- Badge « Cadeau commun », `auth:account.offersAmount` « Votre part : {{amount}} », reste, lien vers `/g/<token>`.

## App mobile

| Écran | Changement | testID |
|-------|-----------|--------|
| `mobile/app/guest/[readToken]/reserve.tsx` | choix seul / cadeau commun, champ montant ; après envoi → `/gift/<token>` | `reserve.modeSingle`, `reserve.modeGroup`, `reserve.amount` |
| `mobile/src/features/guest/GuestItemCard.tsx` | badge, résumé, « Participer » / « Voir le cadeau commun » → `/gift/<token>` | `guestItem.groupGift`, `guestItem.join` |
| `mobile/app/gift/[token].tsx` (nouveau) | page du cadeau, mêmes sections que le site ; partage du lien par la feuille de partage du téléphone ; tirer pour recharger | `gift.join`, `gift.amount`, `gift.submit`, `gift.leave`, `gift.complete`, `gift.reopen`, `gift.share`, `gift.message`, `gift.send`, `gift.password` |
| `mobile/app/(app)/lists/[listId]/reservations.tsx` | regroupement par cadeau, « Annuler le cadeau commun » | `reservations.groupGift`, `reservations.cancelGroupGift` |

Composants : ceux de `mobile/src/ui/` (pas de style en dur) ; `mobile/src/ui/RadioGroup.tsx` nouveau, pendant de `components/ui/radio-group.tsx` (même apparence, jetons de `mobile/src/theme/tokens.ts`). Textes de l'app : namespace `public` partagé, `mobile` pour ce qui lui est propre (« Partager le lien »).

Route de lien : `src/site/app-link-routes.json` + `{ "site": "/g/:token", "app": "/gift/:token", "keepQuery": [] }`.

Parcours Maestro (tags `028-us7`) : `mobile/.maestro/flows/028-us7-group-gift.yaml` : ouvrir une liste de démo, lancer un cadeau commun avec un montant, voir le reste, se retirer.
