# UI Contracts: Site Web & Application Mobile — Abonnements aux listes

**Feature**: `012-list-subscriptions` | **Date**: 2026-11-02

## 1. Site Web (`app/`)

### 1.1 Page publique d'une liste (`app/l/[readToken]/page.tsx`)
- **Visiteur non connecté** :
  - Bouton secondaire « Suivre cette liste » à côté de « Réserver un cadeau », pointant vers `/connexion?next=/l/<readToken>`.
- **Utilisateur connecté non membre** :
  - S'il ne suit pas encore la liste : formulaire avec bouton « Suivre cette liste » (`subscribeAction`).
  - S'il suit déjà la liste : badge « Liste suivie » et bouton « Ne plus suivre » (`unsubscribeAction`).
- **Membre connecté de la liste** :
  - Aucun bouton « Suivre cette liste » (il est déjà membre).

### 1.2 Page « Mes listes » (`app/page.tsx`)
- **Section « Mes listes »** (inchangée : listes dont l'utilisateur est membre, ou état vide avec « Créer une liste »).
- **Section « Listes suivies »** (`<section>` sous « Mes listes ») :
  - En-tête avec titre `h2` « Listes suivies » et formulaire compact permettant de coller un lien public (`/l/...`) et cliquer sur « Suivre » (`subscribeByLinkAction`).
  - Si la liste collée est protégée par un mot de passe de lecture non encore déverrouillé, redirection vers `/l/[readToken]` où le formulaire de déverrouillage s'affiche (et abonne l'utilisateur dès le mot de passe validé si demandé).
  - Cartes des listes suivies : même présentation que les cartes de « Mes listes » (`WishlistCover`, titre pointant vers `/l/[readToken]`, sous-titre), avec un bouton discret « Ne plus suivre ».

## 2. Application Mobile (`mobile/`)

### 2.1 Écran « Mes listes » (`mobile/app/(app)/index.tsx`)
- Sous la liste des listes personnelles (ou sous l'état vide si l'utilisateur n'a créé aucune liste), affiche la section **« Listes suivies »** (`testID="lists.subscriptions-section"`).
- Bouton « Suivre une liste » (`testID="lists.follow-open"`) qui ouvre l'écran d'ajout `mobile/app/(app)/shared/follow.tsx`.
- Chaque liste suivie est affichée dans une `Card` (`testID="lists.shared-card-<readToken>"`) avec `ListCover`, `title`, `subtitle` (et une mention si la liste est verrouillée par un nouveau mot de passe), qui navigue vers `/shared/[readToken]`.

### 2.2 Écran « Suivre une liste » (`mobile/app/(app)/shared/follow.tsx`)
- Champ `Field` + `Input` pour coller le lien ou le jeton (`testID="follow.link"`).
- Si l'API répond `423 readPasswordRequired`, affiche le titre de la liste et un champ mot de passe de lecture (`testID="follow.password"`).
- Bouton de validation (`testID="follow.submit"`) → redirige vers `/shared/[readToken]`.

### 2.3 Écran d'une liste suivie (`mobile/app/(app)/shared/[readToken].tsx`)
- En-tête : `BackLink` (retour à « Mes listes »), `ListCover`, titre, sous-titre.
- Si la liste est verrouillée (`423 readPasswordRequired`), formulaire de déverrouillage (`testID="shared.unlock-password"`, `testID="shared.unlock-submit"`).
- Filtres (lorsque la liste a des idées) :
  - Filtre « Pour qui ? » (si plusieurs personnes) et filtre « Budget » en pastilles.
- Catégories en accordéon animé (`@/ui/Accordion`, `testID="shared.category-<typeId>"`).
- Cartes d'idées publiques (`testID="shared.item-<itemId>"`) :
  - Nom, étoiles de priorité (`Stars`), badges personne et prix (`Badge`), bouton « Voir le site » si `url` présent.
  - Si non réservée : bouton « Réserver ce cadeau » (`testID="shared.offer-<itemId>"`) qui ouvre la modale/écran de réservation (nom optionnel `testID="shared.reserve-name"`, petit mot optionnel `testID="shared.reserve-note"`, confirmation `testID="shared.reserve-submit"`).
  - Si réservée par ce compte (`mine: true`) : badge « Réservé par vous » et bouton « Annuler la réservation » (`testID="shared.cancel-<itemId>"`) avec `ConfirmDialog`.
- En bas de l'écran : bouton « Ne plus suivre cette liste » (`testID="shared.unfollow"`) avec `ConfirmDialog` (`testID="shared.unfollow-confirm"`).
