# Contract: règle « code en anglais »

Ce que la feature expose, ce sont les textes de la règle et le comportement du garde-fou. Les textes ci-dessous sont la cible ; l'implémentation peut retoucher la formulation sans changer la règle.

## AGENTS.md — convention « Langue du code »

Remplace la puce actuelle (« identifiants en anglais. Les commentaires peuvent être en français ou en anglais. ») :

```markdown
- **Langue du code** : tout le code est en anglais : identifiants, commentaires, descriptions de tests (`test`, `it`, `describe`, `name:` des parcours Maestro), messages techniques (journaux, erreurs internes, sorties des scripts, notifications d'exploitation). Un texte du produit cité dans un commentaire garde sa langue, entre « ». Restent en français : les textes du produit (passés par `locales/`, contenus juridiques, données de démo, fiche Runtipi), la documentation (README, ce guide, constitution, `specs/`, contrat OpenAPI compris, `docs/`) et les migrations `drizzle/*.sql` déjà versionnées. Exception temporaire : les segments d'URL et les dossiers de pages de `app/` en français (`listes`, `compte`, `inscription`…), qui sont des adresses publiques ; leurs composants portent quand même un nom anglais. `tests/domain/code-language.test.ts` vérifie les commentaires et les descriptions de tests.
```

## README.md — section « Contribuer »

Nouvelle section placée après « Structure utile » :

```markdown
## Contribuer

Les conventions du dépôt (couches, i18n, tests, workflow Spec Kit) sont dans [AGENTS.md](AGENTS.md). Le code est en anglais : identifiants, commentaires, descriptions de tests, messages techniques. Les textes du site et de l'app passent par `locales/{fr,en}`, et la documentation reste en français. `npm test` le vérifie pour les commentaires et les descriptions de tests.
```

## Skill `wishlist-feature-review`

- Contrôle 2 (i18n) : supprimer la phrase « Les commentaires en français sont acceptés : ne les signale pas. »
- Contrôle 1 (conventions) : remplacer « nommage en anglais » par un point qui demande de vérifier la langue du code selon la convention « Langue du code » d'AGENTS.md : signaler tout identifiant, commentaire, description de test ou message technique en français. Ne pas signaler les textes du produit, les citations entre « », ni les exceptions de la convention.

## Garde-fou `tests/domain/code-language.test.ts`

| Entrée | Résultat attendu |
|--------|------------------|
| Fichiers de code versionnés, tous en anglais | test vert |
| `// Garde la liste si elle existe` ajouté dans un `.ts` | rouge : `fichier:ligne`, texte trouvé |
| `# on relance le serveur pour les tests` dans un `.yaml` ou `.sh` | rouge |
| `test("une liste vide est refusée", …)` | rouge |
| `name: "005 US1 — Se connecter"` dans un parcours Maestro | rouge |
| `// Shows « Réserver ce cadeau » once the idea is free` | vert (citation retirée avant le contrôle) |
| `assert.equal(label, "Réservé par vous")` | vert (chaîne hors commentaire et hors description) |
| Commentaire en français dans `locales/`, `specs/`, `drizzle/*.sql`, un fichier généré | vert (hors périmètre) |

Le test nomme chaque fichier et ligne en défaut, pour qu'on les corrige sans relancer de recherche.
