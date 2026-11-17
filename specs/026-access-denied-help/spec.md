# Feature Specification: Aide sur la page « Accès refusé » d'une liste

**Feature Branch**: `026-access-denied-help`

**Created**: 2026-11-17

**Status**: Draft

**Ticket** : WISH-30

**Input**: User description: "Page « Accès refusé » d'une liste : quand une personne connectée ouvre l'adresse de gestion d'une liste (/lists/<id>) dont elle n'est pas membre (cas réel en prod : la propriétaire a copié l'adresse de son navigateur au lieu du lien de partage public /l/<readToken>), la page affiche seulement « Accès refusé / Vous n'êtes pas membre de cette liste » sans piste. Elle doit expliquer que cette adresse est réservée aux personnes qui gèrent la liste, et inviter à demander à la propriétaire son lien de partage (onglet « Partage »), avec un chemin de retour (ses listes). Regarder aussi l'équivalent dans l'app mobile, et côté propriétaire rendre plus évident quel lien partager." Précision ensuite : l'app mobile doit aussi recevoir l'adresse de gestion et rediriger vers un écran de l'app qui prévient que ce n'est pas le bon lien.

## Contexte

Le 2026-11-17, en prod, une personne a reçu de sa sœur l'adresse de la page de gestion d'une liste toute neuve (copiée depuis la barre d'adresse du navigateur, sous son ancienne forme `/connexion?next=/listes/<id>`). La liste n'était partagée avec personne. Après connexion, la destinataire a vu « Vous n'avez pas accès à la modification de cette liste. Vous n'êtes pas membre de cette liste. » sans savoir quoi faire ni quoi demander.

Deux adresses coexistent pour une même liste :

- l'adresse de **gestion** (réservée aux membres), celle que la propriétaire voit dans son navigateur ;
- le **lien de la liste** (lecture et réservation, sans compte), donné dans l'onglet « Partage ».

Le refus est voulu (principe II de la constitution : un compte non membre ne modifie rien). Ce qui manque, c'est l'explication et la porte de sortie, de part et d'autre.

Aujourd'hui l'app mobile ne prend pas en charge les adresses de gestion du site : sur un téléphone où elle est installée, l'adresse s'ouvre dans le navigateur. La raison donnée à la feature 011 (l'app ouvrait ces pages du site pour « Gérer le partage sur le site ») n'existe plus : l'app a son propre écran « Partager ». Elle doit maintenant recevoir ces adresses, comme elle reçoit déjà le lien de la liste et le lien d'invitation, et réagir comme le site.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprendre le refus et savoir quoi demander (Priority: P1)

Une personne connectée ouvre l'adresse de gestion d'une liste dont elle n'est pas membre. Au lieu d'un simple refus, la page lui explique que cette adresse sert à gérer la liste et n'ouvre que pour les personnes qui la gèrent, que pour voir la liste il lui faut le **lien de la liste**, et qu'elle peut le demander à la personne qui le lui a envoyé (qui le trouve dans l'onglet « Partage » de sa liste). Elle peut revenir à ses listes d'un clic.

**Why this priority**: c'est le cas observé en prod. Sans cette aide, la personne reste bloquée et la propriétaire ne sait pas pourquoi son lien « ne marche pas ».

**Independent Test**: sur la base de démo, se connecter avec un compte A, ouvrir l'adresse de gestion d'une liste du compte B : la page explique le refus, nomme le lien à demander et propose le retour à « Mes listes ».

**Acceptance Scenarios**:

1. **Given** une personne connectée qui n'est ni membre ni abonnée d'une liste, **When** elle ouvre l'adresse de gestion de cette liste, **Then** elle voit un titre clair, une explication (adresse réservée aux personnes qui gèrent la liste), l'invitation à demander le lien de la liste à la personne qui le lui a envoyé, et un bouton vers ses listes.
2. **Given** une personne non connectée, **When** elle ouvre l'ancienne adresse `/connexion?next=/listes/<id>` puis se connecte, **Then** elle arrive sur cette même page d'aide (et non sur une page d'erreur muette).
3. **Given** une personne non membre, **When** elle voit la page d'aide, **Then** la page ne révèle ni le titre de la liste, ni le nom de sa propriétaire, ni aucun lien de partage.
4. **Given** la page d'aide, **When** on l'affiche en français puis en anglais, **Then** les deux textes disent la même chose, et le français vouvoie et garde le lexique du produit (« liste », « lien de la liste »).

---

### User Story 2 - L'app ouvre l'adresse de gestion et explique quand elle n'est pas la bonne (Priority: P2)

Sur un téléphone où l'app est installée, une personne touche l'adresse de gestion d'une liste (reçue par message). L'app s'ouvre au lieu du navigateur. Si la personne gère cette liste, l'app ouvre la liste. Sinon, elle affiche un écran qui dit la même chose que la page d'aide du site : cette adresse sert à gérer la liste, il faut demander le lien de la liste à la personne qui l'a envoyée, avec un retour vers ses listes.

**Why this priority**: la plupart des liens se partagent par message et s'ouvrent sur téléphone. Sans cela, l'app installée ne sert à rien sur ce lien, et la personne qui gère la liste ne retrouve pas sa liste dans l'app.

**Independent Test**: dans le simulateur, avec l'app connectée à la démo, ouvrir l'adresse de gestion d'une liste d'un autre compte : l'écran d'aide s'affiche ; ouvrir celle d'une liste du compte connecté : la liste s'ouvre dans l'app.

**Acceptance Scenarios**:

1. **Given** l'app installée et connectée avec un compte non membre de la liste, **When** la personne ouvre l'adresse de gestion de cette liste, **Then** l'app affiche l'écran d'aide (explication, lien à demander, retour à ses listes), sans rien révéler de la liste.
2. **Given** l'app connectée avec un compte membre de la liste, **When** la personne ouvre l'adresse de gestion, **Then** l'app ouvre cette liste ; si l'adresse vise un onglet (partage, archives, réservations, réglages), l'app ouvre l'écran correspondant quand il existe.
3. **Given** l'app connectée avec un compte qui suit la liste sans en être membre, **When** la personne ouvre l'adresse de gestion, **Then** l'écran d'aide propose d'ouvrir la liste suivie (comme US3 sur le site).
4. **Given** l'app sans session, **When** la personne ouvre l'adresse de gestion, **Then** l'app demande de se connecter puis reprend l'adresse (liste ou écran d'aide).
5. **Given** les anciennes adresses françaises (`/listes/<id>`, `/connexion?next=/listes/<id>`), **When** la personne les ouvre sur le téléphone, **Then** l'app réagit comme pour l'adresse actuelle.
6. **Given** une liste inexistante, **When** la personne ouvre son adresse de gestion dans l'app, **Then** l'app affiche le même écran d'aide (elle ne distingue pas « inexistante » de « pas membre »).

---

### User Story 3 - Accès direct pour une personne qui suit déjà la liste (Priority: P3)

Une personne qui suit déjà la liste (elle l'a ouverte avec le lien de la liste et l'a ajoutée à ses listes suivies) ouvre l'adresse de gestion de cette liste. La page lui propose directement d'ouvrir la liste, puisqu'elle y a déjà accès en lecture.

**Why this priority**: cas plus rare, mais la réponse est immédiate et ne révèle rien que la personne n'ait déjà.

**Independent Test**: sur la démo, avec un compte qui suit une liste d'un autre compte, ouvrir l'adresse de gestion de cette liste : un bouton ouvre la liste en lecture.

**Acceptance Scenarios**:

1. **Given** une personne connectée qui suit la liste sans en être membre, **When** elle ouvre l'adresse de gestion, **Then** la page explique que cette adresse sert à gérer la liste et propose un bouton « Voir la liste » qui ouvre la liste en lecture.
2. **Given** cette même liste protégée par un mot de passe de lecture, **When** la personne clique sur « Voir la liste », **Then** les règles habituelles du mot de passe de lecture s'appliquent (pas de contournement).

---

### User Story 4 - La propriétaire partage le bon lien (Priority: P4)

La propriétaire d'une liste, sur la page de gestion de sa liste, trouve sans chercher comment la partager : une action « Partager » visible en haut de la page mène au lien de la liste, et l'onglet « Partage » précise que l'adresse affichée par le navigateur sur cette page n'est pas celle à envoyer.

**Why this priority**: prévient l'erreur à la source, mais la page d'aide (US1) suffit déjà à débloquer la situation.

**Independent Test**: sur la démo, en propriétaire, ouvrir une liste : l'action « Partager » est visible sans changer d'onglet, mène au lien de la liste, et l'avertissement sur l'adresse du navigateur est lisible dans l'onglet « Partage ».

**Acceptance Scenarios**:

1. **Given** une membre sur n'importe quel onglet de sa liste, **When** elle regarde le haut de la page, **Then** elle voit une action « Partager » qui mène à l'onglet « Partage ».
2. **Given** l'onglet « Partage », **When** la membre le lit, **Then** il indique que l'adresse de cette page est réservée aux personnes qui gèrent la liste et que, pour partager, il faut envoyer le lien de la liste.

---

### Edge Cases

- Liste inexistante (adresse erronée ou liste supprimée) : comportement actuel inchangé (page introuvable).
- Personne qui doit changer son mot de passe : elle est d'abord envoyée vers son compte, comme aujourd'hui.
- Personne retirée de la liste par un membre : elle voit la page d'aide (US1), ce qui est correct.
- Personne qui suit la liste sans en être membre, alors que le lien de la liste a été régénéré ou que l'abonnement n'existe plus : le bouton « Voir la liste » n'apparaît que si l'abonnement est en place, et il utilise le lien de lecture en vigueur.
- App ouverte sur un autre serveur que celui de l'adresse reçue : l'adresse n'est pas reconnue, comme les autres liens (comportement actuel).
- App hors ligne à l'ouverture de l'adresse : si la liste est dans les listes déjà connues de l'app, elle s'ouvre ; sinon l'app ne peut pas trancher et affiche l'écran d'aide.
- Lien d'invitation (gestion à plusieurs) reçu à la place du lien de la liste : hors périmètre, il fonctionne déjà et fait rejoindre la liste.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quand une personne connectée non membre ouvre l'adresse de gestion d'une liste existante, le site DOIT afficher une page qui (a) explique que cette adresse sert à gérer la liste et n'ouvre qu'aux personnes qui la gèrent, (b) indique que pour voir la liste et réserver une idée il faut le lien de la liste, (c) invite à le demander à la personne qui a envoyé l'adresse, en précisant qu'elle le trouve dans l'onglet « Partage » de sa liste.
- **FR-002**: Cette page DOIT proposer un retour vers les listes de la personne.
- **FR-003**: Cette page NE DOIT révéler aucune information sur la liste (titre, propriétaire, membres, idées, liens) à une personne qui n'est ni membre ni abonnée.
- **FR-004**: Si la personne suit déjà la liste, la page DOIT proposer d'ouvrir la liste en lecture, avec les mêmes règles d'accès que depuis ses listes suivies (mot de passe de lecture compris).
- **FR-005**: Le refus de modification reste entier : la page d'aide ne donne aucun moyen de modifier la liste ni de la rejoindre.
- **FR-006**: Sur la page de gestion d'une liste, une membre DOIT disposer d'une action « Partager » visible depuis tous les onglets, qui mène à l'onglet « Partage ».
- **FR-007**: L'onglet « Partage » DOIT indiquer que l'adresse de la page de gestion n'est pas celle à envoyer et que le lien à partager est le lien de la liste.
- **FR-008**: Tous les nouveaux textes DOIVENT exister en français et en anglais, avec les mêmes clés.
- **FR-009**: Les adresses d'avant la feature 018 (`/connexion?next=/listes/<id>`, `/listes/<id>`) DOIVENT aboutir à la même page d'aide après connexion.
- **FR-010**: L'app mobile DOIT prendre en charge l'adresse de gestion d'une liste (et ses formes d'avant la feature 018, y compris par la page de connexion) : elle ouvre la liste pour un membre, l'écran d'aide sinon.
- **FR-011**: L'écran d'aide de l'app DOIT donner les mêmes informations que la page d'aide du site (FR-001 à FR-005), dans les deux langues, avec le même aspect que le reste de l'app.
- **FR-012**: Sans session, l'app DOIT faire se connecter la personne puis reprendre l'adresse reçue.
- **FR-013**: Dans l'app, une adresse visant un onglet de la page de gestion ouvre l'écran correspondant de la liste quand l'app en a un, sinon la liste.

### Key Entities

- **Liste** : son adresse de gestion (membres seulement) et son lien de la liste (lecture et réservation, sans compte).
- **Membre** : personne qui gère la liste (propriétaire ou invitée à la gérer).
- **Abonnement** : une personne qui suit la liste en lecture ; seul cas où la page d'aide propose d'ouvrir la liste.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Une personne non membre qui arrive sur l'adresse de gestion d'une liste sait, en lisant la page une fois, quel lien demander et à qui, sans aide extérieure.
- **SC-002**: Depuis la page d'aide, la personne revient à ses listes en un clic ; si elle suit la liste, elle l'ouvre en un clic.
- **SC-003**: Une propriétaire atteint le lien de la liste en un clic depuis n'importe quel onglet de sa page de gestion.
- **SC-004**: Aucune information sur la liste (titre, propriétaire, idées, liens) n'apparaît sur la page d'aide pour une personne ni membre ni abonnée.
- **SC-005**: Sur un téléphone où l'app est installée, l'adresse de gestion d'une liste ouvre l'app (et non le navigateur) dans 100 % des cas couverts par la suite e2e : liste pour un membre, écran d'aide sinon.

## Assumptions

- **App mobile** : la règle de la feature 011 qui laissait les adresses de gestion au navigateur tombe, puisque l'app n'ouvre plus ces pages du site. Les versions déjà installées de l'app qui ne connaissent pas encore cette adresse ouvriront leur écran d'accueil (comportement actuel pour une adresse inconnue) dès que le site la déclarera pour l'app ; c'est accepté, la mise à jour de l'app corrige.
- L'écran « Partager » de l'app montre déjà le lien de la liste et son QR code : US4 (action « Partager » visible) concerne le site seulement.
- La suite e2e Maestro reçoit un parcours pour US2 (tag `026-us2`).
- On s'adresse à « la personne qui vous a envoyé cette adresse » plutôt qu'à « la propriétaire », puisque la page ne nomme pas la liste ni sa propriétaire (FR-003).
- Pas de bouton « demander l'accès » ni de notification à la propriétaire : la page explique, elle n'ouvre pas de nouveau canal (principe V, simplicité).
- Le contrat de l'API ne change pas : l'erreur `notMember` de l'API reste telle quelle.
- La personne non connectée continue de passer par la connexion avant de voir la page d'aide (comportement actuel de l'adresse de gestion).
