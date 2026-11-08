# Quickstart : vérifier la gestion du partage dans l'app (017)

Parcours réels qui confirment chaque story (constitution, principe IV). Écrans et `testID` : [contracts/screens.md](contracts/screens.md).

## Prérequis

```bash
npm ci && npm --prefix mobile ci
export DEMO_PASSWORD='demo-password-1'
npm run demo:data -- tmp/demo-wishlist.json
# MailDev pour lire les invitations par e-mail (ports de ce Mac : 1026 / 1081)
npx maildev@3.0.0 --smtp 1026 --web 1081
MAIL_SMTP_URL=smtp://localhost:1026 WISHLIST_DATA_PATH=tmp/demo-wishlist.json SESSION_SECRET=dev-secret-dev-secret-dev-secret-00 npm run dev -- --port 3010
EXPO_PUBLIC_API_URL=http://localhost:3010 npm --prefix mobile run ios
```

Comptes de démo : `alex@example.test` (propriétaire de « demo-list »), `camille@example.test` (membre), `sam@example.test` (autre compte), mot de passe `$DEMO_PASSWORD`.

## Story 1 — Inviter

1. App connectée en **camille** (membre) → liste de démo → onglet Partage : cartes 1, 2, 3 et 5 visibles ; pas de carte « Protéger l'accès » ni de « Remplacer le lien d'invitation ».
2. Copier le lien d'invitation → « Lien copié. » ; le presse-papiers contient `…/inviter/demo-list-invitation`.
3. « Envoyer le lien d'invitation » → feuille de partage ; dans Notes ou Messages : le titre de la liste et le lien d'invitation. Le bouton « Partager » de la carte 1 envoie toujours le lien `/l/demo-list-lecture`.
4. Saisir `sam@example.test` → « Envoyer l'invitation » → « Invitation envoyée. » ; MailDev (http://localhost:1081) montre l'e-mail dans la langue de l'app, avec le lien d'invitation.
5. Saisir `pas-une-adresse` → message d'erreur du site, rien n'est envoyé.

## Story 2 — Membres

1. **alex** → onglet Partage : « alex — Propriétaire », « camille — Membre » avec « Retirer de la liste ».
2. Retirer camille → confirmation « Retirer Camille de la liste ? » → « Garder ce membre » : rien ne change ; recommencer et confirmer : camille disparaît. Sur le site connecté en camille, la liste n'est plus accessible.
3. Remettre camille (lien d'invitation, connecté en camille) ; en **camille**, « Quitter cette liste » → confirmer → retour à « Mes listes » sans la liste.
4. **alex**, liste créée pour l'occasion, y invite **camille** (lien d'invitation, connecté en camille) ; en alex, « Quitter cette liste » → confirmer → retour à « Mes listes » sans la liste. En **camille**, la liste est toujours là ; onglet Partage : « camille — Propriétaire » et la carte « Protéger l'accès » visible (scénario 5).
5. **alex**, liste créée pour l'occasion, seul : « Quitter cette liste » → message « Vous êtes seul sur cette liste… » et bouton « Supprimer la liste ».
6. Couper le réseau (simulateur : désactiver le Wi-Fi du Mac) : l'onglet affiche l'alerte hors ligne, les membres restent visibles, « Retirer » et « Quitter » sont désactivés.

## Story 3 — Mot de passe de lecture

1. **alex** → carte « Protéger l'accès » : « Cette liste n'est pas protégée… ».
2. Saisir `court` → message « au moins 8 caractères » ; saisir `secretliste` (l'œil l'affiche en clair) → « Mot de passe enregistré. » ; l'avis « protégée » apparaît dans la carte 1.
3. Dans Safari, ouvrir `http://localhost:3010/l/demo-list-lecture` → la page demande le mot de passe ; `secretliste` l'ouvre.
4. Saisir `autresecret` → « Enregistrer le mot de passe » → « Mot de passe enregistré. » ; dans Safari (fenêtre privée), `secretliste` est refusé, `autresecret` ouvre la liste (scénario 4).
5. « Retirer le mot de passe » → confirmer → « Mot de passe retiré. » ; Safari ouvre la liste sans mot de passe.
6. En **camille** : pas de carte « Protéger l'accès ».

## Story 4 — Remplacer le lien d'invitation

1. **alex** → noter le lien d'invitation → « Remplacer le lien d'invitation » → confirmer : le champ montre un nouveau lien.
2. Connecté en **sam**, ouvrir l'ancien lien → invitation refusée ; le nouveau lien → « Rejoindre » fonctionne.

## Story 5 — Supprimer la liste

1. **alex** → créer une liste « À supprimer » → onglet Réglages : carte « Supprimer la liste » sous les catégories et le « qui ». En **camille**, sur la liste de démo : pas de carte.
2. Hors ligne, ajouter une idée à « À supprimer », puis remettre le réseau avant qu'elle parte (ou laisser hors ligne et vérifier que le bouton est désactivé).
3. « Supprimer la liste » → la confirmation « Supprimer « À supprimer » ? » mentionne le changement non envoyé s'il y en a → confirmer → retour à « Mes listes » sans la liste ; le site ne la montre plus.

## Contrôles automatiques

```bash
npm run lint && npm run typecheck && npm test
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
# Parcours e2e (serveur sur tmp/e2e/wishlist.json, port 3010, MailDev en 1026)
DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/017-us1-invite.yaml
# … puis 017-us2 à 017-us5, et 005-us4-share.yaml (modifié)
```

## Design

Comparer côte à côte l'onglet Partage de l'app et `specs/005-mobile-list-app/design/web-mobile/09-liste-partage.png` (alex puis camille), et la carte « Supprimer la liste » avec `10-liste-reglages.png`, en français puis en anglais.
