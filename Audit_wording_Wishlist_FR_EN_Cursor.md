# Wishlist — Audit et recommandations de wording FR/EN pour Cursor

Audit du site https://wishlist.mesdamesduc.fr/ réalisé le 20 octobre 2026, sur les parcours publics puis dans un compte connecté. Document d’implémentation : textes proposés, règles éditoriales et contrôles à effectuer dans le code.

## 1. Décision éditoriale

Adopter un français chaleureux, direct et entièrement au **vouvoiement**. Conserver **Wishlist** comme nom du produit, employer **liste de cadeaux** pour expliquer le service, puis **liste** lorsque le contexte est clair. Dans l’espace de gestion, parler d’**idées cadeaux** ; dans le parcours visiteur, de **cadeaux à réserver**. Employer **réserver** pour l’action effectuée sur le site et réserver **acheter** à un achat réel chez un marchand.

En anglais : **Wishlist** pour la marque, **wish list / wish lists** pour les listes, **gift idea**, **reserve a gift**, **reservation**. Anglais naturel, international, avec orthographe US pour rester cohérent avec « colors ». Ne pas calquer chaque phrase française.

Le style visuel néobrutaliste fonctionne avec des titres courts, des verbes concrets et une touche chaleureuse. Il ne nécessite ni jargon technique ni phrases abruptes. Éviter « sans friction », « instance », « puce », « read link », « read password » dans les parcours courants.

## 2. Périmètre et niveau de preuve

### Écrans effectivement consultés

| Écran ou parcours | Consultation |
|---|---|
| Accueil déconnecté `/` | FR et EN |
| Inscription `/inscription` | FR et EN, sans créer de compte |
| Connexion `/connexion` | FR ; connexion réussie avec la saisie sécurisée de l’utilisatrice |
| Mot de passe oublié `/mot-de-passe-oublie` | FR et EN, sans envoi |
| Accueil connecté et nouvelle liste `/listes/new` | FR et EN, sans création |
| Compte `/compte` | FR et EN, y compris réservations vides et changement de mot de passe |
| Liste publique `/l/{publicId}` | FR et EN ; liste réelle et liste de démonstration |
| Réservation `/l/{publicId}/reserver` | FR, avec et sans cadeau présélectionné ; formulaire présélectionné également lu en EN |
| Liste de gestion `/listes/{listId}` | Ajout d’idée FR/EN, modification FR |
| Onglets Archives et Réservations | États vides FR |
| Onglets Partage et Réglages | FR et EN ; ouverture du renommage d’une catégorie sans changement |
| Filtres publics | Cas sans résultat vérifié en EN |
| Présentation visuelle | Capture interne du formulaire et des cartes de gestion sur ordinateur |

### Limites à conserver dans le ticket Cursor

L’audit est complet sur les principaux écrans accessibles explorés, mais ne constitue pas un inventaire exhaustif des chaînes du dépôt. Le code source n’a pas été analysé. Les erreurs serveur, e-mails transactionnels, confirmations après enregistrement, listes protégées par mot de passe, invitations reçues, permissions de membre non propriétaire, réservations existantes et écrans destructifs n’ont pas été exécutés. Aucun cadeau n’a été réservé, aucune invitation envoyée et aucune liste modifiée ou supprimée pour cet audit.

Les tableaux 5 à 13 partent de textes ou de contrôles observés. Le signe **Ajout** désigne une nouvelle microcopie proposée. La section 14 constitue une couverture complémentaire à rapprocher du code, et non des textes prétendument lus sur le site. Les noms de clés sont des propositions sémantiques, pas les identifiants existants du dépôt.

Les titres des cadeaux, catégories, noms de personnes et contenus saisis par les utilisateurs ne font pas partie des traductions de l’interface. Ne pas les traduire ou les corriger automatiquement. Les exemples de listes personnelles et les liens d’invitation privés ne doivent pas devenir des fixtures ou du texte produit.

## 3. Problèmes prioritaires

| Priorité | Constat vérifié | Recommandation |
|---|---|---|
| P0 | « J’offre » et « Je réserve une idée » mènent à la réservation ; le même « J’offre » sert ensuite à confirmer | Distinguer ouverture « Réserver ce cadeau » et validation « Confirmer la réservation » |
| P0 | L’accueil promet « sans gâcher la surprise », mais la gestion comporte un onglet Réservations | Ne pas promettre un secret absolu. Vérifier les droits et l’affichage avant d’expliquer qui voit quoi |
| P0 | Le partage juxtapose « Lien de lecture » et « Lien d’invitation » ; ce dernier fait devenir membre | Expliquer la différence entre consulter/réserver et modifier ; nommer les deux liens et les boutons de copie sans ambiguïté |
| P0 | « Un petit mot ? » ne dit pas à qui le message est destiné ni qui le voit | Rendre le caractère facultatif explicite et ajouter une description fondée sur les permissions réelles |
| P1 | Vouvoiement sur l’accueil, tutoiement dans l’authentification, la création et les réglages | Généraliser le vouvoiement |
| P1 | « Wishlist », « wishlist », « liste », « type » et « catégorie » alternent | Appliquer le lexique de la section 4 |
| P1 | « Qui », « Who », « For whom », « Who for » désignent les destinataires | Utiliser « Pour qui ? » / « Gift recipient » de façon cohérente |
| P1 | Prix affichés comme `€78.00` dans la vue FR ; placeholder de prix `18.50` | Formater avec la locale ; proposer `18,50` en FR sans modifier la devise |
| P1 | Les étoiles publiques restent nommées « 4 sur 5 » en EN ; le contrôle de gestion, lui, est traduit | Localiser aussi les textes alternatifs ; expliquer ce que mesure la note |
| P1 | État vide EN : « The other buttons still work. » | Proposer une action utile : modifier ou réinitialiser les filtres |
| P1 | Plusieurs titres de formulaires sont exposés comme simples textes dans les observations | Employer de vrais titres ; assurer un nom accessible pour chaque champ et commande |
| P2 | « Instance », « URL http(s) », « Clique une puce » | Remplacer par des descriptions orientées utilisateur |
| P2 | « Enregistrer », « Ajouter », « Supprimer » sans objet dans plusieurs zones | Préciser l’objet lorsque plusieurs actions sont présentes |
| À reproduire | À plusieurs reprises, le sélecteur de langue reste désactivé sur l’ancienne langue ; la navigation suivante affiche la langue demandée | Vérifier le rafraîchissement après changement de langue. Observation dans ce navigateur, pas diagnostic de la cause |

## 4. Lexique et règles communes

| Concept | FR retenu | EN retenu | Règle |
|---|---|---|---|
| Marque | Wishlist | Wishlist | Ne pas traduire |
| Objet principal | Liste de cadeaux, puis liste | Wish list | Éviter « wishlist » dans les noms communs FR |
| Élément éditable | Idée cadeau | Gift idea | « Idée » possible dans les boutons courts une fois le contexte établi |
| Objet offert | Cadeau | Gift | Parcours des proches |
| Réservation | Réservation | Reservation | Ne signifie ni paiement ni achat |
| Regroupement | Catégorie | Category | Ne pas alterner avec type |
| Personne recevant un cadeau | Pour qui ? | Gift recipient | Ne pas confondre avec les membres qui modifient |
| Participation à l’édition | Membre de la liste | List member | Expliquer les droits associés |
| Créateur/propriétaire | Propriétaire | Owner | À employer seulement si le rôle correspond aux permissions ; sinon « Créateur de la liste » / « List creator » |
| Archive | Idées archivées | Archived ideas | Différencier de la suppression définitive |
| Adresse de connexion | Adresse e-mail | Email address | Même formulation dans tous les formulaires |
| Champ non obligatoire | (facultatif) | (optional) | Choisir une seule convention |
| Lien externe du cadeau | Voir le site | Visit website | Adapté aux boutiques, dons et abonnements présents dans les listes |

Règles : casse de phrase ; pas de point final dans les boutons et labels ; phrases complètes ponctuées dans les aides ; apostrophes et accents corrects ; verbes d’action pour les boutons. Conserver « Mes listes » / « Mon compte » en navigation et employer « vous » dans les explications. Une action = un verbe stable. Ne pas ajouter de points d’exclamation aux erreurs. N’utiliser « Réessayer » que si une nouvelle tentative est possible. Ne jamais annoncer un enregistrement avant confirmation du serveur.

## 5. Navigation, accueil et pied de page

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Navigation « Connexion » / « Log in » | Se connecter | Log in |
| Navigation « Inscription » / « Sign up » | Créer un compte | Sign up |
| « Mes wishlists » / « My wishlists » | Mes listes | My wish lists |
| « Mon compte » | Mon compte | My account |
| « Se déconnecter » | Se déconnecter | Log out |
| Nom accessible du sélecteur | Langue | Language |
| Options FR / EN | Français / English | Français / English |
| « Soutenir le projet ♥ » | Soutenir Wishlist | Support Wishlist |
| Titre « Des listes de cadeaux, sans friction » | Les bonnes idées font les bons cadeaux. | Great gifts start with a wish list. |
| Texte principal de l’accueil | Rassemblez vos envies dans une liste et partagez-la avec vos proches. Ils peuvent choisir un cadeau et le réserver, sans créer de compte. | Create a wish list and share it with friends and family. They can choose and reserve a gift without creating an account. |
| Bouton principal « Créer un compte » | Créer ma liste | Create my wish list |
| Ajout sous ce bouton, puisqu’il ouvre l’inscription | Un compte est nécessaire pour créer une liste. | You’ll need an account to create a wish list. |
| Bouton « J’ai déjà un compte » | Se connecter | Log in |
| « Vous préférez l’héberger vous-même ? » | Vous souhaitez héberger Wishlist vous-même ? | Want to host Wishlist yourself? |
| « Code source sur GitHub » | Voir le code sur GitHub | View the code on GitHub |
| Pied de page « Envie de votre propre instance ? » | Vous souhaitez héberger Wishlist vous-même ? | Want to host Wishlist yourself? |
| « Code libre sur GitHub — installez-la chez vous » | Voir le code sur GitHub | View the code on GitHub |
| Nom accessible du logo actuellement doublé « Wishlist Wishlist » | Wishlist — Accueil | Wishlist — Home |

Le bouton « Créer ma liste » est un choix orienté objectif. Garder « Créer un compte » si l’interface ne peut pas afficher l’explication immédiatement à côté. Ne pas présenter l’hébergement technique au même niveau que l’action principale. Conserver un simple lien secondaire. Le cœur peut rester décoratif ; son nom accessible doit expliquer le soutien, pas seulement dire « cœur ».

## 6. Inscription, connexion et récupération

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Titre Inscription / Sign up | Créer un compte | Create an account |
| « Un compte sert à créer et modifier des listes. Pas à les lire. » | Créez un compte pour préparer vos listes et les modifier. Vos proches peuvent les consulter et réserver un cadeau sans compte. | Create an account to make and manage your wish lists. Friends and family can view them and reserve gifts without an account. |
| Nom affiché / Display name | Nom affiché | Display name |
| Ajout aide du nom | Par exemple : Alex ou Camille. | For example: Alex or Sam. |
| E-mail / Email | Adresse e-mail | Email address |
| Mot de passe / Password | Mot de passe | Password |
| Au moins 10 caractères. | Utilisez au moins 10 caractères. | Use at least 10 characters. |
| Créer le compte / Create account | Créer mon compte | Create account |
| J’ai déjà un compte | Vous avez déjà un compte ? Se connecter | Already have an account? Log in |
| Titre Connexion | Se connecter | Log in |
| « Pour modifier une liste dont tu es membre. » | Retrouvez vos listes et les cadeaux que vous avez réservés. | Access your wish lists and the gifts you’ve reserved. |
| Bouton de connexion | Se connecter | Log in |
| Mot de passe oublié ? | Mot de passe oublié ? | Forgot your password? |
| Créer un compte | Créer un compte | Create an account |
| Titre récupération | Réinitialiser le mot de passe | Reset your password |
| « Indique l’e-mail du compte. S’il existe, tu recevras un lien valable 1 heure. » | Saisissez l’adresse e-mail de votre compte. Si un compte y est associé, vous recevrez un lien pour choisir un nouveau mot de passe. Ce lien est valable 1 heure. | Enter your account’s email address. If it’s linked to an account, we’ll send you a link to choose a new password. The link is valid for 1 hour. |
| Envoyer le lien / Send link | Envoyer le lien | Send reset link |
| Retour à la connexion | Revenir à la connexion | Back to log in |

La durée de 1 heure est affichée sur le site : conserver ce texte uniquement si elle correspond encore au serveur. Le message après envoi doit rester identique qu’un compte existe ou non. L’aide du nom ne doit pas prétendre qu’il est public ou privé sans vérifier ses usages. Prévoir un libellé et une aide persistants : un placeholder seul ne suffit pas.

## 7. Mes listes et création

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Titre Mes wishlists | Mes listes | My wish lists |
| Nouvelle wishlist | Créer une liste | Create a wish list |
| Titre du formulaire Nouvelle wishlist | Créer une liste | Create a wish list |
| « Titre, une première catégorie et une personne — tu pourras en ajouter ensuite. » | Donnez un nom à votre liste, ajoutez une première catégorie et indiquez pour qui sont les cadeaux. Vous pourrez compléter ces informations ensuite. | Name your wish list, add a first category, and choose who the gifts are for. You can add more categories and recipients later. |
| Titre / Title | Nom de la liste | List name |
| Placeholder du titre | Ex. : Noël 2026, Anniversaire d’Alex | e.g. Christmas 2026, Alex’s birthday |
| Catégorie | Première catégorie | First category |
| Placeholder catégorie | Ex. : Livres, Cuisine, Loisirs | e.g. Books, Kitchen, Hobbies |
| « Au moins une pour classer les idées. » | Les catégories servent à regrouper vos idées cadeaux. | Categories help you organize your gift ideas. |
| Pour qui / Who for | Pour qui ? | Gift recipient |
| Placeholder personne | Ex. : Alex, Camille, Nous deux | e.g. Alex, Sam, Both of us |
| « Au moins une personne (ou “Commun”). » | Indiquez une personne ou un groupe, par exemple « Nous deux ». | Enter a person or a group, such as “Both of us”. |
| Créer / Create | Créer la liste | Create wish list |
| Ajout navigation secondaire | Annuler | Cancel |

Le mot « destinataire » est utile dans les spécifications ; « Pour qui ? » est plus simple à l’écran. Les trois champs restent obligatoires si le modèle actuel l’exige ; ne pas promettre une étape facultative sans adapter la validation.

## 8. Gestion des idées

### Navigation et formulaire

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Voir comme un invité / View as guest | Voir la liste partagée | View shared list |
| Navigation accessible Admin | Gestion de la liste | List management |
| Idées ({count}) | Idées ({count}) | Ideas ({count}) |
| Archives / Archive | Archives | Archive |
| Réservations | Réservations | Reservations |
| Partage / Sharing | Partage | Sharing |
| Réglages / Settings | Réglages | Settings |
| Ajouter une idée | Ajouter une idée cadeau | Add a gift idea |
| Ajout aide initiale | Collez un lien pour récupérer les informations, ou remplissez les champs vous-même. | Paste a link to import details, or fill in the fields yourself. |
| Lien / Link | Lien du cadeau | Gift link |
| Récupérer les infos / Fetch details | Remplir depuis le lien | Fill from link |
| Nom / Name | Nom du cadeau | Gift name |
| Catégorie | Catégorie | Category |
| Qui / Who | Pour qui ? | Gift recipient |
| Prix (€) | Prix (€) | Price (€) |
| Placeholder 18.50 | Ex. : 18,50 | e.g. 18.50 |
| Priorité / Priority | Niveau d’envie | Wish level |
| Ajout aide des étoiles | De 1 à 5 : plus il y a d’étoiles, plus ce cadeau vous fait envie. | From 1 to 5: more stars mean you’d love this gift more. |
| Image / Image | Lien de l’image | Image URL |
| Placeholder image | https://… | https://… |
| Ajouter / Add | Ajouter l’idée | Add idea |
| « Glisse une idée d’une catégorie à l’autre. Clique une carte pour la modifier. » | Ouvrez une idée pour la modifier. Vous pouvez aussi la faire glisser vers une autre catégorie. | Open an idea to edit it. You can also drag it to another category. |
| Nom accessible de la poignée | Déplacer « {giftName} » | Move “{giftName}” |
| Nom accessible de l’ouverture de carte | Modifier « {giftName} » | Edit “{giftName}” |
| Archiver / Archive | Archiver | Archive |
| Nom accessible d’archivage | Archiver « {giftName} » | Archive “{giftName}” |
| Titre Modifier l’idée | Modifier l’idée cadeau | Edit gift idea |
| Enregistrer dans la fenêtre | Enregistrer les modifications | Save changes |
| Supprimer dans la fenêtre | Supprimer l’idée | Delete idea |
| Fermer | Fermer | Close |

Ne marquer « lien », « prix » ou « image » comme facultatifs qu’après vérification des schémas. Des idées publiques sans prix et sans lien existent ; il faut conserver cette possibilité dans les formulaires si elle est bien prise en charge. Le lien vers l’image n’est pas un téléversement : ne pas écrire « Importer une image » si l’utilisateur doit fournir une adresse.

« Niveau d’envie » interprète le rôle des étoiles d’une liste de cadeaux. Si le code leur donne un autre sens métier, conserver « Priorité » / « Priority » et définir les extrêmes. Ne pas afficher des étoiles comme une note de qualité produit. Rendre l’absence de note distincte de 1/5 et de 0/5 ; ne pas créer artificiellement une valeur par défaut.

### Archives et réservations de la liste

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Titre Archives | Idées archivées | Archived ideas |
| « Les idées archivées n’apparaissent plus sur la liste publique. » | Les idées archivées ne sont plus visibles dans la liste partagée. | Archived ideas no longer appear in the shared list. |
| « Aucune idée archivée. » | Aucune idée archivée pour le moment. | No archived ideas yet. |
| Ajout aide état vide | Vous retrouverez ici les idées que vous archivez. | Ideas you archive will appear here. |
| Titre Réservations | Réservations | Reservations |
| « Aucune idée n’est réservée. » | Aucun cadeau réservé pour le moment. | No gifts have been reserved yet. |

Si la restauration existe, ajouter à l’aide : « Vous pouvez les remettre dans la liste à tout moment. » / « You can restore them to the list at any time. » Sinon ne pas promettre cette action. Les états avec réservations ou archives remplies restent à vérifier dans le code.

## 9. Liste partagée et filtres

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Ajout introduction courte | Une idée vous plaît ? Réservez-la pour indiquer que vous souhaitez l’offrir. | Found a gift you’d like to give? Reserve it to let others know. |
| Catégories | Catégories | Categories |
| Toute la liste / Whole list | Toutes les idées | All gift ideas |
| Qui / Who | Pour qui ? | Gift recipient |
| Tout le monde / Everyone | Tout le monde | Everyone |
| Budget | Budget | Budget |
| Tous les prix / All prices | Tous les budgets | All budgets |
| Moins de 20 € / Under €20 | Moins de 20 € | Under €20 |
| 20 à 50 € | De 20 à 50 € | €20 to €50 |
| 50 à 100 € | De 50 à 100 € | €50 to €100 |
| Plus de 100 € | Plus de 100 € | Over €100 |
| Sans prix / No price | Prix non renseigné | Price not specified |
| Je réserve une idée / I’ll reserve an idea | Réserver un cadeau | Reserve a gift |
| J’offre / I’ll get it, sur une carte | Réserver ce cadeau | Reserve this gift |
| Lien d’achat / Buy link | Voir le site | Visit website |
| Nom accessible du lien externe | Voir le site pour « {giftName} » | Visit the website for “{giftName}” |
| Texte alternatif étoiles « {rating} sur 5 » | Niveau d’envie : {rating} sur 5 | Wish level: {rating} out of 5 |
| « No ideas for these filters. » | Aucune idée ne correspond à ces filtres. | No gift ideas match these filters. |
| « The other buttons still work. » | Essayez un autre budget ou une autre personne. | Try a different budget or recipient. |
| Ajout bouton état filtré vide | Réinitialiser les filtres | Clear filters |

Le bouton « Réinitialiser les filtres » est une petite évolution fonctionnelle : l’ajouter uniquement avec son comportement réel. Sans lui, conserver l’aide sur les autres filtres. Ne pas afficher « Aucun cadeau dans cette liste » lorsqu’une liste contient des idées exclues par les filtres. Les seuils 20, 50 et 100 doivent être contrôlés : éviter chevauchements ou trous entre les tranches. Si les bornes sont exclusives, adapter les libellés exacts, par exemple « De 20 à moins de 50 € » / « €20 to under €50 ». Ne pas changer les seuils métier au détour d’une traduction.

« Voir le site » convient aux cadeaux matériels, dons, cartes cadeaux et abonnements. « Acheter » serait trop engageant et parfois inexact. Si le lien ouvre un nouvel onglet, l’indiquer dans l’aide accessible : « s’ouvre dans un nouvel onglet » / « opens in a new tab ».

## 10. Réservation

### Formulaire observé

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Réserver un cadeau — {listName} | Réserver un cadeau | Reserve a gift |
| Ajout sous le titre | Dans la liste « {listName} » | From “{listName}” |
| Retour à la liste | Revenir à la liste | Back to wish list |
| Type de cadeau | Catégorie | Category |
| Filtrer la liste | Filtrer par catégorie | Filter by category |
| Tous les types | Toutes les catégories | All categories |
| Filtrer les idées | Afficher les idées | Show gift ideas |
| Le cadeau, titre de section redondant | À supprimer si le champ suivant suffit | Remove if the next field label is sufficient |
| Le cadeau que je souhaite offrir | Cadeau à réserver | Gift to reserve |
| Choisir | Choisir un cadeau | Choose a gift |
| J’offre : {giftName} | Cadeau choisi : {giftName} | Selected gift: {giftName} |
| De la part de (optionnel) | Votre nom (facultatif) | Your name (optional) |
| Un petit mot ? | Message (facultatif) | Message (optional) |
| J’offre / I’ll get it, validation | Confirmer la réservation | Confirm reservation |
| Ajout aide avant validation | La réservation ne passe aucune commande. L’achat se fait séparément. | Reserving a gift doesn’t place an order. You’ll need to purchase it separately. |

Les listes déroulantes par catégorie sont conservées dans cette proposition. Si leur filtrage devient automatique, retirer le bouton « Afficher les idées » et son texte. Ne pas décrire comme automatique un filtrage qui demande encore une validation.

### Transparence à résoudre avant implémentation

1. Déterminer qui voit une réservation, le nom et le message : autres visiteurs, membres, propriétaire, personne qui réserve. La présence d’un onglet Réservations ne permet pas d’en déduire tous les champs visibles.
2. Vérifier le comportement sans connexion : possibilité d’annuler, lien de gestion, conservation dans ce navigateur, durée. Ne pas inventer de lien d’annulation ou promettre une récupération depuis le compte.
3. Vérifier si une réservation bloque les suivantes, s’il existe des quantités ou si plusieurs personnes peuvent réserver le même cadeau.
4. Déterminer si le passage par « Voir la liste partagée » applique réellement les droits d’un visiteur ou ouvre simplement la page publique tout en restant connecté.

Selon le résultat, utiliser une des aides suivantes, jamais les deux par défaut :

| Condition vérifiée | FR | EN |
|---|---|---|
| Nom et message visibles des membres | Les personnes qui gèrent cette liste peuvent voir votre nom et votre message. | People who manage this list can see your name and message. |
| Nom et message visibles aussi des visiteurs | Votre nom et votre message sont visibles par les personnes qui consultent cette liste. | Anyone viewing this list can see your name and message. |
| Réservations consultables volontairement par le propriétaire | Les personnes qui gèrent la liste peuvent consulter les réservations. | People who manage the list can view reservations. |
| Réservation hors compte non rattachée au compte | Les réservations faites sans connexion n’apparaissent pas dans votre compte. | Reservations made while logged out won’t appear in your account. |

Le terme « anonyme » n’est pas équivalent à « sans connexion » : une réservation peut contenir un nom sans être liée à un compte. La microcopie doit distinguer ces notions.

## 11. Partage et collaboration

Deux sous-sections distinctes sont recommandées. Il s’agit d’une clarification de structure et de texte, sans changement des permissions.

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Partager / Share, titre du bloc | Partager la liste | Share this wish list |
| Ajout titre du lien de lecture | Partager pour offrir | Share with gift givers |
| « Le lien de lecture ne permet pas de modifier la liste. » | Ce lien permet de consulter la liste et de réserver un cadeau, sans pouvoir modifier les idées. | This link lets people view the list and reserve gifts. It doesn’t let them edit gift ideas. |
| Lien de lecture / Read link | Lien de la liste | Wish list link |
| Copier le lien, pour lecture | Copier le lien de la liste | Copy wish list link |
| Ajout titre collaboration | Inviter à modifier | Invite people to edit |
| Lien d’invitation / Invite link | Lien d’invitation à modifier | Editing invitation link |
| Copier le lien, pour invitation | Copier le lien d’invitation | Copy invitation link |
| « Un compte qui l’ouvre devient membre. » | Toute personne connectée qui ouvre ce lien rejoint la liste et peut la modifier. Partagez-le uniquement avec les personnes de votre choix. | Anyone who opens this link while logged in can join and edit the list. Only share it with people you want to invite. |
| « Clique le champ ou le bouton pour copier. » | Utilisez le bouton pour copier le lien. | Use the button to copy the link. |
| Inviter par e-mail, titre | Inviter par e-mail | Invite by email |
| Label champ e-mail | Adresse e-mail de la personne | Recipient’s email address |
| Placeholder e-mail | nom@exemple.fr | name@example.com |
| Aide de l’envoi | Cette personne recevra un lien pour rejoindre la liste et la modifier. Elle devra se connecter ou créer un compte. | They’ll receive a link to join and edit the list. They’ll need to log in or create an account. |
| Envoyer l’invitation / Send invite | Envoyer l’invitation | Send invitation |
| Régénérer l’invitation / Regenerate invite | Remplacer le lien d’invitation | Replace invitation link |
| Mot de passe de lecture / Read password | Protéger l’accès à la liste | Protect access to the list |
| Explication avec URL | Sans mot de passe, toute personne disposant du lien peut consulter la liste. Avec un mot de passe, elle devra aussi le saisir pour y accéder. | Without a password, anyone with the link can view the list. With a password, they’ll also need to enter it to access the list. |
| Aucun mot de passe pour l’instant. | Cette liste n’est pas protégée par un mot de passe. | This list isn’t password-protected. |
| Mot de passe, champ de partage | Mot de passe de la liste | List password |
| Enregistrer le mot de passe | Enregistrer le mot de passe | Save password |
| Membres | Personnes qui gèrent la liste | People managing this list |
| Créateur / Owner | Propriétaire | Owner |
| Quitter la liste / Leave list | Quitter la liste | Leave list |

Avant de remplacer « Créateur » par « Propriétaire », contrôler le rôle réel. Si le créateur n’a aucun pouvoir spécifique, afficher « Créateur de la liste » / « List creator ». La description du lien de modification doit refléter exactement l’acceptation automatique ou l’étape de confirmation existante. Si l’ouverture ne suffit pas, écrire « Ce lien permet de rejoindre la liste pour la modifier. » / « This link lets people join the list to edit it. »

Si la régénération invalide les anciennes invitations, ajouter sous l’action : « L’ancien lien d’invitation ne fonctionnera plus. » / « The previous invitation link will stop working. » Confirmer aussi l’effet sur les membres existants avant de le décrire. Ne pas confondre remplacement du lien d’invitation et remplacement du lien de consultation.

## 12. Réglages

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Catégories | Catégories | Categories |
| « Clique une puce pour renommer. Entrée pour ajouter. » | Sélectionnez une catégorie pour la renommer. Pour en ajouter une, saisissez son nom puis sélectionnez « Ajouter ». | Select a category to rename it. To add one, enter its name and select “Add”. |
| Champ sans label persistant, placeholder ex. Cuisine | Nouvelle catégorie | New category |
| Placeholder | Ex. : Cuisine | e.g. Kitchen |
| Ajouter dans catégories | Ajouter | Add |
| Nom accessible de ce bouton | Ajouter la catégorie | Add category |
| Retirer {category} | Supprimer la catégorie « {category} » | Delete category “{category}” |
| Renommer {category} | Renommer la catégorie « {category} » | Rename category “{category}” |
| Pour qui / For whom | Pour qui sont les cadeaux ? | Who are the gifts for? |
| Aide destinataires | Ajoutez les personnes ou les groupes qui recevront les cadeaux. Sélectionnez un nom pour le modifier. Un nom utilisé par une idée ne peut pas être retiré. | Add the people or groups receiving gifts. Select a name to edit it. A recipient used by a gift idea can’t be removed. |
| Champ destinataire sans label persistant | Nouvelle personne ou nouveau groupe | New person or group |
| Placeholder | Ex. : Alex, Nous deux | e.g. Alex, Both of us |
| Ajouter dans destinataires | Ajouter | Add |
| Nom accessible de ce bouton | Ajouter la personne ou le groupe | Add person or group |
| Retirer {recipient} | Retirer « {recipient} » | Remove “{recipient}” |
| Apparence | Apparence de la liste | List appearance |
| Description apparence | Personnalisez le titre, la description, les couleurs et l’illustration de votre liste partagée. | Customize the title, description, colors, and illustration on your shared list. |
| Titre | Nom de la liste | List name |
| Sous-titre / Subtitle | Description (facultatif) | Description (optional) |
| Placeholder de description | Ex. : Nos idées cadeaux pour Noël | e.g. Our Christmas gift ideas |
| « Texte sous le titre. Laisse vide pour n’afficher rien. » | Ce texte apparaît sous le nom de la liste. Laissez ce champ vide pour ne pas afficher de description. | This text appears below the list name. Leave it blank to show no description. |
| Couleurs | Couleurs | Colors |
| Principal / Primary | Couleur principale | Primary color |
| Accent | Couleur d’accent | Accent color |
| Surbrillance / Highlight | Couleur des étoiles | Star color |
| Fond / Background | Couleur de fond | Background color |
| Explication des couleurs | La couleur principale s’applique aux boutons et au corps du cadeau illustré. La couleur d’accent s’applique aux alertes et au couvercle. La couleur des étoiles s’applique aussi au ruban. | The primary color is used for buttons and the illustrated gift box. The accent color is used for alerts and the lid. The star color is also used for the ribbon. |
| Couleurs par défaut / Default colors | Rétablir les couleurs par défaut | Reset to default colors |
| Image d’illustration / Cover image | Lien de l’illustration (facultatif) | Illustration URL (optional) |
| « URL http(s). Vide = cadeau aux couleurs de la liste. » | Collez le lien d’une image. Laissez ce champ vide pour afficher le cadeau illustré aux couleurs de votre liste. | Paste an image URL. Leave this blank to show the gift illustration in your list’s colors. |
| Aperçu | Aperçu | Preview |
| Enregistrer | Enregistrer l’apparence | Save appearance |
| Zone sensible / Danger zone | Supprimer la liste | Delete this wish list |
| Supprimer la liste est définitif. | La suppression de cette liste est définitive. | Deleting this wish list is permanent. |
| Supprimer la liste, bouton | Supprimer la liste | Delete wish list |

Les couleurs restent des options visuelles : ne pas modifier la palette avec ce ticket. Si « couleur des étoiles » pilote d’autres éléments que ceux affichés, reprendre « Couleur de mise en valeur » / « Highlight color » et détailler les usages. La microcopie ne remplace pas un contrôle de contraste. Les aides de renommage doivent correspondre au déclenchement réel ; indiquer Entrée ou Échap seulement après vérification. Les deux champs d’ajout ont besoin d’un label persistant et non uniquement d’un exemple.

## 13. Mon compte

| Repère actuel ou emplacement | FR recommandé | EN recommandé |
|---|---|---|
| Mon compte | Mon compte | My account |
| « Coordonnées, cadeaux offerts et mot de passe. » | Gérez votre profil, vos réservations et votre mot de passe. | Manage your profile, reservations, and password. |
| Profil | Profil | Profile |
| Identifiants du compte. / Account credentials. | Votre nom et votre adresse de connexion. | Your display name and login email address. |
| Nom affiché | Nom affiché | Display name |
| E-mail | Adresse e-mail | Email address |
| L’e-mail sert à la connexion ; il n’est pas modifiable ici. | Cette adresse sert à vous connecter. Vous ne pouvez pas la modifier ici. | This email address is used to log in. You can’t change it here. |
| Enregistrer le nom / Save name | Enregistrer le nom | Save name |
| Cadeaux que j’offre / Gifts I’m getting | Mes réservations | My reservations |
| Réservations faites en étant connecté. Les réservations anonymes n’apparaissent pas ici. | Seules les réservations faites avec ce compte apparaissent ici. Les réservations faites sans connexion ne sont pas affichées. | Only reservations made with this account appear here. Reservations made while logged out aren’t shown. |
| Aucun cadeau réservé pour l’instant. | Vous n’avez pas encore réservé de cadeau avec ce compte. | You haven’t reserved any gifts with this account yet. |
| Ouvre une liste publique et clique « J’offre » en étant connecté. | Ouvrez une liste partagée et choisissez « Réserver ce cadeau » en restant connecté à votre compte. | Open a shared wish list and select “Reserve this gift” while logged in. |
| Changer le mot de passe | Modifier le mot de passe | Change password |
| Compte {email}. | Supprimer cette répétition si l’adresse est déjà affichée au-dessus | Remove if the email address is already shown above |
| Mot de passe actuel | Mot de passe actuel | Current password |
| Nouveau mot de passe | Nouveau mot de passe | New password |
| Au moins 10 caractères. | Utilisez au moins 10 caractères. | Use at least 10 characters. |
| Confirmation / Confirm | Confirmer le nouveau mot de passe | Confirm new password |
| Enregistrer / Save, mot de passe | Modifier le mot de passe | Change password |

« Cadeaux offerts » laisserait penser qu’un achat ou une remise est confirmé. « Gifts I’m getting » peut se comprendre comme les cadeaux que l’on va recevoir. « Mes réservations » / « My reservations » décrit exactement l’objet suivi.

## 14. Couverture complémentaire à intégrer après vérification du code

Ces chaînes sont **proposées pour les états non exécutés**. Réutiliser les composants et clés existants. Ne pas créer de fonctionnalités pour pouvoir afficher les textes. Les conditions précisées dans la dernière colonne sont obligatoires.

### États vides, chargement et retours d’action

| Clé proposée | FR | EN | Condition |
|---|---|---|---|
| lists.empty.title | Votre première liste commence ici | Start your first wish list | Compte sans liste |
| lists.empty.body | Rassemblez vos idées cadeaux, puis partagez-les avec vos proches. | Gather your gift ideas, then share them with friends and family. | État vide réel |
| lists.empty.cta | Créer une liste | Create a wish list | Action existante |
| ideas.empty.title | Aucune idée pour le moment | No gift ideas yet | Liste de gestion vide |
| ideas.empty.body | Ajoutez votre première idée avec un lien ou en remplissant le formulaire. | Add your first idea using a link or by filling in the form. | Ajout manuel disponible |
| public.empty.title | Cette liste n’a pas encore d’idées cadeaux | This wish list has no gift ideas yet | Aucun élément, pas un filtre |
| public.empty.body | Revenez plus tard pour découvrir les idées ajoutées. | Check back later for new gift ideas. | Pas de promesse de notification |
| common.loading | Chargement… | Loading… | Chargement réel |
| common.saving | Enregistrement… | Saving… | Écriture en cours |
| ideas.importing | Récupération des informations… | Importing details… | Import en cours |
| ideas.imported | Informations récupérées. Vérifiez-les avant d’enregistrer. | Details imported. Review them before saving. | Import réussi |
| ideas.importFailed | Impossible de récupérer les informations de ce lien. Vous pouvez les saisir vous-même. | We couldn’t import details from this link. You can enter them manually. | Échec avec saisie manuelle possible |
| ideas.created | Idée ajoutée. | Idea added. | Succès serveur |
| ideas.updated | Modifications enregistrées. | Changes saved. | Succès serveur |
| ideas.archived | Idée archivée. | Idea archived. | Succès serveur |
| ideas.restore | Remettre dans la liste | Restore to list | Restauration existante |
| ideas.restored | Idée remise dans la liste. | Idea restored to the list. | Succès serveur |
| lists.created | Liste créée. | Wish list created. | Succès serveur |
| appearance.saved | Apparence enregistrée. | Appearance saved. | Succès serveur |
| profile.saved | Nom enregistré. | Name saved. | Succès serveur |
| clipboard.copied | Lien copié. | Link copied. | Écriture presse-papiers réussie |
| clipboard.failed | Impossible de copier le lien. Sélectionnez-le pour le copier manuellement. | We couldn’t copy the link. Select it to copy it manually. | Champ sélectionnable |
| invite.sending | Envoi de l’invitation… | Sending invitation… | Envoi en cours |
| invite.sent | Invitation envoyée. | Invitation sent. | Réponse d’envoi positive, pas seulement clic |
| invite.failed | L’invitation n’a pas pu être envoyée. Réessayez. | We couldn’t send the invitation. Try again. | Nouvelle tentative possible |
| reservation.submitting | Réservation en cours… | Reserving gift… | Requête en cours |
| reservation.success.title | Cadeau réservé ! | Gift reserved! | Succès serveur |
| reservation.success.body | Vous avez réservé « {giftName} ». L’achat reste à effectuer séparément. | You’ve reserved “{giftName}”. You’ll need to purchase it separately. | Aucun achat effectué par Wishlist |
| reservation.status | Réservé | Reserved | Réservation réellement active |
| reservation.mine | Réservé par vous | Reserved by you | Identité vérifiée |
| reservation.cancel | Annuler la réservation | Cancel reservation | Annulation réellement autorisée |
| reservation.cancelled | Réservation annulée. | Reservation cancelled. | Succès serveur |
| reservation.conflict | Ce cadeau vient d’être réservé. Choisissez une autre idée. | This gift has just been reserved. Choose another idea. | Une seule réservation permise |
| password.saved | Mot de passe modifié. | Password changed. | Succès serveur |
| reset.sent | Si un compte est associé à cette adresse, un e-mail de réinitialisation a été envoyé. Consultez aussi vos courriers indésirables. | If this email address is linked to an account, a password reset email has been sent. Check your spam folder too. | Même réponse pour toutes les adresses |

Si une personne peut déjà avoir acheté le cadeau, la confirmation peut simplement dire : « Vous avez réservé “{giftName}”. Aucun achat n’est effectué sur Wishlist. » / « You’ve reserved “{giftName}”. No purchase is made through Wishlist. » C’est la variante la plus robuste pour un produit sans commerce intégré.

### Erreurs et validation

| Clé proposée | FR | EN | Condition |
|---|---|---|---|
| validation.required | Renseignez ce champ. | Fill in this field. | Compléter avec le label associé |
| validation.email | Saisissez une adresse e-mail valide. | Enter a valid email address. | Validation e-mail |
| validation.listName | Donnez un nom à votre liste. | Enter a name for your wish list. | Titre requis |
| validation.giftName | Indiquez le nom du cadeau. | Enter a gift name. | Nom requis |
| validation.category | Choisissez une catégorie. | Choose a category. | Sélection requise |
| validation.recipient | Choisissez pour qui est ce cadeau. | Choose a gift recipient. | Sélection requise |
| validation.url | Saisissez un lien commençant par http:// ou https://. | Enter a link starting with http:// or https://. | Protocoles réellement acceptés |
| validation.price | Saisissez un prix valide, par exemple 18,50. | Enter a valid price, such as 18.50. | Parsing conforme à la locale |
| validation.priceNegative | Le prix ne peut pas être négatif. | The price can’t be negative. | Zéro accepté par le modèle |
| validation.passwordLength | Utilisez au moins {minLength} caractères. | Use at least {minLength} characters. | Valeur issue de la règle serveur |
| validation.passwordMismatch | Les deux mots de passe ne correspondent pas. | The passwords don’t match. | Confirmation |
| auth.invalidCredentials | L’adresse e-mail ou le mot de passe est incorrect. | The email address or password is incorrect. | Ne pas révéler l’existence du compte |
| auth.sessionExpired | Votre session a expiré. Reconnectez-vous pour continuer. | Your session has expired. Log in again to continue. | Expiration établie |
| auth.rateLimit | Trop de tentatives. Patientez avant de réessayer. | Too many attempts. Please wait before trying again. | Limitation réelle ; durée seulement si connue |
| reset.invalid | Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien. | This reset link is invalid or has expired. Request a new one. | Lien invalide/expiré |
| list.notFound | Cette liste est introuvable ou n’est plus accessible. | This wish list couldn’t be found or is no longer available. | Sans révéler un accès privé |
| list.forbidden | Vous n’avez pas accès à la modification de cette liste. | You don’t have permission to edit this list. | Page de gestion |
| invite.invalid | Ce lien d’invitation n’est plus valable. Demandez un nouveau lien à la personne qui vous l’a envoyé. | This invitation link is no longer valid. Ask the sender for a new link. | Invitation invalide |
| category.inUse | Cette catégorie contient encore des idées. Déplacez-les avant de la supprimer. | This category still contains ideas. Move them before deleting it. | Seulement si la suppression est bloquée ainsi |
| recipient.inUse | Ce nom est encore utilisé par une idée. Modifiez les idées concernées avant de le retirer. | This recipient is still used by an idea. Update those ideas before removing them. | Blocage annoncé dans l’interface |
| common.loadFailed | Impossible de charger cette page. Réessayez. | We couldn’t load this page. Try again. | Échec de chargement |
| common.saveFailed | Les modifications n’ont pas pu être enregistrées. Réessayez. | We couldn’t save your changes. Try again. | Échec d’écriture confirmé |
| common.unknownOutcome | Nous n’avons pas pu confirmer l’enregistrement. Vérifiez la page avant de réessayer. | We couldn’t confirm whether your changes were saved. Check the page before trying again. | Timeout avec résultat serveur incertain |
| common.retry | Réessayer | Try again | Action disponible |
| common.backHome | Revenir à l’accueil | Back to home | Erreur de navigation |

Associer chaque erreur au champ concerné et fournir un résumé accessible si plusieurs champs échouent. Ne pas effacer les données saisies après une erreur. Ne pas attribuer automatiquement un échec à la connexion Internet. Ne pas montrer des erreurs techniques brutes ou une clé de traduction.

### Confirmations d’actions importantes

| Situation | FR | EN |
|---|---|---|
| Suppression d’idée — titre | Supprimer cette idée ? | Delete this idea? |
| Corps, si suppression définitive | « {giftName} » sera supprimé de la liste. Cette action est définitive. | “{giftName}” will be deleted from the list. This can’t be undone. |
| Validation / retour | Supprimer l’idée / Conserver l’idée | Delete idea / Keep idea |
| Suppression de liste — titre | Supprimer « {listName} » ? | Delete “{listName}”? |
| Corps minimal vérifié par le texte actuel | Cette action est définitive. | This can’t be undone. |
| Validation / retour | Supprimer la liste / Conserver la liste | Delete wish list / Keep wish list |
| Annulation de réservation — titre | Annuler cette réservation ? | Cancel this reservation? |
| Corps, si exclusivité réelle | Ce cadeau sera de nouveau disponible à la réservation. | This gift will be available to reserve again. |
| Validation / retour | Annuler la réservation / Garder la réservation | Cancel reservation / Keep reservation |
| Remplacement d’invitation — titre | Remplacer le lien d’invitation ? | Replace the invitation link? |
| Corps, si invalidation confirmée | L’ancien lien ne permettra plus de rejoindre la liste. | The old link will no longer let people join the list. |
| Validation / retour | Remplacer le lien / Conserver le lien | Replace link / Keep link |
| Départ de liste — titre | Quitter cette liste ? | Leave this wish list? |
| Corps, si droits retirés | Vous ne pourrez plus modifier cette liste avec ce compte. | You’ll no longer be able to edit this list with this account. |
| Validation / retour | Quitter la liste / Rester membre | Leave list / Stay a member |

Préciser l’effet sur les réservations et les autres membres lorsque le code le permet, surtout pour la suppression d’une liste. Ne pas inventer « toutes les données associées seront supprimées » sans vérifier les cascades. Vérifier le cas du dernier propriétaire avant de décrire ou d’autoriser un départ.

### Accès protégé et invitation reçue

| Situation | FR | EN |
|---|---|---|
| Liste protégée — titre | Cette liste est protégée | This wish list is password-protected |
| Aide | Saisissez le mot de passe transmis avec le lien de la liste. | Enter the password shared with the wish list link. |
| Champ | Mot de passe de la liste | List password |
| Action | Accéder à la liste | View wish list |
| Erreur | Le mot de passe est incorrect. | The password is incorrect. |
| Invitation — titre, si étape dédiée | Rejoindre « {listName} » | Join “{listName}” |
| Aide, si droit d’édition | En rejoignant cette liste, vous pourrez en modifier les idées. | Joining this list lets you edit its gift ideas. |
| Action, si confirmation dédiée | Rejoindre la liste | Join list |
| Connexion préalable | Connectez-vous ou créez un compte pour rejoindre cette liste. | Log in or create an account to join this list. |
| Membre déjà présent | Vous faites déjà partie de cette liste. | You’re already a member of this list. |

### E-mails transactionnels à rapprocher des gabarits existants

Ne pas ajouter d’e-mail de réservation s’il n’existe pas. Ne jamais joindre un lien de modification à un message destiné à de simples visiteurs.

| E-mail | FR | EN |
|---|---|---|
| Réinitialisation — objet | Réinitialisez votre mot de passe Wishlist | Reset your Wishlist password |
| Réinitialisation — corps | Vous avez demandé à réinitialiser votre mot de passe. Utilisez le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable 1 heure. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail. | You requested a password reset. Use the button below to choose a new password. This link is valid for 1 hour. If you didn’t request this, you can ignore this email. |
| Réinitialisation — bouton | Choisir un nouveau mot de passe | Choose a new password |
| Invitation — objet | Invitation à rejoindre une liste sur Wishlist | You’re invited to join a list on Wishlist |
| Invitation — corps | Vous avez reçu une invitation à rejoindre « {listName} » pour participer à sa gestion. Connectez-vous ou créez un compte pour continuer. | You’ve been invited to join “{listName}” and help manage it. Log in or create an account to continue. |
| Invitation — bouton | Rejoindre la liste | Join wish list |
| Secours lien | Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : {url} | If the button doesn’t work, copy this link into your browser: {url} |

La langue d’un e-mail doit être définie explicitement : préférence du destinataire si connue, sinon règle de repli documentée. Ne pas la déduire uniquement de la langue de l’expéditeur. Conserver les paramètres et liens sécurisés du système existant.

## 15. Internationalisation, accessibilité et métadonnées

### Formats

- Utiliser `Intl.NumberFormat` avec `fr-FR` ou la locale EN choisie et la devise réelle. Exemple attendu : `78,00 €` en FR, `€78.00` en EN. Conserver les centimes utiles ; choisir une règle uniforme pour les entiers.
- Le changement de langue ne convertit pas les euros en dollars. Séparer langue et devise.
- Accepter et normaliser la saisie décimale conformément à la locale sans changer la valeur. Tester `18,50`, `18.50`, zéro, vide et une valeur invalide selon les règles retenues.
- Utiliser des messages pluralisés complets : « {count} idée » / « {count} idées », « {count} cadeau réservé » / « {count} cadeaux réservés », « {count} gift idea » / « {count} gift ideas ».
- Ne pas reconstruire une phrase par concaténation de fragments traduits. Conserver les mêmes noms de variables entre FR et EN : `{giftName}`, `{listName}`, `{count}`, `{rating}`, `{minLength}`.
- Localiser dates, libellés d’états, texte alternatif, titres, toasts, erreurs serveur exposées au client, mails et noms accessibles.
- Garder les données utilisateur dans leur langue d’origine. Les exemples fournis par l’application peuvent être localisés, pas les données déjà enregistrées.

### Accessibilité rédactionnelle

| Élément | FR | EN |
|---|---|---|
| Afficher le mot de passe, si contrôle disponible | Afficher le mot de passe | Show password |
| Masquer le mot de passe | Masquer le mot de passe | Hide password |
| Fermer une fenêtre | Fermer la fenêtre | Close dialog |
| Note de niveau d’envie sélectionnable | Niveau d’envie : {rating} sur 5 | Wish level: {rating} out of 5 |
| Retour liste depuis formulaire | Revenir à la liste | Back to wish list |
| Résultat de filtrage annoncé | {count} idées affichées | {count} gift ideas shown |

Prévoir un H1 par écran principal et des H2 pour ses sections. Les formulaires inscription, nouvelle liste et récupération présentent leurs titres comme des textes génériques dans les observations : vérifier le HTML. Éviter des boutons imbriqués sur les cartes ; distinguer l’ouverture, le déplacement et l’archivage. Les commandes courtes répétées doivent avoir un nom accessible contextualisé. Les états désactivés doivent être compréhensibles sans dépendre de la couleur. Les toasts importants doivent être annoncés sans voler le focus. Les images décoratives doivent avoir un texte alternatif vide, sans doubler la marque.

### Titres de pages proposés

| Page | FR | EN |
|---|---|---|
| Accueil | Wishlist — Vos listes de cadeaux à partager | Wishlist — Wish lists to share |
| Connexion | Se connecter — Wishlist | Log in — Wishlist |
| Inscription | Créer un compte — Wishlist | Create an account — Wishlist |
| Mes listes | Mes listes — Wishlist | My wish lists — Wishlist |
| Nouvelle liste | Créer une liste — Wishlist | Create a wish list — Wishlist |
| Compte | Mon compte — Wishlist | My account — Wishlist |
| Gestion | Gérer {listName} — Wishlist | Manage {listName} — Wishlist |
| Réservation | Réserver un cadeau — Wishlist | Reserve a gift — Wishlist |

Le titre « Wishlist » seul a été observé sur de nombreuses pages. Pour les métadonnées publiques d’une liste, ne pas exposer automatiquement son nom ou son contenu dans Open Graph avant d’avoir vérifié sa visibilité, sa protection et les règles d’indexation. Meta description de l’accueil : FR « Créez une liste de cadeaux et partagez-la avec vos proches. Ils peuvent réserver une idée sans créer de compte. » ; EN « Create a wish list and share it with friends and family. They can reserve a gift without creating an account. »

## 16. Instruction prête à transmettre à Cursor

> Audite les chaînes de l’interface de ce dépôt et applique les recommandations FR/EN de ce document. Commence par repérer les routes, les catalogues i18n, les composants partagés, les validations, les messages serveur rendus à l’écran et les gabarits d’e-mails. Produis un inventaire de couverture, puis effectue les modifications.
>
> Garde la marque Wishlist et la charte néobrutaliste existante. Utilise le vouvoiement en français, « liste » / « liste de cadeaux », « idée cadeau », « catégorie », « Pour qui ? » et « réservation ». En anglais, utilise « wish list », « gift idea », « gift recipient » et « reservation », avec orthographe US. Distingue la réservation sur le site de l’achat chez un tiers.
>
> Les textes observés de ce rapport servent de repères de recherche, pas de noms de clés garantis. Réutilise les clés existantes lorsque leur sens ne change pas. N’effectue pas de remplacement global aveugle de « type », « nom », « cadeau », « membre », « titre » ou « Wishlist ». Ne traduis pas les noms de listes, catégories, personnes et cadeaux saisis par les utilisateurs.
>
> Pour chaque proposition conditionnelle, vérifie d’abord le comportement réel : visibilité des réservations, nom/message, annulation sans compte, effets des invitations, suppression, archives et permissions. N’invente pas une fonctionnalité, une garantie de confidentialité ou une confirmation de succès. Si le comportement diffère, adapte la phrase à la réalité et consigne le point. Distingue les modifications de texte des petites évolutions d’interface proposées, comme le bouton de réinitialisation des filtres.
>
> Couvre aussi les états vides, chargements, erreurs, confirmations, titres de page, attributs accessibles et e-mails. Assure la parité des clés et variables FR/EN, les pluriels et le formatage localisé des prix. Corrige les libellés des étoiles publiques restés en français dans la vue anglaise. Vérifie le rafraîchissement après changement de langue.
>
> Travaille dans le dépôt et fournis un diff révisable. Ne modifie pas les données de production, les permissions, les liens privés, les comptes ou les réservations. Ne déploie pas dans le cadre de ce ticket. Termine par la liste des fichiers modifiés, les contrôles réalisés, les chaînes restant sans correspondance et les décisions produit encore nécessaires.

## 17. Critères d’acceptation et contrôle d’exhaustivité

### Inventaire à produire dans le dépôt

Pour chaque chaîne : route/composant, clé réelle, texte FR actuel, texte EN actuel, texte FR final, texte EN final, état déclencheur, rôle utilisateur, statut appliqué/conservé/à valider. Cette matrice est le moyen de rendre l’implémentation exhaustive, y compris pour les écrans non atteints pendant cet audit.

### Contrôles indispensables

1. Aucun tutoiement dans les textes applicatifs FR ; vérifier notamment « tu », « ton », « ta », « tes », « clique », « glisse », « ouvre », « laisse », « indique ».
2. Aucun « wishlist » comme nom commun FR hors contenu utilisateur ; marque Wishlist conservée.
3. Les deux liens de partage annoncent leurs fonctions et droits distincts ; leurs boutons de copie ont des noms distincts.
4. Le CTA carte est « Réserver ce cadeau » / « Reserve this gift » et la validation « Confirmer la réservation » / « Confirm reservation ».
5. Aucune promesse de surprise, confidentialité, annulation ou persistance non confirmée par le code.
6. Les réservations sans connexion ne sont pas décrites comme forcément anonymes.
7. Prix et décimales conformes à la locale ; devise inchangée ; bornes des filtres testées à 20, 50 et 100.
8. Les étoiles ont un sens explicite et des textes accessibles localisés ; absence de note gérée séparément.
9. Aucun champ sans label persistant ; titres sémantiques ; commandes répétées contextualisées.
10. Clés FR/EN et placeholders identiques ; aucune chaîne brute oubliée dans toasts, dialogues, validation, erreurs, métadonnées ou e-mails.
11. Les données utilisateur ne sont ni traduites ni modifiées ; échappement des variables conservé.
12. Tester l’accueil, l’authentification, la création, l’ajout/modification, les archives, la liste publique, les filtres, les réservations, le partage, les réglages et le compte en FR puis EN.
13. Tester les rôles propriétaire, membre, visiteur connecté et visiteur sans compte avec des données de test dédiées ; inclure les listes protégées et invitations invalides.
14. Vérifier les libellés sur petit écran et clavier ; aucune action principale coupée ou ambiguë. Ces formats n’ont pas été validés pendant l’audit visuel ordinateur.
15. Vérifier que les confirmations apparaissent après réponse serveur et qu’un échec conserve les champs saisis.

### Ordre de réalisation

- Lot 1 : vocabulaire, vouvoiement, réservation, partage et transparence sur les droits.
- Lot 2 : formulaires, compte, réglages, erreurs, états vides et confirmations.
- Lot 3 : accessibilité, formats, métadonnées, e-mails et vérification complète des catalogues.

Ne pas bloquer les corrections certaines sur les questions restantes. Livrer les remplacements vérifiés, puis une courte liste de décisions précises : qui voit les réservations et messages ; comment une réservation hors compte se gère ; quels droits reçoit un membre ; quelles suppressions sont réellement définitives ; quelles garanties de surprise le produit peut tenir.
