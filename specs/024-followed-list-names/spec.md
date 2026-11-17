# Feature Specification: Renommer une liste suivie et nommer la personne qui l'a créée

**Feature Branch**: `024-followed-list-names`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "WISH-15 — Personnaliser le nom d'une liste suivie + le nom de la personne qui l'a créée"

## Contexte

Une personne connectée peut suivre les listes de ses proches (feature 012) : elles apparaissent dans « Mes listes », section « Listes suivies », sur le site et dans l'app. Chaque carte montre le titre de la liste, son sous-titre et son illustration, tels que les membres de la liste les ont choisis.

Ces titres sont pensés par et pour les membres : beaucoup de listes s'appellent « Ma liste », « Noël » ou « Anniversaire ». Quand on suit les listes de plusieurs proches, on ne sait plus laquelle est à qui. La page publique ne montre pas les membres de la liste, et l'abonné ne peut rien y changer.

Cette feature permet à l'abonné de donner, pour lui seul, un autre nom à une liste suivie et de voir à qui elle est : par défaut le nom d'affichage de la personne qui l'a créée, qu'il peut remplacer (« Léa », « Mamie »). Ces noms s'affichent sur la carte de « Mes listes » et en tête de la liste quand il l'ouvre. Rien ne change pour les membres de la liste, qui ne voient ni ces noms ni l'existence de l'abonnement (FR-008 de la 012).

## Clarifications

### Session 2026-11-17

- Q : Sans nom indiqué par l'abonné, quelle personne s'affiche ? → R : le nom d'affichage du compte propriétaire de la liste (celui qui l'a créée, ou à qui elle a été transmise), que l'abonné peut remplacer. Ce nom devient visible des abonnés, ce qu'il n'était pas.
- Q : Où s'affichent les noms ? → R : sur la carte de « Mes listes » et en tête de la liste quand l'abonné l'ouvre (page publique sur le site, écran de la liste dans l'app).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Donner son propre nom à une liste suivie (Priority: P1)

Sur une liste suivie (carte de « Mes listes » sur le site, écran de la liste dans l'app), l'abonné choisit « Renommer ». Il saisit le nom qui lui parle (« Noël de Léa ») et l'enregistre. La carte, et l'en-tête de la liste quand il l'ouvre, affichent désormais ce nom. Il peut à tout moment revenir au titre d'origine.

**Why this priority**: c'est le problème de départ : plusieurs listes suivies avec le même titre ne se distinguent pas.

**Independent Test**: sur la base de démo, suivre deux listes, renommer l'une : la carte et l'en-tête de la liste ouverte affichent le nouveau nom, sur le site comme dans l'app ; un membre de la liste voit toujours le titre d'origine ; « Revenir au titre de la liste » rétablit le titre.

**Acceptance Scenarios**:

1. **Given** un abonné qui suit une liste « Ma liste », **When** il la renomme « Noël de Léa », **Then** la carte affiche « Noël de Léa », sur le site et dans l'app.
2. **Given** une liste suivie renommée « Noël de Léa », **When** l'abonné l'ouvre, **Then** l'en-tête de la liste affiche « Noël de Léa » (page publique sur le site, écran de la liste dans l'app).
3. **Given** une liste suivie renommée, **When** un membre de la liste change son titre, **Then** l'abonné garde son propre nom sur la carte.
4. **Given** une liste suivie renommée, **When** l'abonné choisit « Revenir au titre de la liste » (ou enregistre un nom vide), **Then** la carte affiche de nouveau le titre choisi par les membres, à jour.
5. **Given** une liste suivie renommée, **When** un membre de la liste, ou un autre abonné, consulte la liste, **Then** il ne voit pas ce nom.
6. **Given** l'app hors ligne, **When** l'abonné veut renommer une liste suivie, **Then** l'action est indisponible avec une explication, comme les autres actions sur les listes suivies.

---

### User Story 2 - Voir et nommer à qui est la liste (Priority: P2)

Sur la carte d'une liste suivie, et en tête de la liste quand il l'ouvre, l'abonné voit à qui elle est : le nom d'affichage de la personne propriétaire de la liste. Il peut le remplacer par le nom qu'il lui donne (« Mamie » au lieu de « Jeanne Martin »).

**Why this priority**: complète US1 sans en dépendre : même sans renommer la liste, savoir à qui elle est suffit souvent à la reconnaître.

**Independent Test**: sur la base de démo, suivre la liste d'Alex : la carte affiche « Alex » ; indiquer « Mon frère » : la carte et l'en-tête de la liste affichent « Mon frère » ; l'effacer : « Alex » revient. Rien n'apparaît pour les membres.

**Acceptance Scenarios**:

1. **Given** une liste suivie dont la propriétaire s'appelle « Léa » (nom d'affichage), **When** l'abonné ouvre « Mes listes » ou la liste, **Then** « Léa » s'affiche sous le titre, sur le site et dans l'app.
2. **Given** cette liste, **When** l'abonné indique « Mamie » comme personne, **Then** « Mamie » remplace « Léa » sur la carte et en tête de la liste.
3. **Given** une personne indiquée par l'abonné, **When** il efface ce nom, **Then** le nom d'affichage de la propriétaire revient.
4. **Given** une liste suivie sans nom choisi par l'abonné, **When** la propriétaire change son nom d'affichage, ou transmet la liste à un autre membre, **Then** la carte affiche le nom d'affichage de la propriétaire actuelle.
5. **Given** une personne qui consulte la liste par son lien public sans la suivre, **When** elle l'ouvre, **Then** rien ne change pour elle : aucun nom de personne n'est affiché.

---

### Edge Cases

- **Se désabonner puis se réabonner** : les noms choisis disparaissent avec l'abonnement ; un nouvel abonnement repart du titre d'origine.
- **Devenir membre de la liste** : l'abonnement est supprimé (FR-009 de la 012), avec ses noms ; la liste s'affiche comme toute liste dont on est membre.
- **Liste supprimée, compte supprimé** : les noms partent avec l'abonnement (suppression en cascade).
- **Liste protégée par un mot de passe de lecture qui a changé** : la carte garde les noms de l'abonné et le badge « Mot de passe requis ».
- **Export des données du compte** (« Télécharger mes données ») : il contient, pour chaque liste suivie, les noms choisis par l'abonné.
- **Nom trop long** : refusé avec un message, au-delà de 80 caractères.
- **Espaces** : un nom fait seulement d'espaces vaut un nom vide (retour au titre d'origine, ou aucune personne).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Un abonné MUST pouvoir donner un nom personnel à chacune de ses listes suivies, là où il peut déjà « Ne plus suivre » : la carte de « Mes listes » sur le site, l'écran de la liste suivie dans l'app (les cartes de l'app n'ont pas d'action).
- **FR-002**: Un abonné MUST pouvoir indiquer, pour chacune de ses listes suivies, le nom qu'il donne à la personne à qui est la liste, depuis le même endroit.
- **FR-003**: Ces deux noms sont facultatifs, de 80 caractères au plus, sans espaces au début ni à la fin ; un nom vide les efface.
- **FR-004**: Quand l'abonné a choisi un nom pour la liste, ce nom MUST s'afficher à la place du titre de la liste ; sinon, le titre de la liste, à jour.
- **FR-005**: Sous le titre MUST s'afficher la personne : le nom choisi par l'abonné, sinon le nom d'affichage actuel du compte propriétaire de la liste.
- **FR-006**: FR-004 et FR-005 s'appliquent à la carte de la liste dans « Listes suivies » et à l'en-tête de la liste quand l'abonné l'ouvre (page publique sur le site, écran de la liste dans l'app). Les visiteurs qui ne suivent pas la liste et les membres ne voient aucun changement.
- **FR-007**: Les noms choisis par un abonné MUST rester privés : aucun membre, aucun autre abonné, aucune vue membre, route de l'API ou export d'un autre compte ne les voit.
- **FR-011**: Le nom d'affichage du propriétaire n'est montré qu'aux abonnés de la liste ; il n'est jamais ajouté à la vue publique des visiteurs qui ne la suivent pas.
- **FR-008**: Les noms suivent l'abonnement : ils disparaissent avec lui (désabonnement, adhésion à la liste, suppression de la liste ou du compte) et figurent dans l'export des données du compte abonné.
- **FR-009**: Dans l'app, modifier ces noms demande une connexion ; hors ligne, l'action est désactivée avec une explication. Les noms déjà enregistrés s'affichent hors ligne.
- **FR-010**: Toutes les chaînes visibles nouvelles sont dans `locales/fr/` et `locales/en/`, au vouvoiement et avec le lexique du produit.

### Key Entities

- **Abonnement (Subscription)** : relie un compte à une liste qu'il suit (feature 012). Gagne deux attributs facultatifs, propres à l'abonné : le nom qu'il donne à la liste, et le nom de la personne à qui est la liste.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un abonné renomme une liste suivie ou indique à qui elle est en moins de 15 secondes.
- **SC-002**: Avec plusieurs listes suivies au même titre, l'abonné reconnaît chacune d'un coup d'œil une fois les noms donnés.
- **SC-003**: 0 nom choisi par un abonné n'est visible d'un autre compte (membre ou abonné) ; 0 nom de propriétaire n'apparaît pour un visiteur qui ne suit pas la liste.
- **SC-004**: Les tests de domaine couvrent la validation, le retour au titre d'origine et la confidentialité ; un parcours Maestro couvre le renommage dans l'app.

## Assumptions

- Les noms se modifient là où l'on se désabonne déjà : la carte de « Mes listes » sur le site, l'écran de la liste suivie dans l'app (plan, research R5).
- La recherche ou le tri des listes suivies ne change pas : l'ordre reste celui d'aujourd'hui.
- Le sous-titre et l'illustration de la liste restent ceux des membres ; seuls le titre et la personne sont personnalisables.
- La limite de 80 caractères suit l'ordre de grandeur des autres noms courts du produit.
- Aucune notification n'est envoyée aux membres ; la 012 reste inchangée sur la confidentialité de l'abonnement.
- Montrer le nom d'affichage du propriétaire à ses abonnés est accepté (clarification du 2026-11-17) : l'abonné connaît déjà la personne qui lui a donné le lien.
- Issue du ticket Plane WISH-15.
