# Contrat des écrans : mode surprise (020)

Textes dans `locales/{fr,en}/list.json` (partagé par le site et l'app), refus dans `locales/{fr,en}/errors.json`. Libellés FR indicatifs, à polir à l'implémentation sans changer le sens.

## Clés i18n nouvelles

| Clé | FR |
|-----|----|
| `list:surprise.title` | Garder la surprise |
| `list:surprise.description` | Les idées réservées restent dans votre liste, sans que vous sachiez lesquelles. Les autres membres continuent de voir les réservations. |
| `list:surprise.toggle` | Ne pas voir les cadeaux réservés |
| `list:surprise.saved` / `list:surprise.cleared` | Mode surprise activé. / Mode surprise désactivé. |
| `list:surprise.hiddenHint` | Vous avez choisi de ne pas voir les cadeaux réservés. |
| `list:surprise.reveal` | Voir les réservations |
| `list:surprise.revealTitle` | Voir les réservations ? |
| `list:surprise.revealBody` | Vous allez voir quels cadeaux ont été réservés. |
| `list:surprise.revealConfirm` / `list:surprise.revealKeep` | Voir les réservations / Garder la surprise |
| `list:surprise.guestViewTitle` | Ouvrir la vue invité ? |
| `list:surprise.guestViewBody` | La vue invité ne montre pas les cadeaux déjà réservés. |
| `list:surprise.guestViewConfirm` / `list:surprise.guestViewKeep` | Ouvrir la vue invité / Rester ici |
| `list:archives.reservedHint` | Cette idée est réservée : annulez la réservation pour la remettre dans la liste. |
| `errors:itemLockedSurprise` | Cette idée ne peut pas être supprimée ou déplacée pour le moment. Voir les réservations pour en savoir plus. |

## Site (`app/lists/[id]/page.tsx`)

| Endroit | Hors mode surprise | En mode surprise |
|---------|--------------------|------------------|
| Onglet Partage | + carte « Garder la surprise », case décochée | carte, case cochée |
| Onglet « Idées (N) » | inchangé | idées réservées comprises, sans marque |
| Onglet « Archives (N) » | idées réservées avec `archives.reservedHint` au lieu de « Remettre dans la liste » | archivées par un membre seulement |
| Onglet « Réservations » | inchangé, avec compteur | sans compteur ; `hiddenHint` + bouton « Voir les réservations » → dialogue → lignes habituelles |
| « Voir comme invité » | lien direct | dialogue `guestView*`, puis la vue invité |

Composants nouveaux : `components/site/surprise-mode-form.tsx` (case + server action), `components/site/reservations-reveal.tsx`, `components/site/guest-view-link.tsx`.

## App (`mobile/app/(app)/lists/[listId]/`)

| Écran | Changement | `testID` |
|-------|------------|----------|
| `share.tsx` | carte « Garder la surprise » (même place que sur le site), case à cocher, désactivée hors ligne, message `saved`/`cleared` | `share.surprise`, `share.surprise-toggle`, `share.surprise-saved` |
| `ListScreen` (onglets) | pas de compteur sur « Réservations » en mode surprise | `list.tab-reservations` (existant) |
| `reservations.tsx` | en mode surprise : `hiddenHint`, bouton, `ConfirmDialog`, puis lignes en mémoire ; hors ligne : bouton désactivé + `NetworkNote` | `reservations.hidden`, `reservations.reveal`, `reservations.reveal-confirm`, `reservations.item-<id>` (existant) |
| `archives.tsx` | sur une idée réservée : `archives.reservedHint` à la place de « Remettre dans la liste » | `archives.reserved-hint` |
| suppression / déplacement d'une idée | affiche `errors:itemLockedSurprise` reçu du serveur | (existants) |

Place exacte de la carte sur le site et dans l'app : à fixer à l'implémentation, la même des deux côtés (après « Protéger l'accès à votre liste », avant « Gérer les membres », pour qu'elle soit visible de tout membre).
