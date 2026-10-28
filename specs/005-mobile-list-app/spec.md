# Feature Specification: App mobile pour gérer ses listes

**Feature Branch**: `005-mobile-list-app`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Crée une application mobile expo qui utilise l'api du projet pour permettre à un user de gérer ses listes. Il doit pourvoir se connecter, se créer un compte, créer une liste, la remplir, la partager publiquement via un qrcode ou via un système expor-share. Reprend la da du projet"

## Contexte

La feature 004 a ouvert l'accès aux listes pour une app autre que le site. Cette feature livre la première app mobile, installée sur le téléphone, avec sa propre interface. Elle sert le **membre** d'une liste : se connecter ou créer un compte, créer une liste, la remplir d'idées, et la partager. Les invités qui consultent ou réservent continuent d'utiliser le lien public, qui ouvre le site.

L'app n'a pas de règles propres : tout ce qu'elle montre et modifie passe par l'accès de la feature 004, avec les mêmes droits et les mêmes refus que le site. Une liste créée ou modifiée dans l'app est la même que sur le site.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Se connecter ou créer un compte (Priority: P1)

À la première ouverture, la personne choisit de se connecter avec son e-mail et son mot de passe, ou de créer un compte (e-mail, nom affiché, mot de passe). Une fois connectée, elle le reste à la réouverture de l'app, jusqu'à ce qu'elle se déconnecte ou que sa connexion expire. Si elle a oublié son mot de passe, l'app lui permet d'en demander un nouveau.

**Why this priority**: Sans compte, aucune autre action de l'app n'est possible : créer et remplir une liste exige un compte (principe II).

**Independent Test**: Sur un téléphone, avec un serveur de démo : créer un compte fictif, fermer l'app, la rouvrir (toujours connecté), se déconnecter, se reconnecter avec un compte de démo existant.

**Acceptance Scenarios**:

1. **Given** l'app ouverte pour la première fois, **When** la personne saisit un e-mail et un mot de passe valides d'un compte existant, **Then** elle arrive sur la liste de ses listes.
2. **Given** un e-mail ou un mot de passe faux, **When** elle tente de se connecter, **Then** un message lui dit que l'e-mail ou le mot de passe est incorrect, sans dire lequel.
3. **Given** l'écran de création de compte, **When** elle saisit un e-mail nouveau, un nom et un mot de passe assez long, **Then** son compte est créé et elle est connectée.
4. **Given** un e-mail déjà inscrit, **When** elle tente de créer un compte, **Then** l'app lui dit de vérifier ses e-mails, sans révéler que le compte existe, comme le site.
5. **Given** une personne connectée, **When** elle ferme puis rouvre l'app, **Then** elle est toujours connectée, sans ressaisir son mot de passe.
6. **Given** une personne connectée, **When** elle se déconnecte, **Then** l'app revient à l'écran de connexion et sa connexion ne vaut plus rien, même si quelqu'un l'avait copiée.
7. **Given** un compte qui doit changer son mot de passe, **When** il se connecte, **Then** l'app lui demande d'abord un nouveau mot de passe, et ne montre rien d'autre avant.
8. **Given** une connexion expirée ou coupée par un changement de mot de passe ailleurs, **When** l'app fait une action, **Then** elle revient à l'écran de connexion avec un message clair.
9. **Given** l'écran de connexion, **When** la personne demande un nouveau mot de passe, **Then** un e-mail lui est envoyé, avec un lien qui ouvre le site, et le message est le même que l'e-mail ait un compte ou non.

---

### User Story 2 - Voir ses listes et en créer une (Priority: P1)

Une personne connectée voit toutes les listes dont elle est membre, avec leur titre et leur nombre d'idées. Elle en crée une nouvelle en donnant un titre, une première catégorie et un premier « qui ».

**Why this priority**: C'est le cœur de la demande (« créer une liste ») et la porte d'entrée vers toutes les autres actions.

**Independent Test**: Connecté avec un compte de démo, créer une liste « Noël » avec la catégorie « Livres » et le « qui » « Alex », la retrouver dans l'app et sur le site.

**Acceptance Scenarios**:

1. **Given** une personne membre de deux listes, **When** elle ouvre l'app, **Then** elle voit ces deux listes, et seulement celles-là.
2. **Given** une personne sans liste, **When** elle ouvre l'app, **Then** un écran l'invite à créer sa première liste.
3. **Given** le formulaire de création, **When** elle saisit un titre, une catégorie et un « qui », **Then** la liste est créée, elle en est la créatrice, et l'app l'ouvre.
4. **Given** le formulaire de création, **When** un des trois champs est vide, **Then** l'app dit lequel manque, avec le même message que le site, et ne crée rien.
5. **Given** une liste modifiée sur le site, **When** la personne revient sur l'app ou la rafraîchit, **Then** elle voit les changements.

---

### User Story 3 - Remplir une liste (Priority: P2)

Dans une liste, la personne ajoute des idées : nom, catégorie, « qui », et en option prix, lien, image et niveau d'envie. Elle peut préremplir une idée à partir d'un lien produit quand ce service est disponible. Elle modifie, archive et supprime ses idées, et gère les catégories et les « qui » de la liste.

**Why this priority**: Une liste vide n'a pas de valeur à partager ; ajouter une idée vue en magasin depuis son téléphone est l'usage quotidien d'un membre.

**Independent Test**: Dans une liste de démo, ajouter trois idées dont une préremplie depuis un lien, en modifier une, en archiver une, et vérifier le résultat sur le site.

**Acceptance Scenarios**:

1. **Given** une liste ouverte, **When** la personne ajoute une idée avec un nom, une catégorie et un « qui », **Then** l'idée apparaît dans sa catégorie, dans l'app et sur le site.
2. **Given** un prix invalide ou un nom vide, **When** elle enregistre, **Then** l'app affiche l'erreur traduite à côté du champ et garde tout ce qu'elle a saisi.
3. **Given** un lien produit et le service de préremplissage disponible, **When** elle demande à préremplir, **Then** le nom, le prix, l'image et la catégorie proposés remplissent le formulaire, qu'elle peut corriger avant d'enregistrer. **Given** le service indisponible, **Then** l'app ne propose pas cette action.
4. **Given** une idée, **When** elle la modifie, l'archive ou la supprime (après confirmation), **Then** le changement est visible dans l'app et sur le site.
5. **Given** les réglages de la liste, **When** elle ajoute, renomme, retire ou réordonne une catégorie ou un « qui », **Then** les mêmes règles que sur le site s'appliquent (pas de retrait d'un libellé encore utilisé).
6. **Given** une idée réservée par un invité, **When** la personne ouvre la liste, **Then** elle voit que l'idée est réservée, avec le nom de l'offreur et le petit mot, comme dans l'admin du site.

---

### User Story 4 - Partager une liste publiquement (Priority: P2)

Depuis une liste, la personne affiche un QR code du lien public pour qu'un proche le scanne, ou envoie ce lien par le partage du téléphone (messagerie, e-mail, réseaux…). Le lien ouvre la page publique de la liste sur le site, où chacun peut consulter et réserver sans compte.

**Why this priority**: Partager est la raison d'être d'une liste de cadeaux, et la demande cite explicitement le QR code et le partage du téléphone.

**Independent Test**: Depuis une liste de démo, afficher le QR code et le scanner avec un autre téléphone : la page publique de la liste s'ouvre. Puis partager le lien par la feuille de partage vers une messagerie : le message contient le titre et le lien.

**Acceptance Scenarios**:

1. **Given** une liste ouverte, **When** la personne choisit « Partager », **Then** l'app propose le QR code du lien public et le partage par le téléphone.
2. **Given** le QR code affiché, **When** un autre téléphone le scanne, **Then** il ouvre la page publique de la liste, dans la langue de l'app de la personne qui partage.
3. **Given** le partage par le téléphone, **When** elle choisit une application, **Then** le message contient un court texte avec le titre de la liste et le lien public.
4. **Given** une liste protégée par un mot de passe de lecture, **When** elle la partage, **Then** l'app lui rappelle que les invités devront saisir ce mot de passe, sans l'afficher.
5. **Given** le lien public, **When** elle choisit de le copier, **Then** il est copié dans le presse-papiers et l'app le confirme.

---

### User Story 5 - Continuer sans réseau (Priority: P2)

Sans réseau (en magasin, dans le métro), la personne ouvre ses listes telles qu'elle les a vues la dernière fois, et continue de les remplir : elle crée une liste, ajoute, modifie, archive ou supprime des idées. L'app garde ces changements sur le téléphone et les envoie au serveur dès que le réseau revient, sans qu'elle ait à refaire quoi que ce soit. Elle voit à tout moment ce qui attend d'être envoyé.

**Why this priority**: On a souvent une idée de cadeau là où le réseau est mauvais. Sans ce mode, l'idée est perdue ou doit être notée ailleurs.

**Independent Test**: Avec un compte de démo, ouvrir une liste, couper le réseau du téléphone, ajouter deux idées et en modifier une, fermer puis rouvrir l'app (les changements sont toujours là et marqués « en attente »), rétablir le réseau : les changements apparaissent sur le site, sans doublon.

**Acceptance Scenarios**:

1. **Given** des listes déjà ouvertes une fois avec du réseau, **When** la personne ouvre l'app sans réseau, **Then** elle voit ces listes et leurs idées dans leur dernier état connu, avec une indication qu'elle est hors ligne et de la date de ce dernier état.
2. **Given** l'app hors ligne, **When** elle ajoute, modifie, archive ou supprime une idée, ou crée une liste, **Then** le changement apparaît tout de suite dans l'app, marqué « en attente d'envoi ».
3. **Given** des changements en attente, **When** elle ferme l'app et la rouvre, toujours hors ligne, **Then** ils sont toujours là et toujours en attente.
4. **Given** des changements en attente, **When** le réseau revient (app ouverte, ou à la prochaine ouverture), **Then** l'app les envoie dans l'ordre où ils ont été faits, sans action de sa part, et chaque changement accepté perd sa marque « en attente ».
5. **Given** une réponse perdue pendant l'envoi (réseau coupé au mauvais moment), **When** l'app renvoie le changement, **Then** il n'est enregistré qu'une fois : pas d'idée ni de liste en double.
6. **Given** un changement en attente que le serveur refuse au moment de l'envoi (liste supprimée entre-temps, catégorie retirée, accès retiré, donnée invalide), **When** l'envoi a lieu, **Then** l'app le signale clairement avec la raison traduite, et la personne choisit de le corriger ou de l'abandonner ; les autres changements continuent d'être envoyés.
7. **Given** une idée modifiée hors ligne sur le téléphone et modifiée aussi sur le site entre-temps, **When** le changement est envoyé, **Then** la dernière modification envoyée l'emporte, comme entre deux membres sur le site, et l'app affiche ensuite l'état du serveur.
8. **Given** des changements en attente, **When** la personne veut se déconnecter, **Then** l'app la prévient qu'ils seront perdus et lui laisse le choix d'attendre le réseau.
9. **Given** l'app hors ligne, **When** elle veut partager une liste déjà connue, **Then** le QR code et la copie du lien fonctionnent ; une liste créée hors ligne et pas encore envoyée ne peut pas être partagée, et l'app explique pourquoi.

---

### User Story 6 - Ressembler au site, écran par écran (Priority: P1)

L'app a la même apparence que le site vu sur un téléphone : même nom de produit, mêmes couleurs, même police, mêmes cartes blanches à bordure noire et ombre décalée, mêmes boutons, champs, badges, onglets en pastilles et illustration cadeau, et les couleurs propres à chaque liste. Chaque écran de l'app a son modèle parmi les écrans du site, décrits dans [design-reference.md](design-reference.md) et capturés dans [`design/web-mobile/`](design/web-mobile/). Elle parle français ou anglais selon la langue du téléphone, avec les textes du site.

**Why this priority**: C'est une exigence de la demande, au même niveau que les fonctions : une personne qui passe du site à l'app doit avoir l'impression d'utiliser le même produit. Chaque écran livré dans les tranches P1 et P2 doit déjà ressembler à son modèle ; ce n'est pas une finition faite à la fin.

**Independent Test**: Pour chaque écran du tableau « Correspondance des écrans » de [design-reference.md](design-reference.md), placer la capture de l'app (même compte de démo, même taille d'écran) à côté de la capture du site, et vérifier la grille de comparaison de SC-005, en français puis en anglais.

**Acceptance Scenarios**:

1. **Given** un écran de l'app et sa capture de référence du site, **When** on les compare côte à côte, **Then** on retrouve les mêmes couleurs (valeurs de design-reference.md), la même police et les mêmes poids, les mêmes bordures de 2 px et ombres décalées de 4 px, les mêmes rayons, et la même organisation (ordre des blocs, titres, libellés, boutons).
2. **Given** un bouton ou une carte cliquable, **When** on appuie dessus, **Then** il « s'enfonce » comme au survol sur le site (décalage de la taille de l'ombre, ombre qui disparaît).
3. **Given** une liste avec un thème personnalisé, **When** on l'ouvre dans l'app, **Then** ses écrans et son illustration cadeau prennent les couleurs du thème, comme sur sa page publique.
4. **Given** un élément propre à l'app (QR code, bandeau hors ligne, badge « en attente »), **When** il s'affiche, **Then** il utilise les composants du site (carte, badge, alerte, bouton) et pas un style étranger.
5. **Given** un téléphone en anglais, **When** on ouvre l'app, **Then** tous les textes, y compris les erreurs, sont en anglais ; en français (ou toute autre langue), ils sont en français. Les libellés repris du site sont mot pour mot ceux du site.
6. **Given** le texte agrandi par les réglages du téléphone, **When** on parcourt les écrans principaux, **Then** les textes restent lisibles, les boutons utilisables, et le style (bordures, ombres) reste le même.
7. **Given** un composant natif du téléphone que l'app ne dessine pas elle-même (feuille de partage, clavier, demande de confirmation système), **When** il apparaît, **Then** c'est le seul élément qui ne suit pas le style du site.

---

### Edge Cases

- Pas de réseau ou serveur injoignable : l'app passe en mode hors ligne (US5) pour les actions qui le permettent ; pour celles qui exigent le serveur (connexion, création de compte, préremplissage depuis un lien, changement de mot de passe, réglages de la liste), elle le dit clairement et propose de réessayer.
- Réseau qui va et vient pendant un envoi : les changements en attente ne sont ni perdus ni envoyés deux fois.
- Connexion expirée pendant que des changements attendent : l'app demande de se reconnecter et garde les changements pour les envoyer ensuite, si c'est le même compte.
- Beaucoup de changements en attente (plusieurs dizaines) : ils sont tous envoyés, dans l'ordre, sans bloquer l'app.
- Trop de tentatives (connexion, inscription, préremplissage) : l'app affiche le message « trop de tentatives » du serveur.
- La personne est retirée d'une liste ou la liste est supprimée depuis le site pendant qu'elle l'a ouverte : l'app revient à ses listes avec un message, sans planter.
- Deux membres modifient la même idée en même temps : la dernière modification enregistrée l'emporte, comme sur le site ; l'app affiche l'état du serveur après chaque enregistrement.
- Le serveur répond qu'il faut mettre l'app à jour (version d'accès retirée) : l'app l'affiche et bloque les actions plutôt que de se comporter de travers.
- Le service de préremplissage ne trouve rien ou la page est illisible : message traduit, et le formulaire reste éditable à la main.
- Lien public très long ou titre avec caractères spéciaux : le QR code reste lisible et le texte de partage correct.
- Un compte qui doit changer son mot de passe : rien d'autre que ce changement n'est accessible (US1-7).

## Requirements *(mandatory)*

### Functional Requirements

#### Compte et connexion

- **FR-001**: L'app MUST permettre de se connecter avec e-mail et mot de passe, et de créer un compte avec e-mail, nom affiché et mot de passe.
- **FR-002**: L'app MUST garder la connexion d'une ouverture à l'autre, dans le stockage sécurisé du téléphone, jusqu'à la déconnexion ou l'expiration.
- **FR-003**: La déconnexion MUST invalider la connexion côté serveur, pas seulement l'oublier sur le téléphone.
- **FR-004**: Quand le serveur refuse la connexion (expirée, invalidée), l'app MUST revenir à l'écran de connexion et oublier la connexion stockée.
- **FR-005**: Un compte qui doit changer son mot de passe MUST passer par l'écran de changement avant tout autre écran.
- **FR-006**: L'app MUST permettre de demander un lien de réinitialisation de mot de passe ; le message affiché MUST être le même que l'e-mail ait un compte ou non.
- **FR-007**: L'app MUST permettre de changer son nom affiché et son mot de passe.

#### Listes et idées

- **FR-010**: L'app MUST afficher les listes dont la personne est membre, et seulement celles-là.
- **FR-011**: L'app MUST permettre de créer une liste avec un titre, une première catégorie et un premier « qui ».
- **FR-012**: L'app MUST afficher une liste avec ses idées groupées par catégorie, ses idées archivées à part, et ses réservations (offreur et petit mot), comme l'admin du site.
- **FR-013**: L'app MUST permettre d'ajouter, modifier, archiver, désarchiver, changer de catégorie et supprimer une idée ; une suppression MUST demander une confirmation.
- **FR-014**: En cas d'erreur d'enregistrement, l'app MUST afficher le message traduit et MUST garder les champs saisis.
- **FR-015**: L'app MUST proposer de préremplir une idée depuis un lien produit seulement quand le serveur indique que ce service est disponible.
- **FR-016**: L'app MUST permettre de gérer les catégories et les « qui » d'une liste (ajouter, renommer, retirer, réordonner les catégories).
- **FR-017**: Chaque écran de liste MUST pouvoir être rafraîchi à la demande, et MUST l'être au retour dans l'app.

#### Hors ligne

- **FR-025**: L'app MUST garder sur le téléphone le dernier état connu des listes de la personne et de leurs idées, et MUST les afficher sans réseau, avec l'indication hors ligne et la date de ce dernier état.
- **FR-026**: Sans réseau, l'app MUST permettre de créer une liste, et d'ajouter, modifier, archiver, désarchiver, changer de catégorie et supprimer une idée ; chaque changement MUST apparaître tout de suite, marqué « en attente d'envoi ».
- **FR-027**: Les changements en attente MUST survivre à la fermeture de l'app et au redémarrage du téléphone.
- **FR-028**: Au retour du réseau, l'app MUST envoyer les changements en attente automatiquement, dans l'ordre où ils ont été faits ; un changement qui dépend d'un autre (une idée dans une liste créée hors ligne) MUST être envoyé après lui.
- **FR-029**: Un changement envoyé plusieurs fois (réponse perdue) MUST n'être enregistré qu'une fois par le serveur.
- **FR-029a**: Un changement refusé par le serveur MUST être signalé avec la raison traduite ; la personne MUST pouvoir le corriger ou l'abandonner, et les autres changements MUST continuer d'être envoyés.
- **FR-029b**: Les actions qui exigent le serveur (connexion, création de compte, réinitialisation et changement de mot de passe, préremplissage depuis un lien, réglages de la liste) MUST être indisponibles hors ligne, avec une explication.
- **FR-029c**: Se déconnecter avec des changements en attente MUST demander une confirmation qui dit qu'ils seront perdus.

#### Partage

- **FR-020**: L'app MUST afficher un QR code du lien public de la liste, assez grand pour être scanné par un autre téléphone posé à côté.
- **FR-021**: L'app MUST permettre d'envoyer le lien public par la feuille de partage du téléphone, avec un court texte qui reprend le titre de la liste.
- **FR-022**: L'app MUST permettre de copier le lien public.
- **FR-023**: Le lien partagé MUST être le lien public de lecture, jamais le lien d'invitation des membres ; il MUST ouvrir la page publique du site dans la langue de l'app.
- **FR-024**: Pour une liste protégée par un mot de passe de lecture, l'écran de partage MUST le signaler sans afficher le mot de passe.

#### Apparence et langue

- **FR-030**: Chaque écran de l'app MUST reproduire son écran modèle du site, tel que listé dans [design-reference.md](design-reference.md) et capturé dans `design/web-mobile/` : couleurs, police et poids, bordures, ombres, rayons, organisation des blocs et libellés.
- **FR-030a**: L'app MUST utiliser exactement les valeurs de design-reference.md (couleurs, tailles de bordure et d'ombre, rayons, police) ; une valeur différente MUST être justifiée dans design-reference.md.
- **FR-030b**: Les composants de l'app (bouton principal, secondaire, désactivé et destructif, lien, champ, liste déroulante, carte, onglets en pastilles, badge, étoiles, catégorie, idée, illustration cadeau, alerte, état vide) MUST avoir l'apparence et le comportement à l'appui décrits dans design-reference.md.
- **FR-030c**: Les éléments propres à l'app (QR code, état hors ligne, changement en attente ou refusé, chargement) MUST être construits avec ces mêmes composants.
- **FR-031**: Les écrans d'une liste et son illustration cadeau MUST utiliser les couleurs du thème de cette liste.
- **FR-032**: Tous les textes, y compris les erreurs du serveur, MUST être en anglais si le téléphone est en anglais, et en français sinon. Les libellés qui existent sur le site MUST être repris mot pour mot ; les nouveaux suivent le ton et le lexique du site.
- **FR-033**: Les écrans MUST rester utilisables avec le texte agrandi par le téléphone, et les éléments interactifs MUST être annoncés par le lecteur d'écran.

#### Fiabilité

- **FR-040**: Pour une action qui exige le serveur, l'app MUST afficher un message clair, avec une action pour réessayer, quand le serveur est injoignable. Un changement fait hors ligne MUST rester visiblement « en attente » tant que le serveur ne l'a pas accepté.
- **FR-041**: L'app MUST utiliser l'accès de la feature 004 sans le contourner ; elle ne MUST NOT avoir de règle métier propre qui contredise le serveur.
- **FR-042**: L'adresse du serveur MUST être configurable au moment de construire l'app (démo locale, production), sans changer son code.

### Key Entities

Aucune nouvelle donnée côté serveur. L'app manipule :

- **Connexion** : la preuve de connexion rendue par le serveur, gardée dans le stockage sécurisé du téléphone.
- **Liste** (vue membre) : titre, sous-titre, thème, catégories, « qui », idées, réservations, membres, lien public, protection par mot de passe.
- **Idée** : nom, catégorie, « qui », prix, lien, image, niveau d'envie, archivée ou non.
- **Lien public** : l'adresse de la page publique de la liste, source du QR code et du partage.
- **Copie locale** : le dernier état connu des listes et de leurs idées, gardé sur le téléphone, avec sa date.
- **Changement en attente** : une action faite sans réseau (création de liste, ajout, modification, archivage ou suppression d'idée), avec son ordre, son état (en attente, envoyé, refusé et pourquoi), et ce qui permet au serveur de ne l'enregistrer qu'une fois.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Une personne qui découvre l'app crée un compte, crée une liste, y ajoute trois idées et la partage en moins de 3 minutes.
- **SC-002**: Le QR code affiché est lu du premier coup par l'appareil photo d'un autre téléphone, à une distance de 20 à 50 cm, dans 100 % des essais du quickstart.
- **SC-003**: Chaque action faite dans l'app (création de liste, idée, catégorie) est visible sur le site au plus tard après un rafraîchissement, dans 100 % des essais.
- **SC-004**: À la réouverture de l'app, une personne connectée arrive sur ses listes sans ressaisir son mot de passe, en moins de 2 secondes sur une connexion mobile normale.
- **SC-005**: Pour 100 % des écrans du tableau de correspondance de design-reference.md, la comparaison côte à côte avec la capture du site (même compte de démo, même taille d'écran, en français et en anglais) passe chaque point de la grille : couleurs, police et poids, bordures, ombres, rayons, ordre des blocs, libellés. Tout écart est corrigé ou justifié dans design-reference.md.
- **SC-005a**: Des personnes qui utilisent déjà le site, à qui l'on montre une capture de l'app sans le dire, l'identifient comme le même produit.
- **SC-006**: Aucun texte n'apparaît dans la mauvaise langue sur les écrans principaux, en français et en anglais.
- **SC-007**: Aucune erreur serveur ne fait planter l'app : chacune aboutit à un message compréhensible.
- **SC-008**: Sur 20 changements faits hors ligne puis envoyés au retour du réseau, y compris avec des coupures pendant l'envoi, 100 % arrivent sur le site, aucun n'est en double, et chaque refus est signalé.
- **SC-009**: Au retour du réseau, les changements en attente apparaissent sur le site en moins de 30 secondes, sans action de la personne.

## Assumptions

- **Périmètre** : l'app sert les membres. Consulter et réserver en invité restent sur le site (le lien partagé ouvre le site). Inviter un autre membre, poser le mot de passe de lecture, retirer un membre et supprimer une liste restent sur le site dans cette première version ; l'API les permet déjà, ils pourront venir plus tard.
- **Hors périmètre** : notifications, connexion Google ou Apple, scan d'un QR code depuis l'app, liens d'e-mail qui ouvrent l'app, mode sombre. Hors ligne, seules les actions de la US5 sont possibles : les réglages de la liste (catégories, « qui ») et le préremplissage depuis un lien demandent le réseau.
- **Plateformes** : iOS et Android, téléphones récents (versions encore maintenues par Apple et Google). Pas de version tablette dédiée.
- **Serveur** : l'accès de la feature 004 est déployé. Le mode hors ligne demande au serveur de reconnaître un changement déjà reçu (FR-029) : si l'accès actuel ne le permet pas, il est étendu dans son contrat (nouvelle version compatible), sans changer les règles métier.
- **Langue** : celle du téléphone (anglais si sa langue principale est l'anglais, français sinon), sans réglage dans l'app pour cette version.
- **Données** : les captures et tests utilisent la base de démo (`@example.test`), jamais de vraies listes (principe I).
- **Technologie** : la description demande une technologie précise pour l'app ; le choix est confirmé au plan, conformément à la constitution (une spec ne nomme pas le framework).
- **Constitution** : l'app est un nouveau client de l'accès existant ; elle n'ajoute ni règle, ni service obligatoire, ni annuaire. Elle sert à créer, remplir et partager une liste (principe V).
