# Feature Specification: Gérer le partage d'une liste dans l'app mobile

**Feature Branch**: `017-mobile-sharing`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Gérer le partage dans l'app : invitations, membres, mot de passe de lecture."

## Contexte

Aujourd'hui, l'onglet Partage d'une liste dans l'app mobile (feature 005) ne montre que la carte « Partager avec vos proches » : le lien public de la liste, son QR code, le bouton « Partager » du téléphone et la copie du lien. Si la liste est protégée, un avis le rappelle. Tout le reste se fait sur le site, ouvert par le lien « Gérer le partage sur le site ».

Sur le site, l'onglet Partage d'une liste contient, dans cet ordre :

| Carte | Qui la voit | Ce qu'elle permet |
|-------|-------------|-------------------|
| « Partager avec vos proches » | tout membre | lien public de lecture, à copier |
| « Gérer la liste à plusieurs » | tout membre | lien d'invitation à modifier, à copier |
| « Inviter par e-mail » | tout membre | envoyer le lien d'invitation par e-mail ; **propriétaire seul** : « Remplacer le lien d'invitation » |
| « Protéger l'accès à votre liste » | **propriétaire seul** | définir, remplacer ou retirer le mot de passe de lecture (8 caractères au moins) |
| « Gérer les membres » | tout membre | liste des membres et de leur rôle ; **propriétaire seul** : retirer un membre ; tout membre : « Quitter cette liste » |

Le serveur applique déjà ces règles pour l'app (feature 004). Cette feature les reprend dans l'app, avec les mêmes droits, les mêmes refus et les mêmes textes que le site, et retire le renvoi vers le site. Elle ajoute aussi la suppression de la liste (carte « Supprimer la liste » de l'onglet Réglages du site, propriétaire seul), sans laquelle une personne seule dans sa liste ne peut pas la quitter depuis l'app.

## Clarifications

### Session 2026-11-06

- Q: Comment un membre envoie-t-il le lien d'invitation depuis le téléphone, sachant que le bouton « Partager » n'envoie que le lien public (FR-023 de la 005) ? → A: un bouton de partage propre à la carte « Gérer la liste à plusieurs », avec un message qui dit que le lien permet de gérer la liste ; le bouton « Partager » principal garde la règle FR-023.
- Q: La suppression de la liste entre-t-elle dans cette feature ? → A: oui, propriétaire seul, avec les textes du site ; quand une personne seule tente de quitter, l'app lui propose de supprimer la liste.
- Q: Un onglet Partage calqué sur le site, ou une refonte de l'UX Réglages/Partage (backlog 8) ? → A: calqué sur le site, cartes dans le même ordre ; la refonte reste un sujet à part.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inviter quelqu'un à gérer la liste (Priority: P1)

Depuis l'onglet Partage d'une liste, un membre voit la carte « Gérer la liste à plusieurs » avec le lien d'invitation à modifier. Il peut le copier, ou l'envoyer par la feuille de partage du téléphone (messagerie, e-mail…). La carte « Inviter par e-mail » lui permet aussi de saisir l'adresse d'une personne, qui reçoit un e-mail avec ce lien. La personne qui ouvre le lien rejoint la liste (parcours déjà en place : feature 011 dans l'app, page d'invitation sur le site).

**Why this priority**: inviter un co-gestionnaire (conjoint, parent) est la raison la plus fréquente d'aller sur le site depuis l'app ; c'est la première chose à rapatrier.

**Independent Test**: avec un compte de démo membre d'une liste, ouvrir l'onglet Partage, copier le lien d'invitation et l'ouvrir connecté avec un second compte : ce compte rejoint la liste. Puis inviter une adresse par e-mail et vérifier que l'e-mail reçu (MailDev) contient le même lien. Parcours e2e tagué `017-us1`.

**Acceptance Scenarios**:

1. **Given** une liste dont la personne est membre, **When** elle ouvre l'onglet Partage, **Then** elle voit, sous la carte « Partager avec vos proches », la carte « Gérer la liste à plusieurs » avec le lien d'invitation, un bouton pour le copier, et l'avertissement du site (« Toute personne connectée qui ouvre ce lien rejoint la liste… »).
2. **Given** la carte « Gérer la liste à plusieurs », **When** la personne copie le lien, **Then** le lien d'invitation est dans le presse-papiers et l'app confirme « Lien copié. ».
3. **Given** la carte « Gérer la liste à plusieurs », **When** la personne envoie le lien d'invitation par le téléphone, **Then** la carte a son propre bouton de partage, distinct du bouton « Partager » de la carte précédente ; la feuille de partage du téléphone s'ouvre avec un court texte qui reprend le titre de la liste, dit que le lien permet de la gérer à plusieurs, et contient le lien d'invitation.
4. **Given** la carte « Inviter par e-mail » et une adresse valide, **When** la personne envoie l'invitation, **Then** l'app confirme l'envoi, vide le champ, et la personne invitée reçoit un e-mail dans la langue de l'app avec le lien d'invitation.
5. **Given** une adresse vide ou sans « @ », **When** la personne envoie, **Then** l'app affiche le même message d'erreur que le site et n'envoie rien.
6. **Given** un compte dont l'adresse e-mail n'est pas confirmée, **When** il envoie une invitation par e-mail, **Then** l'app affiche le refus du serveur (adresse à confirmer), comme le site.
7. **Given** un serveur sans envoi d'e-mail configuré, ou un envoi qui échoue, **When** la personne envoie une invitation, **Then** l'app affiche le message d'erreur correspondant du site, et le lien d'invitation reste disponible à copier.
8. **Given** la personne a envoyé beaucoup d'invitations en peu de temps, **When** elle dépasse la limite du serveur, **Then** l'app affiche le message de limite du site.

---

### User Story 2 - Voir les membres, retirer un membre, quitter la liste (Priority: P1)

La carte « Gérer les membres » liste les membres de la liste avec leur nom et leur rôle (« Propriétaire » ou « Membre »). Le propriétaire peut retirer un autre membre, après confirmation. Tout membre peut quitter la liste, après confirmation.

**Why this priority**: c'est le pendant de l'invitation : savoir qui gère la liste et corriger une erreur d'invitation. Sans elle, inviter depuis l'app ne peut pas se défaire depuis l'app.

**Independent Test**: avec la liste de démo partagée entre deux comptes, ouvrir l'onglet Partage avec le propriétaire, voir les deux membres, retirer le second ; vérifier sur le site et dans l'app du second compte qu'il n'a plus accès. Puis, avec un membre non propriétaire, quitter une liste : l'app revient à « Mes listes » sans elle. Parcours e2e tagué `017-us2`.

**Acceptance Scenarios**:

1. **Given** une liste à plusieurs membres, **When** une personne ouvre l'onglet Partage, **Then** la carte « Gérer les membres » liste chaque membre avec son nom et « Propriétaire » ou « Membre », dans le même ordre que le site.
2. **Given** la personne est propriétaire, **When** elle regarde la carte, **Then** chaque autre membre a un bouton « Retirer de la liste » ; elle-même n'en a pas.
3. **Given** la personne n'est pas propriétaire, **When** elle regarde la carte, **Then** aucun bouton « Retirer de la liste » n'apparaît.
4. **Given** le propriétaire touche « Retirer de la liste » pour Alex, **When** il confirme dans la fenêtre « Retirer Alex de la liste ? », **Then** Alex disparaît de la carte, et Alex n'a plus accès à la liste (site et app). S'il choisit « Garder ce membre », rien ne change.
5. **Given** une personne membre d'une liste avec au moins un autre membre, **When** elle touche « Quitter cette liste » et confirme, **Then** elle n'est plus membre, l'app revient à « Mes listes » sans cette liste et sans sa copie locale. Si elle était propriétaire, le membre le plus ancien devient propriétaire (règle du site).
6. **Given** la personne est seule dans la liste, **When** elle touche « Quitter cette liste », **Then** l'app affiche le message du site (« Vous êtes seul sur cette liste. Supprimez-la si vous voulez la fermer. ») avec un bouton « Supprimer la liste » qui ouvre la confirmation de suppression (story 5) ; rien n'est supprimé sans cette confirmation.
7. **Given** une personne retirée de la liste par un autre membre pendant qu'elle l'a ouverte, **When** l'app recharge la liste, **Then** elle revient à « Mes listes » avec un message, sans planter (comportement de la 005).

---

### User Story 3 - Protéger la liste par un mot de passe de lecture (Priority: P2)

Le propriétaire voit la carte « Protéger l'accès à votre liste ». Il peut définir un mot de passe de lecture (8 caractères au moins), le remplacer, ou le retirer après confirmation. Les invités qui ouvrent le lien public devront saisir ce mot de passe pour voir la liste. Les autres membres ne voient pas cette carte ; ils gardent l'avis de la 005 quand la liste est protégée.

**Why this priority**: utile pour qui partage le lien largement, mais moins fréquent que l'invitation et la gestion des membres ; il existe déjà un avis dans l'app.

**Independent Test**: avec le propriétaire d'une liste de démo, définir le mot de passe « secretliste », ouvrir le lien public dans un autre navigateur : la liste demande le mot de passe et l'accepte. Puis le retirer : la liste s'ouvre sans mot de passe. Parcours e2e tagué `017-us3`.

**Acceptance Scenarios**:

1. **Given** le propriétaire d'une liste non protégée, **When** il ouvre l'onglet Partage, **Then** la carte « Protéger l'accès à votre liste » dit « Cette liste n'est pas protégée par un mot de passe. » et propose un champ « Mot de passe de la liste » et « Enregistrer le mot de passe ».
2. **Given** un mot de passe de 8 caractères ou plus, **When** il l'enregistre, **Then** l'app confirme « Mot de passe enregistré. », vide le champ, la carte dit que la liste est protégée, et le lien public demande ce mot de passe.
3. **Given** un mot de passe vide ou de moins de 8 caractères, **When** il l'enregistre, **Then** l'app affiche le message du site et ne change rien.
4. **Given** une liste protégée, **When** le propriétaire saisit un nouveau mot de passe et l'enregistre, **Then** l'ancien ne fonctionne plus et le nouveau oui.
5. **Given** une liste protégée, **When** le propriétaire touche « Retirer le mot de passe » et confirme, **Then** l'app confirme « Mot de passe retiré. » et le lien public s'ouvre sans mot de passe. S'il choisit « Garder le mot de passe », rien ne change.
6. **Given** un membre non propriétaire, **When** il ouvre l'onglet Partage, **Then** il ne voit pas la carte « Protéger l'accès à votre liste » ; si la liste est protégée, il voit l'avis de la 005 sans le mot de passe.
7. **Given** le champ du mot de passe de lecture, **When** la personne tape, **Then** il se comporte comme les autres champs mot de passe de l'app (feature 016 : pas de majuscule automatique, œil pour afficher ou masquer).
8. **Given** le mot de passe vient d'être défini ou retiré, **When** la personne regarde la carte « Partager avec vos proches », **Then** l'avis « liste protégée » apparaît ou disparaît sans recharger l'écran.

---

### User Story 4 - Remplacer le lien d'invitation (Priority: P3)

Le propriétaire peut remplacer le lien d'invitation, après confirmation, pour qu'un lien diffusé par erreur ne permette plus de rejoindre la liste. Les membres déjà présents restent.

**Why this priority**: action rare, de sécurité ; le site la propose déjà et elle complète l'invitation.

**Independent Test**: avec le propriétaire, noter le lien d'invitation, le remplacer, puis ouvrir l'ancien lien avec un autre compte : il est refusé ; le nouveau lien fonctionne. Parcours e2e tagué `017-us4`.

**Acceptance Scenarios**:

1. **Given** le propriétaire, **When** il ouvre l'onglet Partage, **Then** la carte « Inviter par e-mail » propose « Remplacer le lien d'invitation » avec le texte d'aide du site.
2. **Given** il touche « Remplacer le lien d'invitation » et confirme, **When** le serveur répond, **Then** la carte « Gérer la liste à plusieurs » affiche le nouveau lien, et l'ancien lien ne permet plus de rejoindre la liste.
3. **Given** un membre non propriétaire, **When** il ouvre l'onglet Partage, **Then** le bouton « Remplacer le lien d'invitation » n'apparaît pas.
4. **Given** le lien vient d'être remplacé par un autre appareil, **When** la personne rouvre ou rafraîchit l'onglet, **Then** elle voit le nouveau lien.

---

### User Story 5 - Supprimer la liste (Priority: P3)

Le propriétaire voit, en bas de l'onglet Réglages, la carte « Supprimer la liste » du site (« La suppression de cette liste est définitive. »). Après confirmation (« Supprimer « Noël » ? »), la liste est supprimée pour tous ses membres et l'app revient à « Mes listes ».

**Why this priority**: action rare et définitive, mais nécessaire pour qu'une personne seule puisse fermer sa liste sans passer par le site (story 2, scénario 6).

**Independent Test**: avec le propriétaire d'une liste de démo créée pour l'occasion, ouvrir Réglages, supprimer la liste et confirmer : elle disparaît de « Mes listes » dans l'app et sur le site, et son lien public ne l'ouvre plus. Parcours e2e tagué `017-us5`.

**Acceptance Scenarios**:

1. **Given** le propriétaire d'une liste, **When** il ouvre l'onglet Réglages, **Then** il voit, après les catégories et le « qui », la carte « Supprimer la liste » avec son bouton.
2. **Given** un membre non propriétaire, **When** il ouvre l'onglet Réglages, **Then** cette carte n'apparaît pas.
3. **Given** le propriétaire touche « Supprimer la liste », **When** il confirme, **Then** la liste, ses idées et ses réservations sont supprimées, l'app revient à « Mes listes » sans elle ni sa copie locale. S'il choisit « Conserver la liste », rien ne change.
4. **Given** des changements en attente d'envoi sur cette liste, **When** le propriétaire supprime la liste, **Then** la confirmation prévient qu'ils seront perdus, et ils sont retirés de la file après la suppression.
5. **Given** un autre membre a la liste ouverte dans l'app, **When** elle est supprimée, **Then** au rafraîchissement il revient à « Mes listes » avec un message, sans planter (comportement de la 005).
6. **Given** l'app hors ligne, **When** le propriétaire regarde la carte, **Then** le bouton est indisponible, avec l'explication des réglages hors ligne.

---

### Edge Cases

- **Hors ligne** : les cartes déjà présentes en 005 (lien public, QR code, copie) continuent de marcher hors ligne. Le lien d'invitation et la liste des membres du dernier état connu restent affichés et copiables. Les actions qui écrivent (inviter par e-mail, retirer, quitter, mot de passe, remplacer le lien) sont indisponibles hors ligne avec une explication, comme les réglages de la liste (FR-029b de la 005) ; elles ne passent pas par la file des changements en attente.
- **Liste créée hors ligne et pas encore envoyée** : l'onglet garde le message de la 005 (pas encore partageable) ; aucune carte de gestion n'apparaît.
- **Rôle changé ailleurs** : la personne devient propriétaire (l'ancien a quitté) ou perd l'accès pendant que l'écran est ouvert ; au rafraîchissement, les cartes et boutons suivent le nouveau rôle. Une action refusée par le serveur (« réservé au propriétaire ») affiche le message du site et rafraîchit l'écran.
- **Quitter avec des changements en attente sur cette liste** : la confirmation prévient qu'ils seront perdus ; après avoir quitté, ils sont retirés de la file.
- **Double appui** sur un bouton d'action : une seule action est envoyée (bouton occupé pendant l'envoi).
- **Membre sans nom affiché** : la carte affiche le libellé « Membre » à la place du nom, comme le site.
- **Liste avec beaucoup de membres** (20+) : la carte reste lisible et défile avec l'écran.
- **Invitation à une adresse déjà membre** : comportement du serveur, identique au site (l'e-mail part ; ouvrir le lien ne crée pas de doublon).

## Requirements *(mandatory)*

### Functional Requirements

#### Écran

- **FR-001**: L'onglet Partage de l'app MUST présenter les mêmes cartes que l'onglet Partage du site, dans le même ordre, avec les mêmes titres, descriptions, libellés et messages, en français et en anglais. Aucune réorganisation propre à l'app dans cette feature (la refonte de l'UX Réglages/Partage reste un sujet à part).
- **FR-002**: La carte « Partager avec vos proches » MUST garder ce que la 005 y a ajouté (QR code, bouton « Partager » du téléphone, copie, avis de liste protégée).
- **FR-003**: Le lien « Gérer le partage sur le site » MUST disparaître.
- **FR-004**: Chaque carte, bouton ou action réservé au propriétaire sur le site MUST être caché aux autres membres dans l'app.
- **FR-005**: Chaque nouvel élément MUST reprendre les composants de l'app déjà alignés sur le site (carte, champ lien + copier, bouton, alerte, fenêtre de confirmation, champ mot de passe), et l'écran MUST être comparé à la capture `09-liste-partage.png` du site, mise à jour avec les cartes de gestion.

#### Invitations

- **FR-010**: Tout membre MUST voir le lien d'invitation de la liste et pouvoir le copier.
- **FR-011**: Tout membre dont l'adresse est confirmée MUST pouvoir envoyer une invitation par e-mail ; l'e-mail MUST être dans la langue de l'app et contenir le lien d'invitation.
- **FR-012**: Le propriétaire MUST pouvoir remplacer le lien d'invitation après confirmation ; l'écran MUST afficher le nouveau lien dès la réponse du serveur.
- **FR-013**: Le bouton « Partager » de la carte « Partager avec vos proches » MUST continuer d'envoyer uniquement le lien public (FR-023 de la 005).
- **FR-014**: La carte « Gérer la liste à plusieurs » MUST avoir son propre bouton de partage par le téléphone, qui envoie le lien d'invitation avec un court texte reprenant le titre de la liste et disant que le lien permet de la gérer à plusieurs.

#### Membres

- **FR-020**: Tout membre MUST voir la liste des membres avec leur nom et leur rôle.
- **FR-021**: Le propriétaire MUST pouvoir retirer un autre membre après confirmation ; il MUST ne pas pouvoir se retirer lui-même.
- **FR-022**: Tout membre MUST pouvoir quitter la liste après confirmation ; l'app MUST ensuite revenir à « Mes listes », sans la liste ni sa copie locale.
- **FR-023**: Si le propriétaire quitte, la propriété MUST passer au membre le plus ancien, comme sur le site.
- **FR-024**: Une personne seule dans la liste qui tente de la quitter MUST voir le message du site et se voir proposer la suppression de la liste.

#### Suppression de la liste

- **FR-025**: Le propriétaire MUST pouvoir supprimer la liste depuis l'onglet Réglages (carte « Supprimer la liste » du site, après les catégories et le « qui »), après confirmation avec les textes du site ; les autres membres MUST ne pas voir cette carte.
- **FR-026**: Après la suppression, l'app MUST revenir à « Mes listes », sans la liste ni sa copie locale ni ses changements en attente ; la confirmation MUST prévenir quand des changements en attente seront perdus.

#### Mot de passe de lecture

- **FR-030**: Le propriétaire MUST voir si la liste est protégée et pouvoir définir ou remplacer le mot de passe de lecture (8 caractères au moins), sans que l'app n'affiche jamais le mot de passe enregistré.
- **FR-031**: Le propriétaire MUST pouvoir retirer le mot de passe de lecture après confirmation.
- **FR-032**: Le champ du mot de passe de lecture MUST être le champ mot de passe commun de l'app (feature 016).

#### Comportement commun

- **FR-040**: Chaque action MUST passer par le serveur avec les mêmes droits et les mêmes refus que le site ; un refus MUST s'afficher avec le message traduit du site.
- **FR-041**: Les actions de gestion MUST être indisponibles hors ligne, avec une explication ; le lien d'invitation et la liste des membres du dernier état connu MUST rester visibles hors ligne.
- **FR-042**: Après chaque action réussie, l'écran MUST afficher l'état du serveur (membres, rôle, lien, protection) sans action supplémentaire de la personne.
- **FR-043**: Chaque action destructrice (retirer, quitter, supprimer la liste, retirer le mot de passe, remplacer le lien) MUST demander une confirmation avec les textes du site.
- **FR-044**: Chaque user story MUST avoir son parcours e2e dans la suite de l'app (tag `017-us<N>`), avec des identifiants d'éléments nommés `<écran>.<élément>`.

### Key Entities

- **Liste** : titre, propriétaire, lien public de lecture, lien d'invitation (remplaçable), mot de passe de lecture (présent ou non ; jamais lu par l'app).
- **Membre** : personne qui gère la liste ; nom affiché, rôle (propriétaire ou membre), date d'arrivée (sert à choisir le nouveau propriétaire).
- **Invitation** : lien d'invitation de la liste, partagé à la main ou envoyé par e-mail à une adresse ; donne le rôle de membre à qui l'ouvre connecté.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Toutes les actions de l'onglet Partage du site (copier le lien d'invitation, inviter par e-mail, remplacer le lien, définir / remplacer / retirer le mot de passe, retirer un membre, quitter), plus la suppression de la liste, se font dans l'app, sans ouvrir le site : 8 actions sur 8.
- **SC-002**: Un membre invite un proche depuis l'app (copie ou e-mail) en moins de 30 secondes à partir de la liste ouverte.
- **SC-003**: Pour chaque action, un membre non propriétaire et un propriétaire voient exactement les mêmes boutons dans l'app que sur le site (vérifié sur la liste de démo, rôle par rôle).
- **SC-004**: Chaque texte de l'onglet est identique au site, mot pour mot, en français et en anglais.
- **SC-005**: Les parcours e2e des stories passent sur iOS, et la comparaison côte à côte avec la capture du site ne montre aucun écart non justifié dans `design-reference.md`.
- **SC-006**: Hors ligne, aucune action de gestion ne laisse croire qu'elle a réussi : 0 action envoyée, une explication affichée à chaque tentative.

## Assumptions

- Le serveur offre déjà toutes les actions nécessaires (feature 004 : lien d'invitation, invitation par e-mail, mot de passe de lecture, retrait d'un membre, quitter) et la vue d'une liste donne déjà le rôle de la personne, le lien d'invitation, la protection et les membres. Aucune règle métier nouvelle ; si un manque apparaît au plan, le contrat est étendu de façon compatible.
- Rejoindre une liste par un lien d'invitation est déjà géré par l'app (feature 011) et le site ; cette feature ne le change pas.
- Les textes viennent des fichiers de traduction du site (namespace de la liste) ; seuls les textes propres à l'app (hors ligne, message de partage du lien d'invitation, proposition de suppression quand on est seul) vont dans le namespace de l'app.
- Le hors ligne suit la règle des réglages de la liste (005, FR-029b) : pas de file d'attente pour ces actions.
- La réponse à Apple sur le mot de passe de lecture (retirée en 1.0.0, faute de gestion dans l'app) pourra être remise à jour pour la version qui livre cette feature ; hors du périmètre de la spec.
- Hors périmètre : voir qui suit la liste (backlog 6, contraire à la 012), apparence de la liste (thème et couverture, reste de l'écart 10a), refonte de l'UX Réglages/Partage (backlog 8), écran « mes réservations » (backlog 5).
- Le serveur offre déjà la suppression d'une liste par son propriétaire (feature 004).
