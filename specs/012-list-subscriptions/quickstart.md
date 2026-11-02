# Quickstart: S'abonner à des listes pour suivre leur contenu

**Feature**: `012-list-subscriptions` | **Date**: 2026-11-02

## Prérequis et contrôles automatisés

```bash
# Migration et types
npm run typecheck
npm run lint
npm test

# Contrat OpenAPI -> types mobile + tests mobile
npm --prefix mobile run api:types
npm --prefix mobile run typecheck
npm --prefix mobile run lint
npm --prefix mobile test
```

## Préparation des données de démo

```bash
DEMO_PASSWORD=demo-pass-1234 npm run demo:data -- tmp/demo-wishlist.json
WISHLIST_DATA_PATH=tmp/demo-wishlist.json npm run dev
```

Comptes de démo disponibles :
- `camille@example.test` (propriétaire de la liste de démo)
- `alex@example.test` (membre)
- Créer ou utiliser un troisième compte visiteur (ex. `marie@example.test`) qui n'est pas membre de la liste.

---

## Parcours 1 — S'abonner depuis la page publique sur le site (US1)

1. Ouvrir la page publique `/l/<readToken>` de la liste de Camille en étant connecté avec `marie@example.test`.
2. Cliquer sur **« Suivre cette liste »** :
   - Le bouton passe à **« Liste suivie »** avec l'action **« Ne plus suivre »**.
3. Cliquer sur **« Mes listes »** dans l'en-tête :
   - Même sans liste créée par Marie, la section **« Listes suivies »** affiche la liste de Camille avec sa couverture et son sous-titre.
   - Cliquer sur la carte ouvre `/l/<readToken>`.
4. Se connecter avec `camille@example.test` et ouvrir `/listes/<id>` (onglets Partage, Réglages, Réservations) :
   - Aucune mention de l'abonnement de Marie n'est visible.

## Parcours 2 — Suivre par lien et consulter dans l'app mobile (US2)

1. Lancer l'app mobile pointée sur le serveur local (`EXPO_PUBLIC_API_URL=http://localhost:3000`).
2. Se connecter avec `marie@example.test`.
3. Sur l'écran **« Mes listes »**, toucher **« Suivre une liste »** dans la section **« Listes suivies »**.
4. Coller le lien public complet `http://localhost:3000/l/<readToken>` et valider :
   - L'écran de la liste suivie s'ouvre avec ses catégories et ses idées disponibles.
5. Déplier une catégorie, filtrer par personne ou budget, puis toucher **« Réserver ce cadeau »** sur une idée :
   - Saisir un petit mot et confirmer : l'idée affiche le badge **« Réservé par vous »** et le bouton **« Annuler la réservation »**.
6. Revenir sur **« Mes listes »** : la liste figure dans **« Listes suivies »**.
7. **Mode hors ligne (US2 scénario 4)** : couper le réseau (mode avion sur Android), rouvrir la liste suivie depuis **« Listes suivies »** :
   - Le bandeau hors ligne s'affiche et les idées de la dernière copie synchronisée restent consultables ; les boutons de réservation et de désabonnement sont désactivés.
8. **Liste protégée par mot de passe de lecture (US2 scénario 2, FR-003)** :
   - Sur le site, avec `alex@example.test`, poser un mot de passe de lecture sur la liste (onglet « Partage »).
   - Avec `marie@example.test` (sur le site ou dans l'app mobile), ouvrir la liste suivie : le mot de passe de lecture est demandé avant d'afficher les idées ; une fois saisi, l'accès est rétabli.

## Parcours 3 — Se désabonner sans perdre ses réservations (US3)

1. Depuis la liste suivie (sur le site ou dans l'app mobile), choisir **« Ne plus suivre »** et confirmer :
   - La liste disparaît de la section **« Listes suivies »** de Marie.
2. Rouvrir `/l/<readToken>` avec le compte de Marie (ou vérifier côté Camille dans l'onglet « Réservations ») :
   - Le cadeau réservé par Marie à l'étape précédente est toujours réservé.

## Parcours Maestro (app mobile)

```bash
DEMO_PASSWORD=demo-pass-1234 npm --prefix mobile run e2e -- .maestro/flows/012-us2-follow-and-browse.yaml
DEMO_PASSWORD=demo-pass-1234 npm --prefix mobile run e2e -- .maestro/flows/012-us3-unfollow.yaml
```
