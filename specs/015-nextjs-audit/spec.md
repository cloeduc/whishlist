# Feature Specification: Suites de l'audit du site (formulaires, erreurs, garde-fous)

**Feature Branch**: `015-nextjs-audit`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Traite l'Audit Next.js"

## Contexte

Un audit du site, fait le 2026-11-03, a conclu à un bon usage de son cadre technique dans l'ensemble, et a relevé sept points à traiter. Deux choix y sont confirmés et ne changent pas : le rendu de chaque page à la demande (imposé par la politique de sécurité du contenu, qui signe chaque réponse), et l'affichage des images des idées sans passer par un service d'optimisation du serveur (il irait chercher des adresses fournies par les utilisateurs sans les contrôles de sécurité habituels).

Les sept points :

- **(a) Formulaires** : quand un formulaire du site est refusé (adresse déjà prise, mot de passe trop court, trop de tentatives…), la page se recharge avec seulement un code d'erreur dans l'adresse : tout ce que la personne avait tapé est perdu. Un seul formulaire, celui des idées, garde aujourd'hui la saisie.
- **(b) Rafraîchissements en double** : après certaines actions (déplacer ou copier une idée, gérer les catégories et les « qui », créer une clé d'API), le navigateur fait une deuxième demande au serveur pour recharger la page, au lieu de recevoir la page à jour avec la réponse de l'action. Les libellés reviennent en arrière à la main en cas d'échec.
- **(c) Code serveur sans garde-fou** : rien n'empêche qu'un fichier qui lit la base, la session ou les secrets soit importé par erreur dans le code envoyé au navigateur. Aucune fuite n'existe aujourd'hui, mais l'erreur passerait sans message clair.
- **(d) Panne de la mise en page principale** : une erreur dans la mise en page commune à toutes les pages affiche la page d'erreur brute du cadre technique, en anglais, sans le style du site.
- **(e) Déclarations redondantes** : une soixantaine de fichiers forcent le rendu à la demande alors que leur contenu l'impose déjà. Elles gênent une évolution future du cache. Celles du fichier robots, du plan du site et des fichiers `.well-known` sont nécessaires (ils lisent la configuration au démarrage, pas à la construction de l'image) et restent.
- **(f) Deux façons de démarrer en production** : la commande de démarrage du dépôt lance un petit serveur maison, l'image Docker en lance un autre. Les deux doivent être les mêmes.
- **(g) Lecture de toute la base à chaque page** : chaque page et chaque action lisent toutes les données du site, puis gardent ce qui les concerne. C'est invisible avec les données actuelles et c'est ce qui ralentira le site quand elles grandiront. C'est l'« étape 2 » de la feature 008 (Phases 8 et 9 de `specs/008-sqlite-storage/tasks.md`), abandonnée le 2026-11-02. **Hors périmètre** (décision du 2026-11-06) : il reste au backlog, à reprendre quand les données grandiront.

Les utilisateurs de cette feature sont les visiteurs du site (points a, b, d) et les personnes qui le développent et l'exploitent (points c, e, f).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un formulaire refusé garde ce qui a été tapé (Priority: P1)

Une personne remplit un formulaire du site et l'envoie. Le site le refuse : mot de passe trop court, deux mots de passe différents, trop de tentatives, nom de liste en double… Le message d'erreur s'affiche à côté du formulaire, et les champs gardent ce qu'elle avait tapé, sauf les mots de passe. Elle corrige seulement ce qui ne va pas et renvoie.

Formulaires concernés : inscription, connexion, mot de passe oublié, réinitialisation du mot de passe, changement de mot de passe, nom affiché, changement d'adresse e-mail, création d'une liste, réglages d'une liste (titre, sous-titre, couverture, couleurs), réservation d'une idée (nom de l'offreur, petit mot), déverrouillage d'une liste protégée, invitation par e-mail, mot de passe de lecture d'une liste.

**Why this priority**: C'est le seul point de l'audit que les visiteurs remarquent à chaque erreur. Le cas le plus pénible est la réservation : un offreur qui a écrit un petit mot le perd si l'idée vient d'être prise ou s'il a fait trop de tentatives.

**Independent Test**: Sur la base de démo, provoquer une erreur sur chaque formulaire de la liste ci-dessus (par exemple s'inscrire avec un mot de passe trop court) : le message d'erreur traduit s'affiche, les champs texte gardent leur valeur, les champs mot de passe sont vides. Refaire le parcours avec JavaScript désactivé : le résultat est le même.

**Acceptance Scenarios**:

1. **Given** le formulaire d'inscription rempli avec un mot de passe trop court, **When** la personne l'envoie, **Then** le message « mot de passe trop court » s'affiche, l'adresse et le nom affiché sont toujours remplis, et le champ mot de passe est vide.
2. **Given** un offreur qui a écrit son nom et un petit mot sur le formulaire de réservation, **When** la réservation est refusée (idée déjà réservée entre-temps, trop de tentatives), **Then** le message s'affiche et le nom et le petit mot sont toujours là.
3. **Given** le formulaire de changement de mot de passe avec deux nouveaux mots de passe différents, **When** la personne l'envoie, **Then** le message « les mots de passe ne correspondent pas » s'affiche et aucun mot de passe n'est réaffiché.
4. **Given** n'importe quel formulaire de la liste, **When** il est accepté, **Then** le site fait la même chose qu'aujourd'hui (même page d'arrivée, même message de confirmation, même cookie de session pour la connexion).
5. **Given** un navigateur sans JavaScript, **When** un formulaire de la liste est refusé, **Then** le message s'affiche et la saisie est gardée comme avec JavaScript.
6. **Given** le formulaire d'inscription rempli avec une adresse déjà utilisée, **When** la personne l'envoie, **Then** le site affiche le même écran « e-mail envoyé » qu'aujourd'hui, sans erreur : il ne révèle pas qu'un compte existe.

---

### User Story 2 - Une panne générale affiche une page d'erreur du site (Priority: P2)

Quand une erreur casse la mise en page commune à toutes les pages, la personne voit une page d'erreur dans la langue de son adresse (français ou anglais), aux couleurs du site, qui explique que quelque chose s'est mal passé et propose de réessayer ou de revenir à l'accueil, au lieu de la page brute en anglais du cadre technique.

**Why this priority**: Rare, mais c'est le pire moment pour montrer une page incompréhensible. Le travail est petit.

**Independent Test**: Provoquer volontairement une erreur dans la mise en page commune (en dev) et ouvrir une page en `/fr` puis en `/en` : la page d'erreur du site s'affiche dans la bonne langue, et « Réessayer » recharge la page.

**Acceptance Scenarios**:

1. **Given** une erreur dans la mise en page commune, **When** une personne ouvre une page en français, **Then** elle voit le titre, le texte et le bouton d'erreur du site en français.
2. **Given** la même erreur sur une adresse en anglais, **When** la page s'affiche, **Then** les textes sont en anglais.
3. **Given** la page d'erreur affichée, **When** la personne clique « Réessayer », **Then** le site retente l'affichage de la page.
4. **Given** une erreur dans une page seule (pas dans la mise en page commune), **When** elle survient, **Then** la page d'erreur existante s'affiche comme aujourd'hui, et son bouton « Réessayer » recharge aussi les données de la page.

---

### User Story 3 - Les actions sur une liste mettent la page à jour en une fois (Priority: P2)

Un membre déplace ou copie une idée vers une autre liste, ajoute, renomme ou supprime une catégorie ou un « qui », ou crée une clé d'API. La page se met à jour avec la réponse de l'action, sans second chargement. Pour les catégories et les « qui », le changement s'affiche tout de suite et revient de lui-même à l'état d'avant si le serveur le refuse, avec le message d'erreur.

**Why this priority**: Le gain se voit surtout sur une connexion lente (une attente au lieu de deux) ; le comportement reste le même.

**Independent Test**: Sur la base de démo, avec le réseau ralenti dans le navigateur, faire chacune de ces actions et compter les demandes au serveur : une seule par action. Provoquer un refus (catégorie en double) : la puce revient à son état d'avant et le message s'affiche.

**Acceptance Scenarios**:

1. **Given** une idée copiée vers une autre liste, **When** l'action réussit, **Then** le message de confirmation et la page à jour s'affichent après une seule demande au serveur.
2. **Given** un ajout de catégorie avec un nom déjà pris, **When** le serveur refuse, **Then** la puce ajoutée disparaît et le message « nom déjà utilisé » s'affiche.
3. **Given** une clé d'API créée, **When** l'action réussit, **Then** la clé s'affiche une fois et apparaît dans la liste des clés, comme aujourd'hui.

---

### User Story 4 - Le code serveur et le démarrage sont protégés et unifiés (Priority: P3)

Une personne qui développe le site, ou un agent, est arrêtée à la construction avec un message clair si elle importe par erreur du code serveur (base, session, secrets) dans un composant envoyé au navigateur. Les pages ne portent plus de déclaration de rendu redondante, sauf celles qui en ont besoin, dont la raison est écrite à côté. La production démarre de la même façon avec la commande du dépôt et dans l'image Docker.

**Why this priority**: Aucun visiteur ne le voit ; cela évite des erreurs futures et prépare une évolution du cache.

**Independent Test**: Ajouter temporairement l'import d'un module de la base dans un composant client : la construction échoue avec un message qui nomme le module. Chercher les déclarations de rendu forcé : il ne reste que celles du fichier robots, du plan du site et des fichiers `.well-known`, chacune commentée. Lancer la production avec la commande du dépôt puis avec l'image Docker : c'est le même serveur, qui répond sur le même port et respecte les mêmes variables (port, adresse d'écoute).

**Acceptance Scenarios**:

1. **Given** un composant client qui importe un module de la base, de la session ou des commandes serveur, **When** on construit le site, **Then** la construction échoue avec un message explicite.
2. **Given** le site après la feature, **When** on ouvre chaque page (accueil, liste, liste publique, compte, pages juridiques), **Then** chacune s'affiche comme avant, avec des données à jour à chaque visite et la même politique de sécurité.
3. **Given** le fichier robots, le plan du site et les fichiers `.well-known`, **When** on les demande sur une image construite avec des valeurs factices puis lancée avec la vraie configuration, **Then** ils reflètent la vraie configuration, comme aujourd'hui.
4. **Given** la commande de démarrage du dépôt et l'image Docker, **When** on lance l'une puis l'autre, **Then** elles démarrent le même serveur ; le serveur maison n'existe plus et la documentation de déploiement le dit.

---

### Edge Cases

- **Mots de passe** : un formulaire refusé ne réaffiche jamais un mot de passe, ni dans les champs, ni dans l'adresse de la page, ni dans la page envoyée au navigateur.
- **Adresse de la page** : la saisie gardée ne passe pas par l'adresse de la page (elle se retrouverait dans l'historique et les journaux).
- **Liens existants avec un code d'erreur** : une adresse avec un ancien code d'erreur (`?e=…`), enregistrée en favori ou envoyée, s'ouvre toujours sans planter ; elle peut afficher le message comme aujourd'hui ou l'ignorer.
- **Trop de tentatives** : le message « trop de tentatives » garde la saisie comme les autres erreurs, et la limite de débit reste la même.
- **Champ piège anti-robot du formulaire de réservation** : rempli, il mène toujours à la même page de succès apparent, sans réservation.
- **Erreur pendant l'affichage de la page d'erreur générale** : elle ne doit pas dépendre de la session ni de la base, pour s'afficher même si elles sont en panne.
- **Langue de la page d'erreur générale** : si la langue ne peut pas être lue dans l'adresse, le français s'affiche.
- **Démarrage** : les variables de port et d'adresse d'écoute, et le contrôle de santé de l'image Docker, marchent comme aujourd'hui.

## Requirements *(mandatory)*

### Functional Requirements

#### Formulaires (a)

- **FR-001**: Quand un formulaire de la liste de l'US1 est refusé, le site DOIT afficher le message d'erreur traduit et garder la valeur de chaque champ qui n'est pas un mot de passe.
- **FR-002**: Le site NE DOIT réafficher aucun mot de passe après un refus, ni le faire passer par l'adresse de la page.
- **FR-003**: Ces formulaires DOIVENT marcher sans JavaScript, avec le même message et la même saisie gardée.
- **FR-004**: Quand un de ces formulaires est accepté, le site DOIT garder le comportement actuel (page d'arrivée, message de confirmation, cookies, limites de débit, champ anti-robot).
- **FR-005**: Une adresse qui porte un ancien code d'erreur DOIT toujours s'ouvrir sans erreur.

#### Page d'erreur générale (d)

- **FR-006**: Une erreur dans la mise en page commune DOIT afficher une page d'erreur du site, traduite en français et en anglais selon l'adresse (français par défaut), avec un bouton pour réessayer.
- **FR-007**: Cette page NE DOIT dépendre ni de la session ni de la base.

#### Mises à jour en une fois (b)

- **FR-008**: Après un déplacement ou une copie d'idée, une action sur les catégories ou les « qui », ou une création de clé d'API, la page DOIT être mise à jour avec la réponse de l'action, sans second chargement demandé par le navigateur.
- **FR-009**: Un changement de catégorie ou de « qui » DOIT s'afficher tout de suite et revenir à l'état précédent si le serveur le refuse, avec le message d'erreur.

#### Garde-fous et démarrage (c, e, f)

- **FR-010**: La construction du site DOIT échouer avec un message explicite si un composant envoyé au navigateur importe le code d'accès à la base, à la session ou aux commandes serveur.
- **FR-011**: Les déclarations de rendu forcé DOIVENT être retirées partout où le contenu de la page ou de la route l'impose déjà ; celles qui restent (au moins le fichier robots, le plan du site et les fichiers `.well-known`) DOIVENT être commentées avec leur raison.
- **FR-012**: Toutes les pages DOIVENT rester rendues à chaque visite avec des données à jour et la même politique de sécurité du contenu.
- **FR-013**: La commande de démarrage du dépôt et l'image Docker DOIVENT lancer le même serveur, avec les mêmes variables de port et d'adresse d'écoute ; le serveur maison DOIT être retiré et la documentation de déploiement mise à jour.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur les 13 formulaires de l'US1, un refus garde 100 % des champs non secrets, avec et sans JavaScript.
- **SC-002**: Aucun mot de passe n'apparaît dans la page, l'adresse ou l'historique après un refus.
- **SC-003**: Une panne de la mise en page commune affiche la page d'erreur du site dans la bonne langue, en français et en anglais.
- **SC-004**: Chacune des actions de l'US3 fait une seule demande au serveur au lieu de deux.
- **SC-005**: Aucune page ne garde de déclaration de rendu forcé (14 fichiers aujourd'hui) ; sur les 62 fichiers actuels, seuls restent ceux qui en ont besoin, chacun commenté (dont la mise en page commune, qui empêche tout rendu pendant la construction de l'image), et chaque adresse reste rendue à chaque visite.
- **SC-006**: Un import fautif de code serveur dans un composant client fait échouer la construction, vérifié par un essai.
- **SC-007**: Les tests, le lint, les types et la construction passent ; les parcours de la base de démo (inscription, connexion, réservation, compte, liste) se déroulent comme avant.

## Clarifications

### Session 2026-11-06

- Plan (2026-11-06) : l'inscription avec une adresse déjà prise reste un succès apparent, sans erreur (non-divulgation des comptes, voulue par le code actuel) ; le scénario 1 de l'US1 prend l'exemple du mot de passe trop court.
- Q: Faut-il traiter le point (g), la lecture de toute la base à chaque page (étape 2 de la 008) ? → A: Non, il reste au backlog, hors de cette feature.

## Assumptions

- Le point (g) de l'audit (lecture ciblée de la base) est hors périmètre et reste au backlog.

- Le site seulement : l'app mobile garde déjà la saisie de ses formulaires et n'est pas concernée. L'API JSON ne change pas.
- Les messages d'erreur sont les traductions existantes ; aucun nouveau texte, sauf ceux de la page d'erreur générale s'ils manquent (« Revenir à l'accueil »).
- Les deux choix confirmés par l'audit (rendu à la demande imposé par la politique de sécurité, images des idées sans service d'optimisation) ne changent pas.
- Les formulaires qui n'ont qu'un bouton (déconnexion, renvoi du lien de confirmation, archivage, suppression…) ne sont pas dans l'US1 : ils n'ont pas de saisie à perdre.
- Le formulaire des idées garde déjà la saisie et sert de modèle.
- Les URL du site ne changent pas (sujet à part au backlog).
