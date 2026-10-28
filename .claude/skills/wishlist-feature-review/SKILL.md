---
name: wishlist-feature-review
description: Relit le code d'une feature Spec Kit avec cinq agents, un par contrôle - conventions du projet, i18n FR/EN, duplication et réutilisation des composants, règles métier de la feature et leurs tests, principes de la constitution et sécurité. Se lance après `speckit-implement` via le hook `after_implement`, ou quand l'utilisateur demande de « relire la feature », « relire l'implémentation » ou « review the feature ».
---

# Revue de feature

Relire tout le code écrit pour la feature Spec Kit en cours. Ce skill rapporte d'abord. Il ne change le code que pour les points que l'utilisateur choisit.

La revue laisse une trace dans `<feature_directory>/review.md` : la liste des fichiers relus avec leur hash, et les points trouvés. Une revue suivante ne relit que les fichiers changés depuis.

## 1. Trouver la feature

1. Lire `.specify/feature.json`. La clé `feature_directory` donne le dossier de la feature. S'il manque, demander le dossier à l'utilisateur.
2. Lister les fichiers changés avec la commande ci-dessous. Elle liste les fichiers ajoutés ou modifiés depuis `origin/main`, commités ou non (le travail n'est souvent pas encore commité, ni poussé quand on travaille sur `main`), sans les fichiers supprimés.

   ```bash
   { git diff --name-only --diff-filter=d "$(git merge-base origin/main HEAD)"; git ls-files --others --exclude-standard; } | sort -u
   ```

   Si l'utilisateur donne un autre point de départ (un commit, une branche), remplacer `$(git merge-base origin/main HEAD)` par celui-ci. Sur `main` après un push, la commande ne trouve rien : demander alors le commit de départ de la feature.

   Retirer ensuite les fichiers générés (section « Fichiers générés » de `AGENTS.md`), les fichiers Markdown (`*.md`), dossier Spec Kit compris, et les PNG. Ce qui reste, ce sont les **fichiers de code**, y compris `locales/**/*.json`, `package.json` et `deploy/`.

3. Choisir quoi relire :
   - **Revue complète** : quand `<feature_directory>/review.md` n'existe pas, ou quand l'utilisateur la demande. Relire tous les fichiers de code.
   - **Revue partielle** : quand `review.md` existe. Ne relire que les fichiers de code absents de sa liste « Fichiers relus », ou dont `git hash-object <path>` diffère du hash noté. S'il n'y en a aucun, la revue est à jour : le dire et s'arrêter. Dire à l'utilisateur que c'est une revue partielle, et quels fichiers elle couvre.

S'il n'y a aucun fichier de code, s'arrêter et le dire.

## 2. Lancer cinq agents

Lancer cinq agents `general-purpose` en parallèle, dans un seul message. Chacun vérifie un seul point sur les fichiers choisis à l'étape 1. Dans une revue partielle, la `<liste>` ne contient que ces fichiers.

Donner à chaque agent la partie commune ci-dessous, suivie de son contrôle.

### Partie commune

```text
Tu relis le code de la feature décrite dans <feature_directory>, pour UN seul contrôle (ci-dessous). Ne modifie aucun fichier.

Fichiers changés de la feature :
<liste>

Lis chaque fichier changé en entier, et son diff avec `git diff <base> -- <fichier>`
(pour un fichier non suivi, tout le fichier est nouveau). Ne relis que le code que la feature a ajouté ou modifié.

Ne signale que des problèmes réels que tu peux pointer, avec un fichier et une ligne.

Réponds dans ce format, et rien d'autre :
- <fichier>:<ligne> — <le problème, une phrase>. Correction : <une phrase>.
Si tu n'as rien trouvé, écris « Aucun point. »
```

### Contrôle 1 : conventions

```text
Lis d'abord la section « Conventions » de AGENTS.md.

Vérifie que le code suit ces règles : couches (règles métier dans src/domain, accès au JSON
uniquement par src/store/db.ts et updateDocument, pas de règle métier dans app/),
nommage en anglais, typage TypeScript strict (pas de `any` ni de cast pour faire taire le compilateur),
gestion d'erreur (codes d'erreur traduits par translateError), composants Next.js
(server / client, "use client" seulement si nécessaire).
Une nouvelle variable d'environnement doit figurer dans README.md, .env.example et
deploy/compose.prod.yml, et l'app doit marcher sans elle.
Pour chaque point, cite la règle sur laquelle tu t'appuies. Pas d'avis de style hors de ces documents.
```

### Contrôle 2 : i18n FR/EN

```text
Lis la partie i18n de la section « Conventions » de AGENTS.md, et src/i18n/config.ts.

- Signale toute chaîne visible par l'utilisateur écrite en dur dans un composant, une page,
  un e-mail ou un message d'erreur, dans n'importe quelle langue : elle doit passer par i18next.
- Pour chaque clé utilisée dans le code changé (t("ns:clé") ou t("clé") avec le namespace
  de useTranslation / getTranslations), vérifie qu'elle existe dans locales/fr/<ns>.json ET
  locales/en/<ns>.json.
- Pour chaque fichier locales/**/*.json changé, compare ses clés avec le fichier de l'autre
  langue : signale chaque clé présente d'un seul côté.
- Français : vouvoiement, lexique du produit (« J'offre », « qui », « idée », « liste »).
  Anglais : même sens que le français, pas une traduction mot à mot.
- Liens internes : via withLocale, pas de chemin écrit sans la langue.
Les commentaires en français sont acceptés : ne les signale pas.
```

### Contrôle 3 : duplication

```text
Cherche dans le dépôt (grep) du code qui fait déjà ce que fait le code de la feature,
dans la feature ou ailleurs.
- UI : vérifie que les primitives de components/ui/ et les composants de components/site/
  sont utilisés au lieu d'un nouveau balisage ou d'un nouveau composant.
- Domaine et serveur : vérifie la réutilisation de src/domain/ (access, filters, price,
  priority, tokens…), src/auth/, src/server/ (rate-limit, mail, content-security) et src/site/.
- Tests : vérifie que les fixtures existantes (emptyDatabase, fonctions doc() des tests voisins)
  sont réutilisées.
Pour chaque point, donne le chemin du code existant à réutiliser.
```

### Contrôle 4 : règles métier et tests

```text
Lis <feature_directory>/spec.md, plan.md, tasks.md, et data-model.md, contracts/ et quickstart.md
quand ils existent.
Compare le code avec eux : exigences fonctionnelles (FR-xxx), scénarios d'acceptation,
cas limites, contrats. Signale ce qui manque, ce qui est faux, ou ce qui est ajouté sans que
la spec le demande. Signale aussi les tâches cochées (- [X]) dont tu ne trouves pas le code.

Puis vérifie que la spec est couverte par des tests. Lis d'abord la section « Tests » de AGENTS.md.
- Chaque règle métier, cas limite (validation, erreur, limite) et droit d'accès a un test
  dans tests/domain/<module>.test.ts qui vérifie ce que dit la spec. Un test qui touche le
  store travaille sur un fichier temporaire.
- Chaque parcours utilisateur a une vérification manuelle décrite dans quickstart.md.
Signale chaque scénario ou cas limite sans test, et chaque test qui ne vérifie pas ce que dit
la spec. Nomme le fichier de test où l'ajouter.

Si la feature change la forme des données (src/domain/types.ts, src/store/), vérifie qu'un
fichier wishlist.json existant se lit toujours (valeurs par défaut pour les nouveaux champs),
et qu'un test le couvre.

Pour chaque point, nomme l'exigence, le scénario ou la tâche concernée (FR-xxx, scénario, Txxx).
```

### Contrôle 5 : constitution et sécurité

```text
Lis .specify/memory/constitution.md.

Vérifie que le code respecte les cinq principes et la section hébergement, en particulier :
- lecture et réservation sans compte ; aucune modification par une personne qui n'est pas
  membre de la liste ; pas d'annuaire des listes ;
- pas de double réservation de la même idée (lecture et écriture dans le même updateDocument) ;
  annuler une réservation est une action de membre ;
- aucune donnée personnelle, aucun identifiant ni secret dans le dépôt.

Puis la sécurité :
- chaque server action vérifie l'utilisateur et son appartenance à la liste (findMembership)
  ou l'accès public (canAccessPublicList), avant toute lecture ou écriture ;
- les actions sensibles (connexion, inscription, reset, réservation, mot de passe de lecture,
  enrichissement d'URL) passent par rateLimitOrThrow ;
- tout appel HTTP vers une URL fournie par l'utilisateur passe par safeHttpGet / assertSafeFetchUrl ;
- aucune entrée utilisateur rendue en HTML sans échappement (dangerouslySetInnerHTML, attributs
  href en javascript:), et aucun script inline sans le nonce de la CSP ;
- aucune donnée privée (e-mail, nom de l'offreur, jetons) exposée sur une page publique au-delà
  de ce que la constitution autorise ;
- cookies : httpOnly, sameSite, secure via cookieSecure().
Pour chaque point, cite le principe ou la règle concernée.
```

## 3. Rapport

Quand les cinq agents ont fini, écrire le résultat fusionné dans `<feature_directory>/review.md`.

- **Revue complète** : écraser le fichier.
- **Revue partielle** : garder le fichier. Ajouter les nouveaux points à la fin de leur section, garder les anciens tels quels, et ajouter ou mettre à jour les fichiers relus et leurs hashes dans « Fichiers relus ».

Utiliser cette mise en page :

````markdown
# Revue de code

## Fichiers relus

```text
<git hash-object du fichier>  <chemin>
...
```

## Règles métier et tests

- [ ] <fichier>:<ligne> — <le problème>. Correction : <la correction>.

## Constitution et sécurité

## Duplication

## Conventions

## i18n
````

- Lister chaque fichier de code relu avec son `git hash-object <path>`.
- Chaque point est une case à cocher, ouverte (`- [ ]`). Une section sans point dit « Aucun point. »

Puis donner à l'utilisateur un court résumé en mots simples : le nombre de points par contrôle, les plus graves d'abord (sécurité et règles métier avant le reste). Demander quels points corriger. Ne rien corriger avant sa réponse.

## 4. Fermer les points

Chaque point doit finir fermé :

- **Corrigé** : une fois la correction faite, le cocher (`- [x]`).
- **Non corrigé** : quand l'utilisateur décide de le laisser, le cocher et ajouter `Non corrigé : <la raison de l'utilisateur>.` en fin de ligne.

Après les corrections, lancer `npm run lint`, `npm run typecheck` et `npm test`, et rapporter le résultat. Mettre à jour les hashes dans « Fichiers relus » pour les fichiers modifiés. Des changements faits en dehors de ces corrections demandent une nouvelle revue : relancer ce skill, il ne relira que les fichiers changés depuis.

Commiter `review.md` avec le code.
