# Feature Specification: Pages légales, données et suppression du compte dans l'app

**Feature Branch**: `006-mobile-legal-account`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Crée les pages et fonctionnalités obligatoires sur une app mobile => Mention légale, gestion de data, delete account etc. C'est dispo tout en bas de \"Mon compte\""

## Contexte

L'app mobile de la feature 005 permet de créer un compte et d'y ranger des listes, des idées et des réservations. Une app qui crée des comptes doit aussi permettre, depuis l'app, de lire qui l'édite et comment ses données sont traitées, de récupérer ses données, et de supprimer son compte. Le site a déjà une page « Mentions légales » avec une partie « Données personnelles », mais ni le site ni l'app ne permettent de supprimer un compte ou d'en récupérer les données : il faut aujourd'hui écrire à l'adresse de contact.

Cette feature ajoute, tout en bas de l'écran « Mon compte » de l'app, une section qui regroupe ces informations et ces actions. La suppression du compte et la récupération des données existent aussi sur le site, en bas de « Mon compte », pour qu'une personne qui n'a plus l'app puisse les faire.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Supprimer son compte (Priority: P1)

Tout en bas de « Mon compte », la personne choisit « Supprimer mon compte ». L'app lui explique ce qui va disparaître et ce qui reste (ses listes partagées passent aux autres membres), lui demande son mot de passe pour confirmer, puis supprime le compte. Elle revient à l'écran de connexion, et plus rien de son compte ne reste sur le téléphone.

**Why this priority**: Une app qui permet de créer un compte doit permettre de le supprimer depuis l'app. C'est aussi un droit de la personne sur ses données. Sans cette tranche, l'app ne peut pas être proposée au public.

**Independent Test**: Avec un compte de démo membre d'une liste seule et d'une liste partagée avec un autre compte, supprimer le compte depuis l'app : la liste seule a disparu du site, la liste partagée existe toujours et l'autre membre en est devenu propriétaire, l'ancien mot de passe ne permet plus de se connecter, ni dans l'app ni sur le site.

**Acceptance Scenarios**:

1. **Given** « Mon compte » ouvert, **When** la personne descend tout en bas, **Then** elle trouve l'action « Supprimer mon compte », séparée des autres et présentée comme destructive.
2. **Given** l'action choisie, **When** l'écran de confirmation s'ouvre, **Then** il dit ce qui sera supprimé (compte, listes dont elle est la seule membre avec leurs idées et réservations) et ce qui reste (listes partagées, qui passent aux autres membres ; cadeaux qu'elle a réservés, qui restent réservés), avec le nombre de listes concernées dans chaque cas.
3. **Given** l'écran de confirmation, **When** elle saisit son mot de passe et confirme, **Then** le compte est supprimé, elle revient à l'écran de connexion avec un message qui le confirme, et le téléphone ne garde ni sa connexion, ni la copie locale de ses listes, ni ses changements en attente.
4. **Given** un mot de passe faux, **When** elle confirme, **Then** rien n'est supprimé et l'app dit que le mot de passe est incorrect.
5. **Given** un compte supprimé, **When** quelqu'un tente de se connecter avec son e-mail et son ancien mot de passe, dans l'app ou sur le site, **Then** la connexion échoue avec le message habituel ; toutes les connexions encore ouvertes de ce compte (autre téléphone, navigateur) ne valent plus rien.
6. **Given** un compte supprimé, **When** la personne crée un nouveau compte avec le même e-mail, **Then** c'est un compte neuf, sans aucune des anciennes listes.
7. **Given** une liste partagée dont elle était propriétaire, **When** son compte est supprimé, **Then** le membre le plus ancien de cette liste en devient propriétaire, comme quand un propriétaire quitte une liste.
8. **Given** un cadeau qu'elle a réservé en étant connectée, **When** son compte est supprimé, **Then** le cadeau reste réservé sur la liste, avec le nom et le petit mot qu'elle avait laissés, mais n'est plus lié à aucun compte.
9. **Given** des changements en attente d'envoi, **When** elle demande la suppression, **Then** l'app la prévient qu'ils seront perdus avant de continuer.
10. **Given** le site, **When** elle ouvre « Mon compte » tout en bas, **Then** elle peut supprimer son compte de la même façon, avec les mêmes explications et la même confirmation par mot de passe.

---

### User Story 2 - Lire les mentions légales et la politique de confidentialité (Priority: P1)

Tout en bas de « Mon compte », la personne ouvre « Mentions légales » et « Données personnelles ». Elle y lit qui édite le service, qui l'héberge, quelles données sont gardées, pourquoi, combien de temps, à qui elles peuvent être transmises, ce que l'app garde sur le téléphone, et comment exercer ses droits. Ces pages sont aussi accessibles depuis l'écran de connexion, avant d'avoir un compte.

**Why this priority**: Une personne doit pouvoir savoir, avant et après avoir créé un compte, qui traite ses données et comment. Sans ces pages, l'app n'informe pas la personne de ses droits.

**Independent Test**: Sans compte, depuis l'écran de connexion, ouvrir les deux pages ; puis connecté, les ouvrir depuis le bas de « Mon compte », en français puis en anglais, avec et sans réseau, et comparer leur contenu à celui du site.

**Acceptance Scenarios**:

1. **Given** « Mon compte » ouvert, **When** la personne descend tout en bas, **Then** elle trouve les entrées « Mentions légales » et « Données personnelles ».
2. **Given** l'écran de connexion ou de création de compte, **When** la personne cherche ces informations, **Then** un lien discret ouvre les mêmes pages, sans compte.
3. **Given** la page « Mentions légales », **When** elle la lit, **Then** elle y trouve l'éditeur, l'hébergeur et l'adresse de contact, avec le même contenu que la page du site.
4. **Given** la page « Données personnelles », **When** elle la lit, **Then** elle y trouve : les données gardées pour un compte, une liste et une réservation ; leur finalité ; leur durée de conservation ; les prestataires qui peuvent les recevoir, seulement s'ils sont configurés (envoi d'e-mails, préremplissage depuis un lien, mesure d'audience) ; ce que l'app garde sur le téléphone (connexion, copie des listes, changements en attente) ; et comment récupérer ses données, supprimer son compte ou écrire pour exercer un autre droit.
5. **Given** l'app sans réseau, **When** elle ouvre ces pages, **Then** elles s'affichent quand même.
6. **Given** un téléphone en anglais, **When** elle ouvre ces pages, **Then** elles sont en anglais, comme la version anglaise du site.
7. **Given** le site, **When** une personne y cherche la politique de confidentialité, **Then** elle trouve le même contenu à une adresse publique stable, qu'on peut donner comme lien de politique de confidentialité de l'app.

---

### User Story 3 - Récupérer ses données (Priority: P2)

Tout en bas de « Mon compte », la personne choisit « Télécharger mes données ». L'app prépare un fichier lisible qui contient tout ce que le service garde à son sujet, et l'ouvre dans la feuille de partage du téléphone pour qu'elle l'enregistre ou l'envoie.

**Why this priority**: C'est un droit de la personne (accès et portabilité), qu'on doit aujourd'hui exercer en écrivant à l'adresse de contact. Elle vient après la suppression, parce que le contact par e-mail reste possible en attendant.

**Independent Test**: Avec un compte de démo membre de deux listes et ayant réservé un cadeau, télécharger ses données depuis l'app et depuis le site : le fichier contient le profil, les deux listes avec leurs idées, et la réservation, et ne contient aucun mot de passe ni lien secret.

**Acceptance Scenarios**:

1. **Given** « Mon compte » ouvert avec du réseau, **When** la personne choisit « Télécharger mes données », **Then** un fichier est préparé et proposé par la feuille de partage du téléphone (enregistrer dans Fichiers, envoyer par e-mail…).
2. **Given** le fichier, **When** elle l'ouvre, **Then** il contient son profil (e-mail, nom affiché, date de création), les listes dont elle est membre avec son rôle, leurs catégories, « qui », idées et réservations, et les réservations qu'elle a faites en étant connectée sur d'autres listes.
3. **Given** le fichier, **When** on le parcourt, **Then** il ne contient ni mot de passe (même haché), ni lien d'invitation, ni mot de passe de lecture, ni jeton de connexion, ni donnée d'un autre compte que son nom affiché sur les listes partagées.
4. **Given** l'app sans réseau, **When** elle veut télécharger ses données, **Then** l'action est indisponible, avec l'explication habituelle du mode hors ligne.
5. **Given** le site, **When** elle choisit « Télécharger mes données » en bas de « Mon compte », **Then** le même fichier est téléchargé.
6. **Given** des demandes répétées en peu de temps, **When** la limite est atteinte, **Then** l'app affiche le message « trop de tentatives » du serveur.

---

### User Story 4 - Version, licences et contact (Priority: P3)

Tout en bas de « Mon compte », sous les entrées légales, la personne voit la version de l'app, peut ouvrir la liste des logiciels libres utilisés avec leurs licences, et peut écrire au contact du service.

**Why this priority**: Utile pour le support et pour respecter les licences des logiciels intégrés, mais sans effet sur les données de la personne.

**Independent Test**: Ouvrir le bas de « Mon compte » : la version affichée correspond à celle du build ; la page des licences liste les bibliothèques intégrées ; le lien de contact ouvre l'application d'e-mail du téléphone avec l'adresse de contact.

**Acceptance Scenarios**:

1. **Given** le bas de « Mon compte », **When** la personne le regarde, **Then** elle voit le numéro de version de l'app.
2. **Given** l'entrée « Licences », **When** elle l'ouvre, **Then** elle voit les logiciels libres intégrés à l'app, chacun avec sa licence, et ce texte s'affiche sans réseau.
3. **Given** l'entrée « Nous écrire », **When** elle la choisit, **Then** l'application d'e-mail du téléphone s'ouvre avec l'adresse de contact du service.

---

### Edge Cases

- Compte qui doit changer son mot de passe : il ne voit que le changement de mot de passe (feature 005, FR-005) ; les pages légales restent accessibles depuis l'écran de connexion, et la suppression du compte devient possible une fois le mot de passe changé.
- Liste dont la personne est la seule membre mais que des invités ont déjà réservée : la liste est supprimée avec ses réservations ; l'écran de confirmation le dit.
- Personne membre de dizaines de listes : l'écran de confirmation donne les nombres, pas la liste complète des titres au-delà de quelques-uns.
- Réseau coupé pendant la suppression : l'app ne considère le compte supprimé que si le serveur l'a confirmé ; sinon elle dit que la suppression n'a pas abouti et la personne reste connectée.
- Réponse perdue après une suppression réussie : à la tentative suivante, le serveur refuse la connexion ; l'app oublie alors tout ce qu'elle garde de ce compte, comme pour une connexion expirée.
- Trop de tentatives de mot de passe sur la confirmation de suppression : l'app affiche le message « trop de tentatives » du serveur.
- Un autre membre ouvre une liste partagée pendant la suppression : il voit la liste avec un membre de moins, sans erreur.
- Lien de réinitialisation de mot de passe envoyé avant la suppression : il ne fonctionne plus après.
- Page légale ouverte avec le texte agrandi : elle reste lisible, sans texte coupé.

## Requirements *(mandatory)*

### Functional Requirements

#### Emplacement

- **FR-001**: L'écran « Mon compte » de l'app MUST se terminer par une section qui regroupe, dans cet ordre : mentions légales, données personnelles, télécharger mes données, licences, nous écrire, version de l'app, puis l'action « Supprimer mon compte » en dernier, séparée et présentée comme destructive.
- **FR-002**: Les écrans de connexion et de création de compte MUST donner accès aux mentions légales et aux données personnelles sans compte.
- **FR-003**: La page « Mon compte » du site MUST se terminer par « Télécharger mes données » et « Supprimer mon compte », avec les mêmes règles que dans l'app.

#### Suppression du compte

- **FR-010**: Supprimer son compte MUST demander le mot de passe actuel du compte, sur un écran qui dit ce qui sera supprimé et ce qui restera, avec les nombres de listes concernées.
- **FR-011**: La suppression MUST effacer le compte (e-mail, nom affiché, mot de passe), ses connexions ouvertes sur tous les appareils, et ses demandes de réinitialisation de mot de passe.
- **FR-012**: Les listes dont la personne est la seule membre MUST être supprimées, avec leurs catégories, « qui », vues, idées et réservations.
- **FR-013**: Les listes partagées avec d'autres membres MUST continuer d'exister sans elle ; si elle en était propriétaire, le membre le plus ancien MUST en devenir propriétaire, selon la même règle que quand un propriétaire quitte une liste.
- **FR-014**: Les réservations faites par la personne en étant connectée sur des listes dont elle n'est pas la seule membre MUST rester (le cadeau reste réservé, principe III) mais MUST ne plus être liées à aucun compte.
- **FR-015**: Après la suppression, l'app MUST effacer du téléphone la connexion, la copie locale des listes et les changements en attente, puis revenir à l'écran de connexion avec un message de confirmation.
- **FR-016**: Si des changements attendent d'être envoyés, l'app MUST prévenir qu'ils seront perdus avant de demander le mot de passe.
- **FR-017**: La suppression MUST être définitive : une nouvelle inscription avec le même e-mail MUST créer un compte neuf, sans rien de l'ancien.
- **FR-018**: Une suppression qui échoue (mot de passe faux, serveur injoignable, trop de tentatives) MUST ne rien supprimer, et MUST afficher le message traduit ; la confirmation par mot de passe MUST être limitée en nombre de tentatives comme la connexion.
- **FR-019**: La suppression MUST être indisponible hors ligne, avec l'explication habituelle.

#### Récupération des données

- **FR-020**: La personne MUST pouvoir obtenir, depuis l'app et depuis le site, un fichier qui contient son profil, les listes dont elle est membre (avec son rôle, leurs catégories, « qui », idées et réservations) et les réservations qu'elle a faites en étant connectée.
- **FR-021**: Ce fichier MUST être dans un format structuré, lisible par une personne et réutilisable par un programme.
- **FR-022**: Ce fichier MUST NOT contenir de mot de passe ni d'empreinte de mot de passe, de lien d'invitation, de mot de passe de lecture, de jeton de connexion ou de réinitialisation, ni l'e-mail d'un autre compte.
- **FR-023**: Dans l'app, le fichier MUST être proposé par la feuille de partage du téléphone ; sur le site, il MUST être téléchargé.
- **FR-024**: La demande de fichier MUST exiger d'être connecté, MUST être limitée en nombre de demandes, et MUST être indisponible hors ligne dans l'app.

#### Mentions légales et données personnelles

- **FR-030**: L'app MUST afficher une page « Mentions légales » avec le même contenu que celle du site : éditeur, hébergeur, contact.
- **FR-031**: L'app et le site MUST afficher une page « Données personnelles » qui décrit : les données gardées (compte, listes, idées, réservations, connexions), leur finalité, leur durée de conservation, les prestataires qui peuvent les recevoir quand ils sont configurés, ce que l'app garde sur le téléphone, ce que le site dépose comme cookies, et comment récupérer ses données, supprimer son compte ou exercer un autre droit.
- **FR-032**: Sur le site, la page « Données personnelles » MUST avoir une adresse publique stable, dans chaque langue, utilisable comme lien de politique de confidentialité de l'app.
- **FR-033**: Une mention de prestataire MUST n'apparaître que si ce prestataire est configuré sur le serveur, comme sur le site aujourd'hui ; l'app MUST l'apprendre du serveur quand elle a du réseau, et garder la dernière version connue pour l'affichage hors ligne.
- **FR-034**: Les pages légales MUST s'afficher sans réseau, et MUST s'afficher sans compte.
- **FR-035**: La partie « Hébergeur » des mentions légales, sur le site et dans l'app, MUST décrire l'hébergement réel : serveur personnel de l'éditeur, diffusé via Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, États-Unis). Elle MUST remplacer la mention actuelle de PlanetHoster. La phrase sur l'identification de l'éditeur, non publiée, reste.
- **FR-036**: La page « Données personnelles » MUST nommer Cloudflare comme prestataire, toujours présent : il voit passer les adresses IP et le trafic du site et de l'app. Elle MUST aussi signaler le transfert de ces données hors de l'Union européenne.

#### Version, licences, contact

- **FR-040**: L'app MUST afficher son numéro de version en bas de « Mon compte ».
- **FR-041**: L'app MUST afficher la liste des logiciels libres qu'elle intègre avec le texte de leur licence, lisible sans réseau.
- **FR-042**: L'entrée « Nous écrire » MUST ouvrir l'application d'e-mail du téléphone avec l'adresse de contact affichée dans les mentions légales.

#### Apparence et langue

- **FR-050**: Les nouveaux écrans de l'app MUST suivre l'apparence du site : la page légale de l'app MUST reprendre la page « Mentions légales » du site vue sur téléphone, et la section du bas de « Mon compte » MUST utiliser les composants existants (carte, lien, bouton destructif, alerte).
- **FR-051**: Tous les nouveaux textes MUST exister en français et en anglais ; les textes déjà présents sur le site MUST être repris mot pour mot.
- **FR-052**: Les nouveaux écrans MUST rester utilisables avec le texte agrandi et MUST être annoncés correctement par le lecteur d'écran.

### Key Entities

- **Compte** : déjà existant ; la feature ajoute sa suppression définitive.
- **Effet de la suppression** : ce que la suppression change, calculé avant de confirmer — listes supprimées (seule membre), listes transmises (partagées, nouveau propriétaire éventuel), réservations détachées du compte.
- **Export des données** : un document daté qui rassemble le profil, les listes de la personne et ses réservations, sans secret.
- **Contenu légal** : les textes des mentions légales et des données personnelles, avec les mentions des prestataires configurés sur le serveur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depuis l'ouverture de « Mon compte », une personne trouve et termine la suppression de son compte en moins d'une minute.
- **SC-002**: Après une suppression, 100 % des connexions de ce compte sont refusées, dans l'app et sur le site, et aucune donnée du compte ne reste lisible sur le téléphone.
- **SC-003**: Après une suppression, 100 % des listes partagées existent toujours avec au moins un propriétaire, et 100 % des cadeaux réservés par la personne sur ces listes restent réservés.
- **SC-004**: Le fichier de données contient 100 % des listes, idées et réservations du compte de démo, et aucun des secrets listés en FR-022.
- **SC-005**: Les pages légales s'ouvrent en moins d'une seconde, avec ou sans réseau, avec ou sans compte.
- **SC-006**: Aucun texte des nouveaux écrans n'apparaît dans la mauvaise langue, en français et en anglais.
- **SC-007**: Une personne à qui l'on demande « comment supprimer votre compte ? » ou « où lire la politique de confidentialité ? » trouve la réponse dans l'app sans aide.

## Assumptions

- **Emplacement** : la demande place tout en bas de « Mon compte ». Sur le site, seules la suppression et la récupération des données s'ajoutent en bas de « Mon compte » ; les pages légales restent dans le pied de page du site.
- **Suppression immédiate** : la suppression est faite tout de suite après confirmation, sans délai de grâce ni annulation possible, et sans e-mail de confirmation. Les sauvegardes du volume de données, s'il y en a, suivent leur propre durée de conservation, indiquée dans la page « Données personnelles ».
- **Réservations** : le nom et le petit mot laissés lors d'une réservation sont adressés aux membres de la liste ; ils restent après la suppression du compte, seul le lien au compte disparaît. La personne peut les retirer avant en annulant ses réservations sur le site.
- **Listes partagées** : la règle de transmission est celle qui existe déjà quand un propriétaire quitte une liste (le membre le plus ancien devient propriétaire).
- **Contenu légal** : les textes de la page « Mentions légales » du site sont la source ; la partie « Données personnelles » est étendue et devient une page à part, avec les informations propres à l'app. L'adresse de contact reste celle du site.
- **Hébergeur** : choix de la personne (2026-10-28), en sachant que Cloudflare transporte le contenu sans le stocker, et que la phrase sur l'éditeur non identifié est fragile en auto-hébergement. Elle sera de toute façon moins utile une fois l'app publiée, puisque les stores affichent le nom du développeur.
- **Pas de mesure d'audience dans l'app** : l'app n'envoie aucune donnée à un service de mesure ; la page le dit.
- **Hors périmètre** : choix des cookies, consentement, demande de suppression par e-mail sans compte (l'adresse de contact suffit), suppression d'une liste depuis l'app (feature 005 la laisse au site), notifications.
- **Données** : les tests et les captures utilisent la base de démo (`@example.test`), jamais de vraies données (principe I).
- **Constitution** : la suppression du compte et la récupération des données ajoutent un mécanisme qui ne sert ni à créer, ni à partager, ni à lire une liste (principe V) ; il est justifié par les droits de la personne sur ses données et par l'obligation, pour une app qui crée des comptes, de permettre de les supprimer. Cette spec sert de justification explicite au sens de la gouvernance ; la décision d'en faire un amendement revient à Cloé.
