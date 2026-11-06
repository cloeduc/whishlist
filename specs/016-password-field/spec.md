# Feature Specification: Champ mot de passe (sans majuscule automatique, avec un œil)

**Feature Branch**: `016-password-field`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Champ mot de passe partagé, sur le site et dans l'app mobile : (a) pas de majuscule automatique ni de correction automatique dans les champs mot de passe ; (b) un bouton « œil » pour afficher / masquer le mot de passe, avec libellé accessible traduit FR/EN (« Afficher le mot de passe » / « Masquer le mot de passe »). Un composant partagé dans l'app et son pendant sur le site (même apparence), utilisé par tous les champs mot de passe existants. Garder la croix de la feuille « mot de passe robuste » iOS fonctionnelle et mettre à jour les parcours e2e si besoin."

## Contexte

Aujourd'hui, chaque écran de l'app mobile et chaque formulaire du site déclare son champ mot de passe à sa façon. Sur téléphone, le clavier peut mettre une majuscule à la première lettre ou corriger le mot tapé : la personne se trompe de mot de passe sans le voir, puisque la saisie est masquée. Et rien ne permet de vérifier ce qu'on a tapé.

Champs concernés (tous ceux qui reçoivent un mot de passe) :

| Où | Site | App mobile |
|----|------|------------|
| Connexion | formulaire de connexion | écran Connexion |
| Inscription | formulaire d'inscription | écran Inscription |
| Réinitialisation (lien reçu par e-mail) | page de réinitialisation | écran de réinitialisation |
| Changement de mot de passe (actuel, nouveau, confirmation) | carte Mot de passe du compte | carte Mot de passe du compte |
| Changement d'adresse e-mail (mot de passe actuel) | carte E-mail du compte | carte E-mail du compte |
| Suppression du compte | fenêtre de confirmation | écran de suppression |
| Mot de passe de lecture d'une liste (le définir) | carte « Protéger l'accès à votre liste » | — (pas dans l'app) |
| Mot de passe de lecture d'une liste (le saisir pour lire) | page de la liste protégée | vue invité de la liste, écran « Suivre une liste » |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Taper son mot de passe sans que le clavier le modifie (Priority: P1)

Sur téléphone (app ou site ouvert dans le navigateur du téléphone), une personne tape son mot de passe. Le clavier ne met pas de majuscule automatique à la première lettre, ne corrige pas les mots et ne propose pas de suggestions dans le champ. Ce qu'elle tape est exactement ce qui est envoyé.

**Why this priority**: c'est la cause d'échecs de connexion incompréhensibles (« motdepasse » devient « Motdepasse »). Corriger cela seul a déjà de la valeur, sans l'œil.

**Independent Test**: sur l'app et sur le site en largeur de téléphone, taper un mot de passe tout en minuscules dans chaque champ du tableau ; afficher la saisie (ou se connecter) et constater qu'aucune lettre n'a été changée.

**Acceptance Scenarios**:

1. **Given** l'écran Connexion de l'app, **When** la personne tape « secretdemo1 » avec le clavier du téléphone, **Then** le mot de passe envoyé est « secretdemo1 » et la connexion réussit.
2. **Given** n'importe quel champ mot de passe du tableau (site ou app), **When** la personne commence à taper, **Then** le clavier ne passe pas en majuscule et ne propose aucune correction.
3. **Given** l'écran Inscription sur iOS, **When** la personne touche le champ mot de passe, **Then** la proposition de mot de passe robuste du système apparaît toujours et sa croix permet toujours de la refuser pour taper son propre mot de passe.

---

### User Story 2 - Afficher ou masquer le mot de passe tapé (Priority: P2)

Dans chaque champ mot de passe, un bouton en forme d'œil, placé dans le champ à droite, affiche la saisie en clair ; touché à nouveau, il la masque. Le mot de passe est masqué par défaut. Le bouton est annoncé par les lecteurs d'écran : « Afficher le mot de passe » quand la saisie est masquée, « Masquer le mot de passe » quand elle est visible (« Show password » / « Hide password » en anglais).

**Why this priority**: permet de vérifier sa saisie avant d'envoyer, surtout pour un nouveau mot de passe. Vient après la story 1, qui supprime la cause principale des erreurs.

**Independent Test**: dans chaque champ du tableau, taper un mot de passe, toucher l'œil, lire la saisie en clair, toucher à nouveau, voir la saisie masquée ; vérifier le libellé annoncé avec VoiceOver ou un lecteur d'écran du navigateur.

**Acceptance Scenarios**:

1. **Given** un champ mot de passe avec une saisie masquée, **When** la personne touche l'œil, **Then** la saisie s'affiche en clair, le texte et la position du curseur sont conservés, et le libellé du bouton devient « Masquer le mot de passe ».
2. **Given** une saisie visible, **When** la personne touche à nouveau l'œil, **Then** la saisie est masquée et le libellé redevient « Afficher le mot de passe ».
3. **Given** un formulaire avec plusieurs champs mot de passe (actuel, nouveau, confirmation), **When** la personne affiche l'un d'eux, **Then** les autres restent masqués.
4. **Given** un formulaire du site, **When** la personne active l'œil (clic, ou Entrée / Espace au clavier), **Then** le formulaire n'est pas envoyé.
5. **Given** une saisie affichée en clair, **When** le formulaire est envoyé, que la fenêtre se ferme ou que la personne quitte l'écran, **Then** le champ est de nouveau masqué la prochaine fois qu'il apparaît.
6. **Given** la langue anglaise, **When** un lecteur d'écran lit le bouton, **Then** il annonce « Show password » ou « Hide password ».

---

### User Story 3 - Même champ partout, même apparence sur le site et dans l'app (Priority: P3)

Tous les champs du tableau utilisent un seul et même champ mot de passe, côté site d'une part et côté app d'autre part, avec la même apparence des deux côtés (taille, bordure, place et forme de l'œil). Un futur champ mot de passe hérite d'office de ce comportement.

**Why this priority**: c'est ce qui garantit que les stories 1 et 2 s'appliquent partout et le resteront. Sa valeur propre pour l'utilisateur est la cohérence visuelle.

**Independent Test**: comparer côte à côte une capture du site en largeur de téléphone et une capture de l'app pour les écrans Connexion et Compte ; vérifier qu'aucun champ mot de passe du tableau ne garde l'ancien comportement.

**Acceptance Scenarios**:

1. **Given** l'écran Connexion du site en largeur de téléphone et celui de l'app, **When** on les compare, **Then** le champ mot de passe et son œil ont la même apparence.
2. **Given** la liste des champs du tableau, **When** on les parcourt tous, **Then** chacun a l'œil et ne subit ni majuscule ni correction automatique.

---

### Edge Cases

- **Gestionnaires de mots de passe et trousseau** : le remplissage automatique (mot de passe enregistré, proposition d'un mot de passe robuste à l'inscription et à la réinitialisation) continue de fonctionner, que la saisie soit masquée ou visible. Le bouton œil ne gêne pas l'icône que certains gestionnaires ajoutent dans le champ.
- **Feuille « mot de passe robuste » d'iOS** : elle s'ouvre toujours sur les champs de nouveau mot de passe, et sa croix reste utilisable (y compris par la suite e2e).
- **Navigateur sans JavaScript** (site) : le champ reste un champ mot de passe masqué utilisable ; l'œil n'apparaît pas ou n'a pas d'effet, et le formulaire s'envoie normalement.
- **Navigateurs qui ajoutent leur propre bouton d'affichage** (p. ex. Edge) : un seul œil est visible dans le champ.
- **Erreur au retour du serveur** (site) : quand la page revient avec un message d'erreur, le champ mot de passe est vide et masqué.
- **Champ désactivé** (p. ex. app hors ligne, envoi en cours) : l'œil reste utilisable pour relire la saisie, il ne modifie pas la saisie.
- **Mot de passe long** : le texte ne passe pas sous l'œil ; il défile dans le champ.
- **Copie** : afficher le mot de passe ne change rien à la possibilité de le copier ou de le coller (comportement du système).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tout champ qui reçoit un mot de passe, sur le site et dans l'app (tableau du Contexte), MUST désactiver la majuscule automatique, la correction automatique et les suggestions du clavier.
- **FR-002**: Tout champ mot de passe MUST être masqué par défaut et MUST offrir un bouton « œil », placé dans le champ, qui bascule entre saisie masquée et saisie visible.
- **FR-003**: Le bouton MUST avoir un libellé accessible traduit, qui dépend de l'état : FR « Afficher le mot de passe » / « Masquer le mot de passe », EN « Show password » / « Hide password ». Son icône MUST refléter l'état (œil ouvert ou barré).
- **FR-004**: Basculer l'affichage MUST conserver le texte saisi et ne MUST NOT envoyer le formulaire ni vider le champ.
- **FR-005**: L'état « visible » MUST être propre à chaque champ et MUST NOT survivre à l'envoi du formulaire, à la fermeture de la fenêtre ou de la carte qui le contient, ni au départ de l'écran.
- **FR-006**: Le bouton MUST être utilisable au clavier sur le site (atteignable par Tab, activable par Entrée ou Espace) et au toucher dans l'app, avec une zone de toucher d'au moins 44 × 44 points.
- **FR-007**: Les indications de remplissage automatique existantes (mot de passe actuel ou nouveau mot de passe) MUST être conservées pour chaque champ, afin que trousseaux et gestionnaires de mots de passe continuent de proposer, d'enregistrer et de remplir les mots de passe.
- **FR-008**: Sur iOS, la proposition de mot de passe robuste MUST rester disponible sur les champs de nouveau mot de passe, et sa croix MUST rester utilisable.
- **FR-009**: Le site et l'app MUST chacun utiliser un seul composant de champ mot de passe pour tous les champs du tableau ; les deux composants MUST avoir la même apparence (celle du champ de saisie actuel, plus l'œil à droite).
- **FR-010**: Sans JavaScript, le champ mot de passe du site MUST rester un champ masqué fonctionnel.
- **FR-011**: Les identifiants des champs utilisés par la suite e2e de l'app MUST être conservés, ou les parcours mis à jour dans la même livraison ; le bouton œil MUST avoir son propre identifiant, et la story 2 MUST avoir son parcours e2e.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des champs du tableau (8 formulaires du site, 10 champs de l'app) ont l'œil et aucune majuscule ni correction automatique, vérifié sur iOS, Android et le site en largeur de téléphone.
- **SC-002**: Un mot de passe tout en minuscules tapé au clavier du téléphone permet de se connecter du premier coup, dans l'app comme sur le site.
- **SC-003**: Une personne peut vérifier sa saisie en un seul toucher, et la masquer en un second.
- **SC-004**: Un lecteur d'écran annonce l'état du bouton dans la langue de l'interface, en français comme en anglais.
- **SC-005**: La suite e2e de l'app passe, inscription comprise (croix de la feuille iOS), sans parcours retiré.

## Assumptions

- Le comportement est le même pour tous les champs du tableau, y compris le mot de passe de lecture d'une liste (ce n'est pas un mot de passe de compte, mais il se tape de la même façon).
- Pas d'affichage maintenu tant qu'on appuie (« appuyer pour voir ») : un toucher bascule, un second rebascule, comme dans la plupart des apps.
- La saisie n'est jamais masquée de nouveau automatiquement après un délai : elle le reste jusqu'au second toucher ou au départ de l'écran (FR-005).
- L'icône est l'œil (ouvert / barré) déjà utilisé dans les bibliothèques d'icônes du site et de l'app ; pas de texte « Afficher » visible à côté.
- Aucun changement des règles sur les mots de passe (longueur, refus des mots de passe fuités : sujet séparé du backlog), ni de l'API.
- Le guide du site et ses captures ne sont pas mis à jour pour cette seule feature, sauf si les captures existantes montrent un champ mot de passe de façon gênante (l'œil seul ne justifie pas de les refaire).
