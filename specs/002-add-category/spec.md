# Feature Specification: Ajouter une catégorie

**Feature Branch**: `002-add-category`

**Created**: 2026-10-18

**Status**: Implemented — gestion étendue (chips, renommage, retrait) dans Réglages (`003-i18n-admin-enrich`)

**Input**: User description: "Ajout spec pour ajouter une catégorie"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un membre ajoute une catégorie (Priority: P1)

Un membre donne un nom à une nouvelle catégorie de sa liste. Il peut ensuite classer une idée dedans. La page « Types » de cette liste montre la catégorie, même si aucune idée ne l'utilise encore.

**Why this priority**: Sans catégorie nouvelle, une idée qui ne rentre dans aucun type du modèle ne peut pas être classée. Le reste (filtre public, réservation) n'a rien à montrer tant que la catégorie n'existe pas.

**Independent Test**: Connecté comme membre, ajouter « Bijoux », la voir sur « Types », créer une idée « Bague » classée Bijoux, la voir sur le lien de lecture avec le type Bijoux. Sans être membre, la même action est refusée et « Bijoux » n'existe pas.

**Acceptance Scenarios**:

1. **Given** un membre d'une liste, **When** il ajoute la catégorie « Bijoux », **Then** « Bijoux » apparaît sur la page « Types » de cette liste et comme choix du champ Type, avant même qu'une idée l'utilise.
2. **Given** « Bijoux » vient d'être ajoutée, **When** le membre enregistre une idée avec ce type, **Then** le lien de lecture montre l'idée avec le type Bijoux.
3. **Given** un visiteur, ou un compte qui n'est pas membre, **When** il tente d'ajouter une catégorie, **Then** l'action est refusée et la liste des catégories ne change pas.
4. **Given** deux membres de la même liste, **When** l'un ajoute « Bijoux », **Then** l'autre la voit comme choix du champ Type sans devoir la recréer.
5. **Given** une catégorie ajoutée, **When** on ferme le site et on le rouvre, **Then** la catégorie est toujours là, avec les mêmes idées.

---

### User Story 2 - La catégorie filtre la liste publique (Priority: P2)

Quelqu'un qui a le lien de lecture, sans compte, peut ne voir que les idées de la catégorie ajoutée. Les boutons déjà présents sur une liste importée du modèle restent, avec le même contenu qu'avant.

**Why this priority**: Une catégorie invisible dans les filtres oblige à parcourir toute la liste. Utile dès qu'au moins une catégorie a été ajoutée.

**Independent Test**: Après l'ajout de « Bijoux » et d'une idée dans cette catégorie, ouvrir le lien de lecture sans compte, activer « Bijoux », et vérifier que seules ces idées restent. Sur une liste importée, « Maison » montre toujours les idées Divers, et pas la bague.

**Acceptance Scenarios**:

1. **Given** une catégorie « Bijoux » et au moins une idée de ce type, **When** un visiteur active le bouton « Bijoux » sur le lien de lecture, **Then** il ne voit que les idées de type Bijoux.
2. **Given** une catégorie sans aucune idée, **When** un visiteur active son bouton, **Then** il voit une liste vide, pas une erreur, et les autres boutons fonctionnent encore.
3. **Given** une liste importée du modèle, **When** un membre ajoute « Bijoux », **Then** les boutons du modèle restent (notamment « Maison », « Outils de jardinage et bricolage », « Alex », « Sam », « Crochet (Sam) ») et « Bijoux » s'ajoute après eux. « Maison » continue de montrer les idées Divers, pas un type Maison.
4. **Given** le bouton « Bijoux », **When** le visiteur revient à toute la liste, **Then** les idées Bijoux réapparaissent avec les autres.
5. **Given** une idée Bijoux non réservée, **When** un visiteur filtre le formulaire de réservation sur Bijoux, **Then** seuls les cadeaux libres de ce type sont proposés. S'il n'y en a aucun, la liste des cadeaux est vide.

---

### Edge Cases

- Le nom est obligatoire. Un nom vide, ou composé seulement d'espaces, est refusé. Aucune catégorie n'est créée.
- Les espaces en trop au début et à la fin ne comptent pas : «  Bijoux  » est la catégorie « Bijoux ».
- Deux catégories de la même liste ne peuvent pas porter le même nom, sans tenir compte des majuscules ni des espaces autour. « bijoux » est refusé si « Bijoux » existe déjà. La liste ne change pas, et un message en français le dit.
- Le nom ne peut pas être « Blank ». Blank reste l'absence de filtre dans le formulaire de réservation, pas une catégorie.
- Le nom ne peut pas reprendre le libellé d'un bouton de filtre déjà affiché sur cette liste (par exemple « Maison » ou « Livres »). Deux boutons au même libellé seraient indistinguables.
- Le nom fait au plus 60 caractères après retrait des espaces autour. Au-delà, l'ajout est refusé.
- Les accents, apostrophes et traits d'union sont gardés tels quels (« Pâtisserie », « Sam »).
- Ajouter une catégorie ne modifie pas les idées déjà présentes, ni les 79 idées d'une liste importée.
- Cette fonction n'ajoute pas de bouton pour les types déjà là et qui n'en ont pas (Van, Matériaux, et les autres types du modèle sans bouton). Seule une catégorie ajoutée par un membre reçoit un bouton nouveau.
- Deux membres ajoutent « Bijoux » en même temps : une seule catégorie est créée, l'autre reçoit le message de doublon.
- Fusionner ou réordonner les catégories reste hors parcours. Renommer et retirer (si aucune idée ne les utilise) se font dans **Réglages**, via des chips (voir `003-i18n-admin-enrich`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Un membre d'une wishlist MUST pouvoir ajouter une catégorie en saisissant son nom, sans modifier une idée pour le faire.
- **FR-002**: Une personne qui n'est pas membre de cette liste MUST NOT pouvoir ajouter une catégorie, qu'elle ait un compte ou non.
- **FR-003**: La catégorie ajoutée MUST apparaître sur la page « Types » de cette liste et comme valeur du champ Type, y compris lorsqu'aucune idée ne l'utilise.
- **FR-004**: Le lien de lecture MUST proposer un bouton au nom de la catégorie, y compris sur une liste importée du modèle. Ce bouton MUST ne montrer que les idées de cette catégorie.
- **FR-005**: Les boutons de filtre déjà définis pour une liste importée MUST rester, dans le même ordre, avec le même contenu. Le bouton nouveau MUST s'ajouter après eux.
- **FR-006**: Le formulaire de réservation MUST proposer la catégorie parmi les types. La choisir MUST limiter les cadeaux aux idées libres de cette catégorie.
- **FR-007**: Un nom vide, un doublon (majuscules et espaces autour ignorés), le nom « Blank », un nom déjà utilisé par un bouton de filtre de cette liste, ou un nom de plus de 60 caractères MUST être refusé, avec un message en français, sans créer la catégorie.
- **FR-008**: L'interface de cet ajout MUST être en français.
- **FR-009**: La catégorie, et les idées qui l'utilisent, MUST encore être là après une fermeture du site et une réouverture.

### Key Entities

- **Catégorie**: un type de cette wishlist, nommé par un membre. Une liste en a plusieurs. Une catégorie peut ne classer aucune idée. C'est le même concept que le type déjà porté par chaque idée (le libellé affiché sur la carte reste le nom de la catégorie).
- **Bouton de filtre**: un raccourci de la liste publique. Ceux du modèle importé ne changent pas. Chaque catégorie ajoutée par un membre en ajoute un, libellé comme la catégorie, qui ne retient que ses idées.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un membre ajoute une catégorie et classe une idée dedans en moins d'une minute, sans ouvrir une autre idée avant.
- **SC-002**: Sur 10 essais d'un visiteur sans compte, le bouton de la catégorie ne montre que les idées de cette catégorie, et une catégorie vide montre une liste vide plutôt qu'une erreur.
- **SC-003**: Après l'ajout d'une catégorie sur une liste importée, le bouton « Maison » montre les mêmes idées Divers qu'avant l'ajout.
- **SC-004**: Un non-membre qui tente l'ajout est refusé à chaque essai, et le nombre de catégories de la liste ne change pas.
- **SC-005**: Un nom en doublon, vide, « Blank », ou trop long est refusé à chaque essai, et le nombre de catégories ne change pas.

## Assumptions

- « Catégorie » désigne le type déjà utilisé par les idées et par la page « Types ». On n'ajoute pas une seconde classification à côté du type et du champ Qui.
- Tout membre de la liste peut ajouter une catégorie, pas seulement la personne qui a créé la liste. Cela reprend la règle déjà en vigueur : chaque membre édite.
- Le bouton public est voulu aussi sur une liste importée du modèle. La spec des wishlists ne le prévoyait que pour une liste créée vide. Les boutons du modèle, dont « Maison » (idées Divers, sans type Maison), ne sont pas régénérés ni retirés.
- Les types déjà importés qui n'ont pas de bouton (Van, Matériaux, et les autres dans ce cas) n'en gagnent pas un tout seuls.
- Renommer une catégorie n'est pas redéfini ici. Le nom affiché sur le bouton suit le nom courant de la catégorie.
- Supprimer une catégorie, en changer l'ordre, les imbriquer, ou leur donner une icône est hors de portée.
- Le message de refus est une phrase française compréhensible. Le libellé exact peut varier tant qu'il dit pourquoi l'ajout n'a pas eu lieu.
