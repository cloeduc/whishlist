# Feature Specification: Wishlists personnelles et communes

**Feature Branch**: `001-publish-household-wishlist`

**Created**: 2026-10-18

**Status**: Implemented (socle) — évolutions dans `003-i18n-admin-enrich`. Import produit du catalogue perso retiré ; `data/seed.json` reste une fixture de domaine et `data/demo-seed.json` fournit un scénario de démonstration sans données réelles.

**Input**: User description: "Reproduire le doc Superhuman « Toute la whishlist », et permettre de s'inscrire pour créer ses propres wishlists et des wishlists communes. Pas besoin d'être inscrit pour visionner la wishlist de quelqu'un."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lire une liste sans compte (Priority: P1)

Quelqu'un reçoit le lien d'une wishlist. Il la lit sans créer de compte et sans se connecter : idées, type, lien marchand, prix, priorité, pour qui.

**Why this priority**: C'est le geste des invités. Le compte ne doit pas être un péage devant la lecture.

**Independent Test**: Se déconnecter, ouvrir le lien d'une liste qui contient déjà des idées, et lire une idée connue. Vérifier qu'aucune inscription n'est demandée.

**Acceptance Scenarios**:

1. **Given** une wishlist existante et son lien, **When** un visiteur non inscrit l'ouvre, **Then** il voit les idées dans l'ordre de la liste, avec Item, Type, Lien, Prix, Priorité et Qui, sans écran d'inscription.
2. **Given** une idée sans prix, sans lien ou sans priorité, **When** elle est affichée, **Then** la cellule est vide et l'idée reste dans la liste.
3. **Given** une idée avec un lien, **When** le visiteur l'active, **Then** la page marchande s'ouvre.
4. **Given** un écran de téléphone, **When** le visiteur parcourt la liste, **Then** chaque idée reste lisible sans colonne coupée.
5. **Given** un visiteur non inscrit, **When** il ouvre l'accueil sans lien de liste, **Then** il ne voit aucune wishlist d'autrui, seulement de quoi s'inscrire ou se connecter.
6. **Given** le modèle du doc importé dans une liste, **When** un visiteur ouvre cette liste, **Then** il voit les 79 idées de l'annexe, le rappel des filtres, et « Je réserve une idée ».

---

### User Story 2 - Filtrer comme dans le doc (Priority: P5)

Sur une liste importée du modèle, le visiteur réduit la liste avec les mêmes boutons que le doc : par famille d'idées, ou pour Alex, ou pour Sam. Une liste créée vide n'a ces boutons que lorsqu'un membre ajoute des types ou des « Qui ».

**Why this priority**: Le doc est organisé par ces boutons. Utile une fois qu'une liste importée existe, après les comptes et le partage.

**Independent Test**: Importer le modèle, activer chaque bouton, comparer au filtre décrit ici. « Maison » ramène les idées Divers.

**Acceptance Scenarios**:

1. **Given** la liste complète, **When** le visiteur choisit « Livres », « Jeux », « Tech », « Dessin », « Cuisine », « Arbres et plantes » ou « Crochet (Sam) », **Then** seules les idées de ce type restent. « Crochet (Sam) » filtre le type Crochet, pas le champ Qui.
2. **Given** la liste complète, **When** le visiteur choisit « Outils de jardinage et bricolage », **Then** il voit les idées de type « Outil de jardinage » et celles de type « Outils de bricolage ».
3. **Given** la liste complète, **When** le visiteur choisit « Alex » ou « Sam », **Then** il voit les idées dont le champ Qui est cette personne, tous types confondus. Les idées « Couple » n'apparaissent dans aucun de ces deux boutons.
4. **Given** le catalogue initial, **When** le visiteur choisit « Maison », **Then** il voit les idées de type Divers, et aucune autre. Le type affiché reste « Divers » : « Maison » n'est pas un type.
5. **Given** un filtre actif sur la liste importée, **When** le visiteur revient à toute la liste, **Then** les 79 idées réapparaissent.

---

### User Story 3 - Réserver une idée (Priority: P6)

Un invité réserve une idée pour ne pas offrir la même chose qu'un autre. Il choisit un type, une idée encore libre, peut signer et laisser un mot.

**Why this priority**: C'est la raison du formulaire « Je réserve une idée ». La consultation seule ne suffit pas à éviter les doublons.

**Independent Test**: Réserver « The Gang » avec un prénom et un mot, puis vérifier qu'elle n'est plus proposable et qu'elle apparaît comme réservée.

**Acceptance Scenarios**:

1. **Given** une liste issue du modèle du doc, **When** le formulaire s'affiche, **Then** son titre est « Réserver un cadeau pour Alex et Sam » et il demande le type, le cadeau, « De la part de » (facultatif) et « Un petit mot ? » (facultatif). Sur une autre liste, le titre reprend le titre de la liste et les mêmes quatre champs.
2. **Given** un type choisi, **When** la liste des cadeaux s'ouvre, **Then** elle ne propose que les idées de ce type qui ne sont pas déjà réservées.
3. **Given** le type « Blank », **When** la liste des cadeaux s'ouvre, **Then** elle propose toutes les idées non réservées, quel que soit le type.
4. **Given** une idée libre, **When** l'invité la confirme, **Then** il voit une confirmation, l'idée disparaît de la liste publique (archivée / masquée aux invités) et des choix du formulaire. Les membres voient la réservation dans l'onglet admin.
5. **Given** une idée déjà réservée, **When** un second invité tente de la confirmer, **Then** la réservation est refusée et la première réservation reste la seule.
6. **Given** une réservation confirmée, **When** le site est rouvert plus tard, **Then** l'idée est toujours réservée.

---

### User Story 4 - Voir qui offre quoi (Priority: P7)

Toute personne avec le lien de la liste ouvre « Je veux offrir » et voit les réservations de cette liste : quelle idée, de la part de qui, et le petit mot.

**Why this priority**: La page existe dans le doc. Elle sert à savoir ce qui est pris. Elle vient après le geste de réserver.

**Independent Test**: Après la réservation de l'histoire 3, ouvrir « Je veux offrir » et y retrouver l'idée, le prénom et le mot.

**Acceptance Scenarios**:

1. **Given** aucune réservation, **When** on ouvre « Je veux offrir », **Then** la page explique qu'aucune idée n'est réservée.
2. **Given** une réservation avec prénom et mot, **When** on ouvre la page, **Then** on voit l'idée, le type, le prénom et le mot.
3. **Given** une réservation sans prénom ni mot, **When** on ouvre la page, **Then** l'idée est listée et les deux champs facultatifs sont vides.

---

### User Story 5 - S'inscrire et créer sa wishlist (Priority: P2)

Une personne crée un compte, puis une wishlist à elle. Elle en crée plusieurs. Elle peut partir de zéro ou importer le modèle du doc (les 79 idées).

**Why this priority**: Sans compte, il n'y a pas de liste nouvelle. La lecture (P1) se teste avec une liste déjà là ; la création est le palier suivant.

**Independent Test**: S'inscrire, créer une liste vide « Anniversaire », y ajouter une idée, ouvrir son lien en navigation privée et voir l'idée. Créer une seconde liste en important le modèle et y compter 79 idées.

**Acceptance Scenarios**:

1. **Given** un e-mail encore libre, un mot de passe et un nom affiché, **When** la personne s'inscrit, **Then** elle est connectée et voit qu'elle n'a aucune liste.
2. **Given** un e-mail déjà inscrit, **When** elle recommence l'inscription, **Then** le compte n'est pas dupliqué et un message le dit.
3. **Given** un compte connecté, **When** il crée une wishlist en lui donnant un titre, **Then** il en est membre, la liste est vide, et il obtient un lien de lecture.
4. **Given** la création, **When** il choisit d'importer le modèle du doc, **Then** la liste contient les 79 idées de l'annexe, les types et les filtres décrits dans l'histoire 2.
5. **Given** deux listes créées par le même compte, **When** il ouvre « mes wishlists », **Then** il voit les deux, et le lien de l'une n'affiche pas les idées de l'autre.
6. **Given** un visiteur non inscrit, **When** il tente de créer une liste, **Then** l'application lui demande de s'inscrire ou de se connecter, et aucune liste n'est créée.

---

### User Story 6 - Wishlist commune (Priority: P3)

La personne qui a créé une liste invite un autre compte. À deux, ils modifient la même liste. Quelqu'un qui n'est pas membre continue de la lire avec le lien, sans pouvoir l'éditer.

**Why this priority**: C'est la demande de listes communes. Elle n'a de sens qu'une fois qu'un compte peut créer une liste.

**Independent Test**: Compte A crée une liste et copie le lien d'invitation. Compte B s'inscrit, ouvre ce lien, ajoute une idée. Compte A la voit. Un troisième visiteur, sans compte, voit l'idée et ne trouve pas l'édition.

**Acceptance Scenarios**:

1. **Given** un membre d'une liste, **When** il demande un lien d'invitation, **Then** il obtient un lien distinct du lien de lecture.
2. **Given** ce lien d'invitation et un compte connecté qui n'est pas encore membre, **When** il l'ouvre, **Then** il devient membre et la liste apparaît dans « mes wishlists ».
3. **Given** ce lien et une personne non connectée, **When** elle l'ouvre, **Then** elle peut s'inscrire ou se connecter, puis devenir membre. Elle n'est pas ajoutée tant qu'elle n'a pas de compte.
4. **Given** deux membres, **When** l'un ajoute, modifie ou retire une idée non réservée, **Then** l'autre voit le même résultat sur la même liste.
5. **Given** un compte qui n'est pas membre, **When** il est connecté et ouvre seulement le lien de lecture, **Then** il voit la liste et ne peut pas la modifier.
6. **Given** le membre qui a créé la liste, **When** il retire l'autre membre, **Then** l'autre ne peut plus éditer, le lien de lecture marche encore, et les idées restent.
7. **Given** une liste à deux membres, **When** le créateur la quitte, **Then** l'autre membre devient celui qui peut retirer des membres et supprimer la liste.
8. **Given** une liste dont on est le seul membre, **When** on la supprime, **Then** son lien de lecture ne montre plus la liste.

---

### User Story 7 - Les membres mettent à jour la liste (Priority: P4)

Un membre ajoute une idée, corrige un prix ou un lien, retire une idée, ajoute un type, ou annule une réservation. Un visiteur ne peut pas le faire.

**Why this priority**: Une liste figée devient fausse. Utile une fois que la liste existe et que les membres sont identifiés.

**Independent Test**: Sans compte, l'édition est refusée. Connecté comme membre, ajouter « test », la voir dans la liste et dans le formulaire, la supprimer, annuler une réservation.

**Acceptance Scenarios**:

1. **Given** un visiteur non membre, **When** il cherche à modifier le catalogue ou une réservation, **Then** l'action est refusée.
2. **Given** un membre, **When** il ajoute une idée, **Then** elle apparaît sur le lien de lecture, dans le bon filtre, et dans le formulaire si elle n'est pas réservée.
3. **Given** un membre, **When** il retire une idée qui n'est pas réservée, **Then** elle disparaît de la liste et du formulaire.
4. **Given** une idée réservée, **When** un membre annule la réservation, **Then** l'idée redevient proposable et disparaît de « Je veux offrir ».
5. **Given** une idée réservée, **When** un membre tente de la retirer, **Then** le retrait est refusé tant que la réservation n'est pas annulée.
6. **Given** un membre, **When** il ajoute un type, **Then** ce type est proposable dans le formulaire et comme valeur du champ Type.

---

### Edge Cases

- Prix, lien et priorité peuvent être vides. Le nom, le type et le champ Qui sont obligatoires pour une idée.
- La priorité n'a pas d'échelle dans le doc. Si elle est remplie plus tard, elle s'affiche comme un texte libre. Elle ne trie pas la liste.
- Les libellés du doc sont gardés tels quels, y compris « whishlist », « Vetements », « pépiniaire », « Jolie souvenirs », « Kakier », « moaire roueg », « Pul en laine », « Assoritment », « Anigurumi ».
- Les types « Van » et « Matériaux » existent dans le formulaire source et n'ont aucune idée au départ. Les choisir montre une liste de cadeaux vide.
- Le bouton « Maison » du modèle filtre le type Divers. Il n'ajoute pas de type « Maison » au formulaire.
- Sur une liste importée du modèle, « Couple » est une valeur de Qui sans bouton. Sur une liste créée vide, chaque Qui ajouté a un bouton.
- Deux invités confirment la même idée en même temps : une seule réservation est gardée, l'autre est refusée.
- Un mot ou un prénom très long reste visible en entier sur « Je veux offrir ».
- Retirer le dernier exemplaire d'un type ne supprime pas le type.
- Le modèle importé ne dépend pas de la disponibilité du doc source le jour de la visite.
- Deux personnes s'inscrivent avec le même e-mail en même temps : un seul compte est créé.
- Un lien d'invitation régénéré par un membre ne doit plus faire entrer personne via l'ancien lien.
- Supprimer une liste supprime ses idées et ses réservations. Le lien de lecture ne les montre plus.
- Un compte peut être membre de listes qu'il n'a pas créées, et créateur d'autres listes, en même temps.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Chaque wishlist MUST avoir un lien de lecture. L'ouvrir MUST montrer ses idées sans compte et sans connexion.
- **FR-002**: L'accueil sans lien de liste MUST NOT lister les wishlists d'autrui. Il MUST proposer l'inscription et la connexion.
- **FR-003**: Une wishlist MUST présenter « Toute la liste », « Types » et « Je veux offrir ». Sur une liste importée du modèle, la première vue s'appelle « Toute la whishlist ».
- **FR-004**: La liste MUST afficher chaque idée avec Item, Type, Lien, Prix en euros, Priorité et Qui, dans l'ordre de la liste.
- **FR-005**: Importer le modèle MUST copier les 79 idées de l'annexe, sans en ajouter ni en omettre, avec leurs types, leurs « Qui » et les boutons de filtre de l'histoire 2.
- **FR-006**: Un lien d'idée MUST s'ouvrir vers l'adresse enregistrée. Une idée sans lien MUST rester affichée.
- **FR-007**: Un prix MUST s'afficher en euros avec deux décimales quand il existe, et rester vide sinon.
- **FR-008**: Une liste importée MUST proposer les boutons de filtre du doc, avec le regroupement de l'histoire 2. Une liste non importée MUST proposer un bouton par type et un bouton par valeur de Qui qu'elle contient.
- **FR-009**: Le formulaire de réservation d'une liste importée MUST s'intituler « Réserver un cadeau pour Alex et Sam ». Toute liste MUST demander le type, le cadeau, « De la part de » (facultatif) et « Un petit mot ? » (facultatif).
- **FR-010**: Les types du modèle MUST être : Blank, Outil de jardinage, Arbres et plantes, Outils de bricolage, Matériaux, Livres, Jeux, Cuisine, Tech, Dessin, Divers, Van, Abonnements, Crochet, Vetements. Blank n'est pas une idée, c'est l'absence de filtre.
- **FR-011**: Choisir un type autre que Blank MUST limiter les cadeaux proposés à ce type dans cette liste. Blank MUST lister toutes les idées non réservées de cette liste.
- **FR-012**: Le cadeau MUST être obligatoire à la réservation. « De la part de » et « Un petit mot ? » MUST rester facultatifs.
- **FR-013**: Une idée MUST avoir au plus une réservation active.
- **FR-014**: Une réservation confirmée MUST être visible comme telle sur la liste, sans retirer l'idée.
- **FR-015**: « Je veux offrir » MUST lister les réservations actives de cette liste seulement, avec l'idée, son type, le prénom s'il existe, et le mot s'il existe. Cette page MUST être lisible sans compte par quiconque a le lien de lecture.
- **FR-016**: Comptes, wishlists, membres et réservations MUST être encore là après une fermeture du site et une réouverture.
- **FR-017**: S'inscrire MUST demander un e-mail, un mot de passe et un nom affiché. L'e-mail MUST être unique. Un visiteur MUST pouvoir se connecter et se déconnecter.
- **FR-018**: Un compte connecté MUST pouvoir créer plusieurs wishlists, vides ou par import du modèle, et les retrouver dans « mes wishlists ».
- **FR-019**: Seuls les membres d'une wishlist MUST pouvoir créer, modifier ou retirer une idée, gérer les types et les « Qui », annuler une réservation, et supprimer la liste.
- **FR-020**: Un visiteur non membre MUST pouvoir consulter et réserver sans compte. Il MUST NOT pouvoir éditer.
- **FR-021**: Un membre MUST pouvoir obtenir un lien d'invitation, distinct du lien de lecture. Un compte qui ouvre ce lien MUST devenir membre. Une personne sans compte MUST s'inscrire ou se connecter avant d'être ajoutée.
- **FR-022**: Régénérer le lien d'invitation MUST invalider le précédent. Retirer un membre MUST lui enlever l'édition sans effacer la liste ni casser le lien de lecture.
- **FR-023**: Quand le créateur quitte une liste qui a d'autres membres, le membre le plus ancien restant MUST pouvoir retirer des membres et supprimer la liste. Le dernier membre MUST pouvoir supprimer la liste. La supprimer MUST retirer ses idées et ses réservations.
- **FR-024**: L'interface MUST être en français.
- **FR-025**: La page « Types » MUST lister les types de cette liste. Un membre MUST pouvoir en ajouter ou en renommer. Renommer MUST mettre à jour les idées qui l'utilisent.
- **FR-026**: Un membre MUST pouvoir modifier le nom, le type, le lien, le prix, la priorité et le Qui d'une idée de sa liste.
- **FR-027**: Le modèle MUST démarrer avec les Qui Alex, Sam et Couple. Un membre MUST pouvoir en ajouter sur sa liste.

### Key Entities

- **Compte**: e-mail unique, mot de passe, nom affiché. Peut être membre de plusieurs wishlists.
- **Wishlist**: titre, lien de lecture, lien d'invitation, modèle importé ou non. Contient ses idées, ses types, ses « Qui », ses filtres et ses réservations. Invisible dans un annuaire.
- **Membre**: lien entre un compte et une wishlist. Tous les membres éditent. Un seul d'entre eux, au départ le créateur, retire les autres membres et supprime la liste. Ce rôle passe au membre le plus ancien si le créateur part.
- **Idée**: un cadeau d'une wishlist. Nom, type, lien optionnel, prix optionnel en euros, priorité optionnelle (texte libre), pour qui. Au plus une réservation active.
- **Type**: une catégorie du formulaire de cette liste. Peut exister sans idée.
- **Réservation**: le choix d'une idée libre par un visiteur, avec ou sans compte. Idée concernée, prénom optionnel, petit mot optionnel, moment de la confirmation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visiteur non inscrit ouvre un lien de liste et trouve une idée connue en moins de 30 secondes sur téléphone, sans créer de compte.
- **SC-002**: Après import du modèle, les 79 idées correspondent à l'annexe sur le nom, le type, le prix, le Qui et le lien, sans écart.
- **SC-003**: Une personne crée un compte et une wishlist, puis copie son lien de lecture, en moins de trois minutes.
- **SC-004**: Un second compte rejoint cette liste via le lien d'invitation et ajoute une idée visible par le premier, en moins de deux minutes une fois les deux comptes existants.
- **SC-005**: Un invité réserve une idée libre en moins de deux minutes, sans compte.
- **SC-006**: Après deux tentatives simultanées sur la même idée, une seule réservation existe.
- **SC-007**: Chaque bouton de filtre du modèle renvoie le sous-ensemble de l'histoire 2. « Maison » renvoie les idées Divers.
- **SC-008**: Un compte, une liste et une réservation sont encore présents après que le site a été relancé.
- **SC-009**: Un visiteur non membre ne peut modifier aucune idée ni annuler aucune réservation, sur 100 % des actions essayées. L'accueil sans lien ne révèle aucune liste.

## Assumptions

- « Wishlist commune » veut dire une liste dont plusieurs comptes sont membres, et chaque membre édite. Ce n'est pas une liste modifiable par n'importe quel visiteur. Le rejoindre se fait par un lien d'invitation à copier, parce que cette version n'envoie pas d'e-mail.
- Le lien de lecture suffit à voir la liste et « Je veux offrir », sans compte. Il n'y a pas de mode privé. Il n'y a pas d'annuaire : sans le lien, on ne trouve pas la liste.
- Le prénom et le petit mot restent visibles par quiconque a le lien de lecture, comme sur le doc publié. Ce n'est pas une liste à surprise masquée.
- L'inscription est e-mail + mot de passe + nom affiché. Pas de vérification d'e-mail et pas de « mot de passe oublié » dans cette version.
- « Priorité » reste un texte libre, sans échelle et sans tri.
- Le bouton « Maison » du modèle montre les idées Divers. Lu sur la sous-page du doc le 2026-10-18.
- « Blank » veut dire « pas de filtre de type ».
- Une seule réservation active par idée. Pas de cagnotte. L'invité ne modifie pas sa réservation. Un membre l'annule.
- Le catalogue de l'annexe est l'état du doc au 2026-10-18. Les paramètres de tracking ont été retirés des liens.
- Pas de paiement : le lien mène chez le marchand.
- La page « Types » du doc, lue le 2026-10-18, liste les mêmes types que le FR-010 hors Blank. Sur une liste importée, elle est le référentiel des types du formulaire.
- Les contraintes d'exploitation sont dans la constitution, pas dans cette spec.


## Données de test et de démonstration

Le catalogue personnel (annexe 79 idées) a été retiré du dépôt. `data/seed.json` reste une fixture générique utilisée par les tests de domaine : elle n'est pas proposée à l'import dans le produit.

`data/demo-seed.json` décrit un foyer fictif et couvre les états utiles aux démonstrations et captures : plusieurs catégories et destinataires, prix et liens facultatifs, niveaux d'envie, une idée archivée et une idée destinée à être réservée. Le script `npm run demo:data -- <chemin>` produit une base complète avec deux comptes fictifs, une liste collaborative et une réservation. Il MUST refuser de cibler implicitement `data/wishlist.json` : le chemin de sortie est toujours explicite.

Les adresses utilisent le domaine réservé `.test`, les liens cadeaux `example.com`, et aucun secret ou compte de production n'est réutilisé.
