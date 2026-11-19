# Bug Assessment: Pages du site rechargées en boucle dans Safari pendant la suite e2e (next dev)

- **Slug**: e2e-safari-dev-reload-loop
- **Created**: 2026-11-09
- **Source**: texte collé (diagnostic de la suite iOS du 2026-11-08, `tmp/e2e/results/20261108-132447-ios/`)
- **Verdict**: valid
- **Severity**: high (suite e2e mobile : 11 parcours sur 27 échouent à la confirmation d'adresse ; aucun impact sur les utilisateurs réels, le mécanisme n'existe qu'avec `next dev`)

Suite de [e2e-confirm-email-safari](../e2e-confirm-email-safari/assessment.md) (bulle de Safari, corrigée par 0fd3395). Ce rapport-là notait déjà la boucle « Compiled in 0ms » et la jugeait sans effet sur les parcours. Le run du 2026-11-08 montre le contraire.

## Report (verbatim or summarized)

> Bug e2e : la confirmation d'adresse échoue dans Safari pendant la suite Maestro iOS. 12 parcours sur 27 échouent (005-us1, 005-us2, 006-us1, 006-us3, 010-us1/2/3, 011-us2, 012-us2, 017-us3/4/5) à l'assertion « Votre adresse e-mail est confirmée… » : Safari reste sur la page « Confirmer votre adresse e-mail », en chargement. Cause constatée : les onglets Safari s'accumulent d'un parcours à l'autre ; avec `next dev`, chaque chargement déclenche une recompilation/HMR qui recharge les autres onglets, en boucle (14 800 GET /confirmer-email pendant la suite, ~10 req/s au repos ensuite, 0 après `xcrun simctl terminate booted com.apple.mobilesafari`). Le tap sur « Confirmer » se perd pendant un rechargement. Correctif envisagé : fermer Safari (et ses onglets) entre les parcours.

Correction après vérification : 017-us3 échoue ailleurs (`No visible element found: id: share.password-error`), sans passer par Safari. Il sort de ce bug : 11 parcours sont concernés, pas 12.

## Symptom

Dans `subflows/confirm-email.yaml`, la page « Confirmer votre adresse e-mail » se recharge sans arrêt dans Safari (plusieurs fois par seconde). L'appui sur « Confirmer » tombe pendant un rechargement et n'envoie pas le formulaire, puis le texte de succès n'apparaît pas dans les 3 essais. Attendu : une page chargée une fois, un `POST` par appui, puis le texte de succès.

## Reproduction

Constaté le 2026-11-08 sur `main` (50ef9ef), iPhone 17 Pro Max iOS 26.5, app Release pointée sur `http://localhost:3010`, `next dev` (Next 16.4.2, Turbopack), MailDev en 1026/1081 :

1. `DEMO_PASSWORD=… E2E_MAILDEV_URL=http://localhost:1081 npm --prefix mobile run e2e -- --platform ios`
2. 15 réussis, 12 échoués, 1 non joué. 11 échecs à l'assertion `${DONE}` de `confirm-email.yaml`.
3. Journal du serveur : 15 342 `GET /confirmer-email/<jeton>` pour 6 `POST /confirmer-email/…`, chaque `GET` suivi d'un « ✓ Compiled in 0–2ms ».

Constats (2026-11-08 et 2026-11-09) :

- **La boucle part d'un seul onglet.** Dès le deuxième parcours (006-us1, premier échec), le journal montre un seul jeton, `VUI_…`, rechargé environ toutes les 100 ms : il n'y avait pas encore d'onglets accumulés.
- **Les onglets s'ajoutent ensuite.** Au repos après la suite, Safari rechargeait en tournant 6 pages `confirmer-email` et `/l/demo-list-lecture`. Après `simctl terminate`, plus aucune requête. Au relancement, Safari restaure ces onglets, qui rebouclent.
- **Hors simulateur, la boucle est reproduite puis disparaît.** Le 2026-11-09, une page WebKit (Playwright) sur `/confirmer-email/VUI_…` s'est rechargée 105 fois en 10 s, puis 71 fois en 8 s, alors qu'aucun autre client n'était connecté (journal : seul ce jeton). La page d'accueil, au même moment, ne se rechargeait qu'une fois. Quelques minutes plus tard, sans redémarrer le serveur, les mêmes essais ne bouclent plus (1 chargement), même à deux pages. [NEEDS CLARIFICATION: ce qui déclenche la boucle puis l'arrête n'est pas identifié.]
- **La CSP n'est pas en cause.** Avec la CSP contournée (`bypassCSP`), la page bouclait autant (77 contre 71). Les refus de feuilles de style par `style-src` apparaissent dans la console de WebKit, mais ne provoquent pas les rechargements.
- **Les écritures en base ne sont pas en cause.** La page ne fait que lire (`previewEmailConfirmation` : `readDocument`), et le WAL de `tmp/e2e/wishlist.db` n'a plus bougé après la suite, pendant que la boucle continuait.

Antériorité (vérifiée le 2026-11-09) :

- Ce n'est pas une régression du code. Le 2026-11-07 à 11 h 36, la suite complète en français passait (26 réussis, 1 échec sans rapport) sur la branche 017, avec un code presque identique à `main` du 2026-11-08, et elle aussi contre `next dev`. Le 2026-11-06, les 7 parcours qui confirment une adresse passaient aussi (rapport `e2e-confirm-email-safari`).
- Les URL en anglais (018) ne sont pas sur `main` et n'ont pas joué. Le run `E2E_LANG=en` du 2026-11-07 échouait sur « Confirm » introuvable : la page de confirmation était en français, c'est le problème que la 018 corrige. Ce n'est pas ce bug.
- Pendant le run du 2026-11-08, une autre session travaillait dans le dossier servi par `next dev` (commit a4e916b à 13 h 25, passage sur `staging` et commits à 14 h 34 et 14 h 54). La boucle commence au parcours lancé vers 13 h 25. Mais modifier un fichier serveur, un composant ou la page pendant qu'une page est ouverte dans WebKit ne provoque aucun rechargement : le lien n'est pas établi.

Cache `.next/` régénéré (2026-11-09, piste de l'utilisatrice) :

- Serveur de dev arrêté, `.next/` supprimé (706 Mo ; il contenait aussi un build de production : `BUILD_ID`, `standalone/`, `server/`), base de la suite recréée, `next dev` relancé.
- Safari relancé avec ses onglets restaurés : 1 `GET` en 30 s, contre une dizaine par seconde avant.
- 010-us1, 006-us1 et 005-us2, en échec le 2026-11-08, passent tous les trois (`tmp/e2e/results/20261109-094312-ios`). Journal du serveur : 7 `GET /confirmer-email`, 3 `POST`, aucun « Compiled ».
- Hypothèse (non prouvée, le dossier est supprimé) : un `next build` lancé dans le même dossier pendant que `next dev` tournait, par exemple pour l'image Docker de la session voisine, a laissé `.next/` dans un état où le serveur de dev republie sans fin des compilations.

## Suspected Code Paths

- `node_modules/next/dist/client/dev/hot-reloader/app/hot-reloader-app.js:340-388` — le client de dev de Next recharge toute la page (`window.location.reload()`) sur certains messages du serveur (`reloadPage`, ou `serverComponentChanges` quand la page a eu une erreur). Chaque chargement produit un « Compiled » côté serveur, donc un nouveau message : une boucle possible, propre à `next dev`.
- `mobile/.maestro/README.md:20` — la suite se joue contre `npm run dev`. Le mécanisme n'existe pas avec un serveur de production.
- `mobile/.maestro/subflows/confirm-email.yaml` — ouvre le lien dans Safari (`openLink`) et ne referme jamais l'onglet : chaque parcours en laisse un, restauré au lancement suivant de Safari.
- `mobile/.maestro/subflows/share-from-safari.yaml`, `flows/011-us4-guest-list.yaml` — ouvrent aussi des pages du site dans Safari (`/l/demo-list-lecture` dans la boucle observée).
- Site (`app/confirmer-email/[token]/page.tsx`, `src/server/content-security.ts`) : pas de rechargement dans le code de la page, pas de redirection côté client. La page n'est pas en cause, ni la CSP.

## Root Cause Hypothesis

Confiance : moyenne. Le mécanisme est établi : en `next dev`, le client de rechargement à chaud de Next recharge la page, et chaque rechargement produit côté serveur une compilation qui relance un rechargement. Une fois partie, la boucle s'entretient avec un seul onglet. Les onglets que Safari garde et restaure d'un parcours à l'autre l'amplifient. Le déclencheur n'est pas identifié : la boucle a été reproduite dans WebKit, puis a cessé sans changement de code ni redémarrage. Quoi qu'il en soit, elle n'existe qu'avec le serveur de dev. Avec un serveur de production (`npm run build` puis `npm start`), le client de rechargement à chaud n'est pas chargé.

Conséquence pour le correctif envisagé dans le rapport : fermer Safari entre les parcours enlève l'amplification, pas la boucle. 006-us1 a échoué avec un seul onglet.

## Proposed Remediation

**Preferred (révisé le 2026-11-09, après la régénération de `.next/`)**: garder `next dev`, et le démarrer pour la suite avec un `.next/` neuf. Dans `mobile/.maestro/README.md`, l'étape 3 supprime `.next/` avant `npm run dev`, et un paragraphe décrit le symptôme (pages du site rechargées en boucle dans Safari, « ✓ Compiled in 0ms » en rafale dans le journal, parcours bloqués sur « Confirmer ») et le remède : arrêter le serveur, supprimer `.next/`, relancer ; ne pas lancer `npm run build` ni travailler dans le dossier servi pendant la suite. `serverHint` de `mobile/scripts/e2e.mjs`, qui affiche la commande du serveur quand il manque, part aussi d'un `.next/` neuf. Pas de contrôle automatique : la cause (build de production mêlé au cache de dev) n'est pas prouvée, un arrêt sur la présence d'un `BUILD_ID` pourrait bloquer à tort.

**Ancienne recommandation (avant la régénération)**: jouer la suite contre le serveur de production. Dans `mobile/.maestro/README.md`, l'étape 3 devient `npm run build` puis `PORT=3010 MAIL_SMTP_URL=… WISHLIST_DATA_PATH=tmp/e2e/wishlist.json SESSION_SECRET=… npm start`, avec une phrase sur la raison (le rechargement à chaud de `next dev` recharge en boucle les pages ouvertes dans Safari) et le rappel de refaire le build après un changement du site. `scripts/start.mjs` rend déjà `WISHLIST_DATA_PATH` absolu, et le serveur relit la base à chaque requête. La suite teste aussi ce qui tourne en production. En plus, fermer les onglets de Safari au début de la suite : `mobile/scripts/e2e.mjs` arrête Safari et efface ses onglets enregistrés avant le premier parcours, pour que le run ne dépende pas des précédents.

**Alternatives**:
- Garder `next dev` et seulement fermer Safari entre les parcours (option choisie au départ) : moins cher (pas de build), mais n'empêche pas la boucle sur un seul onglet, comme le montre 006-us1.
- Faire vérifier par `e2e.mjs` que le serveur n'est pas en dev (en-tête ou `/capabilities`) et s'arrêter sinon : garde-fou utile en plus du README, mais l'API ne dit pas aujourd'hui dans quel mode elle tourne.
- Chercher le déclencheur dans Next (signaler un bug en amont) : utile, mais sans garantie de délai et sans débloquer la suite.

**Files likely to change**:
- `mobile/.maestro/README.md` (commande du serveur, raison, build à refaire)
- `mobile/scripts/e2e.mjs` (onglets de Safari vidés avant la suite, iOS seulement)
- `specs/007-mobile-e2e-maestro/contracts/e2e-command.md` (si le contrat décrit le serveur attendu ou le nettoyage du simulateur)
- `AGENTS.md` (la ligne « Suite e2e » cite le serveur lancé)

**Tests to add or update**:
- Pas de test de domaine : le site n'est pas en cause.
- Si `e2e.mjs` gagne une fonction de nettoyage, un test unitaire de la commande `simctl` produite, dans le style des tests existants de `mobile/scripts/e2e/`.
- Preuve : la suite iOS complète contre `npm start`, avec les 11 parcours qui confirment une adresse au vert, et un journal du serveur sans `GET /confirmer-email` répétés.

## Risks & Considerations

- **`upgrade-insecure-requests` en production.** `src/server/content-security.ts:31` ne l'ajoute qu'hors dev. Servie en `http://localhost:3010`, la page de production pourrait voir ses ressources et le `POST` du formulaire basculés en `https`. À vérifier en premier ; si c'est le cas, il faudra une règle pour `localhost` (sans toucher à la prod).
- Le build prend du temps, et un build oublié fait tester un site périmé. Le README doit le dire ; un contrôle de date du build dans `e2e.mjs` est possible.
- Le build et `next dev` partagent `.next/` : arrêter le serveur de dev avant de builder.
- Effacer les onglets de Safari passe par des fichiers internes du simulateur (conteneur de données de Safari), dont le format peut changer d'une version d'iOS à l'autre. Si ce n'est pas faisable proprement, se limiter au serveur de production.

## Open Questions

- 017-us3 (`share.password-error` introuvable) échoue pour une autre raison : bug séparé, ou à regarder dans la 017 ?
- Une fois la suite jouée contre le serveur de production, la vérification de `quickstart.md` (site à la main) reste-t-elle en `next dev` ? Rien ne l'empêche, la boucle ne gêne qu'un navigateur piloté par la suite.
