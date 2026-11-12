# Feature Specification: Nouveau favicon du site

**Feature Branch**: `019-site-favicon`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Changer le favicon du site (ticket Plane WISH-14)"

## Contexte

Le site affiche aujourd'hui une icône de cadeau : un paquet bleu au ruban jaune et au couvercle rouge, avec un cœur, posé dans un carré blanc qui a une ombre noire. L'app mobile a sa propre icône, du même style mais redessinée : nœud arrondi, traits plus nets, fond bleu clair. Les deux icônes ne sont pas identiques.

L'image du site est une grande image (1024 × 1024) sur fond blanc opaque, servie telle quelle à toutes les tailles. Dans un onglet, à 16 ou 32 pixels, le cadeau est petit et le contour blanc se voit sur un onglet sombre. L'image sert aussi d'icône quand on ajoute le site à l'écran d'accueil d'un téléphone.

## Clarifications

### Session 2026-11-12

- Q: Quelle image pour le nouveau favicon ? → A: l'icône de l'app mobile, la même partout.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconnaître le site dans ses onglets et ses favoris (Priority: P1)

Une personne a plusieurs onglets ouverts, dont une liste d'idées. Elle retrouve l'onglet du site d'un coup d'œil grâce à sa nouvelle icône, nette à petite taille, en thème clair comme en thème sombre. La même icône apparaît dans ses favoris et dans son historique.

**Why this priority**: c'est l'objet du ticket, et le seul endroit où toutes les personnes voient l'icône, avec ou sans compte.

**Independent Test**: ouvrir le site dans un navigateur en thème clair puis en thème sombre, regarder l'onglet et ajouter la page aux favoris.

**Acceptance Scenarios**:

1. **Given** une personne qui ouvre n'importe quelle page du site (accueil, liste publique, compte, page d'erreur), **When** elle regarde l'onglet, **Then** elle voit la nouvelle icône, et non l'ancienne.
2. **Given** un navigateur en thème sombre, **When** la personne regarde l'onglet, **Then** l'icône reste lisible : pas de carré blanc qui écrase le dessin, pas de contour qui disparaît.
3. **Given** une personne qui avait déjà visité le site avec l'ancienne icône, **When** elle revient après la mise en production, **Then** elle voit la nouvelle icône sans avoir à vider son cache.

---

### User Story 2 - Ajouter le site à l'écran d'accueil d'un téléphone (Priority: P2)

Une personne qui n'a pas installé l'app mobile ajoute une liste à l'écran d'accueil de son téléphone, depuis son navigateur. Le raccourci porte la nouvelle icône, cadrée comme celle d'une app : sans bord blanc parasite ni dessin coupé.

**Why this priority**: moins fréquent que l'onglet, mais c'est l'endroit où l'icône est la plus grande et où un mauvais cadrage se voit le plus.

**Independent Test**: sur un iPhone et sur un téléphone Android, ajouter une page du site à l'écran d'accueil et regarder le raccourci.

**Acceptance Scenarios**:

1. **Given** un iPhone, **When** la personne ajoute une page du site à l'écran d'accueil, **Then** le raccourci montre la nouvelle icône, qui remplit le carré arrondi.
2. **Given** un téléphone Android, **When** la personne fait de même, **Then** le raccourci montre la nouvelle icône sans dessin coupé.

---

### Edge Cases

- Un navigateur qui demande l'icône à l'adresse classique du site, sans lire la page (lecteurs de flux, certains outils de favoris) : il reçoit la nouvelle icône, pas une erreur.
- Les liens partagés dans une messagerie : l'aperçu peut montrer l'icône du site. Il doit montrer la nouvelle.
- Les anciennes adresses françaises (feature 018) redirigent vers les nouvelles : la page d'arrivée a la nouvelle icône, comme les autres.
- Un navigateur qui garde l'ancienne icône en cache : la nouvelle s'affiche au plus tard au chargement suivant, sans manipulation de la personne.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le site DOIT afficher une nouvelle icône, reprise de l'icône de l'app mobile : le site et l'app ont la même icône.
- **FR-002**: L'icône DOIT exister dans les tailles qu'utilisent les navigateurs (onglet, favoris, écran d'accueil), chacune lisible à sa taille, au lieu d'une seule grande image réduite par le navigateur.
- **FR-003**: Aux petites tailles (onglet), l'icône DOIT garder un dessin lisible et ne pas avoir de fond blanc opaque autour du dessin.
- **FR-004**: L'icône d'écran d'accueil DOIT remplir son carré, sans marge blanche, pour être découpée proprement par le téléphone.
- **FR-005**: Toutes les pages du site, en français comme en anglais, DOIVENT annoncer la même icône.
- **FR-006**: L'adresse classique de l'icône d'un site DOIT rendre la nouvelle icône.
- **FR-007**: L'ancienne icône NE DOIT PLUS être servie par le site.
- **FR-008**: Le changement NE DOIT PAS toucher l'icône de l'app mobile, ni les couleurs par défaut d'une liste, qui reprennent celles du cadeau.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur les navigateurs courants (Chrome, Safari, Firefox), en thème clair et sombre, l'onglet du site montre la nouvelle icône sur 100 % des pages vérifiées : accueil, liste publique, compte, page introuvable.
- **SC-002**: À la taille d'un onglet, une personne reconnaît un cadeau dans l'icône sans zoomer.
- **SC-003**: Sur un iPhone et un Android, le raccourci d'écran d'accueil montre la nouvelle icône sans bord blanc ni dessin coupé.
- **SC-004**: Après la mise en production, une personne qui avait déjà visité le site voit la nouvelle icône au plus tard à sa deuxième visite.

## Assumptions

- Le dessin est celui de l'icône de l'app mobile (cadeau néo-brutaliste), adapté aux petites tailles sans changer le dessin.
- Pas de manifeste d'application web installable ni de mode hors ligne pour le site : seul le raccourci d'écran d'accueil est concerné.
- L'image de partage des liens (aperçu riche) est hors périmètre ; seule l'icône du site change.
- La couleur de fond de l'icône d'écran d'accueil reprend une couleur déjà utilisée par le site ou par l'app.
- Pas de nouveau compte, droit d'accès ou donnée : le changement est purement visuel.
