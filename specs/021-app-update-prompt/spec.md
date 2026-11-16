# Feature Specification: Prévenir qu'une mise à jour de l'app est disponible

**Feature Branch**: `021-app-update-prompt`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "WISH-19 : prévenir la personne qui utilise l'app mobile (iOS et Android) qu'une nouvelle version est disponible sur le store, et l'inviter à la mettre à jour. Mise à jour conseillée seulement (pas d'obligation, pas de version minimale imposée par le serveur pour l'instant). Android : mise à jour in-app de Google Play en mode flexible (téléchargement en arrière-plan, puis redémarrage proposé). iOS : pas de mise à jour in-app chez Apple ; l'app compare sa version avec celle de l'App Store et propose d'ouvrir la fiche de l'app."

## Contexte

L'app est publiée sur l'App Store (1.0.0 en production) et sur Google Play (test fermé). Aujourd'hui, rien ne dit à une personne qu'une version plus récente existe : elle garde l'ancienne tant que son téléphone ne la met pas à jour seul. Or une nouvelle version apporte des choses qu'une ancienne ne sait pas faire (par exemple « Voir les réservations » du mode surprise, feature 020).

Les deux stores ne fonctionnent pas de la même façon :

| | Android (Google Play) | iOS (App Store) |
|---|---|---|
| Savoir qu'une version plus récente existe | Google Play le dit à l'app | l'app compare sa version avec celle publiée sur l'App Store |
| Mettre à jour | depuis l'app : téléchargement en arrière-plan pendant que la personne continue, puis redémarrage pour installer | pas possible depuis l'app : elle ouvre la fiche de l'app dans l'App Store |

Cette feature ne fait que **conseiller** la mise à jour. La personne peut toujours continuer avec sa version.

## Clarifications

### Session 2026-11-16

- Q: Après « Plus tard » (ou un refus sur Android), quand le message revient-il ? → A: 7 jours plus tard, ou plus tôt si une version encore plus récente est publiée.
- Q: Où s'affiche le message ? → A: dans une fenêtre (boîte de dialogue) au démarrage, quel que soit l'écran ouvert ; la personne la ferme d'un geste et continue.
- Q (plan) : sur Android, la bibliothèque retenue installe la mise à jour dès la fin du téléchargement, sans attendre un « Redémarrer ». La garder telle quelle, la patcher, ou écrire un module maison ? → A: la garder telle quelle ; sur Android, une fois téléchargée, la mise à jour s'installe d'elle-même (écran d'installation de Google, puis l'app redémarre). Pas de fenêtre « La mise à jour est prête ».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Être prévenu et mettre à jour sur iPhone (Priority: P1)

Une personne ouvre l'app sur son iPhone alors qu'une version plus récente est publiée sur l'App Store. L'app lui indique, dans une fenêtre qu'elle peut fermer, qu'une nouvelle version est disponible, avec un bouton « Mettre à jour » qui ouvre la fiche de l'app dans l'App Store, et « Plus tard ».

**Why this priority**: l'App Store est le store en production ; c'est là que se trouvent les personnes qui utilisent l'app aujourd'hui.

**Independent Test**: installer sur un iPhone une version plus ancienne que celle de l'App Store, ouvrir l'app : le message apparaît ; « Mettre à jour » ouvre la fiche de l'app ; « Plus tard » le ferme.

**Acceptance Scenarios**:

1. **Given** une version plus récente publiée sur l'App Store, **When** la personne ouvre l'app, **Then** l'app affiche une fenêtre « Une nouvelle version de l'app est disponible. » avec « Mettre à jour » et « Plus tard », par-dessus l'écran ouvert (y compris une liste ouverte par un lien).
2. **Given** ce message, **When** la personne appuie sur « Mettre à jour », **Then** la fiche de l'app s'ouvre dans l'App Store.
3. **Given** ce message, **When** la personne appuie sur « Plus tard », **Then** la fenêtre se ferme et ne revient pas avant 7 jours, sauf si une version encore plus récente est publiée entre-temps.
4. **Given** la version installée est la plus récente (ou plus récente que celle de l'App Store, par exemple une version de test), **When** la personne ouvre l'app, **Then** aucun message n'apparaît.

---

### User Story 2 - Être prévenu et mettre à jour sur Android (Priority: P1)

Une personne ouvre l'app sur Android alors qu'une version plus récente est disponible sur Google Play. L'app lui propose la mise à jour ; si elle accepte, la nouvelle version se télécharge pendant qu'elle continue d'utiliser l'app. Une fois le téléchargement fini, Google installe la nouvelle version et l'app redémarre.

**Why this priority**: même besoin que sur iPhone ; Google Play permet en plus d'installer sans quitter l'app.

**Independent Test**: installer une version plus ancienne que celle disponible sur Google Play (piste de test), ouvrir l'app : la proposition de mise à jour apparaît ; accepter ; continuer à utiliser l'app ; quand le téléchargement est fini, la nouvelle version s'installe et l'app redémarre.

**Acceptance Scenarios**:

1. **Given** une version plus récente disponible sur Google Play, **When** la personne ouvre l'app, **Then** l'app lui propose de mettre à jour, et elle peut refuser.
2. **Given** la personne accepte, **When** le téléchargement se fait, **Then** elle peut continuer à utiliser l'app normalement pendant ce temps.
3. **Given** le téléchargement est fini, **When** la personne est dans l'app, **Then** l'écran d'installation de Google s'affiche, la nouvelle version s'installe et l'app redémarre, sans autre action.
4. **Given** la personne refuse la proposition, **Then** l'app suit la même règle que « Plus tard » sur iPhone (User Story 1, scénario 3).
5. **Given** le téléchargement a fini alors que l'app était fermée, **When** la personne la rouvre, **Then** la mise à jour s'installe à ce moment-là.

---

### Edge Cases

- **Hors ligne, ou store injoignable** : aucune vérification, aucun message ; l'app fonctionne comme d'habitude, sans message d'erreur.
- **Version installée plus récente que celle du store** (version de test, build de développement) : aucun message.
- **App installée hors store** (build de développement, test interne) : aucun message ; la vérification échoue en silence.
- **Changements en attente d'envoi** (file hors ligne de l'app) : le redémarrage pour installer ne les perd pas ; ils sont gardés sur le téléphone et envoyés après.
- **Personne non connectée** (écran de connexion, liste vue sans compte) : le message s'affiche aussi ; la mise à jour ne dépend pas du compte.
- **Ouvertures répétées** : l'app ne vérifie pas le store à chaque ouverture ; au plus une vérification par jour, et à chaque démarrage complet de l'app.
- **App ouverte par un lien** (liste, invitation, confirmation d'adresse) : la fenêtre s'affiche par-dessus l'écran ouvert ; la fermer laisse la personne exactement où le lien l'a menée.
- **Langue** : le message suit la langue de l'app (français ou anglais).
- **Versions déjà installées (1.0, 1.1)** : elles ne connaissent pas ce message ; il ne vaut qu'à partir de la version qui l'embarque.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L'app MUST vérifier, au démarrage et au plus une fois par jour quand elle revient au premier plan, si une version plus récente que la sienne est disponible sur le store de l'appareil.
- **FR-002**: Sur iOS, quand une version plus récente existe, l'app MUST afficher une fenêtre « Une nouvelle version de l'app est disponible. » avec « Mettre à jour », qui ouvre la fiche de l'app dans l'App Store, et « Plus tard », qui la ferme.
- **FR-003**: Sur Android, quand une version plus récente existe, l'app MUST proposer la mise à jour de Google Play en mode « en arrière-plan » : la personne peut refuser ; si elle accepte, elle continue d'utiliser l'app pendant le téléchargement.
- **FR-004**: Sur Android, quand le téléchargement est fini, la nouvelle version MUST s'installer sans autre action (écran d'installation de Google, puis redémarrage de l'app) ; si le téléchargement a fini app fermée, l'installation se fait à la prochaine ouverture. Si l'installation échoue, Google Play s'ouvre sur la fiche de l'app.
- **FR-005**: Après « Plus tard » (iOS) ou un refus de la proposition (Android), l'app MUST ne plus rien proposer pendant 7 jours, sauf si une version plus récente que celle refusée est publiée entre-temps.
- **FR-006**: La mise à jour MUST rester conseillée : chaque fenêtre se ferme d'un geste, rien ne bloque l'usage de l'app, et refuser n'a aucune autre conséquence.
- **FR-007**: Sans connexion, ou si le store ne répond pas, l'app MUST ne rien afficher et fonctionner normalement.
- **FR-008**: L'app MUST ne rien proposer quand sa version est égale ou plus récente que celle du store.
- **FR-009**: Les textes MUST exister en français et en anglais, et suivre la langue de l'app.
- **FR-010**: Les fenêtres MUST s'afficher au démarrage (ou au retour au premier plan, FR-001), par-dessus l'écran ouvert, quel qu'il soit ; une seule à la fois.
- **FR-011**: Installer la mise à jour MUST ne perdre ni la session ni les changements en attente d'envoi.

### Key Entities

- **Version disponible** : numéro de la dernière version publiée sur le store de l'appareil, comparé à la version installée.
- **Choix « Plus tard »** : gardé sur le téléphone, avec la version concernée et la date, pour appliquer FR-005.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur un téléphone dont la version est dépassée, le message apparaît dans les 5 secondes qui suivent l'ouverture de l'app, avec une connexion normale.
- **SC-002**: Sur iPhone, mettre à jour depuis le message demande une action dans l'app (« Mettre à jour »), puis l'installation dans l'App Store.
- **SC-003**: Sur Android, la personne peut utiliser l'app sans interruption pendant tout le téléchargement, puis la mise à jour s'installe sans autre action de sa part.
- **SC-004**: Hors ligne ou avec un store injoignable, l'app s'ouvre aussi vite qu'avant et n'affiche aucun message lié à la mise à jour.
- **SC-005**: Aucun message n'apparaît sur un téléphone à jour.

## Assumptions

- Mise à jour conseillée seulement. Une version minimale imposée par le serveur (mise à jour obligatoire) est hors périmètre : elle pourra venir dans une feature suivante.
- La première version qui embarque cette feature doit être publiée sur les deux stores ; les versions déjà installées ne préviendront de rien.
- Sur Google Play, la proposition de mise à jour et l'écran d'installation sont ceux de Google (leur apparence ne dépend pas de l'app) ; sur Android, l'app n'affiche aucune fenêtre à elle.
- Le parcours ne peut pas être joué par la suite e2e (il faut une vraie version publiée sur un store) : il se vérifie à la main, sur Android avec une piste de test de Google Play, sur iOS avec une version plus ancienne installée face à celle de l'App Store. Les règles (comparaison de versions, « Plus tard », fréquence) se vérifient par des tests de l'app.
- Le site n'est pas concerné.
