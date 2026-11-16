# Contrat des écrans : nouvelle catégorie depuis le formulaire d'idée (023)

Pas de changement du contrat d'API : `POST /lists/{listId}/types` existe et rend `Label` (`{ id, label }`).

## Textes

| Clé | FR | EN | Origine |
|-----|----|----|---------|
| `list:form.newTypeOption` | + Nouvelle catégorie | + New category | nouvelle |
| `list:categories.newType` | Nouvelle catégorie | (existant) | Réglages |
| `list:categories.newTypePlaceholder` | Ex. : Cuisine | (existant) | Réglages |
| `list:categories.addTypeAria` | Ajouter la catégorie | (existant) | Réglages |
| `common:actions.cancel` | Annuler | (existant) | commun |

Erreurs : `errors:typeNeedsName`, `errors:typeExists`, `errors:notMember`, `errors:listMissing` (existantes).

## App (`mobile/src/features/items/ItemForm.tsx`, `mobile/src/ui/Select.tsx`)

- `Select` : prop facultative `action?: { label: string; onPress: () => void; disabled?: boolean; hint?: string; testID?: string }`, dernière ligne de la feuille ; désactivée, elle montre `hint` dessous.
- Champ « Catégorie » : `action` = `form.newTypeOption`, désactivée si hors ligne ou `list.localOnly` (`hint` = `mobile:offline.needsNetwork`).
- Bloc sous le champ quand l'action est choisie : `Field` « Nouvelle catégorie », `Input` (placeholder `newTypePlaceholder`), `Button` « Ajouter la catégorie », `Button` lien « Annuler », message d'erreur.
- `testID` : `item-form.type` (le champ), `item-form.new-type` (la ligne de la feuille), `item-form.new-type-name`, `item-form.new-type-add`, `item-form.new-type-cancel`, `item-form.new-type-error`.

## Site (`components/site/item-form.tsx`)

- `NativeSelect` des catégories : dernière `<option value="__new__">` (`form.newTypeOption`) ; la choisir garde la catégorie précédente et ouvre le même bloc (`Field`, `Input`, `Button`, lien « Annuler », `FormRefusal`).
- « Ajouter la catégorie » appelle `manageLabelAction({ wishlistId, kind: "type", op: "add", label })`, qui rend `{ ok: true, label }` ; succès → `typeId` = `label.id`.
