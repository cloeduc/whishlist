# Feature Specification: Mode surprise, ne pas voir ce qui est réservé sur sa propre liste

**Feature Branch**: `020-surprise-mode`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "WISH-17 : Ne pas voir ce qui est réservé sur sa propre liste (mode surprise). Le propriétaire de la liste veut continuer à voir toutes les idées de sa liste sans être spoilé. Au moment de partager la liste, il peut dire « je ne veux pas voir les cadeaux réservés ». Pour lui, les idées réservées restent affichées dans sa liste, sans indication visible du premier coup d'œil ; il garde la possibilité d'aller voir volontairement lesquelles le sont. Pour les autres personnes qui consultent la liste, les idées réservées ne s'affichent plus."

## Contexte

Aujourd'hui, quand un invité réserve une idée :

| Qui | Ce qu'il voit |
|-----|---------------|
| Un invité (lien public, liste suivie) | L'idée disparaît de la liste publique, sauf pour la personne qui l'a réservée (« Vous avez réservé ce cadeau »). **C'est déjà le comportement voulu par WISH-17 pour les autres personnes.** |
| Un membre de la liste (site et app) | L'idée quitte l'onglet « Idées » et passe dans l'onglet « Archives ». L'onglet « Réservations (N) » affiche le nombre de réservations, puis pour chacune l'idée, « De la part de … » et le petit mot. Supprimer ou déplacer l'idée est refusé avec un message qui dit qu'elle est réservée. Le bouton « Voir comme invité » montre la liste sans les idées réservées. |
| L'assistant relié au compte (feature 013) | Chaque idée porte un « réservée : oui/non ». |

Le membre est donc spoilé de quatre façons : l'idée disparaît de « Idées », elle apparaît dans « Archives », le compteur et le contenu de « Réservations » sont visibles d'emblée, et les refus de suppression ou de déplacement disent qu'elle est réservée.

Cette feature ajoute un **mode surprise**. Quand il est actif, un membre voit sa liste comme si rien n'était réservé, jusqu'à ce qu'il demande explicitement à voir les réservations. Le comportement côté invités ne change pas.

## Clarifications

### Session 2026-11-16

- Q: Dans une liste à plusieurs membres, le mode surprise vaut-il pour une personne ou pour toute la liste ? → A: chaque membre choisit pour lui-même ; les autres membres continuent de voir les réservations.
- Q: Que se passe-t-il quand un membre en mode surprise supprime ou déplace une idée réservée ? → A: le refus reste (la réservation est protégée), avec un message neutre qui ne dit pas que l'idée est réservée et renvoie vers « Voir les réservations ».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Activer le mode surprise et ne plus voir les réservations (Priority: P1)

Dans l'onglet Partage de sa liste, sur le site, une personne trouve la carte « Garder la surprise ». Elle active « Ne pas voir les cadeaux réservés ». Ensuite, dans sa liste, toutes les idées restent dans l'onglet « Idées », réservées ou non, sans aucune marque qui les distingue. Les idées réservées n'apparaissent pas dans « Archives ». L'onglet « Réservations » ne montre plus de compteur ni de contenu tant qu'elle ne le demande pas (US2). Elle peut désactiver le mode à tout moment depuis la même carte.

**Why this priority**: c'est le besoin de WISH-17. Sans cette tranche, la personne ne peut pas regarder sa liste sans découvrir ses cadeaux.

**Independent Test**: sur la base de démo, activer le mode sur une liste, réserver une idée depuis le lien public dans une autre session, puis revenir sur la liste en tant que membre : l'idée est toujours dans « Idées », identique aux autres, absente d'« Archives », et l'onglet « Réservations » n'a pas de compteur.

**Acceptance Scenarios**:

1. **Given** une liste dont la personne est membre, **When** elle ouvre l'onglet Partage, **Then** elle voit la carte « Garder la surprise » avec un interrupteur « Ne pas voir les cadeaux réservés », désactivé par défaut, et une phrase qui explique l'effet.
2. **Given** le mode surprise activé et une idée réservée par un invité, **When** la personne ouvre l'onglet « Idées », **Then** l'idée y figure à sa place habituelle, avec la même apparence que les idées libres, et le compteur « Idées (N) » la compte.
3. **Given** le mode surprise activé, **When** la personne ouvre l'onglet « Archives », **Then** elle ne voit que les idées qu'un membre a archivées lui-même, pas les idées réservées, et le compteur « Archives (N) » ne compte qu'elles.
4. **Given** le mode surprise activé et au moins une réservation, **When** la personne regarde les onglets, **Then** l'onglet « Réservations » ne montre aucun compteur.
5. **Given** le mode surprise activé, **When** la personne le désactive, **Then** sa liste retrouve immédiatement le comportement habituel (idées réservées dans « Archives », compteur et contenu de « Réservations » visibles).
6. **Given** le mode surprise activé, **When** un invité ouvre le lien public, **Then** il voit la liste comme aujourd'hui : les idées réservées par d'autres n'y figurent pas, la sienne reste marquée « Vous avez réservé ce cadeau ».

---

### User Story 2 - Aller voir volontairement les réservations (Priority: P1)

En mode surprise, la personne garde la possibilité de voir les réservations : dans l'onglet « Réservations », un bouton « Voir les réservations » ouvre une confirmation (« Vous allez voir quels cadeaux ont été réservés. ») avant de les afficher, avec les mêmes informations et les mêmes actions qu'aujourd'hui (idée, « De la part de … », petit mot, « Annuler la réservation »). Quand elle quitte l'onglet ou revient plus tard, les réservations sont de nouveau cachées.

**Why this priority**: sans elle, le mode surprise empêche un membre d'annuler une réservation ou de vérifier une liste avant une fête. WISH-17 demande que ce soit possible par une action explicite.

**Independent Test**: en mode surprise, ouvrir l'onglet « Réservations », confirmer « Voir les réservations » : la réservation faite par l'invité s'affiche avec son nom et son mot. Quitter l'onglet et y revenir : elle est de nouveau cachée.

**Acceptance Scenarios**:

1. **Given** le mode surprise activé, **When** la personne ouvre l'onglet « Réservations », **Then** elle voit une phrase qui rappelle que les réservations sont cachées et le bouton « Voir les réservations », mais ni le nombre ni le contenu des réservations.
2. **Given** l'onglet « Réservations » en mode surprise, **When** la personne appuie sur « Voir les réservations » puis annule la confirmation, **Then** rien n'est révélé.
3. **Given** la confirmation acceptée, **When** les réservations s'affichent, **Then** la personne voit la même liste qu'hors mode surprise et peut annuler une réservation, avec la même confirmation qu'aujourd'hui.
4. **Given** les réservations affichées, **When** la personne quitte l'onglet puis y revient, ou recharge la page, **Then** les réservations sont de nouveau cachées et le mode surprise reste activé.
5. **Given** les réservations affichées, **When** la personne retourne dans « Idées », **Then** les idées réservées n'y portent toujours aucune marque.

---

### User Story 3 - Le mode surprise dans l'app mobile (Priority: P2)

Dans l'app, l'onglet Partage d'une liste a la même carte « Garder la surprise », avec le même interrupteur. Le réglage est le même que sur le site : l'activer d'un côté l'active de l'autre. Les écrans Idées, Archives et Réservations de l'app suivent les mêmes règles que les onglets du site (US1 et US2).

**Why this priority**: le partage se gère aussi dans l'app (feature 017). Sans cette tranche, la personne qui active le mode sur le site serait spoilée en ouvrant l'app.

**Independent Test**: activer le mode sur le site, ouvrir la liste dans l'app : l'idée réservée est dans Idées, sans marque, absente d'Archives, et l'écran Réservations demande une confirmation. Parcours e2e tagué `020-us3`.

**Acceptance Scenarios**:

1. **Given** le mode surprise activé sur le site, **When** la personne ouvre la liste dans l'app, **Then** l'app applique le mode surprise sans autre action.
2. **Given** l'onglet Partage de l'app, **When** la personne active ou désactive le mode, **Then** le site reflète le même état.
3. **Given** le mode surprise activé dans l'app, **When** la personne ouvre Idées, Archives et Réservations, **Then** elle observe les scénarios des US1 et US2.
4. **Given** le mode surprise activé et le téléphone hors ligne, **When** la personne ouvre la liste, **Then** l'app n'affiche aucune réservation gardée en mémoire sans la confirmation « Voir les réservations ».

---

### Edge Cases

- **Supprimer ou déplacer une idée réservée en mode surprise** : l'action reste refusée, pour protéger la réservation, mais le message est neutre : « Cette idée ne peut pas être supprimée ou déplacée pour le moment. Voir les réservations pour en savoir plus. » Le refus reste un indice pour qui tente l'action ; c'est accepté. Copier l'idée reste permis.
- **Liste à plusieurs membres** : chaque membre a son propre réglage. Quand un membre est en mode surprise, un autre membre qui ne l'est pas voit les réservations comme aujourd'hui, et peut en annuler une ; la personne en mode surprise n'en voit rien.
- **Modifier une idée réservée** : c'est permis aujourd'hui et ça le reste. Ni le formulaire ni le résultat ne disent que l'idée est réservée.
- **Archiver une idée réservée en mode surprise** : l'idée passe dans « Archives » comme une autre, sans marque. La remettre dans la liste la ramène dans « Idées ». La réservation n'est jamais touchée.
- **« Voir comme invité »** : la vue invité n'affiche pas les idées réservées ; en la comparant à « Idées », on devine lesquelles le sont. En mode surprise, le bouton ouvre d'abord un avertissement (« La vue invité ne montre pas les cadeaux déjà réservés. »), puis la vue invité si la personne confirme.
- **Le membre réserve une idée de sa propre liste par le lien public** : il voit sa propre réservation comme aujourd'hui (« Vous avez réservé ce cadeau »). Le mode surprise ne cache que les réservations des autres.
- **Assistant relié au compte (feature 013)** : en mode surprise, l'assistant reçoit les idées sans l'information « réservée » et ses actions suivent les mêmes règles que le site. Il ne peut pas révéler une réservation que la personne n'a pas demandé à voir.
- **Réservation faite pendant que la personne regarde sa liste** : rien ne change à l'écran ; au prochain affichage, l'idée reste dans « Idées », sans marque.
- **Réservation annulée par un invité** : rien ne change pour la personne en mode surprise ; l'idée était déjà dans « Idées ».
- **Liste sans aucune réservation** : en mode surprise, l'onglet « Réservations » montre quand même le bouton « Voir les réservations », pour ne pas révéler qu'il n'y en a aucune. Après confirmation, il affiche « Aucun cadeau réservé pour le moment. ».
- **Mot de passe de lecture, listes suivies** : le mode surprise ne change rien à l'accès des invités ni aux listes suivies (feature 012).

## Requirements *(mandatory)*

### Functional Requirements

**Réglage**

- **FR-001**: L'onglet Partage d'une liste, sur le site et dans l'app, MUST présenter une carte « Garder la surprise » avec un interrupteur « Ne pas voir les cadeaux réservés » et une phrase qui explique son effet.
- **FR-002**: Le mode surprise MUST être un choix propre à chaque membre, pour chaque liste : il ne change que ce que voit ce membre, pas ce que voient les autres membres ni les invités. Tout membre (propriétaire ou non) peut l'activer.
- **FR-003**: Le mode surprise MUST être désactivé par défaut, pour les listes existantes comme pour les nouvelles.
- **FR-004**: Le réglage MUST pouvoir être changé à tout moment, et MUST être le même sur le site et dans l'app.

**Ce que voit un membre en mode surprise**

- **FR-005**: Une idée réservée par une autre personne MUST rester dans « Idées », à sa place, sans aucune marque, badge, couleur ou texte qui la distingue d'une idée libre, et MUST compter dans « Idées (N) ».
- **FR-006**: « Archives » MUST ne montrer que les idées archivées par un membre, et son compteur MUST ne compter qu'elles.
- **FR-007**: L'onglet « Réservations » MUST ne montrer ni compteur ni contenu tant que la personne n'a pas confirmé « Voir les réservations ».
- **FR-008**: « Voir les réservations » MUST demander une confirmation, puis afficher les réservations avec les informations et les actions habituelles (y compris « Annuler la réservation »).
- **FR-009**: Les réservations révélées MUST être de nouveau cachées quand la personne quitte l'onglet, recharge la page ou rouvre l'écran ; le mode surprise reste activé.
- **FR-010**: Aucun message, refus, confirmation ou compteur MUST ne révéler qu'une idée est réservée, sauf après « Voir les réservations ».
- **FR-010a**: En mode surprise, supprimer ou déplacer une idée réservée MUST rester refusé, avec un message neutre qui ne dit pas que l'idée est réservée et renvoie vers « Voir les réservations ». Le même message MUST servir sur le site, dans l'app et pour l'assistant.
- **FR-011**: En mode surprise, le bouton « Voir comme invité » MUST avertir que la vue invité ne montre pas les cadeaux réservés, et n'ouvrir cette vue qu'après confirmation.
- **FR-012**: L'app mobile MUST ne pas afficher de réservation conservée sur le téléphone tant que la personne n'a pas confirmé « Voir les réservations ».
- **FR-013**: Les informations de réservation d'une liste MUST ne pas être transmises à l'assistant relié au compte d'une personne en mode surprise.

**Ce qui ne change pas**

- **FR-014**: Les invités, y compris les personnes qui suivent la liste, MUST continuer à ne pas voir les idées réservées par d'autres et à voir la leur, comme aujourd'hui.
- **FR-015**: Le mode surprise MUST ne pas changer les règles de réservation : une idée réservée ne peut pas l'être une seconde fois, et annuler une réservation reste une action de membre.
- **FR-016**: Hors mode surprise, le comportement actuel des onglets « Idées », « Archives » et « Réservations » MUST rester identique.
- **FR-017**: Toutes les nouvelles chaînes MUST exister en français et en anglais, avec le lexique du produit (« idée », « liste », « réservé »).

### Key Entities

- **Mode surprise** : un réglage oui ou non, désactivé par défaut, propre à un membre dans une liste (attaché à son appartenance à la liste).
- **Réservation** (existante) : idée, nom de l'offreur, petit mot, date. Inchangée.
- **Idée** (existante) : aujourd'hui archivée quand elle est réservée. En mode surprise, une personne ne doit pas pouvoir distinguer une idée réservée d'une idée libre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En mode surprise, une personne qui parcourt « Idées », « Archives », « Réservations » (sans confirmer), la vue invité (sans confirmer) et les messages d'erreur ne peut identifier aucune idée réservée : 0 indice sur un parcours de vérification qui couvre chacun de ces écrans, sur le site et dans l'app.
- **SC-002**: Activer ou désactiver le mode surprise prend une seule action depuis l'onglet Partage, et le résultat est visible dès l'écran suivant, sur le site comme dans l'app.
- **SC-003**: Voir les réservations en mode surprise prend deux actions (bouton puis confirmation), et les réservations sont de nouveau cachées à la visite suivante dans 100 % des cas.
- **SC-004**: Hors mode surprise, les parcours existants du site et de l'app (tests de domaine et suite e2e) passent sans changement.

## Assumptions

- Le réglage se trouve dans l'onglet Partage, puisque le ticket le place « au moment de partager la liste ». Il reste modifiable ensuite au même endroit ; il ne s'agit pas d'une étape imposée à chaque partage.
- La révélation des réservations dure le temps de l'affichage de l'onglet ; on ne garde pas de « déjà vu ».
- Il n'existe pas aujourd'hui de notification (e-mail ou autre) de réservation adressée aux membres ; si une notification est ajoutée plus tard, elle devra respecter le mode surprise.
- La page « Mes offres » d'un compte (ce qu'il a lui-même réservé sur les listes des autres) n'est pas concernée.
- Constitution, principe III : « Le statut "réservé" reste visible sur la liste pour éviter un doublon ». Le comportement actuel des invités s'en écarte déjà (les idées réservées leur sont cachées, ce qui évite aussi le doublon), et cette feature ne le change pas. Côté membres, le mode surprise cache le statut à la personne qui le demande, sans permettre de doublon. Une clarification du principe III (PATCH) est à proposer à Cloé ; la feature n'en dépend pas.
- Le site n'a pas de test e2e : son parcours se vérifie à la main sur la base de démo (quickstart). L'app a son parcours Maestro.
