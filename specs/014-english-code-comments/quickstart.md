# Quickstart: vérifier « code en anglais »

Prérequis : `npm ci`, `npm --prefix mobile ci`, une base de démo (`npm run demo:data -- tmp/demo-wishlist.json`, `DEMO_PASSWORD` défini).

## 1. La règle est écrite (US1)

1. Ouvrir `AGENTS.md`, convention « Langue du code » : elle dit que le code (identifiants, commentaires, descriptions de tests, messages techniques) est en anglais, puis liste les exceptions (textes du produit, documentation, migrations, segments d'URL). Texte cible : [contracts/language-rule.md](contracts/language-rule.md).
2. `README.md`, section « Contribuer » : même règle, avec un lien vers AGENTS.md.
3. `.claude/skills/wishlist-feature-review/SKILL.md` : `grep -n "commentaires en français" .claude/skills/wishlist-feature-review/SKILL.md` ne trouve plus la phrase d'acceptation. Le contrôle 1 vérifie la langue du code.
4. Sur une branche jetable, ajouter `// Garde la liste si elle existe` dans un fichier de `src/domain/`, puis lancer la revue (`wishlist-feature-review`). Attendu : le contrôle 1 signale la ligne. Abandonner la branche ensuite.

## 2. Les commentaires sont en anglais (US2)

1. `npm test` : `code-language.test.ts` est vert.
2. Ajouter temporairement `// on garde la liste` dans un `.ts` et `# relance du serveur` dans un parcours Maestro, puis relancer `npm test`. Attendu : rouge, avec les deux `fichier:ligne`. Annuler l'ajout.
3. `npm run lint && npm run typecheck && npm test && npm run build` : vert.
4. `npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test` : vert.
5. Relire `git diff main --stat`, puis le diff d'une zone tirée au hasard par répertoire (`git diff main -- src/domain`) : seules des lignes de commentaire changent. Le contrôle des jetons (research R4) est noté dans `tasks.md`.

## 3. Le reste du code est en anglais (US3)

1. `npm test` : `code-language.test.ts` vérifie aussi les descriptions de tests et les `name:` Maestro, et il est vert.
2. `git grep -nE "function (Connexion|Inscription|Compte|Reserver|Reinitialiser|MotDePasse|ChangerMotDePasse)\w*Page" app` : aucun résultat.
3. `npm run db:check -- tmp/demo-wishlist.db` : le message (« no problem » ou équivalent) est en anglais.
4. `npm --prefix mobile test -- runner` : vert avec les messages anglais du lanceur e2e.
5. `bash -n deploy/backup-whishlist.sh deploy/notify.sh` : la syntaxe est valide. Les libellés d'étape et de notification sont en anglais.

## 4. Rien ne change pour les utilisateurs (SC-005)

`WISHLIST_DATA_PATH=tmp/demo-wishlist.json npm run dev`, puis, en français et en anglais :

- l'accueil, `/connexion`, `/inscription`, `/compte`, `/listes` et une liste publique `/l/<readToken>` s'ouvrent à leurs adresses habituelles, avec les mêmes textes qu'avant ;
- réserver une idée sur la liste publique (`/l/<readToken>/reserver`) marche comme avant.

Dans l'app mobile (simulateur de référence), un parcours Maestro court, par exemple `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/005-us1-auth.yaml`, passe et s'affiche sous son nouveau nom anglais.
