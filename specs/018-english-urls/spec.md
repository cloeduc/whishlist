# Feature Specification: Adresses du site en anglais

**Feature Branch**: `018-english-urls`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "URL du site en anglais, avec des redirections depuis les anciennes adresses et la mise à jour des liens profonds de l'app. dans son propre worktree"

## Contexte

Les adresses des pages du site sont en français : `/listes`, `/compte`, `/inscription`, `/connexion`, `/inviter`, `/reinitialiser`, `/confirmer-email`, `/mot-de-passe-oublie`, `/changer-mot-de-passe`, `/mentions-legales`, `/donnees-personnelles`, `/projet`, `/l/…/reserver`, ainsi que quelques paramètres (`onglet=partage`, `suite=`). La feature 014 a passé le code en anglais mais a laissé ces adresses de côté, parce qu'elles sont publiques : elles circulent dans les e-mails déjà envoyés, les liens partagés, les favoris, les moteurs de recherche, les fiches des stores, et les versions de l'app déjà installées les connaissent (feature 011). Le guide des agents les note comme une « exception temporaire ».

Cette feature donne au site des adresses en anglais, dans les deux langues (le français reste sans préfixe, l'anglais sous `/en`), sans casser une seule ancienne adresse : chacune mène, par une redirection permanente, à la page qui la remplace. L'app mobile reconnaît les nouvelles adresses, continue de reconnaître les anciennes, et ouvre le site sur les nouvelles.

**Périmètre** : le site (pages, liens qu'il produit, e-mails, plan du site), l'app mobile (liens qui l'ouvrent, liens qu'elle ouvre vers le site) et les références externes que le projet maîtrise (fiches des stores, documentation). Le texte des pages ne change pas.

### Nouvelles adresses

| Ancienne adresse | Nouvelle adresse |
|------------------|------------------|
| `/listes/new` | `/lists/new` |
| `/listes/<id>` | `/lists/<id>` |
| `/compte` | `/account` |
| `/compte/export` | `/account/export` |
| `/inscription` | `/register` |
| `/connexion` | `/login` |
| `/mot-de-passe-oublie` | `/forgot-password` |
| `/changer-mot-de-passe` | `/change-password` |
| `/reinitialiser/<jeton>` | `/reset-password/<jeton>` |
| `/confirmer-email/<jeton>` | `/confirm-email/<jeton>` |
| `/inviter/<jeton>` | `/invite/<jeton>` |
| `/l/<jeton>/reserver` | `/l/<jeton>/reserve` |
| `/mentions-legales` | `/legal-notice` |
| `/donnees-personnelles` | `/privacy` |
| `/projet` | `/about` |
| paramètre `onglet=` (`idees`, `partage`, `reglages`…) | `tab=` (`ideas`, `sharing`, `settings`…) |
| paramètre `suite=` | `next=` |
| paramètres de retour d'action : `lien=`, `envoi=echec`, `sansmail=1`, `compte=1` | `link=`, `mail=failed`, `nomail=1`, `own=1` |
| ancres `#contenu`, `#suivies`, `#cles`, `#donnees`, `#supprimer` | `#content`, `#following`, `#keys`, `#data`, `#delete` |

Une ancre (`#…`) n'est pas envoyée au serveur : une ancienne ancre ne se redirige pas, la page s'ouvre simplement en haut.

Restent tels quels : `/`, `/faq`, `/guide`, `/l/<jeton>`, `/l/<jeton>/types`, le préfixe `/en`, l'API (`/api/…`), les fichiers `/.well-known/…`, le paramètre d'erreur `e=` et les autres paramètres déjà en anglais (`next`, `typeId`, `itemId`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Le site a des adresses en anglais, et les anciennes y mènent (Priority: P1)

Une personne utilise le site comme aujourd'hui. Les pages qu'elle visite ont des adresses en anglais, en français comme en anglais : une liste est sous `/lists/<id>`, son compte sous `/account`, l'inscription sous `/register` (et `/en/register` en anglais). Les e-mails qu'elle reçoit (confirmation d'adresse, réinitialisation du mot de passe, invitation, compte déjà existant) contiennent les nouvelles adresses. Le lien de partage et le QR code d'une liste n'ont pas changé.

Une autre personne ouvre une ancienne adresse : un e-mail reçu la semaine dernière, un favori, un lien collé dans un message, une page trouvée dans un moteur de recherche. Elle arrive sur la bonne page, avec la nouvelle adresse dans la barre du navigateur, dans la même langue, et le lien fait la même chose qu'avant (le jeton est gardé, l'action a lieu, les paramètres suivent).

**Why this priority**: c'est la feature elle-même. Les deux moitiés ne se livrent pas séparément : changer les adresses sans rediriger les anciennes casserait les e-mails déjà envoyés et les liens partagés.

**Independent Test**: sur la base de démo, parcourir le site en français et en anglais (accueil, inscription, connexion, mot de passe oublié, une liste et ses onglets, compte, export, pages légales, page projet, réservation sur une liste publique) : chaque adresse est en anglais. Déclencher les e-mails en mode développement : leurs liens sont en anglais et marchent. Puis ouvrir chaque ancienne adresse de la table (avec et sans `/en`, avec un jeton valide, avec des paramètres) : la nouvelle page s'affiche, dans la même langue, et l'action du lien a lieu. Le site n'a pas de test e2e : ce parcours est décrit dans le `quickstart.md`, et la table des redirections a ses tests de domaine.

**Acceptance Scenarios**:

1. **Given** le site en français, **When** la personne navigue (menus, boutons, liens de pied de page, formulaires et leurs redirections après envoi), **Then** chaque page affichée a son adresse en anglais, sans préfixe de langue.
2. **Given** le site en anglais, **When** la personne navigue, **Then** chaque page affichée a son adresse en anglais sous `/en`.
3. **Given** un événement qui envoie un e-mail (inscription, mot de passe oublié, changement d'adresse, invitation, compte déjà existant), **When** l'e-mail part, **Then** ses liens utilisent les nouvelles adresses, dans la langue de l'e-mail.
4. **Given** une ancienne adresse de la table, **When** elle est ouverte, **Then** le navigateur est redirigé, de façon permanente, vers la nouvelle adresse, et la page qui s'affiche est la même qu'avant le changement.
5. **Given** une ancienne adresse sous `/en` (par exemple `/en/compte`), **When** elle est ouverte, **Then** la redirection mène à la nouvelle adresse sous `/en` (`/en/account`) et la page est en anglais.
6. **Given** une ancienne adresse avec un jeton (confirmation, réinitialisation, invitation), **When** elle est ouverte, **Then** la nouvelle adresse porte le même jeton, et le résultat est celui qu'aurait donné l'ancienne : adresse confirmée, formulaire du nouveau mot de passe, invitation proposée ; un jeton expiré ou inconnu donne le même message qu'avant.
7. **Given** une ancienne adresse avec des paramètres (`?onglet=partage`, `?suite=/inviter/<jeton>`, `?next=/listes/<id>`, `?e=<code>`), **When** elle est ouverte, **Then** la nouvelle adresse porte les paramètres équivalents (`?tab=sharing`, `?next=/invite/<jeton>`, `?next=/lists/<id>`, `?e=<code>`) et la page se comporte de la même façon.
8. **Given** une page qui renvoie vers une autre après une action (`next` après la connexion, suite d'une confirmation d'adresse), **When** la valeur de renvoi est une ancienne adresse (gardée dans un ancien e-mail ou une page ouverte avant le changement), **Then** la personne arrive quand même sur la bonne page.
9. **Given** le plan du site et les adresses canoniques et alternatives par langue, **When** un moteur de recherche les lit, **Then** ils ne citent que les nouvelles adresses.
10. **Given** un lien de partage public ou un QR code d'une liste, créé avant ou après le changement, **When** il est ouvert, **Then** il mène à la liste sans redirection (son adresse ne change pas).

---

### User Story 2 - L'app ouvre les nouveaux liens, et toujours les anciens (Priority: P2)

Une personne a l'app sur son téléphone. Elle touche un lien du service : un e-mail reçu après le changement (nouvelle adresse) ou avant (ancienne adresse), une invitation, un lien de réservation. Dans les deux cas l'app s'ouvre sur le bon écran et fait l'action, comme avec la feature 011. Quand l'app l'envoie sur le site (« Gérer le partage sur le site », mentions légales, données personnelles), le site s'ouvre directement à la nouvelle adresse.

Une personne qui garde une ancienne version de l'app n'est pas perdue : un lien qu'elle ne sait pas ouvrir s'ouvre sur le site, au bon endroit, et jamais sur un mauvais écran de l'app.

**Why this priority**: la nouvelle version de l'app passe par les stores, avec son propre délai de publication. Le site (US1) se livre seul ; les liens restent utilisables entre-temps, au pire dans le navigateur.

**Independent Test**: sur le simulateur, avec la nouvelle version de l'app et le serveur de la feature, ouvrir chaque lien que l'app gère, sous sa nouvelle et sous son ancienne adresse, avec et sans `/en` : l'app ouvre le bon écran et fait l'action. Toucher « Gérer le partage sur le site » et les liens des pages légales : le navigateur s'ouvre sur la nouvelle adresse, sans redirection. Les parcours Maestro de la feature 011 tournent avec les nouvelles adresses, et un parcours `018-us2` ouvre les anciennes.

**Acceptance Scenarios**:

1. **Given** la nouvelle version de l'app installée, **When** la personne ouvre un lien du service à sa nouvelle adresse (confirmation, réinitialisation, invitation, connexion, inscription, liste publique, réservation, catégories d'une liste publique), **Then** l'app ouvre le même écran qu'avec l'ancienne adresse et fait la même action.
2. **Given** la nouvelle version de l'app installée, **When** la personne ouvre un lien à son ancienne adresse, **Then** l'app l'ouvre comme avant.
3. **Given** un lien de connexion ou d'inscription qui renvoie vers une invitation (`next=`), **When** il est ouvert dans l'app, sous l'ancienne ou la nouvelle forme, **Then** l'invitation reprend après la connexion, comme aujourd'hui.
4. **Given** l'app, **When** elle ouvre une page du site (gestion du partage d'une liste, mentions légales, données personnelles, ou toute autre page du site), **Then** elle utilise la nouvelle adresse, dans la langue de l'app.
5. **Given** une version de l'app antérieure à cette feature, **When** la personne ouvre un lien à une nouvelle adresse, **Then** soit l'app ouvre le bon écran, soit le site s'ouvre sur la bonne page ; l'app ne s'ouvre jamais sur un écran sans rapport (l'accueil à la place de l'action du lien).
6. **Given** une version de l'app antérieure à cette feature, **When** la personne ouvre un lien à une ancienne adresse, **Then** l'app l'ouvre comme aujourd'hui.

---

### Edge Cases

- **Ancienne adresse d'une ressource disparue** (`/listes/<id>` d'une liste supprimée, `/inviter/<jeton>` révoqué) : la redirection a lieu, puis la nouvelle page affiche le même message qu'avant (liste introuvable, lien plus valide).
- **Barre finale** (`/compte/`, `/listes/<id>/`) : même comportement qu'aujourd'hui pour la forme correspondante, sans boucle de redirection.
- **Préfixe `/fr` ou paramètre `?lang=`** sur une ancienne adresse : une seule redirection mène à la nouvelle adresse canonique dans la bonne langue, pas une chaîne de plusieurs.
- **Formulaire envoyé depuis une page restée ouverte** avant la mise en production : l'envoi aboutit, ou affiche l'erreur habituelle ; il ne se perd pas en silence.
- **Valeurs de renvoi** : `next` (et l'ancien `suite`) n'accepte toujours qu'une adresse interne au site ; une ancienne adresse y est traduite, une adresse externe reste refusée.
- **Collision** : aucune nouvelle adresse ne réutilise un segment qui avait un autre sens avant.
- **Mesure d'audience** : les pages vues sont comptées sous leur nouvelle adresse ; l'historique garde les anciennes. Pas de fusion des statistiques.
- **Fiches des stores et documentation** : les adresses de politique de confidentialité et de mentions légales déclarées aux stores, et celles citées dans le README et la documentation, sont remplacées par les nouvelles ; les anciennes continuent de répondre par une redirection.
- **Durée** : les redirections restent en place sans date de fin (des e-mails, des favoris et des versions anciennes de l'app circulent indéfiniment).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le site MUST servir chaque page sous la nouvelle adresse de la table « Nouvelles adresses », en français sans préfixe et en anglais sous `/en`.
- **FR-002**: Tout lien que le site produit MUST utiliser les nouvelles adresses : navigation, formulaires et leurs redirections, e-mails, liens rendus aux clients (invitation, confirmation…), plan du site, adresses canoniques et alternatives par langue.
- **FR-003**: Chaque ancienne adresse de la table MUST rediriger de façon permanente vers sa nouvelle adresse, dans la même langue, en gardant les segments variables (jeton, identifiant de liste) et en traduisant les paramètres (`onglet` et ses valeurs, `suite`) ; les autres paramètres sont gardés tels quels.
- **FR-004**: Une ancienne adresse MUST atteindre sa page canonique en une seule redirection, y compris avec `/fr` ou `?lang=`.
- **FR-005**: Les valeurs de renvoi (`next`, ancien `suite`) qui désignent une ancienne adresse MUST mener à la page correspondante ; elles restent limitées aux adresses internes au site.
- **FR-006**: Les redirections MUST rester actives sans date de fin.
- **FR-007**: Les adresses qui ne changent pas (`/`, `/faq`, `/guide`, `/l/<jeton>`, `/l/<jeton>/types`, API, fichiers `.well-known`) MUST répondre sans redirection.
- **FR-008**: L'app MUST ouvrir sur le bon écran tout lien qu'elle gère aujourd'hui, sous sa nouvelle comme sous son ancienne adresse, avec ou sans `/en`.
- **FR-009**: Les fichiers d'association du domaine et la configuration de l'app MUST déclarer les nouvelles adresses en plus des anciennes.
- **FR-010**: Une version de l'app antérieure à cette feature MUST NOT ouvrir un lien de nouvelle adresse sur un écran qui ne correspond pas à son action ; à défaut du bon écran, le lien ouvre le site.
- **FR-011**: Les liens que l'app ouvre vers le site MUST utiliser les nouvelles adresses.
- **FR-012**: Les références externes que le projet maîtrise (fiches des stores, README, guide des agents, documentation de déploiement) MUST citer les nouvelles adresses ; le guide des agents ne mentionne plus l'exception des segments d'URL en français.
- **FR-013**: Le contenu et le comportement des pages MUST rester les mêmes ; seule leur adresse change.

### Key Entities

- **Table des adresses** : pour chaque page renommée, l'ancienne et la nouvelle adresse, avec leurs segments variables, et pour chaque paramètre renommé, l'ancien et le nouveau nom et ses valeurs. Une seule source sert aux redirections du site, à la traduction des valeurs de renvoi et aux liens que l'app reconnaît.
- **Lien géré par l'app** (feature 011) : adresse du site qui ouvre un écran de l'app ; il en existe désormais deux formes (ancienne et nouvelle) pour le même écran.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des pages du site parcourues dans le `quickstart.md`, dans les deux langues, affichent une adresse sans mot français.
- **SC-002**: 100 % des anciennes adresses de la table (avec et sans `/en`, avec jeton et paramètres) aboutissent à la bonne page, dans la bonne langue, en une seule redirection.
- **SC-003**: Un e-mail envoyé avant la mise en production (lien de confirmation, de réinitialisation ou d'invitation encore valide) fait la même action après.
- **SC-004**: Avec la nouvelle version de l'app, 100 % des liens qu'elle gère ouvrent le bon écran, sous l'ancienne comme sous la nouvelle adresse.
- **SC-005**: Avec une ancienne version de l'app, aucun lien du service n'ouvre un écran sans rapport avec son action.
- **SC-006**: Le plan du site et les adresses canoniques ne contiennent aucune ancienne adresse.

## Assumptions

- Les noms anglais de la table sont une proposition : `/register` et `/login` reprennent les noms des écrans de l'app ; `/about` remplace `/projet` ; `/legal-notice` et `/privacy` suivent l'usage courant. Ils peuvent changer avant le plan sans toucher au reste de la spec.
- `/l/<jeton>` reste court et neutre : c'est l'adresse la plus imprimée (QR codes) et elle n'est pas en français. Seul son sous-chemin `/reserver` change.
- Le français garde ses adresses sans préfixe, l'anglais sous `/en` : seuls les mots changent, pas le schéma des langues.
- Les anciennes versions de l'app restent en circulation longtemps. Le site est mis en production avant la nouvelle version de l'app, qui suit par les stores.
- Les captures du guide (`public/guide/`) ne montrent pas la barre d'adresse : elles ne sont refaites que si une adresse y apparaît.
- La mesure d'audience n'a pas à relier les anciennes et les nouvelles adresses.
- Les routes de l'API ne changent pas ; seules les adresses de site qu'elle renvoie (liens d'invitation, de confirmation) suivent la nouvelle table.
