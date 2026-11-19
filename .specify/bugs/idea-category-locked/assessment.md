# Bug Assessment: catégorie bloquée sur « Livres » à l'ajout d'une idée (app Android)

- **Slug**: idea-category-locked
- **Created**: 2026-11-16
- **Source**: pasted text (retour d'une utilisatrice, transmis par la propriétaire du projet)
- **Verdict**: valid (reproduit sur iOS, hypothèse A)
- **Severity**: medium
- **Remédiation** : feature 023 (`specs/023-add-category-from-idea/spec.md`) — « + Nouvelle catégorie » dans le formulaire d'idée, app et site (branche `023-add-category-from-idea`)

## Report (verbatim or summarized)

> « coucou..qd j'ajoute une autre idée je n'arrive pas à changer la catégorie...je ne peux mettre que livre. gros bisouxxx »

Précision de la propriétaire : sur l'**app Android** (test fermé Google Play).

## Symptom

À l'ajout d'une idée (pas la première de la liste) dans l'app Android, le champ « Catégorie » ne laisse choisir que « Livres » (ou « Livre ») ; la personne attendait de pouvoir choisir une autre catégorie.

## Reproduction

Hypothèse A (la plus probable) :

1. Dans l'app, créer une liste en saisissant « Livres » dans le champ catégorie de « Nouvelle liste » (`mobile/app/(app)/lists/new.tsx`).
2. Ajouter une idée, puis une autre (onglet Idées → « Ajouter une idée cadeau »).
3. Ouvrir « Catégorie » : la feuille de choix ne propose que « Livres ». Rien dans le formulaire ne dit qu'on ajoute des catégories dans l'onglet Réglages.

Hypothèse B :

1. Liste qui a plusieurs catégories, app Android.
2. Ajouter une idée, appuyer sur « Catégorie », choisir une autre catégorie.
3. Le choix n'est pas pris (la feuille ne s'ouvre pas, ou la valeur reste « Livres »).

[NEEDS CLARIFICATION: combien de catégories la liste a-t-elle dans l'onglet Réglages ? Et la feuille de choix s'ouvre-t-elle quand on appuie sur « Catégorie » ?]

## Vérification sur iOS (2026-11-16)

Simulateur iPhone 17 Pro (iOS 26.5), build Debug de l'app sur la base e2e, parcours Maestro jetables (supprimés ensuite) :

| Cas | Résultat |
|-----|----------|
| Liste de démo (4 catégories), 1re idée, choisir « Loisirs » | OK : la feuille propose les 4 catégories, « Loisirs » est retenue et l'idée est enregistrée dans « Loisirs » |
| Même liste, 2e idée juste après, choisir « Gourmand » | OK : le formulaire se rouvre, « Gourmand » est retenue et enregistrée (un premier essai avait échoué parce que le tap était parti pendant un défilement du parcours, pas à cause de l'app) |
| Liste neuve créée dans l'app avec la catégorie « Livres », ajouter une idée, ouvrir « Catégorie » | **Reproduit** : la feuille ne propose que « Livres » ; aucun moyen d'en ajouter, aucune indication vers Réglages |

Conclusion : **hypothèse A confirmée** ; le choix de catégorie fonctionne, mais une liste créée dans l'app n'a qu'une catégorie et le formulaire ne permet pas d'en ajouter. **Hypothèse B (défaut Android) non vérifiée** : le composant est le même sur les deux systèmes et marche sur iOS ; un défaut propre à Android reste possible mais peu probable.

## Suspected Code Paths

- `mobile/src/features/items/ItemForm.tsx:158` — le champ « Catégorie » est un `Select` dont les options sont les seules catégories existantes de la liste (`list.categories`) ; aucune option pour en ajouter une, aucun renvoi vers Réglages.
- `mobile/app/(app)/lists/new.tsx` — une liste créée dans l'app reçoit la ou les catégories saisies (plusieurs seulement si on les sépare par des virgules) ; avec « Livres », la liste n'a qu'une catégorie.
- `mobile/app/(app)/lists/[listId]/settings.tsx` + `mobile/src/features/lists/LabelEditor.tsx` — seul endroit de l'app pour ajouter une catégorie (en ligne seulement : `addLabel` appelle l'API).
- `mobile/src/ui/Select.tsx` — feuille de choix (`Modal` en bas d'écran) ; jamais vérifiée sur Android par un test ni un parcours e2e (hypothèse B).
- `components/site/item-form.tsx:239` — même limite sur le site (`NativeSelect` des catégories existantes, sans ajout).

## Root Cause Hypothesis

**Hypothèse A, confiance haute (reproduite sur iOS)** : ce n'est pas un défaut du champ, mais une liste qui n'a qu'une catégorie (« Livres »), créée ainsi dans l'app ; le formulaire d'idée ne permet pas d'en ajouter et ne dit pas où le faire (Réglages), d'où l'impression d'un champ bloqué. Le message (« je ne peux mettre que livre ») colle à ce cas.

**Hypothèse B, confiance très faible** : un défaut propre à Android du `Select` (feuille `Modal` qui ne s'ouvre pas, ou appui sur une option non pris). Aucun test ni parcours n'a jamais choisi une catégorie dans ce formulaire, donc rien ne l'exclut.

## Proposed Remediation

**Preferred** : A est confirmée sur iOS ; corriger A. Pour écarter B, rejouer le parcours d'ajout dans une autre catégorie sur un émulateur Android (ou demander à l'utilisatrice combien de catégories elle voit dans Réglages). Puis :

- Si **A** : permettre d'ajouter une catégorie depuis le formulaire d'idée. Dans la feuille de choix de « Catégorie », une dernière entrée « + Nouvelle catégorie » ouvre un champ ; la catégorie est créée (même règle que Réglages : `addLabel`, en ligne) puis sélectionnée. Hors ligne, l'entrée renvoie à un message « Connectez-vous pour ajouter une catégorie ». Même ajout sur le site (`components/site/item-form.tsx`) pour garder les deux pareils. C'est une petite évolution : à passer par `/speckit-specify` si elle dépasse un correctif (règle du projet).
- Si **B** : corriger `mobile/src/ui/Select.tsx` sur Android selon la cause trouvée.
- Dans les deux cas, ajouter le test qui manque : choisir une catégorie dans le formulaire (jest) et dans un parcours Maestro joué sur Android.

**Alternatives** :
- A, version minimale : sous le champ « Catégorie », une phrase « Ajoutez des catégories dans l'onglet Réglages de la liste. » avec un lien ; aucun nouveau flux, mais une étape de plus pour la personne.
- A : à la création d'une liste, proposer plusieurs catégories par défaut ; change le comportement de création (site et app), hors du périmètre d'un bug.

**Files likely to change**:
- `mobile/src/ui/Select.tsx` ou `mobile/src/features/items/ItemForm.tsx`
- `components/site/item-form.tsx` (si A, ajout de catégorie)
- `locales/{fr,en}/list.json`
- `mobile/__tests__/screens/item-form.test.tsx`
- `mobile/.maestro/flows/` (parcours qui choisit une catégorie)

**Tests to add or update**:
- jest : dans le formulaire d'idée, ouvrir « Catégorie », choisir la deuxième catégorie, enregistrer : l'idée part avec ce `typeId`.
- jest (si A) : « + Nouvelle catégorie » crée la catégorie, la sélectionne ; hors ligne, message.
- Maestro, joué sur Android : ajouter une idée dans une autre catégorie que la première.

## Risks & Considerations

- Si A, l'ajout depuis le formulaire demande le réseau (les catégories ne passent pas par la file hors ligne) : le formulaire, lui, marche hors ligne ; il faut un message clair.
- Garder le site et l'app au même comportement (mémoire « écarts site/app »).
- La version Android en test fermé n'est peut-être pas la dernière : vérifier sa version (« Mon compte ») avant de conclure.

## Open Questions

- [NEEDS CLARIFICATION: combien de catégories la liste a-t-elle (onglet Réglages) ? Si une seule, c'est l'hypothèse A.]
- [NEEDS CLARIFICATION: quand elle appuie sur « Catégorie », la feuille de choix s'ouvre-t-elle, et voit-elle d'autres catégories ?]
- [NEEDS CLARIFICATION: quelle version de l'app (« Mon compte » → « Version ») ?]
