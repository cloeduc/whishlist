# Revue de code

Revue complète, faite sur le diff depuis `staging` (point de départ de la branche, `0b997dd`). `origin/main` est en retard sur `staging`, et la commande par défaut remontait tout le travail encore non publié. Un seul fichier de code : `package.json`. `package-lock.json` est un fichier généré, et ses 12 entrées `next` / `@next/*` ont été contrôlées pendant T003. Les cinq contrôles ont été faits par cinq agents en parallèle, comme le prévoit le skill. Aucun n'a trouvé de point.

## Fichiers relus

```text
19868e4f62141e0b69b2a1e404da51c85bfad008  package.json
```

## Règles métier et tests

Aucun point.

FR-001 à FR-009 sont couverts :

- `next`, `@next/env` et `eslint-config-next` sont épinglés exactement en `16.4.6`.
- L'audit de production est propre et le lockfile passe avec npm 10.
- Les contrôles sont verts : 465 tests du site, 415 tests de l'app, build, image Docker.
- Les parcours du `quickstart.md` sont consignés dans `research.md`.

Pas de règle métier nouvelle, donc pas de test de domaine à ajouter. T011 est coché « non nécessaire », avec sa raison.

## Constitution et sécurité

Aucun point.

Ni droits ni store ne changent, et aucune variable d'environnement n'est ajoutée. Aucun secret de la vérification (mot de passe de démo, clé MCP) n'est dans le dépôt. La montée ferme les sept avis de 16.4.5, dont GHSA-pc58 qui touche le relais Umami.

## Duplication

Aucun point.

## Conventions

Aucun point.

Versions exactes comme avant. Commits en anglais, préfixés `fix:` ou `chore:`.

## i18n

Aucun point.

Aucun texte n'a changé.
