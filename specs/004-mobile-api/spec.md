# Feature Specification: API pour une app mobile

**Feature Branch**: `004-mobile-api`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Crée une api qui me permettra de créer une app mobile indépendante dans un second temps"

## Contexte

Aujourd'hui, seul le site web lit et modifie les listes. Une app mobile installée sur le téléphone, avec sa propre interface, a besoin d'un accès programmatique aux mêmes données et aux mêmes règles : consulter une liste par son lien, réserver une idée, se connecter, gérer ses listes.

Cette feature livre cet accès, pas l'app mobile. Elle est réussie quand un client autre que le site (un script de test ou une future app) peut faire les parcours ci-dessous avec les mêmes règles et les mêmes droits que le site. Le site web reste inchangé pour ses utilisateurs.

## User Scenarios & Testing *(mandatory)*

Dans les scénarios, « le client » désigne une application qui n'est pas le site web : la future app mobile, ou un script qui la simule pendant les tests.

### User Story 1 - Consulter une liste et réserver sans compte (Priority: P1)

Une personne a reçu le lien d'une liste. Depuis le client, sans compte, elle voit les idées de la liste avec leur statut, puis réserve une idée en laissant son nom et un petit mot. Elle peut annuler sa propre réservation depuis le même appareil.

**Why this priority**: C'est le parcours le plus fréquent (les invités sont plus nombreux que les membres) et il ne demande pas de compte (principe II). Seul, il permet déjà une app « invité » utile.

**Independent Test**: Avec la base de démo, ouvrir une liste par son lien depuis le client, réserver une idée libre, vérifier sur le site que l'idée apparaît réservée, puis annuler depuis le client.

**Acceptance Scenarios**:

1. **Given** le lien de lecture d'une liste sans mot de passe, **When** le client demande la liste, **Then** il reçoit son titre, ses catégories, ses « qui » et les mêmes idées que la page publique du site (les idées libres, plus celles que ce client a réservées, marquées comme siennes), sans e-mail de membre ni donnée privée.
2. **Given** une liste protégée par un mot de passe de lecture, **When** le client la demande sans avoir donné le mot de passe, **Then** il reçoit un refus qui indique qu'un mot de passe est nécessaire, sans le contenu de la liste.
3. **Given** une liste protégée, **When** le client envoie le bon mot de passe, **Then** il peut lire la liste et y réserver pendant la même durée que sur le site.
4. **Given** une idée libre, **When** le client la réserve avec un nom d'offreur et un petit mot, **Then** l'idée disparaît des idées libres pour tous, sur le site comme dans le client, et ce client la voit comme sienne.
5. **Given** deux clients qui réservent la même idée au même moment, **When** les deux demandes arrivent, **Then** une seule réussit et l'autre reçoit un refus « déjà réservée » (principe III).
6. **Given** une réservation faite par ce client sans compte, **When** il l'annule, **Then** l'idée redevient libre ; **When** un autre client sans compte tente d'annuler cette réservation, **Then** il est refusé.
7. **Given** un lien de lecture inconnu, **When** le client le demande, **Then** il reçoit « introuvable », sans indiquer si d'autres listes existent (pas d'annuaire).

---

### User Story 2 - Se connecter et retrouver ses listes (Priority: P2)

Une personne qui a un compte se connecte depuis le client avec son e-mail et son mot de passe. Elle voit les listes dont elle est membre, ouvre l'une d'elles avec la vue membre (réservations comprises, avec le nom de l'offreur), et se déconnecte.

**Why this priority**: C'est la porte d'entrée de tous les parcours membre. Sans elle, l'app reste une app invité.

**Independent Test**: Avec un compte fictif de la démo, se connecter depuis le client, lister ses listes, ouvrir une liste, se déconnecter, et vérifier qu'une demande suivante avec l'ancienne connexion est refusée.

**Acceptance Scenarios**:

1. **Given** un compte existant, **When** le client envoie le bon e-mail et le bon mot de passe, **Then** il reçoit une preuve de connexion qu'il présente ensuite à chaque demande.
2. **Given** un mauvais mot de passe, **When** le client tente de se connecter, **Then** il reçoit un refus qui ne dit pas si l'e-mail existe.
3. **Given** un client connecté, **When** il demande ses listes, **Then** il reçoit uniquement les listes dont le compte est membre.
4. **Given** un client connecté, **When** il demande une liste dont il n'est pas membre (par son identifiant), **Then** il est refusé comme si la liste n'existait pas.
5. **Given** un client connecté, **When** il se déconnecte, ou **When** le mot de passe du compte est changé ailleurs, **Then** sa preuve de connexion ne fonctionne plus.
6. **Given** un compte qui doit changer son mot de passe à la première connexion, **When** le client se connecte, **Then** il est informé qu'il doit le changer et ne peut faire que ce changement avant les autres actions.
7. **Given** trop de tentatives de connexion échouées, **When** le client réessaie, **Then** il est temporairement refusé, avec la même limite que sur le site.

---

### User Story 3 - Gérer les idées d'une liste (Priority: P3)

Un membre connecté ajoute, modifie, range dans une catégorie, archive et supprime des idées de sa liste depuis le client. Il peut préremplir une idée à partir d'un lien produit quand ce service est configuré. Il peut annuler une réservation faite sur sa liste.

**Why this priority**: C'est l'usage principal d'un membre au quotidien (ajouter une idée vue en magasin, depuis son téléphone).

**Independent Test**: Connecté avec un compte membre de la démo, ajouter une idée depuis le client, la voir sur le site, la modifier, l'archiver, puis la supprimer.

**Acceptance Scenarios**:

1. **Given** un membre connecté, **When** il ajoute une idée avec un titre, une catégorie, un « qui », un prix, un lien, une image et une priorité, **Then** l'idée est créée avec les mêmes validations que sur le site.
2. **Given** une idée invalide (titre vide, prix invalide, lien non autorisé), **When** le client l'envoie, **Then** il reçoit un code d'erreur stable et un message dans la langue demandée.
3. **Given** un membre connecté, **When** il modifie, archive, désarchive, change de catégorie ou supprime une idée, **Then** le changement est visible sur le site et dans le client.
4. **Given** un compte qui n'est pas membre de la liste, **When** il tente une de ces actions, **Then** il est refusé et rien ne change (principe II).
5. **Given** un lien produit et le service d'enrichissement configuré, **When** le membre demande à préremplir, **Then** il reçoit le nom, le prix, l'image et la catégorie proposés, sans que l'idée soit créée ; **Given** le service non configuré, **Then** il reçoit une réponse qui indique que le service est absent.
6. **Given** une réservation sur sa liste, **When** un membre l'annule, **Then** l'idée redevient libre (principe III).

---

### User Story 4 - Créer une liste et l'organiser (Priority: P4)

Un membre connecté crée une liste, gère ses catégories et ses « qui » (ajouter, renommer, retirer, réordonner), et modifie les réglages de la liste.

**Why this priority**: La création et le réglage d'une liste sont plus rares que l'ajout d'idées, et le site les couvre déjà bien.

**Independent Test**: Connecté, créer une liste depuis le client, lui ajouter deux catégories et un « qui », les renommer, puis vérifier le résultat sur le site.

**Acceptance Scenarios**:

1. **Given** un client connecté, **When** il crée une liste, **Then** il en devient le créateur et le seul membre, et reçoit son lien de lecture.
2. **Given** une catégorie ou un « qui » encore utilisé par des idées, **When** le client tente de le retirer, **Then** il est refusé avec un code d'erreur stable.
3. **Given** un membre, **When** il réordonne les catégories, **Then** le nouvel ordre est le même sur le site.

---

### User Story 5 - Partager une liste et gérer ses membres (Priority: P5)

Un membre connecté invite une personne par e-mail ou récupère un lien d'invitation, régénère ce lien, pose ou retire le mot de passe de lecture, retire un membre, quitte la liste. Le créateur peut supprimer la liste. Une personne connectée peut rejoindre une liste avec un lien d'invitation.

**Why this priority**: Ces actions sont rares et sensibles. Elles complètent l'app mais ne bloquent aucun parcours précédent.

**Independent Test**: Avec deux comptes fictifs, inviter le second depuis le client, accepter l'invitation avec le second compte, puis le retirer.

**Acceptance Scenarios**:

1. **Given** un membre, **When** il régénère le lien d'invitation, **Then** l'ancien lien ne permet plus de rejoindre la liste.
2. **Given** une personne connectée et un lien d'invitation valide, **When** elle l'accepte depuis le client, **Then** elle devient membre de la liste.
3. **Given** un membre qui n'est pas le créateur, **When** il tente de supprimer la liste, **Then** il est refusé.
4. **Given** un membre, **When** il envoie une invitation par e-mail, **Then** les mêmes limites de débit que sur le site s'appliquent, et l'envoi est absent si l'e-mail n'est pas configuré.

---

### User Story 6 - Gérer son compte (Priority: P6)

Depuis le client, une personne crée un compte, change son nom affiché et son mot de passe, et demande la réinitialisation d'un mot de passe oublié.

**Why this priority**: Utile pour une app autonome, mais une personne peut faire tout cela sur le site en attendant.

**Independent Test**: Créer un compte fictif depuis le client, se connecter, changer de nom affiché, puis vérifier le nom sur le site.

**Acceptance Scenarios**:

1. **Given** un e-mail inconnu, **When** le client crée un compte, **Then** le compte est créé et le client est connecté.
2. **Given** un client connecté, **When** il change son mot de passe, **Then** ses autres connexions (site et autres appareils) ne fonctionnent plus, et la sienne continue.
3. **Given** une demande de réinitialisation, **When** le client l'envoie, **Then** la réponse est la même que l'e-mail existe ou non, et le lien de réinitialisation ouvre le site.

---

### Edge Cases

- Une idée est réservée sur le site pendant que le client affiche la liste : la réservation depuis le client est refusée « déjà réservée », et le client peut recharger la liste.
- Une idée est supprimée ou archivée pendant qu'un invité la réserve : refus avec un code « introuvable ».
- La preuve de connexion a expiré : refus « non connecté », sans autre détail, pour que le client renvoie vers la connexion.
- Le client demande une langue qui n'est ni le français ni l'anglais : les messages sont en français (langue par défaut).
- Le client envoie une demande mal formée ou trop grosse : refus clair, sans trace technique interne.
- Le formulaire anti-robot du site (champ piège) n'existe pas dans le client : les limites de débit restent la protection des réservations.
- Une ancienne version de l'app appelle l'accès après une évolution incompatible : elle reçoit une réponse qui lui dit d'être mise à jour, pas un comportement silencieusement différent.
- Le fichier de données existant de la prod est lu sans migration : la feature ne change pas la forme des données des listes.

## Requirements *(mandatory)*

### Functional Requirements

#### Accès et contrat

- **FR-001**: Le système MUST offrir un accès programmatique, distinct des pages du site, qui couvre les parcours des User Stories 1 à 6, et dont chaque réponse est structurée (pas une page à lire).
- **FR-002**: Le contrat de cet accès (opérations, données échangées, codes d'erreur) MUST être décrit dans un document versionné dans le dépôt, assez précis pour écrire l'app mobile sans lire le code du serveur.
- **FR-003**: Le contrat MUST porter un numéro de version. Une évolution incompatible MUST créer une nouvelle version, et l'ancienne MUST soit continuer de fonctionner, soit répondre explicitement qu'elle n'est plus prise en charge.
- **FR-004**: Chaque opération MUST appliquer exactement les mêmes règles métier, validations et droits que l'action équivalente du site ; une règle ne MUST exister qu'une fois dans le code.
- **FR-005**: Les erreurs MUST être renvoyées sous forme d'un code stable (les codes déjà utilisés par le site) et d'un message traduit dans la langue demandée par le client (français par défaut, anglais).
- **FR-006**: Le site web MUST continuer de fonctionner sans changement visible pour ses utilisateurs.

#### Lecture et réservation sans compte

- **FR-010**: Le client MUST pouvoir lire une liste par son lien de lecture, sans compte, avec les mêmes informations que la page publique du site, et rien de plus.
- **FR-011**: Le client MUST pouvoir déverrouiller une liste protégée avec son mot de passe de lecture, avec la même limite de tentatives que le site.
- **FR-012**: Le client MUST pouvoir réserver une idée libre sans compte (nom d'offreur, petit mot), avec la même limite de débit que le site.
- **FR-013**: Deux réservations simultanées de la même idée MUST aboutir à une seule réservation (principe III).
- **FR-014**: Une personne sans compte MUST pouvoir annuler une réservation qu'elle a faite depuis le même client, et seulement celle-là.
- **FR-015**: Aucune opération MUST NOT permettre de lister ou de deviner les listes existantes (pas d'annuaire).

#### Comptes et connexion

- **FR-020**: Le client MUST pouvoir se connecter avec e-mail et mot de passe et recevoir une preuve de connexion à présenter à chaque demande, sans dépendre des cookies du navigateur.
- **FR-021**: La preuve de connexion MUST expirer au bout de la même durée qu'une session du site (30 jours), et MUST être invalidée par la déconnexion et par un changement de mot de passe.
- **FR-022**: Les connexions, inscriptions et demandes de réinitialisation MUST avoir les mêmes limites de débit que sur le site, et les refus MUST NOT révéler si un e-mail a un compte.
- **FR-023**: Un compte qui doit changer son mot de passe MUST ne pouvoir faire que ce changement (et se déconnecter) tant qu'il ne l'a pas fait.
- **FR-024**: Le client connecté MUST pouvoir créer un compte, changer son nom affiché et son mot de passe, et demander une réinitialisation de mot de passe dont le lien ouvre le site.

#### Actions de membre

- **FR-030**: Chaque opération de membre MUST vérifier que le compte connecté est membre de la liste visée avant toute lecture ou écriture ; un non-membre MUST recevoir la même réponse que pour une liste inexistante.
- **FR-031**: Un membre MUST pouvoir lister ses listes et lire une liste avec la vue membre (réservations, nom de l'offreur, petit mot).
- **FR-032**: Un membre MUST pouvoir créer, modifier, archiver, désarchiver, changer de catégorie et supprimer une idée.
- **FR-033**: Un membre MUST pouvoir demander le préremplissage d'une idée à partir d'un lien produit, avec la même limite de débit et les mêmes protections sur les liens que le site ; sans service configuré, l'opération MUST répondre que le service est absent.
- **FR-034**: Un membre MUST pouvoir créer une liste, gérer ses catégories et ses « qui » (ajouter, renommer, retirer s'ils ne sont pas utilisés, réordonner) et modifier ses réglages.
- **FR-035**: Un membre MUST pouvoir annuler une réservation de sa liste, inviter (par e-mail ou par lien), régénérer le lien d'invitation, poser ou retirer le mot de passe de lecture, retirer un membre et quitter la liste ; seul le créateur MUST pouvoir supprimer la liste.
- **FR-036**: Une personne connectée MUST pouvoir rejoindre une liste avec un lien d'invitation valide.

#### Sécurité et exploitation

- **FR-040**: L'accès MUST n'accepter les demandes venant d'une page web que depuis le site lui-même ou depuis les origines de l'app mobile déclarées dans la configuration ; sans cette configuration, seules les demandes hors navigateur et celles du site MUST être acceptées.
- **FR-041**: Les réponses qui contiennent des données de membre ou de connexion MUST NOT être mises en cache par un intermédiaire.
- **FR-042**: Toute nouvelle variable de configuration MUST être optionnelle et documentée comme les autres (README, exemple d'environnement, fichier de déploiement).
- **FR-043**: Chaque règle d'accès et chaque cas limite de cet accès (non connecté, non membre, liste protégée, réservation concurrente, preuve de connexion expirée ou invalidée) MUST avoir un test automatique.

### Key Entities

- **Preuve de connexion** : ce que le client reçoit à la connexion et présente ensuite. Rattachée à un compte, elle a une date d'expiration et cesse de valoir à la déconnexion ou au changement de mot de passe. Elle n'est pas stockée en clair côté serveur.
- **Preuve de réservation invité** : ce qui permet à un client sans compte d'annuler sa propre réservation, l'équivalent de ce que le site garde dans le navigateur.
- **Déverrouillage de liste** : la preuve qu'un client a donné le bon mot de passe de lecture d'une liste, avec la même durée que sur le site.
- **Contrat** : la description versionnée des opérations, des données échangées et des codes d'erreur.
- Les entités métier sont inchangées : User, Wishlist, Membership, Type (catégorie), Person (« qui »), Item (idée), Reservation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un script qui ne lit que le contrat peut faire les six parcours (User Stories 1 à 6) sur la base de démo, sans lire le code du serveur.
- **SC-002**: Pour chaque action du site couverte, le même scénario fait depuis le client et depuis le site donne le même résultat sur les données, y compris les refus.
- **SC-003**: Sur 20 réservations simultanées de la même idée, exactement une réussit.
- **SC-004**: Aucune réponse faite à un client sans compte ou non membre ne contient un e-mail de membre, un identifiant de connexion ou un nom d'offreur au-delà de ce que montre la page publique.
- **SC-005**: Lire une liste de 100 idées depuis le client prend moins d'une seconde dans les conditions de la prod.
- **SC-006**: Après un changement de mot de passe, 100 % des preuves de connexion émises avant ce changement sont refusées.
- **SC-007**: Le site garde le même comportement : les tests existants passent et les parcours du guide utilisateur se refont à l'identique.

## Assumptions

- **Périmètre** : l'accès couvre tous les parcours du site sauf les pages de présentation (projet, FAQ, guide, mentions légales) et la mesure d'audience. Les User Stories sont ordonnées pour pouvoir livrer par tranches (principe IV) : la tranche P1 seule permet une app invité.
- **Hors périmètre** : l'app mobile elle-même, les notifications push, le fonctionnement hors ligne, la connexion par un service tiers (Google, Apple), et toute synchronisation en temps réel.
- **Un seul service** : l'accès est servi par la même application que le site, sur le même domaine, avec les mêmes données. Pas de second service à déployer (section Hébergement de la constitution).
- **Données** : la forme du fichier de données des listes ne change pas. Ce qui s'ajoute pour les preuves de connexion reste compatible avec un fichier existant.
- **Ouvert à tout client** : l'accès n'est pas réservé à une app signée ; les droits reposent sur les comptes, les liens de lecture et les limites de débit, comme pour le site.
- **Liens qui ouvrent le site** : les liens envoyés par e-mail (invitation, réinitialisation) continuent d'ouvrir le site. Les faire ouvrir l'app est une évolution future de l'app.
- **Constitution** : cette feature ajoute un mécanisme (un accès programmatique). Il sert à créer, partager et lire une liste, ce que le principe V autorise, et cette spec en est la justification explicite.
