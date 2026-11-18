# Feature Specification: Montée du cadre technique du site pour une vulnérabilité connue

**Feature Branch**: `027-next-security-upgrade`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "WISH-31" — ticket Plane « Monter Next.js en 16.4.6 (vulnérabilité modérée, cache de 'use cache') ».

## Contexte

Constat du 2026-11-18 : au lancement du site en développement, le cadre technique signale que sa version est touchée par une vulnérabilité connue, et l'audit des dépendances de production le confirme.

- Version du site : 16.4.2, épinglée.
- Versions touchées : 16.2.0 à 16.4.4. Sévérité : modérée.
- Deux avis publiés : GHSA-mfr8-8qww-v76h (fuite d'informations entre « root params » quand une fonction mise en cache est appelée par l'ancienne fonction de cache) et GHSA-vc7v-qv4w-wrv8 (fuite de cache entre valeurs de « root params » dans des fonctions mises en cache imbriquées).
- Version corrigée : 16.4.6.

La version 16.4.5 corrige en fait sept avis de sévérité modérée, dont les deux signalés par l'audit (détail et exposition du site dans `research.md`, décision R1). Exposition réelle : nulle pour les deux avis du ticket. Le site n'utilise ni la mise en cache de fonctions ni l'ancienne fonction de cache (vérifié le 2026-11-18 : aucune occurrence dans `app/`, `src/`, `components/` ni dans la configuration). Exposition faible pour un troisième : le site relaie les réponses du service de mesure d'audience, mais il en reconstruit les en-têtes. La montée reste faite : l'avertissement gêne, l'audit des dépendances doit redevenir propre, et une future évolution du cache (déjà envisagée par la feature 015) ne doit pas réintroduire la faille.

Gêne annexe : au premier lancement en développement, le serveur s'arrête pour afficher l'avertissement et il faut le relancer.

Les utilisateurs de cette feature sont les personnes qui développent et exploitent le site. Les visiteurs ne doivent voir aucune différence.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Le site tourne sur une version sans vulnérabilité connue (Priority: P1)

La personne qui maintient le site monte le cadre technique (et l'outil de lint qui lui est aligné) à la version corrigée. L'audit des dépendances de production ne signale plus les deux avis, le serveur de développement démarre du premier coup sans avertissement de sécurité, et tous les contrôles du dépôt (lint, types, tests, construction de production, image Docker) passent comme avant.

**Why this priority**: C'est tout l'objet du ticket ; sans elle la feature n'apporte rien.

**Independent Test**: Lancer l'audit des dépendances de production : aucun avis sur le cadre technique. Lancer le serveur de développement : il démarre sans s'arrêter ni afficher d'avertissement de sécurité. Lancer lint, types, tests et construction : tous verts.

**Acceptance Scenarios**:

1. **Given** le dépôt après la montée, **When** on lance l'audit des dépendances de production, **Then** ni GHSA-mfr8-8qww-v76h ni GHSA-vc7v-qv4w-wrv8 n'apparaissent.
2. **Given** le dépôt après la montée, **When** on lance le serveur de développement pour la première fois, **Then** il démarre sans s'arrêter et sans avertissement de vulnérabilité.
3. **Given** le dépôt après la montée, **When** on lance lint, vérification des types, tests et construction de production, **Then** tous réussissent sans nouvelle erreur ni nouvel avertissement de dépréciation non traité.
4. **Given** le fichier de verrouillage des dépendances après la montée, **When** la CI l'installe avec la même version du gestionnaire de paquets qu'elle et que l'image Docker, **Then** l'installation réussit sans modifier le fichier.

---

### User Story 2 - Le site en production se comporte comme avant (Priority: P1)

L'image Docker se construit avec la nouvelle version, démarre, et les parcours principaux du site restent identiques : lire une liste publique sans compte, se connecter, créer une liste et une idée, réserver une idée, changer de langue. L'API de l'app mobile répond comme avant.

**Why this priority**: Une montée de version ne vaut que si elle ne casse rien ; la prod se déploie à chaque merge sur `main`.

**Independent Test**: Construire l'image, la lancer sur la base de démo, dérouler les parcours du `quickstart.md` de la feature, et appeler quelques routes de l'API avec une clé de démo.

**Acceptance Scenarios**:

1. **Given** l'image construite avec la nouvelle version, **When** on la démarre sur un volume de données existant, **Then** elle répond sur son port, les données sont lues et la migration éventuelle de la base se passe comme avant.
2. **Given** le site lancé sur la base de démo, **When** un visiteur sans compte ouvre une liste publique et réserve une idée, **Then** la page s'affiche avec le même contenu et la même apparence qu'avant, et la réservation est enregistrée.
3. **Given** le site lancé, **When** une personne se connecte, crée une liste et une idée, puis change de langue, **Then** tout fonctionne comme avant, en français et en anglais, avec la politique de sécurité du contenu toujours appliquée.
4. **Given** le site lancé, **When** l'app mobile (ou un appel direct) utilise l'API, **Then** les réponses gardent le même format et les mêmes codes.

---

### Edge Cases

- La version corrigée change un comportement ou déprécie une API utilisée par le site : les notes de version et la documentation fournie avec le paquet sont lues avant la montée ; tout changement nécessaire est fait dans cette feature, ou la feature s'arrête et le signale si le changement dépasse une simple adaptation.
- Une dépendance de développement alignée sur le cadre technique (configuration de lint) n'existe pas encore en 16.4.6 : elle prend la version disponible la plus proche compatible, et l'écart est noté.
- La mise à jour du fichier de verrouillage avec une version locale du gestionnaire de paquets différente de celle de la CI le rendrait incompatible : il est régénéré avec la même version que la CI et l'image Docker.
- Le fichier de déclaration de types généré par le serveur de développement change à chaque lancement : il n'entre pas dans la feature.
- D'autres vulnérabilités sont signalées par l'audit, sans lien avec le cadre technique : elles sont listées dans le compte rendu de la feature mais ne sont pas traitées ici.
- L'app mobile ne dépend pas du cadre technique du site : elle n'est pas modifiée.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le site DOIT utiliser une version du cadre technique égale ou supérieure à 16.4.6, épinglée exactement comme aujourd'hui (pas de plage de versions).
- **FR-002**: Les paquets compagnons du cadre technique épinglés à sa version (chargement des variables d'environnement, configuration de lint) DOIVENT être montés à la même version quand elle existe.
- **FR-003**: L'audit des dépendances de production NE DOIT PLUS signaler GHSA-mfr8-8qww-v76h ni GHSA-vc7v-qv4w-wrv8.
- **FR-004**: Le fichier de verrouillage DOIT s'installer à l'identique avec la version du gestionnaire de paquets utilisée par la CI et l'image Docker.
- **FR-005**: Lint, vérification des types, tests du site, tests de l'app mobile et construction de production DOIVENT réussir après la montée.
- **FR-006**: L'image Docker DOIT se construire et démarrer, et le démarrage de production du dépôt DOIT rester le même que celui de l'image (acquis de la feature 015).
- **FR-007**: Les pages, les actions, les redirections des anciennes adresses, la politique de sécurité du contenu et l'API DOIVENT se comporter comme avant pour les visiteurs, les membres et l'app mobile.
- **FR-008**: Les notes de version entre 16.4.2 et 16.4.6 DOIVENT être relues, et chaque changement qui touche le site DOIT être noté dans la recherche de la feature avec la décision prise.
- **FR-009**: Le compte rendu de la feature DOIT indiquer que le site n'utilise pas la mise en cache de fonctions (donc pas d'exposition réelle), pour qu'une future évolution du cache sache qu'elle part d'une version corrigée.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 avis de sécurité sur le cadre technique dans l'audit des dépendances de production.
- **SC-002**: Le serveur de développement démarre du premier coup, sans arrêt ni avertissement de vulnérabilité, sur 3 lancements consécutifs.
- **SC-003**: 100 % des contrôles du dépôt (lint, types, tests du site et de l'app, construction, image Docker) sont verts, en local et en CI.
- **SC-004**: Tous les parcours du `quickstart.md` de la feature donnent le même résultat qu'avant la montée, sur la base de démo.
- **SC-005**: Aucune différence visible signalée par les visiteurs après le déploiement en production.

## Assumptions

- Le site n'utilise pas la mise en cache de fonctions (vérifié le 2026-11-18), donc la faille n'est pas exploitable aujourd'hui ; la montée est préventive et sans urgence, priorité moyenne comme le ticket.
- La montée se limite au cadre technique et à sa configuration de lint alignée ; React et les autres dépendances ne changent que si la nouvelle version l'exige.
- La version 16.4.6 est un correctif de la même branche (16.4.x) : on n'attend pas de changement cassant, seulement à confirmer par les notes de version.
- La feature se livre avec la prochaine version du site, sans attendre l'app mobile, qui n'est pas touchée. Elle part de `staging` et ne dépend pas de la feature 026.
- Le site n'a pas de tests de bout en bout : les parcours se vérifient à la main sur la base de démo (principe IV).
