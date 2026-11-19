# Research : Mode surprise (020)

## R1. Une réservation n'archive plus l'idée

**Constat** : aujourd'hui `reserveItem` met `item.archived = true` et `removeReservation` le remet à `false`. Le drapeau `archived` mélange donc deux choses : « un membre a rangé l'idée » et « un invité l'a réservée ». En mode surprise, une idée réservée doit rester dans « Idées » ; si un membre l'archive (cas limite de la spec), elle doit passer dans « Archives ». Avec un seul drapeau, ces deux états sont indiscernables.

**Decision** : `Item.archived` ne veut plus dire que « archivée par un membre ». Une réservation ne touche plus ce drapeau, et l'annuler non plus. La réservation se lit dans la table `reservations`, comme le font déjà `listPublicVisibleItems` et `availableItems`. La migration remet `archived = 0` sur les idées réservées : avant la 020, une idée réservable n'était jamais archivée (`reserveItem` refuse une idée archivée), donc toute idée réservée et archivée l'a été par la réservation.

**Rationale** : un seul sens par donnée. Le placement d'une idée devient une fonction pure (R3), testée une fois, et partagée par le site, l'API et l'assistant.

**Alternatives considered** :
- garder le couplage et calculer « archivée sauf si réservée » en mode surprise : archiver une idée réservée ne la ferait jamais passer dans « Archives » (cas limite cassé) ;
- un second drapeau `archivedByMember` : deux drapeaux à tenir alignés, pour le même résultat.

**Conséquence hors mode surprise** : aujourd'hui, « Remettre dans la liste » sur une idée réservée (dans « Archives ») la remet dans « Idées » tout en la laissant réservée. Après R1, cette action ne changerait rien de visible. Sur une idée réservée, le bouton « Remettre dans la liste » est remplacé par une phrase : « Cette idée est réservée : annulez la réservation pour la remettre dans la liste. » (site et app). C'est le seul écart à FR-016, et il corrige une incohérence (une idée réservée affichée comme libre aux membres).

## R2. Où vit le réglage

**Decision** : une colonne `surprise_mode` (booléen, `false` par défaut) sur `memberships`. Le réglage est propre à un membre dans une liste (clarification Q1), exactement la portée d'une ligne de `memberships`. Quitter la liste ou en être retiré efface la ligne, donc le réglage.

**Alternatives considered** : une table à part (une ligne par membre en mode surprise) : une jointure de plus pour la même information ; un réglage sur `users` : vaudrait pour toutes les listes, ce que la clarification écarte.

## R3. Placement d'une idée pour un membre

**Decision** : un module pur `src/domain/surprise.ts` :
- `surpriseModeOf(doc, wishlistId, userId): boolean` ;
- `memberShelf(doc, item, surprise): "ideas" | "archives"` : hors mode surprise, `archives` si `item.archived` ou réservée ; en mode surprise, `archives` seulement si `item.archived` ;
- `setSurpriseMode(doc, { wishlistId, actorId, enabled })` : membre requis (`notMember`), écrit le réglage.

La page de liste du site, `toMemberListView` / `toListSummary` (API, app, assistant) l'appellent. Aucun écran ne refait le calcul.

## R4. Refus neutre pour supprimer ou déplacer (clarification Q2)

**Decision** : `deleteItem` et le déplacement (`transferItem` en mode `move`) gardent le refus pour une idée réservée, mais rendent `itemLockedSurprise` au lieu de `itemHasReservation` / `itemReservedCannotMove` quand l'acteur est en mode surprise. La règle vit dans le domaine (l'acteur y est déjà passé), donc le site, l'API et l'assistant la reçoivent sans code en plus. Texte FR : « Cette idée ne peut pas être supprimée ou déplacée pour le moment. Voir les réservations pour en savoir plus. »

## R5. Révéler les réservations sur le site

**Decision** : en mode surprise, la page de la liste ne met **aucune** donnée de réservation dans le HTML (ni compteur ni lignes), pour qu'un « afficher la source » ne spoile pas. L'onglet « Réservations » rend un composant client `ReservationsReveal` : texte d'explication, bouton « Voir les réservations », confirmation (`components/ui/dialog.tsx`), puis appel d'une server action `revealReservationsAction(wishlistId)` qui renvoie les lignes de `listOffrir`. Les lignes vivent dans l'état du composant : recharger la page ou changer d'onglet les cache de nouveau (FR-009). « Annuler la réservation » réutilise `cancelReservationAction` ; après la redirection, l'onglet est de nouveau caché, avec le message habituel.

**Alternatives considered** : un paramètre `?reveal=1` dans l'adresse : il survit au rechargement et à l'historique, contraire à FR-009.

## R6. « Voir comme invité » en mode surprise

**Decision** : un petit composant client `GuestViewLink` : hors mode surprise, le lien actuel ; en mode surprise, un dialogue (« La vue invité ne montre pas les cadeaux déjà réservés. ») avec « Ouvrir la vue invité » et « Rester ici ». `ConfirmForm` ne convient pas : il poste un formulaire, ici on navigue. **Révisé par la revue** : `ConfirmForm` accepte désormais un lien (`href`) ou un rappel (`onConfirm`), et sert ici comme pour « Voir les réservations » ; pas de composant à part.

## R7. API et anciennes versions de l'app

**Decision** :
- `MemberList` gagne `surpriseMode: boolean`.
- En mode surprise, `reservations` est `[]` et `items[].archived` suit R3 ; hors mode surprise, `items[].archived` vaut `archived || réservée`, exactement la valeur d'avant R1.
- `GET /lists/{listId}/reservations` rend les réservations (révélation volontaire, US2/US3), quel que soit le réglage.
- `PUT /lists/{listId}/surprise-mode` `{ enabled }` rend la `MemberList` relue.
- Les refus de suppression et de déplacement peuvent rendre `itemLockedSurprise`.

Une app déjà installée (1.0, 1.1) ne connaît pas `surpriseMode` : hors mode surprise, rien ne change pour elle ; en mode surprise activé depuis le site, elle reçoit une liste sans réservation, les idées réservées dans « Idées ». Elle ne spoile donc pas ; elle ne permet simplement pas de révéler.

**Rationale** : la valeur de `archived` hors mode surprise est inchangée, donc les écrans existants de l'app restent justes sans calcul en plus.

## R8. L'app mobile

**Decision** :
- Carte « Garder la surprise » dans `share.tsx`, interrupteur en ligne seulement (comme les autres actions de partage de la 017), puis rechargement de la liste : la copie locale est remplacée par une `MemberList` sans réservation.
- `ListScreen` : pas de compteur sur l'onglet « Réservations » quand `list.surpriseMode`.
- `reservations.tsx` : en mode surprise, bouton « Voir les réservations » + `ConfirmDialog`, puis `GET …/reservations` ; le résultat reste en mémoire dans l'écran, jamais dans la base locale (FR-012). Hors ligne, le bouton est désactivé avec la `NetworkNote` habituelle.
- `archives.tsx` : sur une idée réservée (hors mode surprise), la phrase de R1 à la place de « Remettre dans la liste ».
- Le réglage est une case à cocher : `components/ui/checkbox.tsx` sur le site, `mobile/src/ui/Checkbox.tsx` dans l'app. Aucun composant d'interrupteur nouveau (le site n'en a pas). La spec dit « interrupteur » au sens d'un réglage oui/non ; la case à cocher en tient lieu.

## R9. L'assistant relié au compte (013)

**Decision** : `get_list` passe déjà par `readMemberList` → `toMemberListView` : en mode surprise, `reservations` est vide, donc `reserved` vaut `false` pour toutes les idées et les idées réservées ne sont pas « archivées ». Les outils `delete_idea` et `move_idea` reçoivent le refus neutre de R4. On met à jour la description de `get_list` (« `reserved` is always false when the user chose not to see reservations »). Pas d'outil de révélation pour l'assistant : la révélation est une action de la personne, sur le site ou dans l'app.

## R10. Import d'un ancien `wishlist.json`

**Decision** : `src/store/legacy-json.ts` applique la même normalisation que la migration (idée réservée → `archived = false`) et met `surpriseMode = false` sur les appartenances. `npm run db:check` reste vert sur un ancien fichier.

## R11. Constitution

Le principe III dit « Le statut "réservé" reste visible sur la liste pour éviter un doublon ». Les invités ne voient déjà plus les idées réservées par d'autres (avant la 020), et la feature ne change pas leur vue ; côté membres, le statut n'est caché qu'à la personne qui l'a demandé, et aucune règle de collision ne change. Pas de violation ; une clarification PATCH du principe III est à proposer à Cloé, hors de cette feature.
