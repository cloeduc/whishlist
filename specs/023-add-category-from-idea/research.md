# Research : ajouter une catégorie depuis le formulaire d'idée (023)

## R1. Même chemin que Réglages

**Decision** : la création passe par la commande existante `manageLabel` (`src/server/commands/labels.ts`, `op: "add"`, `kind: "type"`), donc par la règle de domaine `addType` : nom requis, doublon refusé sans tenir compte de la casse (`typeExists`), longueur maximale. Aucune règle nouvelle, aucun changement de domaine ni d'API.

- **App** : `POST /lists/{listId}/types` existe (contrat 004) et rend la `Label` créée (`{ id, label }`). `addLabel` (`mobile/src/data/labels.ts`) l'appelle déjà pour Réglages mais jette la réponse ; il rendra la `Label` créée (Réglages ignore la valeur).
- **Site** : `manageLabelAction` (`src/server/actions.ts`) rend aujourd'hui `{ ok: true }` ; il rendra aussi la `label` créée (`{ ok: true, label }`), ce qui ne gêne pas ses appels actuels.

**Virgules** : comme dans Réglages, « Jeux, Livres » crée deux catégories ; la première (`label` de la réponse) est sélectionnée pour l'idée.

## R2. Interface : une option de plus, puis un petit champ

**Decision**, même forme sur le site et dans l'app :

1. Le choix de catégorie se termine par « + Nouvelle catégorie ».
2. La choisir ne change pas la catégorie sélectionnée ; un petit bloc s'ouvre sous le champ : « Nom de la catégorie », bouton « Ajouter la catégorie », lien « Annuler ».
3. « Ajouter » crée la catégorie (R1) ; succès → le bloc se ferme, la nouvelle catégorie est sélectionnée ; refus → message sous le champ, le bloc reste ouvert avec la saisie.

- **App** : `mobile/src/ui/Select.tsx` gagne une prop facultative `action?: { label; onPress; disabled?; hint? }`, une dernière ligne de la feuille, au style des options (distincte par son libellé « + … »). Le bloc de saisie est dans `ItemForm` (`Input`, `Button`, `NetworkNote`). Hors ligne ou liste pas encore envoyée (`list.localOnly`) : la ligne est désactivée et la feuille montre l'explication (`mobile:offline.needsNetwork`).
- **Site** : `components/ui/native-select` garde le `<select>` natif ; une dernière `<option value="__new__">` ; la choisir remet la valeur précédente et ouvre le bloc (composants `Input`, `Button`, `Field` de `components/ui/`). Le site est toujours en ligne.

**Alternatives considered** : un bouton « + » à côté du champ (un geste de moins, mais une forme de plus à apprendre, et sur mobile une cible étroite) ; une fenêtre (lourd pour un seul champ).

## R3. Garder la saisie (FR-004, SC-002)

- **App** : `ItemForm` garde son brouillon en état local ; après la création, `refreshList` met à jour `list.categories` (la nouvelle catégorie apparaît dans les options) et le brouillon reçoit `typeId` = l'id créé. Aucun autre champ ne bouge.
- **Site** : l'action appelle `refresh()` ; le composant client `ItemForm` reçoit les nouvelles `types` en props et garde son état (`draft`) ; il pose `typeId` = l'id rendu.

## R4. Messages

Les erreurs viennent des codes du domaine (`typeNeedsName`, `typeExists`, `notMember`, `listMissing`), traduits par `translateError` (site) et `errorText` (app). Textes réutilisés de Réglages (`list:categories.newType` « Nouvelle catégorie », `newTypePlaceholder` « Ex. : Cuisine », `addTypeAria` « Ajouter la catégorie ») ; une seule clé nouvelle, `list:form.newTypeOption` « + Nouvelle catégorie », et « Annuler » de `common:actions.cancel`.

## R5. Vérification

- Tests de domaine : rien de neuf (règles de `addType` déjà testées) ; un test de commande vérifie que `manageLabel` rend la première catégorie créée avec les virgules (`tests/domain/commands-labels.test.ts`).
- jest (app) : `Select` avec `action` ; `ItemForm` : créer « Jeux » sélectionne « Jeux » sans toucher aux autres champs ; doublon → message ; hors ligne → ligne désactivée.
- Maestro `023-us1` : liste neuve à une catégorie, créer « Jeux » depuis le formulaire, enregistrer l'idée, la retrouver dans « Jeux ».
- Site : quickstart (pas de suite e2e).
