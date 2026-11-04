# Feature Specification: Code et commentaires du code en anglais

**Feature Branch**: `014-english-code-comments`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Traduis tous les commentaires de code qui sont en fr en anglais. De la même façon le code ne doit jamais être en français. Il faut mettre à jour la doc et la doc des agents à ce sujet"

## Contexte

Les messages de commit sont en anglais depuis le 2026-11-01, et les identifiants du code le sont déjà par convention. Les commentaires, eux, sont restés majoritairement en français : la règle « Langue du code » du guide des agents autorise encore « les commentaires en français ou en anglais », et le contrôle i18n de la revue automatique dit explicitement de ne pas signaler les commentaires en français. Un premier relevé compte environ 1 300 lignes de commentaires en français dans quelque 380 fichiers (site, domaine, serveur, app mobile, tests, parcours e2e, scripts), des descriptions de tests en français dans 73 fichiers, quelques messages techniques (journaux, erreurs internes) en français, et plusieurs segments d'URL du site en français (`/listes`, `/compte`, `/inscription`…).

Cette tâche aligne le dépôt sur une règle unique : tout ce qui est du code (identifiants, commentaires, messages techniques destinés aux développeurs) est en anglais. Les textes lus par les utilisateurs du produit restent traduits en français et en anglais par les fichiers de traduction, comme aujourd'hui. La documentation du projet reste en français ; elle énonce la nouvelle règle.

Les « utilisateurs » de cette tâche sont les personnes et les agents qui lisent et modifient le code.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Le guide et la revue énoncent la règle « code en anglais » (Priority: P1)

Une personne ou un agent qui ouvre le guide des agents, ou la documentation du projet, lit sans ambiguïté que le code (identifiants, commentaires, messages techniques) s'écrit en anglais, et ce qui reste en français (textes visibles via les traductions, documentation, specs). La revue automatique des features signale désormais un commentaire ou un identifiant en français au lieu de l'accepter.

**Why this priority**: Sans la règle écrite, chaque nouvelle feature réintroduit des commentaires en français et la traduction de l'existant est à refaire. C'est aussi la tranche la plus petite et elle a de la valeur seule.

**Independent Test**: Relire le guide des agents, la documentation de contribution et la consigne de la revue automatique : la règle y est énoncée de la même façon, et plus aucune phrase n'autorise les commentaires en français. Lancer la revue sur un diff de test qui ajoute un commentaire en français : il est signalé.

**Acceptance Scenarios**:

1. **Given** le guide des agents, **When** on lit la convention sur la langue du code, **Then** elle dit que les identifiants, les commentaires et les messages techniques sont en anglais, et liste ce qui reste en français.
2. **Given** la consigne du contrôle i18n de la revue automatique, **When** on la lit, **Then** elle ne dit plus d'accepter les commentaires en français, et la vérification de la langue figure dans le contrôle des conventions.
3. **Given** un diff qui ajoute un commentaire en français, **When** la revue automatique tourne, **Then** elle le signale comme écart aux conventions.

---

### User Story 2 - Les commentaires existants sont en anglais (Priority: P2)

Une personne ou un agent qui lit n'importe quel fichier de code du dépôt (site, domaine, serveur, app mobile, tests, parcours e2e, scripts, configuration) trouve des commentaires en anglais, avec le même sens qu'avant, sans que le comportement du code ait changé.

**Why this priority**: C'est le gros du travail demandé. Il dépend de la règle (US1) pour ne pas se défaire aussitôt.

**Independent Test**: Une recherche de commentaires contenant du français dans les fichiers de code versionnés (hors fichiers générés) ne remonte plus rien ; lint, types, tests du site et de l'app mobile passent ; le build passe ; le diff ne touche que des commentaires.

**Acceptance Scenarios**:

1. **Given** un fichier de code versionné qui contenait des commentaires en français, **When** la tâche est faite, **Then** ces commentaires sont en anglais et disent la même chose.
2. **Given** le dépôt après traduction, **When** on lance lint, types, tests (site et app mobile) et build, **Then** tout passe comme avant.
3. **Given** un commentaire qui cite un texte visible en français (ex. un libellé « J'offre »), **When** il est traduit, **Then** la citation du texte produit reste telle quelle, entre guillemets, et seul le commentaire autour est en anglais.

---

### User Story 3 - Le reste du code n'a plus de français (Priority: P3)

Une personne qui lit le code ne rencontre plus de français dans ce qui n'est pas un texte du produit : descriptions de tests, messages de journaux et d'erreurs internes, sorties des scripts d'exploitation, identifiants. Les descriptions des tests (`test("une liste dont elle est la seule membre disparaît…")`, 73 fichiers) sont traduites elles aussi (décision du 2026-11-03).

**Why this priority**: Moins volumineux que les commentaires mais nécessaire pour que la règle « le code n'est jamais en français » soit vraie partout.

**Independent Test**: Une recherche de chaînes en français dans le code, hors fichiers de traduction, fichiers générés et textes du produit cités, ne remonte plus que les exceptions listées dans la spec.

**Acceptance Scenarios**:

1. **Given** un message de journal, une erreur interne ou une sortie de script en français, **When** la tâche est faite, **Then** il est en anglais.
2. **Given** une description de test en français, **When** la tâche est faite, **Then** elle est en anglais et énonce la même règle ; la valeur attendue d'un texte du produit reste en français.
3. **Given** un identifiant (variable, fonction, type, `testID`, nom de fichier de code) en français, **When** la tâche est faite, **Then** il est renommé en anglais, sans changer le comportement.
4. **Given** les segments d'URL du site en français (`/listes`, `/compte`, `/inscription`…) et les dossiers de pages qui les portent, **When** la tâche est faite, **Then** ils restent inchangés : ce sont des adresses publiques (liens partagés, e-mails envoyés, liens profonds de l'app). Le guide les liste comme exception temporaire, et leur renommage fait l'objet d'une feature à part, notée au backlog (décision du 2026-11-03).

---

### Edge Cases

- Un commentaire cite un libellé, une erreur ou une clé de traduction en français : la citation reste exacte, seul le texte du commentaire est traduit.
- Un commentaire désigne un terme du lexique produit (« idée », « qui », « J'offre ») : le terme anglais correspondant est celui des fichiers de traduction anglais (ex. « idea », « for whom »), pour garder un vocabulaire unique.
- Un commentaire est devenu faux ou obsolète : il est traduit tel quel ; le corriger sort du périmètre, sauf s'il contredit manifestement le code (dans ce cas, le signaler dans le rapport de la tâche).
- Fichiers générés ou installés par des outils (liste « Fichiers générés » du guide des agents, migrations SQL déjà appliquées) : non modifiés ; un commentaire en français dans une migration déjà versionnée reste tel quel pour ne pas changer son empreinte.
- Fichiers de traduction, textes juridiques, contenus des pages et données de démo : ce sont des textes du produit, pas du code ; ils ne changent pas.
- Documentation (README, guide des agents, constitution, specs, `docs/`) : reste en français ; seule la règle y est mise à jour.
- Un test vérifie un texte français affiché : la valeur attendue reste en français.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le guide des agents MUST énoncer que les identifiants, les commentaires et les messages techniques (journaux, erreurs internes, sorties de scripts) sont en anglais, et lister ce qui reste en français : textes du produit via les fichiers de traduction, documentation, specs.
- **FR-002**: La documentation de contribution du projet (README) MUST reprendre la même règle, ou renvoyer au guide des agents, sans la contredire.
- **FR-003**: La consigne de la revue automatique des features MUST ne plus accepter les commentaires en français et MUST vérifier la langue du code dans son contrôle des conventions.
- **FR-004**: Aucune autre consigne d'agent du projet (templates propres au projet, skills du projet) MUST autoriser du français dans le code.
- **FR-005**: Tous les commentaires en français des fichiers de code versionnés, hors fichiers générés ou installés et hors migrations déjà versionnées, MUST être traduits en anglais en gardant leur sens.
- **FR-006**: Les messages techniques en français (journaux, erreurs internes non montrées à l'utilisateur, sorties des scripts) MUST être traduits en anglais.
- **FR-006b**: Les descriptions des tests (site, app mobile, parcours e2e) MUST être traduites en anglais en gardant la règle qu'elles énoncent.
- **FR-007**: Les identifiants en français MUST être renommés en anglais, sans changer le comportement observable. Les segments d'URL publics et les dossiers de pages qui les portent sont exclus de cette feature ; le guide des agents MUST les mentionner comme exception, à traiter dans une feature dédiée.
- **FR-008**: Les textes du produit (fichiers de traduction, valeurs attendues des tests sur ces textes, contenus juridiques, données de démo) MUST rester inchangés.
- **FR-009**: Le travail MUST ne changer aucun comportement : lint, types, tests du site, tests de l'app mobile et build passent avant et après, et le diff de traduction des commentaires ne contient que des commentaires.
- **FR-010**: Le vocabulaire anglais employé pour les notions du produit MUST être celui des fichiers de traduction anglais.

### Key Entities

- **Commentaire de code** : texte destiné au lecteur du code, dans un fichier de code versionné ; doit être en anglais.
- **Texte du produit** : texte lu par l'utilisateur de l'app ou du site, géré par les fichiers de traduction ; reste en français et en anglais.
- **Fichier généré ou installé** : fichier écrit par un outil (liste du guide des agents) ; hors périmètre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 ligne de commentaire en français dans les fichiers de code versionnés hors exceptions listées (contre environ 1 300 au relevé du 2026-11-03).
- **SC-002**: 0 phrase du guide des agents, de la documentation ou des consignes de revue n'autorise du français dans le code.
- **SC-003**: 100 % des contrôles existants (lint, types, tests site et app mobile, build) passent après la tâche, sans test modifié autrement que dans ses commentaires ou descriptions ; 0 description de test en français.
- **SC-004**: Un commentaire en français ajouté dans un diff de test est signalé par la revue automatique dès sa première exécution.
- **SC-005**: 0 changement visible pour les utilisateurs du site et de l'app (textes, adresses, comportements), vérifié sur la base de démo.

## Assumptions

- La documentation (README, guide des agents, constitution, specs, `docs/`) reste en français ; seule la règle sur la langue du code change.
- Les fichiers générés ou installés par des outils (liste du guide des agents) ne sont pas traduits ; les migrations SQL déjà versionnées non plus.
- La traduction se fait en un ou plusieurs commits `chore:` séparés des changements de règle, pour que le diff reste relisible.
- La règle est appliquée par la revue automatique et le guide ; un contrôle automatique bloquant (lint) n'est pas exigé par cette spec, le plan peut en proposer un.
- L'entrée « commentaires du code en anglais » du backlog personnel est couverte par cette feature.
- Le renommage des URL publiques en anglais (avec redirections, liens profonds, e-mails, nouvelle version de l'app) est une feature distincte, ajoutée au backlog.
