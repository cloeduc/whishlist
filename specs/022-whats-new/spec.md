# Feature Specification: Fenêtre « Quoi de neuf » après une mise à jour de l'app

**Feature Branch**: `022-whats-new`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "App mobile : au premier lancement d'une nouvelle version (après une mise à jour), afficher une fenêtre « Quoi de neuf » qui résume les nouveautés de cette version, sur iPhone et Android. Textes embarqués dans l'app, en français et en anglais. Pas au premier lancement après une installation neuve. Complète la 021 (proposition de mise à jour)."

## Contexte

La 021 invite à mettre l'app à jour, mais rien ne dit ensuite ce que la nouvelle version apporte. Une nouveauté comme le mode surprise (020) passe inaperçue si personne ne va la chercher dans l'onglet Partage.

## Clarifications

### Session 2026-11-16

- Q: Faut-il pouvoir revoir les nouveautés plus tard ? → A: oui, une entrée « Nouveautés » dans « Mon compte », qui montre les nouveautés des dernières versions.

Cette feature affiche, au premier lancement qui suit une mise à jour, une fenêtre « Quoi de neuf » avec les nouveautés de la version, en quelques lignes. Les textes sont dans l'app : la fenêtre marche hors ligne, et sur iPhone comme sur Android.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Découvrir les nouveautés après une mise à jour (Priority: P1)

Une personne met à jour l'app (par la proposition de la 021, ou directement dans le store) puis l'ouvre. Une fenêtre « Quoi de neuf dans la version X » liste les nouveautés en quelques points courts. Elle la ferme (« C'est noté ») et continue. La fenêtre ne revient plus pour cette version.

**Why this priority**: c'est toute la feature ; sans elle, les nouveautés restent invisibles.

**Independent Test**: installer la version précédente, l'ouvrir une fois, mettre à jour vers la nouvelle, l'ouvrir : la fenêtre s'affiche avec les nouveautés ; la fermer ; rouvrir l'app : plus rien.

**Acceptance Scenarios**:

1. **Given** l'app vient d'être mise à jour vers une version qui a des nouveautés, **When** la personne l'ouvre, **Then** une fenêtre « Quoi de neuf » liste les nouveautés de cette version, dans la langue de l'app.
2. **Given** cette fenêtre, **When** la personne appuie sur « C'est noté », **Then** elle se ferme et ne revient plus pour cette version, même après redémarrage.
3. **Given** la personne a sauté des versions (par exemple de 1.1.1 à 1.1.3), **When** elle ouvre l'app, **Then** la fenêtre réunit les nouveautés de chaque version manquée, la plus récente en premier.
4. **Given** la nouvelle version n'a aucune nouveauté annoncée (simple correction), **When** la personne ouvre l'app, **Then** aucune fenêtre ne s'affiche.
5. **Given** l'app vient d'être installée pour la première fois, **When** la personne l'ouvre, **Then** aucune fenêtre « Quoi de neuf » ne s'affiche.
6. **Given** l'app est hors ligne, **When** la personne ouvre la nouvelle version, **Then** la fenêtre s'affiche quand même.

---

### User Story 2 - Revoir les nouveautés plus tard (Priority: P2)

Dans « Mon compte », une entrée « Nouveautés » ouvre un écran qui liste les nouveautés des versions de l'app, la plus récente en premier, avec le numéro de chaque version et la version installée en haut.

**Why this priority**: utile quand on a fermé la fenêtre trop vite ; elle réutilise les textes écrits pour la fenêtre.

**Independent Test**: depuis « Mon compte », ouvrir « Nouveautés » : les versions et leurs nouveautés s'affichent, dans la langue de l'app, hors ligne compris.

**Acceptance Scenarios**:

1. **Given** « Mon compte », **When** la personne ouvre « Nouveautés », **Then** un écran liste chaque version qui a des nouveautés (version installée et plus anciennes), la plus récente en premier, avec ses points.
2. **Given** cet écran, **When** la personne revient en arrière, **Then** elle retrouve « Mon compte » ; rien ne change pour la fenêtre « Quoi de neuf ».
3. **Given** l'app hors ligne, **When** la personne ouvre « Nouveautés », **Then** l'écran s'affiche normalement.

---

### Edge Cases

- **Mise à jour depuis une version qui ne connaît pas cette fenêtre** (1.1.0 et avant) : l'app ne sait pas quelle version tournait avant. Si elle trouve sur le téléphone des traces d'un usage passé (compte connecté, listes gardées, changements en attente), elle considère que c'est une mise à jour et affiche les nouveautés de la version ; sinon, c'est une installation neuve et rien ne s'affiche.
- **Fenêtre « Nouvelle version disponible » (021) au même démarrage** : une seule fenêtre à la fois ; « Quoi de neuf » d'abord (la personne vient de mettre à jour, la proposition n'a alors en principe pas lieu d'être).
- **Retour à une version plus ancienne** (version de test, réinstallation) : aucune fenêtre ; la version mémorisée reste la plus récente vue.
- **App ouverte par un lien** (liste, invitation) : la fenêtre s'affiche par-dessus l'écran ouvert ; la fermer laisse la personne où le lien l'a menée.
- **Langue** : les nouveautés suivent la langue de l'app ; chaque version a ses textes en français et en anglais.
- **Déconnexion** : la version vue est un réglage du téléphone, gardé à la déconnexion (comme l'état de la 021) ; se déconnecter ne fait pas revoir la fenêtre.
- **Build de développement** : pas de fenêtre (pas de vraie mise à jour).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Au premier lancement d'une version plus récente que la dernière version vue sur ce téléphone, l'app MUST afficher une fenêtre « Quoi de neuf » si cette version, ou une version manquée depuis, a des nouveautés annoncées.
- **FR-002**: La fenêtre MUST lister les nouveautés de chaque version plus récente que la dernière vue, jusqu'à la version installée, la plus récente en premier, avec le numéro de chaque version.
- **FR-003**: Fermer la fenêtre (« C'est noté », ou le geste de fermeture du système) MUST enregistrer la version installée comme vue ; la fenêtre MUST ne plus s'afficher pour elle.
- **FR-004**: Après une installation neuve, l'app MUST enregistrer la version installée comme vue sans rien afficher.
- **FR-005**: Sans version vue enregistrée mais avec des traces d'usage passé sur le téléphone (compte connecté, listes gardées ou changements en attente), l'app MUST traiter le lancement comme une mise à jour depuis une version inconnue et afficher les nouveautés de la version installée seulement.
- **FR-006**: Les nouveautés MUST être embarquées dans l'app (aucun réseau nécessaire) et exister en français et en anglais.
- **FR-007**: Une version sans nouveautés annoncées MUST être enregistrée comme vue sans fenêtre.
- **FR-008**: La fenêtre MUST s'afficher par-dessus l'écran ouvert, une seule fenêtre à la fois avec celle de la 021, « Quoi de neuf » en premier.
- **FR-009**: Une version installée plus ancienne que la dernière vue MUST ne rien afficher et ne pas changer la dernière version vue.
- **FR-010**: La dernière version vue MUST être gardée à la déconnexion (réglage du téléphone, pas du compte).
- **FR-011**: « Mon compte » MUST proposer une entrée « Nouveautés » qui ouvre un écran listant les nouveautés de chaque version jusqu'à la version installée, la plus récente en premier, sans réseau.

### Key Entities

- **Nouveautés d'une version** : numéro de version, et une courte liste de points (une phrase chacun), en français et en anglais. Écrites à chaque version qui apporte quelque chose de visible.
- **Dernière version vue** : numéro de la version dont la personne a vu (ou n'avait pas à voir) les nouveautés, gardé sur le téléphone.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Après une mise à jour qui apporte des nouveautés, 100 % des premiers lancements affichent la fenêtre, et 0 % des lancements suivants.
- **SC-002**: Une installation neuve n'affiche jamais la fenêtre.
- **SC-003**: Lire et fermer la fenêtre prend moins de 30 secondes : au plus 5 points par version, une phrase chacun.
- **SC-004**: La fenêtre s'affiche hors ligne comme en ligne, dans les 2 secondes qui suivent l'ouverture.

## Assumptions

- Première version concernée : **1.1.1** (la même que la 021). Ses nouveautés, à valider : le mode surprise (« Ne pas voir les cadeaux réservés » dans l'onglet Partage, feature 020) ; la proposition de mise à jour (021) ; la gestion du partage dans l'app si elle n'a pas encore été annoncée (017). Le texte final se décide à la publication.
- Les nouveautés sont rédigées au moment de préparer chaque version ; une version sans changement visible n'en a pas.
- Le site n'est pas concerné.
- La suite e2e peut vérifier la fenêtre en simulant une version vue plus ancienne ; la vraie mise à jour depuis un store se vérifie à la main (quickstart).
