# Contrat des écrans : nouvelle catégorie depuis le formulaire d'idée (023)

Pas de changement du contrat d'API : `POST /lists/{listId}/types` existe et rend `Label` (`{ id, label }`).

## Textes

| Clé | FR | EN | Origine |
|-----|----|----|---------|
| `list:form.newTypeOption` | + Nouvelle catégorie | + New category | nouvelle |
| `list:categories.newType` | Nouvelle catégorie | (existant) | Réglages |
| `list:categories.newTypePlaceholder` | Ex. : Cuisine | (existant) | Réglages |
| `list:categories.add` | Ajouter | (existant) | Réglages (texte du bouton) |
| `list:categories.addTypeAria` | Ajouter la catégorie | (existant) | Réglages (nom accessible du bouton) |
| `common:actions.cancel` | Annuler | (existant) | commun |

Erreurs : `errors:typeNeedsName`, `errors:typeExists`, `errors:notMember`, `errors:listMissing` (existantes).

## App (`mobile/src/features/items/ItemForm.tsx`, `mobile/src/ui/Select.tsx`)

- `Select` : props facultatives `action?: { label: string; onPress: () => void; disabled?: boolean; hint?: string }` et `actionTestID`, dernière ligne de la feuille (même style de ligne que les options) ; désactivée, elle montre `hint` dessous.
- Champ « Catégorie » : `action` = `form.newTypeOption`, désactivée si hors ligne ou `list.localOnly`.
- Bloc sous le champ quand l'action est choisie : `NewLabelField` (`mobile/src/features/lists/NewLabelField.tsx`, partagé avec Réglages) : « Nouvelle catégorie », « Ajouter » (désactivé tant que le nom est vide), « Annuler », refus du serveur. La catégorie créée s'ajoute aux options même si la liste n'est pas encore rechargée ; l'explication de la ligne désactivée est `lists.notSentYet` pour une liste pas encore envoyée, `offline.needsNetwork` sinon.
- `testID` : `item-form.type` (le champ), `item-form.new-type` (la ligne de la feuille), `item-form.new-type-name`, `item-form.new-type-add`, `item-form.new-type-cancel`, `item-form.new-type-error`.

## Site (`components/site/item-form.tsx`)

- `NativeSelect` des catégories : dernière `<option value="__new__">` (`form.newTypeOption`) ; la choisir garde la catégorie précédente et ouvre le même bloc (`Field`, `Input`, `Button`, lien « Annuler », `FormRefusal`).
- « Ajouter » passe par `useAddLabel` (`components/site/use-add-label.ts`, partagé avec les puces de Réglages), qui appelle `manageLabelAction` et rend la catégorie créée ; succès → `typeId` = son id. Sans catégorie (`typeId` vide), une première option vide et désactivée évite que « + Nouvelle catégorie » soit choisie d'office.
