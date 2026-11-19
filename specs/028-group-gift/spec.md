# Feature Specification: Cadeau commun, plusieurs participants sur une même idée

**Feature Branch**: `028-group-gift`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "WISH-23 : cadeau commun". Ticket Plane WISH-23 « Cadeau commun : plusieurs participants sur une même idée » : permettre à plusieurs personnes de participer à un même cadeau. Aujourd'hui une réservation correspond à une seule personne. Family Gift gère les participations à plusieurs, avec en plus un réglage « cacher les participations » : qui participe reste caché, seule la disponibilité (disponible ou non) est visible. Repéré en étudiant Family Gift pour WISH-21, le 2026-11-17.

## Contexte

Aujourd'hui, une idée se réserve une seule fois :

| Qui | Ce qu'il voit |
|-----|---------------|
| Un invité (lien public, liste suivie, site et app) | « Réserver ce cadeau » ouvre un formulaire (nom et message facultatifs). Une fois réservée, l'idée disparaît de la liste publique, sauf pour la personne qui l'a réservée (« Réservé par vous », avec « Annuler la réservation »). Une deuxième réservation de la même idée est refusée (« déjà réservé »). |
| La personne qui a réservé avec son compte | La réservation figure dans « Mes réservations » (page Compte). |
| Un membre de la liste | L'idée réservée passe dans « Archives » ; l'onglet « Réservations » montre l'idée, « De la part de … » et le message, et permet d'annuler. En mode surprise (feature 020), rien de cela n'est visible tant qu'il ne le demande pas. |

Un cadeau cher (un vélo, une console) est souvent offert à plusieurs, parfois par des personnes qui ne connaissent pas la liste (des collègues). Aujourd'hui, une seule personne peut le réserver ; les autres s'organisent hors de l'application, sans savoir qui participe ni combien il reste à réunir.

Cette feature ajoute le **cadeau commun** : au moment de réserver, une personne choisit de lancer un cadeau commun. D'autres y **participent**, chacune avec un message et, si elle le veut, le montant qu'elle met ; l'application affiche ce qu'il reste à réunir. Un lien propre au cadeau permet d'inviter des personnes qui n'ont pas le lien de la liste. Les participants qui ont un compte peuvent changer leur montant et échanger dans un fil de messages. Un participant déclare enfin le cadeau **complet**.

**Constitution** : la feature demande un amendement daté de la constitution (décision : Cloé) :

- Principe III (« Deux personnes ne doivent pas pouvoir confirmer la même idée ») : plusieurs personnes peuvent participer à un cadeau commun ; un cadeau complet n'est plus proposable ; une idée ne peut pas être à la fois réservée seule et cadeau commun.
- Principe V (« On n'ajoute un mécanisme que s'il sert à créer, partager ou lire une liste ») : le montant annoncé (sans paiement) et le fil de messages entre participants servent à offrir un cadeau de la liste ; l'amendement le dit explicitement. « Pas de paiement » reste.

## Clarifications

### Session 2026-11-18

- Q: Qui ouvre un cadeau commun ? → A: la personne qui réserve choisit « Réserver seul » ou « Lancer un cadeau commun » ; les membres de la liste ne marquent rien à l'avance.
- Q: Les participations portent-elles un montant ? → A: aucun paiement, mais chacun peut annoncer « je mets tant », facultatif, et l'application déduit ce qu'il reste à réunir. Les participants peuvent envoyer un lien du cadeau commun à d'autres personnes (des collègues), qui s'enregistrent comme participants. Sans compte : un seul message et un montant. Avec un compte : accès à un fil de messages entre participants, et possibilité de changer son montant.
- Q: Réglage « Cacher les participations » ? → A: pas dans cette feature, il reste au backlog.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lancer un cadeau commun et y participer (Priority: P1)

Sur la liste publique, une personne choisit une idée. Le formulaire de réservation lui propose « Réserver seul » ou « Lancer un cadeau commun ». Elle lance un cadeau commun avec son nom (facultatif), un message (facultatif) et le montant qu'elle met (facultatif). L'idée reste visible des autres invités, marquée « Cadeau commun », avec le nombre de participants, ce qu'il reste à réunir et un bouton « Participer ». Une deuxième personne participe à son tour, avec son nom, son message et son montant. Chaque participant voit l'idée marquée « Vous participez », la liste des participants (nom, montant, message), le total annoncé et ce qu'il reste, et peut retirer sa participation.

**Why this priority**: c'est le besoin de WISH-23. Sans cette tranche, plusieurs personnes ne peuvent pas se partager un cadeau dans l'application.

**Independent Test**: sur la base de démo, ouvrir le lien public d'une liste dans deux navigateurs. Dans le premier, lancer un cadeau commun sur une idée à 100 € en mettant 30 € ; dans le second, l'idée est toujours là, « Cadeau commun · 1 participant · reste 70 € » ; y participer avec 50 € : les deux voient « reste 20 € » et le nom de l'autre.

**Acceptance Scenarios**:

1. **Given** une idée libre sur une liste publique, **When** un invité ouvre « Réserver ce cadeau », **Then** il choisit entre « Réserver seul » (comportement actuel) et « Lancer un cadeau commun ».
2. **Given** une idée libre, **When** un invité lance un cadeau commun, avec ou sans nom, message ou montant, **Then** sa participation est enregistrée et l'idée reste affichée sur la liste publique, marquée « Cadeau commun » et « Vous participez » pour lui.
3. **Given** un cadeau commun ouvert, **When** un autre invité ouvre la liste, **Then** il voit l'idée marquée « Cadeau commun » avec le nombre de participants, ce qu'il reste à réunir (si l'idée a un prix) et « Participer », sans bouton « Réserver ce cadeau ».
4. **Given** un cadeau commun ouvert, **When** un invité y participe, **Then** le nombre de participants augmente d'un, le total annoncé augmente de son montant, et ce qu'il reste diminue d'autant.
5. **Given** un participant, **When** il ouvre la liste, **Then** il voit chaque participant (nom donné, ou « Anonyme »), son montant (ou « montant non précisé ») et son message, le total annoncé et ce qu'il reste.
6. **Given** une idée sans prix, **When** des personnes y participent, **Then** seuls le total annoncé et le nombre de participants s'affichent, sans « reste ».
7. **Given** un total annoncé égal ou supérieur au prix, **When** la liste s'affiche, **Then** le cadeau est marqué « Montant atteint » (sans montant négatif), et reste ouvert tant qu'un participant ne l'a pas déclaré complet.
8. **Given** un invité qui participe déjà, **When** il rouvre la liste, **Then** il ne peut pas participer une deuxième fois ; il peut retirer sa participation après confirmation. Si c'était le dernier participant, l'idée redevient libre.
9. **Given** un participant connecté à son compte, **When** il ouvre « Mes réservations », **Then** sa participation y figure, marquée « Cadeau commun », avec son montant et ce qu'il reste.

---

### User Story 2 - Déclarer le cadeau commun complet (Priority: P1)

Quand le compte est bon, un participant déclare le cadeau « complet ». L'idée cesse d'être proposée aux personnes qui n'y participent pas, comme une idée réservée. Les participants continuent de la voir et peuvent la rouvrir.

**Why this priority**: sans elle, un cadeau commun reste ouvert sans fin et d'autres personnes s'y joignent alors qu'il est déjà acheté ; le principe III (pas de doublon) ne tient plus.

**Independent Test**: dans un des deux navigateurs de l'US1, déclarer le cadeau complet ; dans un troisième navigateur sans participation, l'idée n'apparaît plus sur la liste publique ; les deux participants la voient toujours, marquée « Complet ».

**Acceptance Scenarios**:

1. **Given** un cadeau commun ouvert, **When** un participant le déclare complet, **Then** l'idée disparaît de la liste publique pour les personnes qui n'y participent pas.
2. **Given** un cadeau commun complet, **When** un participant ouvre la liste, **Then** il voit l'idée marquée « Complet », les participations, et peut le rouvrir.
3. **Given** un cadeau commun complet, **When** une personne qui n'y participe pas tente d'y participer (page ouverte avant, ou lien du cadeau), **Then** elle reçoit un message clair : le cadeau n'est plus disponible.
4. **Given** un cadeau commun complet, **When** un participant se retire, **Then** le cadeau reste complet ; s'il était le dernier, l'idée redevient libre.

---

### User Story 3 - Inviter d'autres personnes avec le lien du cadeau (Priority: P2)

Un participant récupère le lien du cadeau commun (« Copier le lien », ou le partage du téléphone) et l'envoie à des collègues qui n'ont pas le lien de la liste. En l'ouvrant, un collègue voit l'idée, les participants, le total et ce qu'il reste, et peut participer, sans compte, avec son nom, un message et un montant. Le lien ne donne accès qu'à ce cadeau, pas au reste de la liste.

**Why this priority**: c'est ce qui permet de réunir un cadeau entre collègues ou amis qui ne connaissent pas la liste. Le cadeau commun a déjà de la valeur sans lui (US1), entre personnes qui ont le lien de la liste.

**Independent Test**: après l'US1, copier le lien du cadeau dans un navigateur participant, l'ouvrir dans un navigateur neuf : la page montre l'idée et ses participants, sans les autres idées de la liste ; y participer : le nombre de participants augmente dans les autres navigateurs.

**Acceptance Scenarios**:

1. **Given** un participant, **When** il ouvre le cadeau commun, **Then** il voit « Inviter à participer » avec le lien du cadeau à copier ou partager.
2. **Given** le lien du cadeau, **When** une personne l'ouvre, **Then** elle voit l'idée (nom, image, prix, description), le nom de la liste, les participants, le total, ce qu'il reste et « Participer », sans les autres idées de la liste.
3. **Given** le lien d'un cadeau complet, **When** une personne qui n'y participe pas l'ouvre, **Then** elle voit que le cadeau est complet et ne peut pas participer.
4. **Given** le lien d'un cadeau qui n'existe plus (dernier participant retiré, annulé par un membre), **When** une personne l'ouvre, **Then** elle voit que ce cadeau commun n'existe plus, sans accès à la liste.
5. **Given** une liste protégée par un mot de passe de lecture, **When** une personne ouvre le lien du cadeau, **Then** le mot de passe lui est demandé, comme pour la liste.

---

### User Story 4 - Changer son montant, avec un compte (Priority: P2)

Un participant connecté à son compte peut changer le montant qu'il met (ou le retirer), tant que le cadeau existe. Ce qu'il reste se met à jour pour tous. Un participant sans compte garde le montant qu'il a donné ; pour le changer, il retire sa participation et participe de nouveau, ou crée un compte avant de participer.

**Why this priority**: les montants bougent souvent pendant qu'on réunit un cadeau (quelqu'un se désiste, le prix change). Le cadeau commun marche sans, au prix d'un retrait et d'une nouvelle participation.

**Independent Test**: participer connecté avec 30 €, changer pour 40 € : le reste diminue de 10 € dans l'autre navigateur. Participer sans compte : aucun bouton pour changer le montant, et une phrase qui explique qu'un compte le permet.

**Acceptance Scenarios**:

1. **Given** un participant connecté, **When** il change son montant, **Then** son nouveau montant, le total et ce qu'il reste s'affichent pour tous les participants.
2. **Given** un participant sans compte, **When** il regarde sa participation, **Then** il ne peut pas changer son montant ni son message, et une phrase lui dit qu'un compte permet de changer son montant et d'accéder aux messages.
3. **Given** un participant connecté, **When** il efface son montant, **Then** sa participation reste, avec « montant non précisé ».

---

### User Story 5 - Échanger entre participants dans un fil de messages (Priority: P3)

Les participants qui ont un compte disposent d'un fil de messages propre au cadeau commun : qui achète, où, quand on se retrouve. Chacun y écrit et lit les messages des autres, dans l'ordre. Les participants sans compte n'y ont pas accès ; leur message de participation reste visible de tous les participants. Les membres de la liste ne voient jamais ce fil (il parle de leur cadeau).

**Why this priority**: c'est un confort de coordination ; les participants peuvent s'organiser par leurs messages de participation ou hors de l'application.

**Independent Test**: deux participants connectés écrivent chacun un message dans le fil : chacun voit les deux, dans l'ordre. Un participant sans compte voit qu'un fil existe pour les participants avec un compte, sans son contenu. Un membre de la liste ne voit aucun fil.

**Acceptance Scenarios**:

1. **Given** un participant connecté, **When** il ouvre le cadeau commun, **Then** il voit le fil de messages et peut y écrire.
2. **Given** un message écrit par un participant, **When** un autre participant connecté ouvre le fil, **Then** il voit le message, son auteur (nom donné, ou nom du compte) et sa date.
3. **Given** son propre message, **When** un participant le supprime, **Then** il disparaît du fil pour tous.
4. **Given** un participant qui se retire, **When** le fil s'affiche, **Then** il n'y a plus accès ; ses messages restent, signés de son nom.
5. **Given** un participant sans compte, ou une personne qui n'est pas participante, **When** elle ouvre le cadeau, **Then** elle ne voit pas le contenu du fil et ne peut pas y écrire.
6. **Given** un membre de la liste qui ne participe pas, **When** il ouvre sa liste ou l'onglet « Réservations », **Then** il ne voit ni le fil ni son existence.

---

### User Story 6 - Le cadeau commun vu par les membres de la liste (Priority: P2)

Pour les membres de la liste, un cadeau commun avec au moins un participant compte comme une idée réservée : il passe dans « Archives » et figure dans l'onglet « Réservations » sur une seule entrée, marquée « Cadeau commun », avec chaque participant (« De la part de … » et son message), sans les montants ni le fil de messages. Un membre peut annuler une participation, ou tout le cadeau commun. Le mode surprise (feature 020) cache les cadeaux communs comme les réservations.

**Why this priority**: les membres ont déjà ces informations pour une réservation seule ; sans cette tranche, ils voient des réservations éparses ou rien. Elle n'est pas nécessaire pour que les invités se partagent un cadeau.

**Independent Test**: après l'US1, se connecter en membre de la liste : l'idée est dans « Archives », l'onglet « Réservations » montre « Cadeau commun · 2 participants » avec les deux noms et messages, sans montant. Activer le mode surprise : l'entrée disparaît comme les autres réservations.

**Acceptance Scenarios**:

1. **Given** un cadeau commun avec deux participants, **When** un membre ouvre l'onglet « Réservations », **Then** il voit une seule entrée pour l'idée, marquée « Cadeau commun », avec chaque participant, son nom et son message, sans montant ni « reste ».
2. **Given** un cadeau commun ouvert ou complet, **When** un membre ouvre la liste hors mode surprise, **Then** l'idée est dans « Archives », comme une idée réservée.
3. **Given** un membre en mode surprise, **When** il ouvre sa liste, **Then** le cadeau commun reste dans « Idées », sans marque, comme une idée réservée en mode surprise.
4. **Given** un cadeau commun, **When** un membre annule une participation, **Then** seule celle-ci disparaît ; **When** il annule le cadeau commun, **Then** toutes les participations et le fil disparaissent, le lien du cadeau ne mène plus à rien et l'idée redevient libre.
5. **Given** un cadeau commun, **When** un membre tente de supprimer ou de déplacer l'idée, **Then** c'est refusé comme pour une idée réservée.

---

### User Story 7 - Le cadeau commun dans l'app mobile (Priority: P2)

Dans l'app, la vue invité d'une liste (lien ouvert, liste suivie) et le lien d'un cadeau commun offrent les mêmes actions que le site : lancer, participer, se retirer, déclarer complet, inviter avec le lien, changer son montant et le fil de messages (avec un compte). Côté membre, l'onglet « Réservations » de l'app montre les cadeaux communs comme le site.

**Why this priority**: l'app est publiée sur les stores et une bonne part des invités l'utilisent. Le site seul suffit à livrer la valeur des US1 à US6.

**Independent Test**: dans le simulateur, ouvrir une liste suivie, participer à un cadeau commun lancé sur le site : le nombre de participants et le reste se mettent à jour sur le site comme dans l'app ; ouvrir le lien du cadeau sur le téléphone : il s'ouvre dans l'app.

**Acceptance Scenarios**:

1. **Given** un cadeau commun ouvert, **When** un invité l'ouvre dans l'app, **Then** il voit « Cadeau commun », le nombre de participants, ce qu'il reste et « Participer », comme sur le site.
2. **Given** un invité qui participe depuis l'app avec son compte, **When** il rouvre la liste sur le site avec le même compte, **Then** il y voit « Vous participez », son montant et le fil.
3. **Given** le lien d'un cadeau commun ouvert sur un téléphone où l'app est installée, **When** la personne le touche, **Then** il s'ouvre dans l'app ; avec une version de l'app qui ne le connaît pas, il s'ouvre sur le site.
4. **Given** une ancienne version de l'app, **When** elle affiche une liste avec un cadeau commun, **Then** le cadeau n'y apparaît jamais comme une idée libre, et une réservation seule tentée dessus est refusée (« déjà réservé »).

---

### Edge Cases

- **Actions simultanées** : deux personnes qui lancent un cadeau commun, ou l'une qui réserve seule pendant que l'autre lance un cadeau commun, sur la même idée : la première action enregistrée gagne ; la seconde reçoit un message clair (« déjà réservé » pour une réservation seule ; si un cadeau commun vient d'être lancé, elle peut y participer).
- **Participation sur un cadeau déclaré complet entre-temps** : refusée avec « ce cadeau n'est plus disponible ».
- **Même personne qui participe deux fois** (deux onglets, site puis app avec le même compte) : refusé. Une personne sans compte est reconnue par la preuve de participation gardée par son navigateur ou son téléphone, comme pour l'annulation d'une réservation aujourd'hui ; si elle change d'appareil, elle peut participer de nouveau (accepté, comme une réservation seule sans compte).
- **Participation sans nom** : affichée « Anonyme » aux autres participants et aux membres.
- **Montant invalide** (négatif, nul, non numérique, démesuré) : refusé avec un message clair ; le montant est facultatif.
- **Prix de l'idée changé par un membre** pendant le cadeau commun : ce qu'il reste se recalcule sur le nouveau prix ; un prix retiré fait disparaître le « reste ».
- **Total supérieur au prix** : « Montant atteint », jamais de reste négatif.
- **Idée archivée ou supprimée** : impossible tant qu'elle a un participant (comme une réservation seule) ; une idée archivée avant le lancement n'est pas proposable.
- **Liste supprimée** : le cadeau commun, ses participations, son fil et son lien disparaissent avec elle.
- **Lien du cadeau** : il ne révèle ni le lien de la liste, ni ses autres idées ; deviner le lien d'un autre cadeau est impossible en pratique.
- **Un membre de la liste qui participe** (depuis le lien public ou le lien du cadeau) : possible, comme il peut réserver aujourd'hui ; il voit alors le fil en tant que participant. Son mode surprise ne lui cache pas sa propre participation sur la liste publique.
- **Compte supprimé** : ses participations restent, détachées du compte, comme ses réservations aujourd'hui (le cadeau garde son total) ; ses messages du fil restent, signés « Ancien participant ».
- **Export des données d'un compte** : ses participations (montant compris) et ses messages du fil y figurent.
- **Limite de débit** : lancer, participer, se retirer, changer de montant et écrire dans le fil suivent une limite de débit, comme la réservation.
- **Messages** : texte seul, longueur maximale comme le message d'une réservation ; un participant ne supprime que ses propres messages.

## Requirements *(mandatory)*

### Functional Requirements

**Lancement et participation**

- **FR-001**: Le formulaire de réservation d'une idée libre (non réservée, non archivée) MUST proposer « Réserver seul » et « Lancer un cadeau commun » ; lancer un cadeau commun enregistre la première participation.
- **FR-002**: Toute personne qui a accès à la liste publique ou au lien du cadeau (mot de passe de lecture le cas échéant) MUST pouvoir participer à un cadeau commun ouvert, sans compte, avec un nom, un message et un montant tous facultatifs ; nom et message suivent les longueurs maximales de la réservation.
- **FR-003**: Une même personne (même compte, ou même preuve de participation) MUST NOT pouvoir participer deux fois au même cadeau commun.
- **FR-004**: Un participant MUST pouvoir retirer sa propre participation, après confirmation, avec les mêmes preuves que l'annulation d'une réservation (compte, ou preuve gardée par le navigateur ou le téléphone).
- **FR-005**: Quand le dernier participant se retire, l'idée MUST redevenir libre, et le lien du cadeau et le fil MUST disparaître.
- **FR-006**: Une idée réservée seule MUST NOT pouvoir devenir un cadeau commun, et un cadeau commun MUST NOT pouvoir être réservé seul.

**Montants**

- **FR-007**: Une participation MUST pouvoir porter un montant facultatif, strictement positif, dans la devise des prix de la liste, sans aucun paiement.
- **FR-008**: L'application MUST afficher aux invités le total annoncé et, si l'idée a un prix, ce qu'il reste à réunir (prix moins total), jamais négatif ; « Montant atteint » quand le total atteint le prix.
- **FR-009**: Un participant connecté à son compte MUST pouvoir changer ou effacer son montant tant que le cadeau existe ; un participant sans compte MUST NOT pouvoir changer son montant ni son message.

**Complet**

- **FR-010**: Un participant MUST pouvoir déclarer le cadeau commun complet, et le rouvrir.
- **FR-011**: Un cadeau commun complet MUST NOT être proposé aux personnes qui n'y participent pas, et toute nouvelle participation MUST être refusée avec un message clair.
- **FR-012**: Un cadeau commun MUST rester ouvert jusqu'à sa déclaration « complet », même quand le montant est atteint ; aucune clôture automatique.

**Lien du cadeau**

- **FR-013**: Chaque cadeau commun MUST avoir un lien propre, que tout participant peut copier ou partager.
- **FR-014**: Le lien du cadeau MUST donner accès à ce seul cadeau (idée, nom de la liste, participants, total, reste, participation), jamais aux autres idées ni au lien de la liste ; il MUST demander le mot de passe de lecture si la liste en a un.
- **FR-015**: Le lien d'un cadeau qui n'existe plus MUST afficher un message clair, sans rien révéler de la liste.

**Fil de messages**

- **FR-016**: Les participants connectés à un compte MUST pouvoir lire et écrire dans un fil de messages propre au cadeau commun ; un participant MUST pouvoir supprimer ses propres messages.
- **FR-017**: Le fil MUST NOT être lisible par les participants sans compte, les personnes qui ne participent pas, ni les membres de la liste qui ne participent pas.
- **FR-018**: Aucun e-mail ni notification MUST NOT être envoyé pour une participation, un changement de montant, un message ou un cadeau complet.

**Affichage**

- **FR-019**: Sur la liste publique, un cadeau commun ouvert MUST rester visible des invités, marqué « Cadeau commun » avec le nombre de participants, le reste (FR-008) et « Participer ».
- **FR-020**: Un participant MUST voir l'idée marquée « Vous participez », l'état (ouvert ou complet) et chaque participation (nom ou « Anonyme », montant ou « montant non précisé », message).
- **FR-021**: « Mes réservations » MUST afficher les participations faites avec le compte, marquées « Cadeau commun », avec le montant et ce qu'il reste.

**Membres de la liste**

- **FR-022**: Pour les membres de la liste, un cadeau commun avec au moins un participant MUST se comporter comme une idée réservée (Archives, refus de suppression et de déplacement, mode surprise).
- **FR-023**: L'onglet « Réservations » MUST montrer un cadeau commun sur une seule entrée, avec chaque participant, son nom et son message, sans montant, sans reste et sans le fil.
- **FR-024**: Un membre de la liste MUST pouvoir annuler une participation, ou le cadeau commun entier (participations, fil et lien).

**App mobile, API et assistant**

- **FR-025**: L'app mobile MUST offrir, dans la vue invité, à l'ouverture du lien du cadeau et dans l'onglet « Réservations » des membres, les mêmes actions et informations que le site.
- **FR-026**: Les anciennes versions de l'app MUST continuer de fonctionner : un cadeau commun y apparaît comme réservé, jamais comme une idée libre ; une réservation seule tentée dessus est refusée (« déjà réservé ») ; le lien du cadeau s'ouvre sur le site quand l'app installée ne le connaît pas.
- **FR-027**: L'assistant relié au compte (feature 013) MUST voir un cadeau commun avec au moins un participant comme « réservé », sans plus de détail que pour une réservation seule.

**Données et textes**

- **FR-028**: L'export des données d'un compte MUST inclure ses participations et ses messages ; la suppression d'un compte MUST garder ses participations détachées du compte (comme ses réservations) et signer ses messages « Ancien participant ».
- **FR-029**: Tous les nouveaux textes MUST exister en français et en anglais, avec le lexique du produit (« idée », « liste », « réserver ») ; les libellés exacts (« Cadeau commun » / « Group gift », « Participer », « Complet », « Il reste … ») se fixent au plan.

### Key Entities

- **Cadeau commun** : une idée ouverte à plusieurs participants. Porte son état (ouvert ou complet) et son lien propre. N'existe que tant qu'il a au moins un participant.
- **Participation** : la part d'une personne à un cadeau commun : nom, message et montant facultatifs, compte si elle était connectée, date. Se retire avec une preuve (compte ou preuve gardée par l'appareil) ; montant modifiable seulement avec un compte.
- **Message du fil** : un texte écrit par un participant connecté dans le fil d'un cadeau commun, avec son auteur et sa date.
- **Réservation** (existante) : inchangée pour une idée réservée seule.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Deux personnes sans compte, chacune sur son appareil, peuvent participer au même cadeau commun en moins d'une minute chacune, sans se coordonner hors de l'application.
- **SC-002**: Une personne qui n'a que le lien du cadeau peut y participer en moins d'une minute, sans jamais voir les autres idées de la liste.
- **SC-003**: Ce qu'il reste à réunir est toujours égal au prix moins la somme des montants annoncés (ou « Montant atteint »), sur le site comme dans l'app, juste après chaque participation, retrait ou changement de montant.
- **SC-004**: Aucune idée ne peut être à la fois réservée seule et cadeau commun, ni recevoir une participation une fois déclarée complète, même avec des actions simultanées (vérifié par des tests sur chaque combinaison).
- **SC-005**: Un membre de la liste qui ne participe pas ne voit jamais les montants ni le fil ; en mode surprise, il ne voit aucun indice d'un cadeau commun tant qu'il ne demande pas à voir les réservations.
- **SC-006**: Les versions de l'app publiées avant la feature n'affichent jamais un cadeau commun comme une idée libre.
- **SC-007**: Chaque parcours (lancer, participer, inviter avec le lien, changer son montant, fil de messages, déclarer complet, vue membre) est confirmé à la main sur la base de démo, sur le site et dans l'app.

## Assumptions

- **Pas de paiement** (principe V) : le cadeau commun coordonne qui participe et combien chacun annonce ; il ne collecte ni ne répartit d'argent. L'achat se fait hors de l'application, par un des participants.
- **Clôture par un participant** : n'importe quel participant peut déclarer complet ou rouvrir ; pas de « responsable » du cadeau commun. Les membres de la liste ne déclarent pas complet (ils gardent l'annulation).
- **Membres de la liste** : ils voient les noms et messages de participation, comme pour une réservation aujourd'hui (le formulaire le dit déjà), mais ni les montants ni le fil, qui concernent l'organisation du cadeau qu'ils reçoivent.
- **Lien du cadeau** : propre au cadeau commun, il ne donne pas accès au reste de la liste ; il reste soumis au mot de passe de lecture de la liste. Pas de révocation du lien dans cette feature : il cesse de marcher quand le cadeau commun disparaît.
- **Sans compte** : un nom, un seul message et un montant à la participation, non modifiables ; le retrait reste possible avec la preuve gardée par l'appareil.
- **Fil de messages** : texte seul, sans pièce jointe, sans modification d'un message envoyé (suppression seulement), sans notification.
- **Pas de nombre maximal de participants**, au-delà de la limite de débit.
- **Réservation seule inchangée** : le parcours « Réserver seul » reste celui d'aujourd'hui.
- **« Cacher les participations »** (repéré chez Family Gift) : hors de cette feature, gardé au backlog.
- **Amendement de la constitution** (principes III et V) : à faire par Cloé avant l'implémentation ; le plan le rappelle.
- **App mobile** : la feature demande une nouvelle version de l'app (US7) ; le site peut partir avant elle, les anciennes versions restant correctes grâce à FR-026.
