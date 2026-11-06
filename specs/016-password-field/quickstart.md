# Quickstart: Champ mot de passe

**Feature**: `016-password-field` | **Date**: 2026-11-06

Interface des composants : [contracts/password-input.md](contracts/password-input.md). Liste des champs : [data-model.md](data-model.md#champs-concernés).

## Contrôles automatisés

```bash
npm run lint && npm run typecheck && npm test
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
```

## Préparation

```bash
DEMO_PASSWORD=… npm run demo:data -- tmp/demo-wishlist.json
WISHLIST_DATA_PATH=tmp/demo-wishlist.json DEMO_PASSWORD=… npm run dev
# App, dans un autre terminal (simulateur iPhone 17 Pro Max iOS 26.5) :
EXPO_PUBLIC_API_URL=http://localhost:3000 npm --prefix mobile run ios -- --device E26F103A-7085-4088-860C-5CFE35803247
```

Comptes de démo : `alex@example.test`, `camille@example.test`, `sam@example.test`, avec le mot de passe `DEMO_PASSWORD`. Pour la liste protégée, poser un mot de passe de lecture sur « Nos envies toute l'année » (onglet Partage, connecté en Alex), puis ouvrir `/l/demo-list-lecture` dans une fenêtre privée.

Site en largeur de téléphone : outils de développement du navigateur, mode appareil (iPhone), ou Safari du simulateur sur `http://localhost:3000`.

---

## US1 — Pas de majuscule ni de correction automatique

1. **App**, écran Connexion : toucher le champ Mot de passe. Le clavier s'ouvre en minuscules (touche Maj éteinte) et ne propose pas de suggestion au-dessus des touches.
2. Taper le mot de passe de démo tout en minuscules avec le clavier du simulateur (pas de collage), avec `alex@example.test` : la connexion réussit du premier coup.
3. Refaire l'étape 1 sur chaque champ de l'app : Inscription, réinitialisation (lien de `tmp/demo-mails/` ou du journal du serveur), Mon compte → Mot de passe (3 champs) et → E-mail, Supprimer mon compte, vue invité d'une liste protégée, Listes suivies → Suivre une liste (lien d'une liste protégée).
4. **Inscription sur iOS** : toucher le champ Mot de passe. La feuille « Utiliser un mot de passe robuste ? » s'ouvre ; sa croix la ferme et on tape son propre mot de passe.
5. **Site** dans Safari du simulateur : refaire l'étape 1 sur les 8 formulaires (connexion, inscription, réinitialisation, compte : mot de passe et e-mail, fenêtre de suppression du compte, carte « Protéger l'accès à votre liste », page de la liste protégée). Taper « motdepasse », afficher la saisie avec l'œil : elle reste « motdepasse ».

**Attendu** : aucune majuscule, aucune correction, connexion réussie, feuille iOS toujours là.

## US2 — Afficher ou masquer la saisie

1. **App**, Connexion : taper « secret-demo ». Le champ montre des points ; l'œil (ouvert) est à droite, dans le champ.
2. Toucher l'œil : « secret-demo » se lit en clair, l'icône devient un œil barré. Toucher encore : la saisie est masquée.
3. VoiceOver (Réglages → Accessibilité, ou raccourci) : l'œil s'annonce « Afficher le mot de passe, bouton », puis « Masquer le mot de passe, bouton ». En anglais (langue de l'app) : « Show password » / « Hide password ».
4. Mon compte → Mot de passe : afficher le champ « Nouveau mot de passe » seulement ; les deux autres restent masqués.
5. Afficher la saisie de Connexion, aller sur Inscription puis revenir : la saisie est de nouveau masquée.
6. Mon compte → E-mail, hors ligne (Android, mode avion) : le champ est grisé et l'œil fonctionne toujours.
7. **Site**, `/connexion` : mêmes étapes 1 à 3. Au clavier : Tab jusqu'à l'œil, Entrée puis Espace : la saisie s'affiche puis se masque, **le formulaire n'est pas envoyé**.
8. Site, connexion avec un mauvais mot de passe, saisie affichée : la page revient avec le message d'erreur, champ vide et masqué.
9. Site, fenêtre « Supprimer mon compte » : afficher la saisie, Annuler, rouvrir : le champ est vide et masqué.
10. **Edge** : un seul œil dans le champ. **Gestionnaire de mots de passe** (trousseau Safari, 1Password ou Bitwarden) : remplissage proposé et fait, l'œil reste cliquable.
11. **Sans JavaScript** : le site ne s'affiche pas sans JavaScript depuis la 015 ; le rendu serveur du champ (masqué, `type="password"`) est vérifié par `tests/domain/password-input.test.ts`.
12. Mot de passe long (60 caractères) dans l'app et sur le site, saisie affichée : le texte défile, il ne passe pas sous l'œil.

## US3 — Même champ partout, même apparence

1. Côte à côte : écran Connexion de l'app et `/connexion` dans Safari du simulateur. Même hauteur, même bordure, même ombre, œil à droite de même taille et même couleur.
2. Même comparaison pour Mon compte (cartes Mot de passe et E-mail).
3. Parcourir le tableau de [data-model.md](data-model.md#champs-concernés) : chaque champ a l'œil (contrôlé aussi par `tests/domain/password-input.test.ts` et `mobile/__tests__/ui/password-fields.test.ts`).

## E2E

```bash
DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/016-us2-show-password.yaml
DEMO_PASSWORD=… npm --prefix mobile run e2e   # suite entière, inscription comprise (SC-005)
```
