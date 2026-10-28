# Contrat des écrans de l'app

Chaque écran, sa route Expo Router, son modèle sur le site ([design-reference.md](../design-reference.md), captures `design/web-mobile/`), les appels d'API qu'il fait, et son comportement hors ligne.

## Navigation

```text
(auth)                     sans connexion
├── login                  Connexion
├── register               Création de compte
└── forgot-password        Mot de passe oublié
change-password            Changement imposé (mustChangePassword) — seul écran accessible
(app)                      connecté
├── index                  Mes listes (écran d'accueil)
├── account                Mon compte (bouton profil en haut de Mes listes)
├── lists/new              Nouvelle liste
└── lists/[listId]
    ├── index              Liste — onglet Idées (par défaut)
    ├── archives           Liste — onglet Archives
    ├── reservations       Liste — onglet Réservations
    ├── share              Liste — onglet Partage
    ├── settings           Liste — onglet Réglages
    ├── items/new          Nouvelle idée
    └── items/[itemId]     Modifier une idée
```

Les onglets d'une liste (Idées, Archives, Réservations, Partage, Réglages) sont les **pastilles du site**, en haut de l'écran de liste, et non la barre d'onglets du système. Pas de barre d'onglets en bas : « Mes listes » est l'écran d'accueil ; sa barre du haut reprend l'en-tête du site (cadeau + nom du produit) avec, à droite, un bouton carré au style du site (icône de personne) qui ouvre « Mon compte ». Les autres écrans ont un lien « Retour ».

## Écrans

| Écran | Modèle | Appels d'API | Hors ligne |
|-------|--------|--------------|------------|
| Connexion | `02-connexion.png` | `POST /auth/login` | indisponible, message + réessayer |
| Création de compte | `03-inscription.png` | `POST /auth/register` | indisponible |
| Mot de passe oublié | page `/mot-de-passe-oublie` du site | `POST /auth/password-reset` | indisponible |
| Changement imposé | page `/compte` (bloc mot de passe) | `POST /me/password` | indisponible |
| Mes listes | `04-mes-listes.png` | `GET /lists` | copie locale + listes créées hors ligne « En attente » |
| Nouvelle liste | `05-nouvelle-liste.png` | `POST /lists` (avec `id`, `categoryId`, `personId`) | mis en attente |
| Liste – Idées | `06-liste-idees.png` (accordéon des catégories) | `GET /lists/{id}`, `GET /capabilities` | copie locale + changements en attente |
| Nouvelle idée / Modifier | carte « Ajouter une idée cadeau » de `06-liste-idees.png` | `POST …/items` (avec `id`), `PUT …/items/{id}`, `POST …/enrich` | création/modification mises en attente ; préremplissage indisponible |
| Liste – Archives | `07-liste-archives.png` | `PATCH …/items/{id}`, `DELETE …/items/{id}` | mis en attente |
| Liste – Réservations | `08-liste-reservations.png` | `DELETE …/reservations/{id}` | lecture seule depuis la copie ; annulation indisponible |
| Liste – Partage | carte « Partager avec vos proches » de `09-liste-partage.png` + QR code + bouton de partage | aucun (utilise `readUrl`, `hasReadPassword` de la copie) | disponible, sauf liste pas encore envoyée |
| Liste – Réglages | bloc catégories / « qui » de `10-liste-reglages.png` | `POST/PATCH/DELETE …/types|people`, `PUT …/types/order` | indisponible, message |
| Mon compte | `11-compte.png` (nom affiché, mot de passe, déconnexion) | `PATCH /me`, `POST /me/password`, `POST /auth/logout` | indisponible, sauf lecture du nom |

Dans cette première version, l'onglet Partage ne montre que le partage public ; l'invitation de membres, le mot de passe de lecture et la gestion des membres restent sur le site (spec, Assumptions). Il affiche un lien « Gérer le partage sur le site » vers la page admin.

## États communs à tous les écrans

| État | Rendu (composants de design-reference.md) |
|------|------------------------------------------|
| Chargement initial | cadeau animé, comme `LiveGiftMark` |
| Hors ligne | bandeau-alerte blanc en haut : « Hors ligne · dernière mise à jour à HH:MM » |
| Changements en attente | badge jaune « En attente » sur l'élément ; compteur dans le bandeau |
| Changement refusé | alerte rouge sur l'élément, raison traduite, boutons « Corriger » / « Abandonner » |
| Erreur d'une action en ligne | alerte rouge sous le formulaire, champs gardés |
| Mise à jour de l'app requise (`410`) | écran plein avec le message du serveur, sans autre action |
| Rafraîchir | tirer vers le bas, sur Mes listes et sur la liste |
