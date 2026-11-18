# Research: Cadeau commun (028)

Décisions prises pour le plan, à partir de la spec et du code existant (réservation seule, preuves de réservation, liens de l'app, mode surprise 020).

## R1. Une participation est une réservation

**Constat** : toute la logique « réservé » passe par `doc.reservations` : refus de supprimer ou déplacer une idée (`src/domain/items.ts:228,275`), rangement Archives et mode surprise (`src/domain/surprise.ts`), onglet Réservations (`src/domain/offrir.ts`), « Mes réservations » (`listMyOffers`), assistant (`src/server/mcp/server.ts:96-129`, `reserved`), suppression de compte (`account.ts:72`), suppression de liste (`membership.ts:71`), export, preuves de réservation sans compte (`src/auth/reservation-claim.ts`, `X-Reservation-Claims`), annulation par l'invité (`cancelOwnReservation`) et par un membre (`cancelReservation`).

**Decision** : une participation est une ligne de `reservations` avec deux colonnes nouvelles : `group_gift_id` (le cadeau commun, `null` pour une réservation seule) et `amount_cents` (montant annoncé, `null` si non précisé ou réservation seule). Le cadeau commun lui-même est une table `group_gifts` (idée, état, jeton du lien). Les messages du fil sont une table `group_gift_messages`.

**Rationale** : FR-022 (un cadeau commun se comporte comme une idée réservée côté membre), FR-027 (assistant), FR-004 (retrait avec les mêmes preuves), FR-021 (« Mes réservations ») et FR-028 (compte supprimé) sont alors acquis sans toucher ces modules. Seules les vues qui supposent « une réservation par idée » changent (`read.ts`, `offrir.ts`, `views.ts`).

**Alternatives considered** :
- Table `participations` séparée : il faudrait apprendre à chaque module ci-dessus qu'une idée peut être prise de deux façons, et doubler les preuves sans compte.
- Un champ « participants » JSON sur la réservation : un seul `fromName`/`userId` par ligne aujourd'hui, retrait individuel et preuves impossibles.

## R2. Unicité : une réservation seule par idée, un cadeau commun par idée

**Constat** : `reservations.item_id` est `UNIQUE` (`src/store/schema.ts:150`, commentaire « principle III »). `writeDiff` supprime avant d'insérer pour cette raison (`src/store/diff.ts`). Les écritures passent une à une par `updateDocument` (file d'écriture, transaction) : les vérifications du domaine voient l'état à jour.

**Decision** :
- `reservations.item_id` perd sa contrainte de colonne ; un index unique partiel la remplace : `UNIQUE (item_id) WHERE group_gift_id IS NULL`.
- `group_gifts.item_id` est `UNIQUE` : un seul cadeau commun par idée.
- Le domaine refuse une réservation seule sur une idée qui a un cadeau commun, et un cadeau commun sur une idée réservée seule (`itemAlreadyReserved`), FR-006.
- Index unique `(group_gift_id, user_id)` : un compte ne participe qu'une fois (FR-003) ; les participations sans compte (`user_id` NULL) ne sont pas concernées par l'index (NULL distincts), le domaine refuse un doublon par la preuve.

**Rationale** : la base garde le principe III comme filet, le domaine donne les messages. La migration `drizzle-kit` reconstruit la table `reservations` (SQLite ne retire pas une contrainte de colonne) ; elle se relit (data-model.md).

## R3. Cycle de vie et invariant « un cadeau commun a au moins un participant »

**Decision** : `src/domain/group-gift.ts` (nouveau, pur) porte toutes les règles. Toute suppression de réservation passe par une fonction unique qui, si c'était la dernière participation d'un cadeau, supprime aussi le cadeau et ses messages (`pruneGroupGifts(doc)`), appelée par `removeReservation` (`items.ts:479`), la suppression d'une liste (`membership.ts:71`) et l'annulation du cadeau entier par un membre.

États : `open` → `complete` (un participant, FR-010) → `open` (un participant le rouvre). Pas de clôture automatique (FR-012). Le passage à `complete` ne touche pas les participations.

## R4. Liste publique : qui voit quoi

**Decision** (`src/domain/read.ts`) :

| Idée | Invité qui ne participe pas | Participant |
|------|-----------------------------|-------------|
| Réservée seule (pas à lui) | absente (inchangé) | — |
| Cadeau commun ouvert | visible : « Cadeau commun », nombre de participants, total, reste ou « Montant atteint », lien vers la page du cadeau | visible, « Vous participez », même résumé |
| Cadeau commun complet | absente (FR-011) | visible, « Complet » |

Les noms des participants, leurs montants et messages ne sont jamais sur la liste publique : ils sont sur la page du cadeau (R6). « À moi » se calcule comme aujourd'hui (`mineReservationIdsFor`) : une participation est à moi par compte ou par preuve.

## R5. Montant et reste

**Decision** : `amount_cents` entier, `1 … 10 000 000` (100 000 €), saisi comme un prix (`parsePrice` de `src/domain/price.ts`, « 18,50 » ou « 18.50 »), affiché avec `formatPrice` (EUR). Reste = `max(0, priceCents − Σ amount_cents)` si l'idée a un prix, sinon pas de reste ; `goalReached = priceCents !== null && total ≥ priceCents`. Le prix est lu au moment de l'affichage : un prix changé par un membre recalcule le reste.

Changer son montant (FR-009) : compte seulement (`reservation.userId === userId`), tant que le cadeau existe (ouvert ou complet). Une participation sans compte n'est pas modifiable (ni montant ni message).

## R6. Page du cadeau et lien propre

**Decision** :
- `group_gifts.token` : jeton aléatoire (`newToken()` comme `readToken`), stocké tel quel comme `wishlists.read_token`, unique. Lien du site `/g/<token>` (court, comme `/l/<readToken>`), page `app/g/[token]/page.tsx`.
- La page du cadeau est le lieu unique des actions de participant (site et app) : résumé, participants, participer, ma participation (montant, se retirer), complet/rouvrir, inviter (copier/partager le lien), fil de messages. La carte de la liste publique renvoie vers elle (« Participer », « Voir le cadeau commun »).
- Ce que voit qui a accès (lien du cadeau ou de la liste) sans participer : l'idée (nom, image, prix, description, lien marchand), le titre de la liste, l'état, le nombre de participants, leurs noms (ou « Anonyme »), le total et le reste. Les montants par personne et les messages de participation sont réservés aux participants (FR-020) ; le fil aux participants avec compte (FR-016, FR-017).
- La page ne contient jamais le `readToken` de la liste ni ses autres idées (FR-014) : pas de lien « Revenir à la liste ».
- Mot de passe de lecture : la page demande le mot de passe de la liste ; le déverrouillage pose la même preuve que celui de la liste (cookie de déverrouillage du site, `unlockToken` de l'API), retrouvée côté serveur depuis le cadeau.
- Lien d'un cadeau disparu : 404 propre « Ce cadeau commun n'existe plus » (FR-015), sans titre de liste.
- `app/robots.ts` interdit `/g/` ; `src/site/analytics-public.ts` masque le jeton comme pour `/l/`.

**Alternatives considered** : `/l/<readToken>?gift=<id>` révélerait la liste entière (contraire à FR-014).

## R7. Preuves sans compte (cookie du site, téléphone)

**Constat** : la preuve est signée avec le `readToken` (`signReservationClaim`), le cookie du site est nommé d'après lui (`wl_rc_<hmac(readToken)>`), l'app range ses preuves par `readToken` (`mobile/src/features/guest/storage.ts`).

**Decision** :
- Site : une participation reçoit la même preuve qu'une réservation, dans le même cookie de la liste ; la page du cadeau retrouve la liste côté serveur et lit ce cookie. Rien ne change pour les participations faites depuis la liste.
- API / app : les réponses de la liste publique et du cadeau portent un `claimKey` opaque (le même condensé que le nom du cookie, qui ne révèle pas le `readToken`). L'app range chaque preuve avec son `claimKey` (et son `readToken` quand elle le connaît) et envoie, pour une liste comme pour un cadeau, les preuves de ce `claimKey`. Les preuves déjà rangées par `readToken` restent lues (compatibilité).
- Le serveur vérifie les preuves avec le `readToken` de la liste du cadeau, comme aujourd'hui.

## R8. Fil de messages

**Decision** : table `group_gift_messages` (`id`, `group_gift_id`, `user_id` nullable, `author_name` nullable, `body`, `created_at`). Lecture et écriture : participant avec compte (`reservations.user_id = user` sur ce cadeau). `author_name` est figé à l'écriture (nom donné à la participation, sinon nom du compte) pour que les messages d'un participant qui se retire restent signés (US5 sc. 4). Suppression de compte : `user_id` et `author_name` passent à `null` → « Ancien participant » (FR-028). Longueur max = `MAX_NOTE` (2000). Suppression de ses propres messages seulement ; pas de modification. Pas de temps réel : la page se recharge après un envoi ; l'app recharge au focus et en tirant vers le bas. Aucune notification (FR-018). Messages lus dans l'ordre de création, 200 derniers au plus par réponse.

## R9. Anciennes versions de l'app

**Constat** : `PublicItemView` n'a pas de champ `reserved` : l'app 1.x affiche comme libre toute idée renvoyée qui n'est pas `mine`. Elle réserve par `POST /public/lists/{readToken}/reservations` sans connaître de mode.

**Decision** :
- `GET /public/lists/{readToken}` ne renvoie un cadeau commun à un non-participant que si le client le demande (`?groupGifts=true`, envoyé par la nouvelle app). Sans ce paramètre, un cadeau commun est traité comme une réservation : absent, ou `mine` avec son `reservationId` pour un participant (l'ancienne app montre « Réservé par vous » et son annulation retire la participation). FR-026, SC-006.
- `POST …/reservations` sans `mode` = réservation seule : refusée par `itemAlreadyReserved` sur un cadeau commun.
- `MemberReservation` garde ses champs ; `groupGiftId` s'ajoute (nullable). L'ancienne app montre chaque participation comme une réservation, avec son annulation par un membre.
- Lien `/g/:token` : nouvelle ligne de `src/site/app-link-routes.json`. Comme pour la 026 (mémoire « Feature 026 en attente ») : sur iOS, le fichier d'association est lu en direct et une app qui ne connaît pas la route ouvre son accueil. **Ordre de sortie** : publier la version de l'app qui contient la 028 avant de merger sur `main`. Android : l'ancienne app ne réclame pas `/g/`, le lien reste au navigateur.

## R10. Membres de la liste

**Decision** : `toOffrirRows` regroupe les participations d'un même cadeau en une entrée (`groupGift: { id, status, participants: [{ reservationId, fromName, note }] }`), sans montant ni reste ni fil (FR-023). Annuler une participation = action actuelle. Annuler le cadeau entier : `cancelGroupGiftAsMember` (membre, FR-024). Mode surprise : inchangé (les participations sont des réservations). Export des données d'un membre (`account.ts:211`) : les participations y restent des réservations, sans montant.

## R11. Limites de débit

**Decision** : `rateLimitForIp` (`src/server/rate-limit.ts`) : lancer et participer partagent le seau de `reserve` (15/h) ; changer de montant, complet/rouvrir, se retirer : 30/h ; écrire un message : 30/h ; déverrouiller par le cadeau : même seau que le déverrouillage de la liste.

## R12. Constitution

**Decision** : la feature contredit le texte des principes III (« Deux personnes ne doivent pas pouvoir confirmer la même idée ») et V (mécanisme nouveau : montant annoncé, fil de messages). Amendement MINOR proposé à Cloé, à dater avant l'implémentation (plan.md, Complexity Tracking) :

- III : « … Deux personnes ne doivent pas pouvoir confirmer la même idée, sauf en participant ensemble à un cadeau commun ; une idée ne peut pas être à la fois réservée seule et cadeau commun, et un cadeau commun déclaré complet n'est plus proposable. »
- V : « Pas de paiement » reste ; ajouter que le montant annoncé et le fil de messages d'un cadeau commun servent à offrir une idée de la liste, sans collecte d'argent ni messagerie générale.

MINOR plutôt que MAJOR : la règle est étendue, pas retirée (la réservation seule garde exactement la règle actuelle).

## R13. Textes

Namespaces : `public` (liste publique, page du cadeau), `list` (onglet Réservations), `auth` (« Mes réservations »), `errors` (nouveaux codes), `mobile` (textes propres à l'app). Libellés : « Cadeau commun » / « Group gift », « Participer » / « Chip in », « Lancer un cadeau commun » / « Start a group gift », « Réserver seul » / « Reserve on my own », « Complet » / « Complete », « Il reste {{amount}} » / « {{amount}} to go », « Montant atteint » / « Goal reached », « Vous participez » / « You're chipping in ». Liste complète : contracts/screens.md.
