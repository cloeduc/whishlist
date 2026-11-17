# Revue de code

Revue complète de la feature 023, depuis `31a696c` (branche `023-add-category-from-idea`).

## Fichiers relus

```text
66b7cb951282ab2111ddd01ffc73a5f5eb27d09d  components/site/item-form.tsx
9ce12e826fff80703c1041a8749dc0c4a923839a  components/site/label-chips.tsx
f84217d61df9ac200750c3e61b0adbfd68690c8d  components/site/use-add-label.ts
9fac591a3c87ac2e3b4ea98792649a0123d29d6c  locales/en/list.json
122b68028b4ea1f2b5183be686d9db158fbef066  locales/fr/list.json
300c881453c9a516e305c86e907590e6bb678d2a  mobile/.maestro/flows/023-us1-new-category.yaml
6f5eed51be8924292d41c64dc92c5fb0961dcf71  mobile/__tests__/e2e/coverage.test.ts
8acfd0dd738c2cf439038fb207bbcdff33551f29  mobile/__tests__/screens/item-form.test.tsx
921edc75cd86cacdc72b520b83cab9a12cdebba8  mobile/__tests__/ui/components.test.tsx
e51fa3d777f0a34d6c19fc96195e0a37fbf0fc80  mobile/src/data/labels.ts
31f67c1e02c7298c259d610f2224f6aef37ec276  mobile/src/features/items/ItemForm.tsx
105b7ad345e7063a0a5fc45c471acb19d45713cf  mobile/src/features/lists/LabelEditor.tsx
23b03b54e367d5dda6f534b84190f69cd0ad67b6  mobile/src/features/lists/NewLabelField.tsx
8322678c62b3c5fc762d557c775e3a759790987f  mobile/src/ui/Select.tsx
2ebb0ffd2cf548180f58bb169b802ac05225f3de  src/server/actions.ts
d24583b381f91cf1f508c8c9957e96ff7d76dbd5  tests/domain/commands-labels.test.ts
```

## Règles métier et tests

- [x] components/site/item-form.tsx:286 — Liste sans aucune catégorie (Réglages permet de supprimer la dernière) : « + Nouvelle catégorie » est la seule option, sélectionnée d'office (`typeId` vide) ; la choisir ne déclenche pas `onChange`, le bloc ne s'ouvre pas, et l'idée part avec `typeId=__new__` (le serveur répond `typeNotInList`). Correction : une première `<option value="">` désactivée quand `typeId` est vide ; ajouter ce cas au quickstart US2.
- [x] mobile/src/features/items/ItemForm.tsx:120 — `refreshList` avale les erreurs : si le rechargement échoue après la création, `typeId` vaut un id absent des options et le champ s'affiche vide, sans message. Correction : ajouter la catégorie créée aux options tant que la liste n'est pas rechargée ; test avec un `GET /lists/w` qui échoue après le `POST`.
- [x] mobile/__tests__/screens/item-form.test.tsx:278 — Le test « hors ligne, ou liste pas encore envoyée » ne couvre que le hors ligne, et ne vérifie pas l'explication (FR-007, T007). Correction : un cas `localOnly: true` en ligne, et vérifier le texte d'explication dans les deux cas.
- [x] mobile/__tests__/screens/item-form.test.tsx:217 — L'écran de modification d'une idée n'est pas testé (FR-001, T007). Correction : un test qui ouvre une idée existante, crée une catégorie, vérifie qu'elle est choisie et que le nom reste.
- [x] mobile/__tests__/screens/item-form.test.tsx:252 — Le test du doublon ne vérifie pas que le nom et le prix restent (FR-005, SC-002). Correction : les remplir avant, les vérifier après le refus.
- [x] specs/023-add-category-from-idea/quickstart.md:15 — Cas limite « catégorie créée puis idée abandonnée » sans étape. Correction : ajouter l'étape (US1 et US2) : créer, quitter sans enregistrer, retrouver la catégorie dans Réglages et la supprimer.

## Constitution et sécurité

Aucun point.

## Duplication

- [x] components/site/item-form.tsx:120 — `addCategory` refait la logique d'ajout de `components/site/label-chips.tsx:57-73` (appel, transition, erreur, Entrée qui ajoute) ; les deux divergent déjà (nom vide : message ici, bouton désactivé dans Réglages). Correction : un hook partagé (`useAddLabel(wishlistId, kind)`) utilisé par les deux.
- [x] mobile/src/features/items/ItemForm.tsx:110 — `addCategory` et le bloc `Field` + `Input` + `Button` refont `run` et le champ d'ajout de `mobile/src/features/lists/LabelEditor.tsx:55-66, 129-140`. Correction : un hook ou un composant partagé dans `mobile/src/features/lists/`, réutilisé par le formulaire.
- [x] mobile/src/ui/Select.tsx:131 — Le style de la ligne d'action recopie celui des lignes d'option (`Select.tsx:106-111`). Correction : une constante ou un petit composant de ligne local.
- [x] mobile/__tests__/screens/item-form.test.tsx:280 — Le test hors ligne recâble la coupure réseau à la main alors que `setOnline` est importé. Correction : `await setOnline(false)`.

## Conventions

Aucun point.

## i18n

- [x] mobile/src/features/items/ItemForm.tsx:194 — Pour une liste pas encore envoyée (en ligne), l'explication dit « demande une connexion ». Correction : `mobile:lists.notSentYet` dans ce cas, comme l'onglet Réglages (`mobile/app/(app)/lists/[listId]/settings.tsx:23`).
- [x] mobile/src/features/items/ItemForm.tsx:215 — Le bouton visible utilise `categories.addTypeAria`, une clé d'accessibilité ; Réglages utilise `categories.add`. Correction : `categories.add` (ou une clé visible dédiée, FR et EN).
- [x] components/site/item-form.tsx:307 — Même réutilisation de `categories.addTypeAria` comme texte visible. Correction : la même clé visible que dans l'app.
