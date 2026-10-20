# Contrat UI

Pages en français. Lire, filtrer, réserver et s'inscrire fonctionnent sans JavaScript. Les liens marchands s'ouvrent dans un nouvel onglet.

Aucune page ne liste les wishlists de quelqu'un d'autre. Les e-mails des membres ne sont pas affichés sur le lien de lecture.

## Accueil et comptes

### `GET /`

Sans session : inscription et connexion, aucune liste. Avec session : « mes wishlists » (celles dont le compte est membre) et le bouton créer.

### `POST /inscription`

Champs `email`, `password`, `displayName`. E-mail libre : compte créé, session ouverte, redirection vers `/`. E-mail pris : formulaire réaffiché, message explicite, pas de second compte.

### `POST /connexion`

Champs `email`, `password`. Échec : message générique, pas d'indice sur lequel des deux est faux. Succès : session, redirection vers `/`.

### `POST /deconnexion`

Efface la session. Redirige vers `/`.

## Listes du membre

### `POST /listes`

Session requise. Champs `title`, `importTemplate` (`0` ou `1`). Crée la wishlist, membership `owner`, et si `importTemplate=1` copie le modèle. Redirige vers la liste.

### `GET /listes/{id}`

Session + membership. Édition : idées, types, Qui, annulation, lien de lecture à copier, lien d'invitation à copier, régénérer l'invitation, retirer un membre (owner), quitter, supprimer (owner, ou dernier membre).

### `POST /listes/{id}/invitation`

Owner. Remplace `inviteToken`. L'ancien lien ne recrute plus.

### `GET /inviter/{token}`

Token courant : si session, ajoute le compte comme `member` et redirige vers la liste. Sans session : inscription ou connexion, puis ajout. Token inconnu : refus, personne n'est ajouté.

### `POST /listes/{id}/membres/{userId}/retirer`

Owner. Ne retire pas le dernier owner sans transmettre le rôle. Retirer l'owner est refusé : il quitte via l'action quitter, qui transmet le rôle s'il reste quelqu'un.

### `POST /listes/{id}/quitter`

S'il reste d'autres membres et que l'auteur est owner : le plus ancien devient owner, puis la ligne part. S'il est seul : refus, la suppression est l'autre action.

### `POST /listes/{id}/supprimer`

Owner. Efface la liste et son contenu. Le lien de lecture répond que la liste n'existe pas.

Les actions d'édition d'idée, de type et de Qui sont celles du contrat précédent (`POST` créer / modifier / supprimer), scopées à `listes/{id}`, réservées aux membres. Supprimer une idée réservée est refusé.

## Lecture publique

### `GET /l/{readToken}`

Sans session exigée. Idée, type, lien, prix, priorité, Qui. Idée réservée marquée, toujours listée. Query `vue` = id de vue de cette liste. Token inconnu : la liste n'existe pas, sans dire si elle a existé.

Liste importée : titre de vue « Toute la whishlist », boutons du modèle, texte sur les filtres, lien « Je réserve une idée ». La vue `maison` filtre le type `divers`.

### `GET /l/{readToken}/types`

Types de cette liste. Lecture seule sans membership. Un membre connecté peut ajouter et renommer.

### `GET /l/{readToken}/offrir`

Réservations de cette liste seulement. Zéro réservation : une phrase qui le dit.

### `GET /l/{readToken}/reserver` et `POST`

Mêmes champs que le formulaire du doc : `typeId` (vide = Blank), `itemId` obligatoire, `fromName`, `note`. Titre « Réserver un cadeau pour Alex et Sam » si la liste vient du modèle, sinon le titre de la liste.

Succès : redirection vers la page offrir de cette liste. Déjà réservée, idée hors liste, ou idée hors type : refus, une seule réservation.

Deux `POST` simultanés sur la même idée : un succès, un refus.
