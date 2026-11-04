# Research: Code et commentaires du code en anglais

Relevé fait le 2026-11-03 sur `git ls-files`, hors fichiers générés ou installés (liste « Fichiers générés » d'AGENTS.md).

## R1. Étendue du français dans le code

**Constat** (détecteur heuristique : lettres accentuées ou mots-outils français majoritaires dans le texte d'un commentaire) :

| Zone | Lignes de commentaire en français |
| ---- | ---- |
| `mobile/src/` | 355 |
| `src/server/` | 190 |
| `mobile/.maestro/` (parcours YAML) | 183 |
| `src/domain/` | 148 |
| `mobile/app/` | 106 |
| `tests/domain/` | 95 |
| `mobile/__tests__/` | 64 |
| `src/store/` | 57 |
| `components/site/` | 55 |
| `mobile/scripts/` | 48 |
| `src/site/` | 41 |
| `app/` (pages, API) | ~60 |
| `scripts/`, `deploy/`, `src/auth/`, `src/i18n/`, `.env.example`, `.github/workflows/`, `Dockerfile`, `proxy.ts`, `instrumentation.ts`, `.gitignore` | ~80 |
| **Total** | **~1 500 lignes, 389 fichiers** |

Autres catégories :

- **Descriptions de tests** : 340 sur 386 dans `tests/domain/`, 60 sur 277 dans `mobile/__tests__/`, et les `name:` des 22 parcours Maestro.
- **Messages techniques** : sorties de `scripts/db-check.ts`, `mobile/scripts/e2e.mjs` et `mobile/scripts/e2e/*.cjs` (`checks.cjs`, `flows.cjs`, `locale.cjs`, `strings.cjs` qui écrit un en-tête de commentaire en français dans le fichier généré), notifications et étapes de `deploy/backup-whishlist.sh`, `deploy/notify.sh`. `mobile/__tests__/e2e/runner.test.ts` attend certains de ces messages mot pour mot : test et messages changent ensemble.
- **Identifiants** : les identifiants sont déjà en anglais (colonnes et tables SQL, `testID`, fonctions, types), sauf 7 composants de pages nommés d'après leur dossier français : `ConnexionPage`, `InscriptionPage`, `ChangerMotDePassePage`, `MotDePasseOubliePage`, `ComptePage`, `ReinitialiserPage`, `ReserverPage`. Les layouts voisins sont déjà en anglais (`AccountLayout`, `ResetLayout`…), ce qui donne les noms cibles.

**Decision** : tout ce qui précède est traduit, sauf les exceptions de R2.

## R2. Ce qui reste en français

**Decision** :

1. **Textes du produit** : `locales/**`, valeurs attendues des tests sur un texte affiché, textes juridiques et contenus des pages, données de démo (`scripts/create-demo-data.mjs`, données simulées de `scripts/capture-demo.mjs`, `data/seed.json`), fiche Runtipi (`deploy/runtipi/whishlist/config.json`, lue par la personne qui installe l'app). Une citation d'un texte du produit dans un commentaire reste telle quelle, entre « » ou guillemets.
2. **Segments d'URL et dossiers de pages** (`app/listes`, `app/compte`, `app/inscription`, `app/connexion`, `app/inviter`, `app/reinitialiser`, `app/confirmer-email`, `app/mot-de-passe-oublie`, `app/changer-mot-de-passe`, `app/mentions-legales`, `app/donnees-personnelles`, `app/projet`, `app/l/[readToken]/reserver`) : adresses publiques, décision Q2 (feature à part, backlog n° 12).
3. **Documentation** : README, AGENTS.md, constitution, `specs/**` (y compris le contrat `specs/004-mobile-api/contracts/openapi.yaml`), `docs/**`, `deploy/*.md`, `mobile/.maestro/README.md` et `exclusions.md`.
4. **Migrations SQL versionnées** (`drizzle/*.sql`) : un fichier déjà appliqué en prod ne change pas.

**Rationale** : le contrat OpenAPI est un document de spec (décrit avant la route, AGENTS.md). Ses descriptions passent en commentaires dans `mobile/src/api/schema.d.ts`, mais ce fichier est généré, donc hors périmètre. `mobile/__tests__/api/schema.test.ts` compare ce fichier au contrat : ne toucher à aucun des deux garde ce test vert.

**Alternatives considered** : traduire le contrat. Écarté : ce serait toucher une spec, régénérer `schema.d.ts` et relire 80 descriptions d'API, pour un document que la règle laisse en français.

**Fichiers de configuration** : les commentaires de `.env.example`, `Dockerfile`, `.gitignore`, `.github/workflows/*.yml` et `deploy/compose.prod.yml` sont du code de configuration, donc traduits. Le tableau des variables du README reste en français.

## R3. Garde-fou automatique

**Decision** : ajouter un test `tests/domain/code-language.test.ts` (lancé par `npm test`, donc par la CI) qui parcourt les fichiers de code versionnés (`git ls-files`, hors exceptions de R2 et fichiers générés) et échoue sur :

- un **commentaire** (`//`, `/* */`, `{/* */}`, `#` pour YAML, shell et fichiers de config) en français ;
- une **description de test** (premier argument de `test`, `it`, `describe` dans `tests/` et `mobile/__tests__/`) ou un **`name:` de parcours Maestro** en français.

Heuristique, appliquée après avoir retiré les citations (`«…»`, `"…"`, `` `…` ``) : le texte contient une lettre propre au français (`é è ê ë à â ç î ï ô û ù œ`), ou un mot-outil français sans homographe anglais (`le la les un une des du au aux ce ces cette il elle ils elles leur est sont pour dans avec sans sur par mais donc qui que pas ne se si`). Une citation « … » coupée sur deux lignes de commentaire est retirée elle aussi. *(Réglé à l'implémentation : le seuil initial de deux mots laissait passer « on garde la liste ».)* Le message d'échec donne `fichier:ligne` et le texte trouvé. Les faux positifs restants se corrigent en reformulant, ou par une liste courte d'exceptions dans le test, chacune justifiée.

**Rationale** : les agents lisent une documentation en français et reprennent spontanément le français dans leurs commentaires. La revue automatique (US1) ne passe qu'en fin de feature et n'est qu'une consigne, alors qu'un test bloque dès la CI. Il donne aussi la mesure de SC-001 (0 ligne). Les messages techniques (logs, erreurs internes) ne sont pas couverts : les distinguer des textes du produit demanderait de connaître chaque chaîne. Ils relèvent de la revue.

**Alternatives considered** : règle ESLint maison (couvre seulement JS/TS, pas YAML, shell ni CSS, et l'app mobile a sa propre config ESLint) ; vérification seulement dans la revue (non bloquante, arrive tard) ; dictionnaire de langue (dépendance lourde pour un gain faible).

## R4. Méthode de traduction et preuve qu'aucun code ne change

**Decision** :

- Traduction faite à la main (agent), fichier par fichier, par zone (R1), avec le glossaire de [data-model.md](data-model.md). Pas de traduction automatique en masse : chaque commentaire garde son sens, ses références (`FR-005b`, `US3`, `R3`, chemins) et ses citations.
- Les zones sont indépendantes : on peut les traiter en parallèle, puisque chaque fichier n'appartient qu'à une zone.
- Preuve « commentaires seulement » (FR-009) pour US2 : pour chaque fichier JS/TS modifié, on compare les jetons du fichier avant et après, sans les commentaires (scanner TypeScript, `skipTrivia`). Les jetons doivent être identiques. Pour YAML, shell et CSS, on compare les lignes sans leurs commentaires. Le script de comparaison est un outil jetable de l'implémentation, non versionné ; son résultat est noté dans `tasks.md`.
- Un commentaire faux ou obsolète est traduit tel quel ; s'il contredit le code, on le note dans le rapport de la tâche, sans le corriger.

**Alternatives considered** : un seul gros passage scripté avec un service de traduction. Écarté : envoi du code à un service externe, perte des citations, vocabulaire du produit non tenu.

## R5. Lieux de la règle

**Decision** :

- `AGENTS.md`, convention « Langue du code » : réécrite (texte cible dans [contracts/language-rule.md](contracts/language-rule.md)).
- `README.md` : nouvelle courte section « Contribuer » après « Structure utile », qui énonce la règle et renvoie à AGENTS.md. (Au passage, la ligne `src/store/  # JSON + lock fichier` de « Structure utile » est fausse depuis la 008 ; à corriger dans le même commit, puisque ce bloc est du code et qu'on y touche.)
- `.claude/skills/wishlist-feature-review/SKILL.md` : retirer « Les commentaires en français sont acceptés : ne les signale pas. » du contrôle 2, et ajouter au contrôle 1 la vérification de la langue (identifiants, commentaires, descriptions de tests, messages techniques), en citant les exceptions.
- `.specify/templates/overrides/tasks-template.md` : rien à changer (il parle déjà de messages de commit en anglais) ; c'est le seul template propre au projet.
- Constitution : rien à changer. La langue du code est une convention, pas un principe, et la constitution renvoie déjà aux conventions.

## R6. Découpage en commits

**Decision** : un commit par story, en `chore:` (aucun changement de comportement) :

1. US1 : règle dans AGENTS.md, README, skill de revue.
2. US2 : traduction des commentaires et test garde-fou (partie commentaires). Gros diff, mais homogène : on le relit par zone.
3. US3 : descriptions de tests, `name:` Maestro, messages techniques avec `runner.test.ts`, renommage des 7 composants de pages, test garde-fou étendu aux descriptions de tests.
4. Polish : vérification sur la base de démo, et mise à jour de `tasks.md`.

Il n'y a pas de PR ouverte (`gh pr list`, 2026-11-03) : aucun conflit à prévoir. Le squash sur `main` doit suivre vite, car toute branche ouverte plus tard rencontrera des conflits sur les commentaires.
