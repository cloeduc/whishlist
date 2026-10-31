# Référence de design : app mobile

L'app doit ressembler le plus possible au site vu sur un téléphone. La référence n'est pas une maquette : ce sont les **écrans du site en largeur mobile**, capturés sur la base de démo dans [`design/web-mobile/`](design/web-mobile/) (390 × 844, densité 2). Quand ce document et une capture divergent, la capture fait foi.

Valeurs relevées dans `app/globals.css`, `components/ui/*` et `components/site/*` le 2026-10-28. Si le site change, ce document et les captures sont mis à jour avec lui. Les captures doivent être refaites par le script existant du guide (`scripts/capture-demo.mjs`, `npm run demo:capture`), étendu au plan avec un mode largeur mobile ; les captures du guide (`public/guide/`) restent en largeur bureau.

## Style général

Néo-brutaliste et joyeux : aplats de couleurs franches, **bordures noires de 2 px**, **ombre noire pleine décalée de 4 px vers le bas et la droite**, sans flou ni dégradé (sauf l'accueil invité), coins légèrement arrondis. Pas de mode sombre.

## Couleurs

| Rôle | Valeur | Usage |
|------|--------|-------|
| Fond de l'app | `#e8f0ff` | fond de tous les écrans |
| Bleu cadeau (principal) | `#1a56e8` | bouton principal, onglet actif, sélecteur de langue actif, anneau de focus |
| Texte sur bleu | `#ffffff` | libellé des boutons principaux |
| Jaune cadeau | `#ffd700` | accent, étoiles du niveau d'envie, badges « highlight » |
| Rouge cadeau | `#ff2d2d` | détails de l'illustration cadeau |
| Rouge destructif | `#c41212` | bouton de suppression (texte blanc) |
| Carte, champ, bouton secondaire | `#ffffff` | fond |
| Texte | `#000000` | texte principal, bordures, ombres |
| Texte secondaire | `oklch(0.4 0 0)` ≈ `#4d4d4d` | descriptions, aides sous les champs |
| Fond atténué | `#d6e4ff` | zones « muted » |

Contraste vérifié sur le site : bleu sur fond `#e8f0ff` 5,2:1 ; blanc sur bleu 5,9:1.

**Thème de liste** : chaque liste a 4 couleurs (`primary`, `accent`, `highlight`, `background`, défaut `#1e60ff`, `#ff2d2d`, `#ffd700`, `#e8f0ff`). Sur les écrans d'une liste, ces couleurs remplacent le bleu, le rouge, le jaune et le fond, comme sur la page publique du site (`WishlistThemeScope`).

## Typographie

- Police **Geist** (sans-serif), partout.
- Poids : **500** pour le texte courant, **700** pour les titres, les titres de carte et les badges.
- Tailles relevées sur le site (en px CSS) : titre d'écran (« Mes listes ») ≈ 30 ; titre de liste à côté du cadeau ≈ 30, poids 500 ; titre de carte 16 ; texte courant 16 ; libellé de champ 14 à 16 ; aide et description 14 ; badge 12, poids 700.
- Les tailles suivent le réglage de taille de texte du téléphone (FR-033).

## Formes

| Élément | Rayon | Bordure | Ombre |
|---------|-------|---------|-------|
| Bouton, champ, badge, carte | 5 px | 2 px noire | 4 px / 4 px noire pleine |
| Cadre de l'illustration cadeau | ≈ 18 % de sa taille | 2 px noire | 4 px / 4 px noire pleine |
| Lien texte | — | souligné, décalage 4 px | — |

**Appui** : un bouton ou une carte cliquable pressé glisse de 4 px vers le bas et la droite et perd son ombre (il « s'enfonce »), puis revient. C'est l'équivalent tactile du survol du site.

**Focus clavier / lecteur d'écran** : anneau noir de 2 px, décalé de 2 px.

## Composants

- **Bouton principal** : fond bleu, texte blanc, hauteur 40 px (petit 36, grand 44), bordure et ombre. Pleine largeur dans les formulaires (« Se connecter », « Ajouter l'idée »).
- **Bouton secondaire** : fond blanc, texte noir, bordure et ombre (« Voir la liste partagée », « Remplacer le lien d'invitation »).
- **Bouton désactivé** : même forme, contour et texte gris, opacité 50 %, ombre grise (voir « Remplir depuis le lien » dans `06-liste-idees.png`).
- **Bouton destructif** : fond rouge `#c41212`, texte blanc, bordure et ombre.
- **Lien** : texte noir souligné (« Mot de passe oublié ? », « Créer un compte », « Archiver »).
- **Champ de saisie** : fond blanc, hauteur 40 px, bordure et ombre, libellé au-dessus en poids 500, aide en gris en dessous, erreur sous le champ.
- **Liste déroulante** : comme un champ, avec un chevron à droite.
- **Carte** : fond blanc, bordure et ombre, marges internes 16 px ; titre en gras 16 px, description grise 14 px.
- **Onglets d'une liste** : boutons-pastilles qui passent à la ligne (Idées (n), Archives (n), Réservations (n), Partage, Réglages) ; l'actif est bleu à texte blanc, les autres blancs. Sur l'app, ils peuvent devenir une barre défilante horizontale, avec exactement le même style de pastille.
- **Badge** : pastille de hauteur 24 px, bordure, ombre, texte 12 px gras ; utilisé pour le « qui » (blanc) et le prix (blanc) sur une idée.
- **Étoiles du niveau d'envie** : 1 à 5 étoiles jaunes à contour noir ; en saisie, étoiles vides à contour noir.
- **Catégorie (accordéon)** : carte avec flèches haut/bas pour l'ordre, poignée, nom en gras, nombre d'idées, chevron ; ouverte, elle montre ses idées en cartes.
- **Idée** : carte avec poignée, nom, étoiles, badges « qui » et prix, image carrée à bordure et ombre si présente, lien « Archiver ».
- **Illustration cadeau** (`GiftMark`) : cadeau dessiné aux couleurs du thème (couvercle `accent`, corps `primary`, ruban `highlight`), dans un carré blanc à coins arrondis, bordure noire et ombre. En tête de l'app (à côté du nom du produit), en tête de chaque liste, et sur chaque carte de « Mes listes ».
- **Champ lien + copier** : champ en lecture seule et petit bouton carré « copier » à droite (`09-liste-partage.png`).
- **Alerte** : carte blanche (info) ou rouge à texte blanc (erreur).
- **État vide** : texte centré, sans carte.

## En-tête

Le site affiche en haut : cadeau encadré + « Oh, mais fallait pas ! » (EN : « Oh, You Shouldn't! ») en gras, puis la navigation en pastilles (Mes listes active, Mon compte, Se déconnecter) et le sélecteur FR / EN. Dans l'app :

- le cadeau encadré et le nom du produit restent en tête des écrans principaux, au même style ;
- la navigation devient celle d'une app (barre d'onglets ou en-tête avec retour), mais **ses éléments gardent le style pastille** (actif bleu, inactif sans fond) ;
- pas de sélecteur de langue (langue du téléphone) ni de pied de page (projet, FAQ, guide, mentions légales).

## Correspondance des écrans

| Écran de l'app | Capture de référence | Ce qui doit se retrouver |
|----------------|----------------------|--------------------------|
| Connexion | `02-connexion.png` | carte « Se connecter » avec description, deux champs, bouton bleu pleine largeur, lien « Mot de passe oublié ? », lien « Créer un compte » sous la carte |
| Création de compte | `03-inscription.png` | même carte et mêmes champs que le site |
| Mes listes | `04-mes-listes.png` | titre « Mes listes » à gauche, bouton « Créer une liste » à droite, une carte par liste avec cadeau, titre gras, sous-titre gris |
| Nouvelle liste | `05-nouvelle-liste.png` | même formulaire en carte |
| Liste – Idées | `06-liste-idees.png` | cadeau + titre, bouton « Voir la liste partagée », pastilles d'onglets, carte « Ajouter une idée cadeau », catégories en accordéon |
| Liste – Archives | `07-liste-archives.png` | idées archivées en cartes |
| Liste – Réservations | `08-liste-reservations.png` | réservations avec offreur et petit mot |
| Liste – Partage | `09-liste-partage.png` | carte « Partager avec vos proches » avec champ lien + copier ; **ajout de l'app** : QR code et bouton de partage du téléphone dans cette carte, au même style |
| Liste – Réglages | `10-liste-reglages.png` | catégories et « qui » en pastilles éditables |
| Mon compte | `11-compte.png` | cartes nom affiché et mot de passe ; en bas (feature 006), carte « Vos données et informations », « Se déconnecter », puis « Supprimer mon compte » en rouge |
| Supprimer mon compte (feature 006) | `11-compte.png` | mêmes cartes, champ mot de passe et bouton rouge pleine largeur que la carte « Supprimer mon compte » du site |
| Page publique (ouverte par le lien partagé) | `12-liste-publique.png` | reste sur le site ; sert de référence pour le thème de liste |
| Mentions légales (feature 006) | page `/mentions-legales` du site (pas de capture) | sur-titre bleu en majuscules, grand titre, intro grise, une carte blanche à bordure et ombre par section |
| Données personnelles (feature 006) | page `/donnees-personnelles` du site (pas de capture) | même en-tête et mêmes cartes ; les paragraphes des prestataires optionnels suivent le serveur |

Éléments propres à l'app, sans équivalent sur le site, à dessiner **avec les mêmes composants** (carte, badge, bouton, alerte) :

- **QR code** : noir sur blanc, dans une carte blanche à bordure et ombre, avec une marge blanche autour du code pour qu'il reste lisible.
- **Hors ligne** : bandeau-alerte blanc à bordure et ombre en haut de l'écran (« Hors ligne · dernière mise à jour à 14 h 05 ») ; badge jaune « En attente » sur une idée ou une liste pas encore envoyée ; alerte rouge pour un changement refusé.
- **Chargement** : pas de spinner générique seul ; le cadeau peut servir d'indicateur, comme `LiveGiftMark` sur le site.

## Ton et textes

Reprendre les textes du site (`locales/fr/*.json`, `locales/en/*.json`) plutôt que d'en écrire de nouveaux : mêmes libellés de boutons, de champs et d'erreurs, vouvoiement, lexique « idée », « liste », « qui », « J'offre ». Un texte propre à l'app (QR code, hors ligne) suit le même ton.

## Écarts justifiés (implémentation)

Relevés en comparant l'app sur simulateur iOS (iPhone Air, compte de démo) aux captures `design/web-mobile/`. Tout le reste (couleurs, police, bordures, ombres, rayons, ordre des blocs, libellés) est identique.

| Écran | Écart | Pourquoi |
|-------|-------|----------|
| Tous | Pas de navigation en pastilles, pas de sélecteur FR/EN, pas de pied de page | Navigation d'app : « Mes listes » est l'accueil, avec en haut l'en-tête du site et un bouton carré « profil » (icône de personne) vers « Mon compte » ; « Se déconnecter » est dans « Mon compte » ; langue du téléphone (FR-032) ; liens du pied de page hors périmètre |
| Liste, formulaires | Lien « Retour » à la place de l'en-tête du produit | Le site s'appuie sur le bouton retour du navigateur ; l'app en a besoin à l'écran. Même style que les liens du site |
| Liste – Idées | Bouton « Ajouter une idée cadeau » qui ouvre le formulaire, au lieu de la carte-formulaire en tête | Sur un téléphone, le formulaire complet au-dessus des catégories repousse les idées très loin ; le formulaire ouvert est la même carte, mêmes champs et libellés |
| Liste – Idées | Pas de poignée de glisser-déposer | Le site garde des flèches et un menu de catégorie pour les mêmes actions ; l'app n'utilise que ceux-là |
| Liste – Partage | Seule la carte « Partager avec vos proches », avec QR code et bouton « Partager » ; lien « Gérer le partage sur le site » | Invitations, mot de passe de lecture et membres restent sur le site dans cette version (contracts/screens.md) |
| Liste – Réglages | Seuls les blocs catégories et « qui » | Apparence et suppression de la liste restent sur le site dans cette version |
| Mon compte | Pas de sous-titre ni de carte « Mes réservations » ; bouton « Se déconnecter » en bas | Les réservations faites avec le compte ne sont pas dans le périmètre de l'app ; sur le site, la déconnexion est dans la navigation du haut, que l'app n'a pas |
| Chargement | Le cadeau se balance doucement | Indicateur propre à l'app ; immobile si le téléphone demande moins d'animations |
