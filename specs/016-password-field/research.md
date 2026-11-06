# Research: Champ mot de passe

## R1 — Site : un composant qui enveloppe l'`Input` existant

- **Decision** : `components/ui/password-input.tsx`, composant client `PasswordInput`. Il rend un conteneur `relative` avec l'`Input` de `components/ui/input.tsx` (même classes, plus `pr-11` pour que le texte ne passe pas sous l'œil) et un `<button type="button">` posé à droite, centré verticalement. Il accepte toutes les props d'`Input` sauf `type`, qu'il gère.
- **Rationale** : même apparence que les autres champs (FR-009) sans dupliquer les classes ; `components/ui/` parce que le composant n'a pas de règle métier (comme `input.tsx`). Le `type="button"` empêche l'envoi du formulaire au clic, à Entrée et à Espace (FR-004, scénario US2-4).
- **Alternatives** : un bouton hors du champ, à côté (refusé : la spec place l'œil dans le champ) ; une prop `revealable` sur `Input` (refusé : `Input` resterait utilisé pour les mots de passe sans qu'on le voie, alors qu'un composant dédié se contrôle par une recherche de `type="password"`).

## R2 — Site : sans JavaScript

- **Decision** : le rendu serveur donne `type="password"` et le bouton. Sans JavaScript, le bouton ne fait rien (et `type="button"` n'envoie rien) ; le champ reste masqué et le formulaire s'envoie normalement (FR-010).
- **Rationale** : le cas limite de la spec accepte « l'œil n'apparaît pas ou n'a pas d'effet ». Cacher le bouton jusqu'à l'hydratation ferait sauter le champ à l'affichage pour tout le monde.
- **Alternatives** : bouton caché jusqu'au montage (refusé, ci-dessus) ; case à cocher CSS `:checked` (refusé : changer le `type` d'un champ demande du JavaScript).
- **Constat à l'implémentation** : depuis la 015 (FR-003 abandonnée), le site ne s'affiche pas sans JavaScript (`app/loading.tsx`). FR-010 se vérifie donc au niveau du composant : son rendu serveur est un champ `type="password"` (test `tests/domain/password-input.test.ts`), pas par une connexion sans JavaScript.

## R3 — Site : attributs du clavier et remplissage automatique

- **Decision** : `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}` posés par le composant, que l'appelant ne peut pas désactiver ; `autoComplete` (`current-password` / `new-password`) reste donné par chaque formulaire, inchangé (FR-007).
- **Rationale** : Safari iOS lit `autocapitalize` et `autocorrect` ; Chrome Android lit `autocapitalize` et `spellcheck`. Ces attributs existent déjà en pratique pour `type="password"` sur certains claviers, mais pas sur tous, et ils deviennent nécessaires quand le champ passe en `type="text"` (saisie affichée).

## R4 — Site : un seul œil (Edge) et gestionnaires de mots de passe

- **Decision** : `input::-ms-reveal { display: none }` dans `app/globals.css`. Pour les gestionnaires (1Password, Bitwarden…), aucune règle : ils posent leur icône dans le champ ou à côté, et la marge droite `pr-11` laisse l'œil cliquable. Vérifié à la main (quickstart).
- **Rationale** : Edge ajoute son propre bouton aux champs `type="password"` ; Chrome et Safari, non. Les gestionnaires ne se pilotent pas par CSS de façon fiable.

## R5 — Site : état remis à « masqué »

- **Decision** : l'état vit dans le composant (`useState(false)`). Les formulaires ont déjà `key={state?.attempt}` : un refus du serveur remonte le formulaire, donc un champ vide et masqué (cas limite « Erreur au retour du serveur »). La fenêtre de suppression du compte démonte son contenu à la fermeture (Base UI `Dialog`), ce qui remet l'état à zéro. Un envoi réussi change de page.
- **Rationale** : aucune logique à ajouter pour FR-005 côté site ; un test de rendu vérifie que l'état initial est masqué.

## R6 — App : composant et zone de toucher

- **Decision** : `mobile/src/ui/PasswordInput.tsx` compose `Input` (même `Shadow`, même focus « enfoncé ») avec une prop `trailing` ajoutée à `Input` : un élément posé à droite dans la boîte, à côté du `TextInput` (ligne `flexDirection: "row"`). L'œil est un `Pressable` de 44 × 44 (`hitSlop` pour compléter si la boîte fait 40 de haut), `accessibilityRole="button"`, `accessibilityLabel` traduit selon l'état, testID `<testID>-reveal`.
- **Rationale** : même apparence que le site (FR-009) et un seul endroit pour le style du champ. Placer l'œil à côté du `TextInput` (et non par-dessus) évite que le texte passe dessous (cas limite « Mot de passe long »).
- **Alternatives** : œil en position absolue par-dessus le `TextInput` avec une marge droite (refusé : sur Android, la marge du `TextInput` se combine mal avec le défilement horizontal du texte).

## R7 — App : clavier, trousseau iOS et feuille « mot de passe robuste »

- **Decision** : `autoCapitalize="none"`, `autoCorrect={false}`, `spellCheck={false}` toujours ; `secureTextEntry={!visible}` ; `autoComplete` et `textContentType` passés tels quels par chaque écran (inchangés). Le testID et l'`accessibilityLabel` restent sur le `TextInput`, donc les parcours Maestro existants (et la croix tapée par position dans `submit-register.yaml`) ne changent pas : le champ garde sa hauteur, seule sa largeur diminue de celle de l'œil.
- **Rationale** : la feuille iOS s'ouvre pour un champ sécurisé `newPassword` ; il est masqué par défaut, donc elle s'ouvre comme avant (FR-008).
- **Risque connu** : iOS vide un champ sécurisé quand on y retape après l'avoir quitté (comportement d'UIKit, déjà vrai aujourd'hui). Basculer l'œil ne vide pas le champ : la valeur est contrôlée par l'écran.

## R8 — App : état remis à « masqué »

- **Decision** : deux règles dans le composant : (1) `useFocusEffect` d'expo-router, dont le nettoyage masque la saisie quand l'écran perd le focus (un écran de la pile reste monté sous le suivant) ; (2) quand l'écran vide le champ lui-même (valeur passée à `""` sans que la personne l'ait tapé, p. ex. après un envoi réussi dans `PasswordForm` ou `EmailCard`), la saisie est masquée. Une carte repliée (`CollapsibleCard`) démonte ou non son contenu : la règle (2) et le démontage couvrent les deux cas après envoi ; à la fermeture d'une carte sans envoi, le contenu est démonté (vérifié par test).
- **Rationale** : FR-005 sans demander à chaque écran de gérer l'état.
- **Conséquence pour les tests** : les tests d'écrans qui simulent `expo-router` ajoutent `useFocusEffect: jest.fn()` à leur simulation.

## R9 — Textes

- **Decision** : namespace `common` (chargé partout, sur le site et dans l'app) : `passwordField.show` = « Afficher le mot de passe » / « Show password », `passwordField.hide` = « Masquer le mot de passe » / « Hide password ».

## R10 — Tests et e2e

- **Decision** :
  - Site : `tests/domain/password-input.test.ts` rend le composant avec `react-dom/server` (attributs du champ et du bouton, état masqué au départ, libellé FR et EN) et parcourt `components/` et `app/` : aucun `type="password"` hors de `password-input.tsx`.
  - App : `mobile/__tests__/ui/password-input.test.tsx` (props du clavier, bascule, libellés, testID de l'œil, champs indépendants, remise à zéro au départ de l'écran et après vidage) ; un test parcourt `app/` et `src/` : aucun `secureTextEntry` hors du composant ; les tests d'écrans gardent leurs testID.
  - Maestro : `016-us2-show-password.yaml` sur l'écran Connexion (saisie masquée, œil, saisie lue en clair, libellé, re-masquage, masquage au retour d'Inscription). US1 et US3 en exclusions (« story entière ») : Maestro tape le texte sans passer par la majuscule automatique du clavier, et la ressemblance se juge à l'œil.
  - `coverage.test.ts` lit désormais la spec 016.
