# Quickstart : vérifier le cadeau commun (028)

Principe IV : une tranche n'est faite que si son parcours réel la confirme. Règles et vues : data-model.md ; API : contracts/api.md ; écrans : contracts/screens.md.

## Préparation

```sh
npm ci
npm run db:generate            # une fois le schéma changé ; relire drizzle/0008_*.sql (reconstruction de reservations)
npm run lint && npm run typecheck && npm test
npm run demo:data -- tmp/demo-wishlist.json
DEMO_PASSWORD=… WISHLIST_DATA_PATH=tmp/demo-wishlist.json npm run dev
```

Prévoir trois sessions de navigateur : **A** et **B** (fenêtres privées, sans compte), **C** (connectée à un compte de démo `@example.test` qui n'est pas membre de la liste), et **M**, un membre de la liste. Choisir une idée libre **avec un prix** (par ex. 100 €) et une idée **sans prix**.

Vérifier aussi sur une base existante : `npm run db:check -- data/wishlist.db --counts` avant et après le démarrage (nombre de réservations identique).

## US1 : lancer et participer

1. A ouvre le lien public, « Réserver ce cadeau » sur l'idée à 100 €, choisit « Lancer un cadeau commun », nom « Alice », 30 €. → page `/g/<token>`, « Vous participez », reste 70 €.
2. B ouvre le lien public : l'idée est là, « Cadeau commun · 1 participant · il reste 70 € », bouton « Participer ». → page du cadeau : nom « Alice » visible, pas son montant ni son message.
3. B participe sans nom avec 50 €. → reste 20 € ; B voit « Alice · 30 € » et « Anonyme · 50 € » ; A, en rechargeant, aussi.
4. B tente de participer de nouveau (deuxième onglet) → refus « Vous participez déjà ».
5. Idée sans prix : lancer un cadeau commun → seul le total s'affiche, pas de reste.
6. Total ≥ prix : A et B mettent 60 € + 50 € sur une autre idée à 100 € → « Montant atteint », jamais de reste négatif, cadeau toujours ouvert.
7. B retire sa participation, puis A aussi → l'idée redevient libre (« Réserver ce cadeau »), le lien `/g/<token>` affiche « Ce cadeau commun n'existe plus ».
8. C (compte) participe → sa participation apparaît dans « Mes réservations » avec sa part et le reste.

## US2 : complet

1. A déclare le cadeau complet. → une fenêtre D sans participation ne voit plus l'idée sur la liste publique ; A et B la voient, « Complet ».
2. D ouvre `/g/<token>` → « Ce cadeau commun est complet », pas de formulaire.
3. A rouvre → l'idée réapparaît pour D.

## US3 : lien du cadeau

1. A copie le lien « Inviter à participer », l'ouvre dans une fenêtre E. → l'idée, le titre de la liste, les participants, le reste ; aucune autre idée, aucun lien vers la liste ; le code source de la page ne contient pas le `readToken`.
2. E participe → nombre et reste à jour pour A et B.
3. Liste protégée par mot de passe : E doit saisir le mot de passe de lecture avant de voir le cadeau.

## US4 : changer son montant

1. C change sa part de 20 € à 35 € → le reste baisse de 15 € chez A.
2. A (sans compte) : pas de champ pour changer, phrase « Avec un compte… ».
3. C efface son montant → « montant non précisé ».

## US5 : fil de messages

1. C et un deuxième compte participant F écrivent chacun un message → chacun voit les deux, dans l'ordre, avec les noms.
2. C supprime son message → il disparaît chez F.
3. A (participant sans compte) : pas de contenu du fil ; D (non-participant) : rien.
4. F se retire → son message reste, signé de son nom ; F ne voit plus le fil.

## US6 : membres

1. M ouvre la liste : l'idée est dans « Archives » ; « Réservations » : une carte « Cadeau commun · N participants », noms et messages, **aucun montant ni fil**.
2. M annule une participation → seule celle-ci disparaît (le reste remonte pour les participants).
3. M tente de supprimer ou déplacer l'idée → refus comme une idée réservée.
4. M active le mode surprise → l'idée est dans « Idées » sans marque, rien dans « Réservations » avant « Voir les réservations ».
5. M annule le cadeau commun → l'idée est libre, le lien du cadeau n'existe plus, le fil a disparu.
6. Assistant (clé d'API de M) : `get_list` → l'idée est `reserved: true`, sans autre détail.

## US7 : app mobile

Serveur sur le port 3010 (`WISHLIST_DATA_PATH=tmp/e2e/wishlist.json`), simulateur « Whishlist e2e ».

```sh
EXPO_PUBLIC_API_URL=http://localhost:3010 npm --prefix mobile run ios
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/028-us7-group-gift.yaml
```

1. Ouvrir une liste suivie, lancer un cadeau commun avec un montant → écran du cadeau, reste correct ; le site montre le même état.
2. Participer depuis l'app à un cadeau lancé sur le site → nombre et reste à jour des deux côtés.
3. Partager le lien du cadeau depuis l'app ; l'ouvrir sur le simulateur (`xcrun simctl openurl booted http://localhost:3010/g/<token>`) → l'écran du cadeau s'ouvre dans l'app.
4. Compte connecté : changer son montant, écrire dans le fil.
5. Membre : onglet Réservations regroupé, « Annuler le cadeau commun ».
6. **Ancienne app** (build de `main`, sans la 028) : la liste publique ne montre pas le cadeau commun comme libre (absent, ou « Réservé par vous » pour un participant) ; l'onglet Réservations du membre montre chaque participation comme une réservation.

## Sortie

Comme la 026 : le lien `/g/` est déclaré dans le fichier d'association iOS lu en direct. Publier sur les stores la version de l'app qui contient la 028 **avant** de merger sur `main`.
