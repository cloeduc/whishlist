# Quickstart : vérifier le mode surprise (020)

Principe IV : une tranche n'est faite que si ce parcours réel la confirme.

## Préparation

```sh
npm run demo:data -- tmp/demo-wishlist.json
DEMO_PASSWORD=… WISHLIST_DATA_PATH=tmp/demo-wishlist.json npm run dev -- -p 3010
```

Deux sessions de navigateur : **A**, connectée avec un compte de démo membre d'une liste partagée avec un second compte de démo **B** ; **G**, une fenêtre privée (invité) sur le lien public de la liste.

## US1 : activer le mode et ne plus voir les réservations (site)

1. A : onglet Partage → carte « Garder la surprise » → cocher. Message « Mode surprise activé. ».
2. G : réserver une idée X, avec un nom et un mot.
3. A : recharger la liste. X est dans « Idées », identique aux autres ; « Idées (N) » la compte ; X n'est pas dans « Archives » ; l'onglet « Réservations » n'a pas de compteur. Afficher la source de la page : ni le nom de G ni son mot.
4. A : supprimer X → message `itemLockedSurprise`, sans le mot « réservée ». Déplacer X vers une autre liste → même message. Copier X → permis.
5. A : archiver X → X passe dans « Archives », sans marque ; « Remettre dans la liste » → X revient dans « Idées ».
6. A : « Voir comme invité » → dialogue d'avertissement ; « Rester ici » ne quitte pas la page.
7. B (même liste, pas en mode surprise) : X est dans « Archives » avec la phrase « annulez la réservation… », « Réservations (1) » montre G.
8. G : la liste publique ne montre pas X pour un autre invité ; G voit « Vous avez réservé ce cadeau ».
9. A : décocher → X repasse dans « Archives » (avec la phrase), compteur « Réservations (1) » visible.

## US2 : voir volontairement les réservations

1. A (mode surprise recoché) : onglet « Réservations » → phrase + « Voir les réservations », aucun nom.
2. « Voir les réservations » → « Garder la surprise » : rien ne s'affiche.
3. Recommencer et confirmer : X, « De la part de … », le mot.
4. Changer d'onglet puis revenir, ou recharger : de nouveau caché ; la case du Partage est toujours cochée.
5. Sur une liste sans réservation : le bouton est là ; après confirmation, « Aucun cadeau réservé pour le moment. ».
6. Révéler puis « Annuler la réservation » : X redevient libre, l'onglet est de nouveau caché.

## US3 : l'app mobile

```sh
EXPO_PUBLIC_API_URL=http://localhost:3010 npm --prefix mobile run ios
```

1. Connecté avec A (mode surprise coché sur le site) : X dans Idées, pas dans Archives, pas de compteur sur Réservations.
2. Réservations → « Voir les réservations » → confirmer : X et G. Quitter l'écran et revenir : caché.
3. Passer en mode avion, rouvrir la liste : aucune réservation affichée ; le bouton est désactivé.
4. Partage → décocher : le site (A) montre de nouveau les réservations.
5. Parcours Maestro : `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/020-us3-surprise-mode.yaml`.

## Assistant (013)

Avec une clé d'API de A en mode surprise : `get_list` rend `reserved: false` pour X et ne la compte pas comme archivée ; `delete_idea` sur X rend le refus neutre.

## Contrôles automatiques

```sh
npm run lint && npm run typecheck && npm test
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
npm run db:check -- data/wishlist.db --counts   # sur une copie de la base de prod, après migration
```
