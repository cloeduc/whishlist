# Feature Specification: Ajouter une catégorie depuis le formulaire d'idée

**Feature Branch**: `023-add-category-from-idea`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Ajouter une catégorie depuis le formulaire d'idée, sur le site et dans l'app. Dans le choix de catégorie du formulaire (ajout et modification d'une idée), une entrée « + Nouvelle catégorie » permet de saisir un nom ; la catégorie est créée dans la liste (mêmes règles que l'onglet Réglages : nom requis, pas de doublon) puis sélectionnée pour l'idée. Origine : bug idea-category-locked — une liste créée dans l'app n'a qu'une catégorie (« Livres ») et le formulaire ne permet pas d'en ajouter ni ne dit où le faire."

## Contexte

Une utilisatrice de l'app Android a écrit : « quand j'ajoute une autre idée je n'arrive pas à changer la catégorie… je ne peux mettre que livre ». La vérification (`.specify/bugs/idea-category-locked/assessment.md`) l'a reproduit sur iPhone : une liste créée dans l'app ne reçoit que la catégorie saisie à sa création, et le choix de catégorie du formulaire d'idée ne propose que les catégories existantes, sans moyen d'en ajouter ni d'indication que cela se fait dans l'onglet Réglages. Le site a la même limite.

Cette feature permet de créer une catégorie au moment où on en a besoin : en remplissant une idée.

## Clarifications

### Session 2026-11-16

- Q: Faut-il aussi pouvoir créer un « Pour qui ? » depuis le formulaire ? → A: non, seulement la catégorie. « Pour qui ? » doit à terme n'exister que pour les listes collaboratives : sujet à part (ticket Plane).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Créer une catégorie depuis le formulaire d'idée, dans l'app (Priority: P1)

En ajoutant ou en modifiant une idée dans l'app, la personne ouvre « Catégorie » ; sous les catégories existantes, une entrée « + Nouvelle catégorie » lui permet de taper un nom (par exemple « Jeux ») et de valider. La catégorie est ajoutée à la liste et choisie pour l'idée ; la personne termine son idée normalement.

**Why this priority**: c'est l'app qui a déclenché le signalement ; une liste créée dans l'app n'a souvent qu'une catégorie.

**Independent Test**: créer une liste dans l'app avec la seule catégorie « Livres », ajouter une idée, « Catégorie » → « + Nouvelle catégorie » → « Jeux » → valider ; enregistrer l'idée : elle apparaît dans « Jeux », et « Jeux » figure dans l'onglet Réglages. Parcours e2e tagué `023-us1`.

**Acceptance Scenarios**:

1. **Given** le formulaire d'idée (ajout ou modification), **When** la personne ouvre « Catégorie », **Then** elle voit les catégories existantes puis une entrée « + Nouvelle catégorie ».
2. **Given** « + Nouvelle catégorie », **When** elle saisit « Jeux » et valide, **Then** « Jeux » est ajoutée à la liste, sélectionnée dans le champ « Catégorie », et les autres champs du formulaire gardent ce qu'elle avait saisi.
3. **Given** la catégorie créée, **When** elle enregistre l'idée, **Then** l'idée est rangée dans « Jeux ».
4. **Given** un nom vide (ou fait d'espaces), **When** elle valide, **Then** rien n'est créé et le message du site s'affiche (nom requis).
5. **Given** un nom déjà pris dans la liste, sans tenir compte des majuscules (« livres »), **When** elle valide, **Then** rien n'est créé, le message « Cette catégorie existe déjà dans cette liste. » s'affiche, et la personne peut choisir la catégorie existante.
6. **Given** l'app hors ligne, **When** elle ouvre « Catégorie », **Then** « + Nouvelle catégorie » est désactivée, avec l'explication habituelle (« demande une connexion ») ; le reste du formulaire fonctionne hors ligne comme avant.
7. **Given** elle ouvre « + Nouvelle catégorie » puis renonce, **When** elle ferme, **Then** rien n'est créé et la catégorie choisie avant reste choisie.

---

### User Story 2 - Créer une catégorie depuis le formulaire d'idée, sur le site (Priority: P2)

Même chose sur le site : dans le formulaire d'idée (ajout et modification), le choix de catégorie propose « + Nouvelle catégorie », qui laisse saisir un nom, crée la catégorie et la sélectionne.

**Why this priority**: garder le site et l'app au même comportement ; la limite existe aussi sur le site.

**Independent Test**: sur le site, liste à une catégorie, ajouter une idée, « + Nouvelle catégorie » → « Jeux » ; enregistrer : l'idée est dans « Jeux ».

**Acceptance Scenarios**:

1. **Given** le formulaire d'idée du site, **When** la personne ouvre « Catégorie », **Then** une option « + Nouvelle catégorie » suit les catégories existantes.
2. **Given** cette option, **When** elle saisit un nom et valide, **Then** la catégorie est créée, choisie, et les autres champs gardent leur saisie.
3. **Given** un nom vide ou déjà pris, **When** elle valide, **Then** rien n'est créé et le message correspondant s'affiche.

---

### Edge Cases

- **Mêmes règles que Réglages** : nom requis (espaces retirés), pas deux catégories du même nom dans une liste sans tenir compte des majuscules, même longueur maximale ; mêmes messages.
- **Virgules** : un nom avec des virgules (« Jeux, Livres ») suit la règle de Réglages pour l'ajout d'une catégorie.
- **« Pour qui ? »** : inchangé (choix parmi les « qui » existants) ; il n'a pas d'entrée « + Nouvelle personne ».
- **Membre retiré ou liste supprimée entre-temps** : la création est refusée avec le message habituel ; l'idée n'est pas enregistrée.
- **Deux membres créent la même catégorie en même temps** : le second reçoit « Cette catégorie existe déjà » ; il choisit l'existante.
- **Catégorie créée puis idée abandonnée** : la catégorie reste dans la liste (comme si elle avait été créée dans Réglages) ; on peut la supprimer dans Réglages tant qu'aucune idée ne l'utilise.
- **Liste en attente d'envoi (créée hors ligne, pas encore sur le serveur)** : « + Nouvelle catégorie » est désactivée, comme hors ligne.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le choix de catégorie du formulaire d'idée (ajout et modification), dans l'app et sur le site, MUST proposer après les catégories existantes une entrée « + Nouvelle catégorie ».
- **FR-002**: Cette entrée MUST permettre de saisir un nom puis de valider ou de renoncer.
- **FR-003**: À la validation, la catégorie MUST être créée dans la liste avec les mêmes règles et les mêmes messages que l'ajout dans l'onglet Réglages (nom requis, pas de doublon sans tenir compte des majuscules, longueur maximale).
- **FR-004**: Une catégorie créée MUST être aussitôt sélectionnée pour l'idée en cours, sans perdre aucune autre saisie du formulaire.
- **FR-005**: Un refus (nom vide, doublon, droits, liste disparue) MUST ne rien créer, afficher le message correspondant, et laisser le formulaire tel quel.
- **FR-006**: Renoncer MUST ne rien créer et garder la catégorie choisie avant.
- **FR-007**: Dans l'app, l'entrée MUST être désactivée hors ligne et pour une liste pas encore envoyée, avec l'explication habituelle ; le reste du formulaire garde son fonctionnement hors ligne.
- **FR-008**: La catégorie créée MUST apparaître ensuite partout où apparaissent les catégories de la liste (Réglages, regroupement des idées, liste partagée).
- **FR-009**: Les textes MUST exister en français et en anglais.

### Key Entities

- **Catégorie** (existante) : nom, ordre, liste. Créée ici par le même chemin que dans Réglages ; rien ne change dans ses règles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depuis une liste à une seule catégorie, une personne range une nouvelle idée dans une nouvelle catégorie sans quitter le formulaire, en moins de 30 secondes.
- **SC-002**: Aucune saisie du formulaire n'est perdue en créant une catégorie (0 champ vidé).
- **SC-003**: Les mêmes noms refusés dans Réglages sont refusés depuis le formulaire, avec les mêmes messages (100 % des cas testés).

## Assumptions

- Le comportement de création d'une liste (une seule catégorie si on n'en saisit qu'une) ne change pas.
- La création d'une catégorie demande le réseau, comme dans Réglages aujourd'hui ; rendre les catégories créables hors ligne est hors périmètre.
- Une réponse à l'utilisatrice qui a signalé le problème (ajouter les catégories dans Réglages) est donnée à part, en attendant la publication.
- Le site n'a pas de suite e2e : US2 se vérifie à la main (quickstart) ; US1 a son parcours Maestro.
