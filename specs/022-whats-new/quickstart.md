# Quickstart : vérifier « Quoi de neuf » (022)

## Contrôles automatiques

```sh
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
npm run lint && npm run typecheck && npm test
DEMO_PASSWORD=… npm --prefix mobile run e2e -- --platform ios .maestro/flows/022-us1-fresh-install.yaml .maestro/flows/022-us2-whats-new-screen.yaml
```

## US1 : la fenêtre après une mise à jour

Sans store, en simulateur, avec deux builds **Release** pointés sur le serveur local (en build de développement la fenêtre est coupée) : un build A d'un numéro plus bas (par exemple 1.1.0) et un build B de la version annoncée (1.1.1).

1. Installation neuve du build B (app effacée), ouvrir : aucune fenêtre « Quoi de neuf ».
2. Simuler une mise à jour : effacer l'app, installer le build A, se connecter, créer une liste, puis installer le build B par-dessus (sans effacer l'app) ; ouvrir : la fenêtre « Quoi de neuf » liste les nouveautés de la 1.1.1.
3. « C'est noté » : la fenêtre se ferme ; rouvrir l'app : plus rien.
4. Se déconnecter puis se reconnecter : la fenêtre ne revient pas.
5. Mode avion au moment de l'ouverture (étape 2 rejouée) : la fenêtre s'affiche quand même.
6. Langue de l'app en anglais : textes en anglais.
7. Avec la fenêtre « Nouvelle version disponible » (021) au même démarrage : « Quoi de neuf » d'abord, l'autre ensuite.
8. Étape 2 rejouée, mais en ouvrant le build B par un lien de liste : la fenêtre s'affiche par-dessus la liste ; « C'est noté » laisse sur la liste.
9. Version sans nouveautés : installer par-dessus un build C de numéro plus haut (1.1.2) qui n'est pas dans `RELEASES` : aucune fenêtre ; « Mon compte » → « Nouveautés » montre toujours la 1.1.1.

Avec les stores : après la publication de la 1.1.1, mettre à jour depuis une 1.1.0 utilisée (compte connecté) : la fenêtre s'affiche (FR-005).

## US2 : l'écran « Nouveautés »

1. « Mon compte » → « Nouveautés » : la version installée en haut, avec ses phrases.
2. Retour : « Mon compte ».
3. Mode avion : l'écran s'affiche.
