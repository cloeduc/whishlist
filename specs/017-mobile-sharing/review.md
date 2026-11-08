# Revue de code

## Fichiers relus

```text
1186f2eb7b3ad910d5d0be046cac89d87318be21  locales/en/mobile.json
1c390b6d230a432ae0c4f58606adf742e498ab74  locales/fr/mobile.json
b9dc2940ed66dc9807b2d76de732af6daf9d60f0  mobile/__tests__/data/sharing.test.ts
45b7c03e49be815e1220eb9417ea6c5b94eb622a  mobile/__tests__/e2e/coverage.test.ts
cc6fa6cbb32428638ea9d3bf862a8ff6d8d942d3  mobile/__tests__/offline/outbox.test.ts
4e5d62e0df62732882c7ee3a4cfe71dc109f6bc8  mobile/__tests__/screens/settings.test.tsx
a6b68adb3830b0c1694e2901a2207383909466ad  mobile/__tests__/screens/share.test.tsx
5e5582992f3be9ed9e34960cbf1f7447b3648e3d  mobile/__tests__/ui/password-fields.test.ts
80fcd6caf59e992f9c4ab6fad187a00a73440648  mobile/.maestro/flows/005-us4-share.yaml
29ef00d4b87723949b3d49a450c2a048ed3650d2  mobile/.maestro/flows/017-us1-invite.yaml
0c93cb4593e9a2556bdffa8b015580d86f3d331a  mobile/.maestro/flows/017-us2-members.yaml
2131b8d62b1c4fc400b827fa35fc7832515ceb96  mobile/.maestro/flows/017-us3-read-password.yaml
96ecb37eadd630090273ce099add444a2cd38b55  mobile/.maestro/flows/017-us4-regenerate.yaml
227130d0eb8b47edd5a47f5f31491f0dfab2837d  mobile/.maestro/flows/017-us5-delete-list.yaml
17a07b66539189c261ac9f2dc2cc5c9a2b6ef708  mobile/app/(app)/lists/[listId]/settings.tsx
f8bbf76c86f153e46b6f61bf8fbfeb57e835ed84  mobile/app/(app)/lists/[listId]/share.tsx
38ef7bddc0afc83ce26cf3f183ab12eae1c65e6e  mobile/src/data/sharing.ts
92b70ec7478915fc10e487083b64062b16fe3db5  mobile/src/data/store.ts
100bc599993c4dde550a20169ea01accf78734a6  mobile/src/features/lists/DeleteListCard.tsx
b6b96407638a81cc1d92c9bf2a4fb75b57f9ebc9  mobile/src/features/sharing/CopyLinkField.tsx
309018dd8a3bc79d5d667225f801037320dfbd15  mobile/src/features/sharing/InviteCard.tsx
4c9b1ffe29de97a080884d43a25acbf5d73401b3  mobile/src/features/sharing/InviteEmailCard.tsx
cd79eb7d9f0522652aef76f41fbe5aba8ef5129d  mobile/src/features/sharing/MembersCard.tsx
81e4c0d948c72b17b5bde03f5182996e25779f00  mobile/src/features/sharing/pendingLost.ts
c51d8e1f80cf5c16538b9ee5e2f648599e7125cd  mobile/src/features/sharing/ReadPasswordCard.tsx
4ff4c55c68e2e80e408140082a4b7b59f638edea  mobile/src/offline/outbox.ts
```

## Règles métier et tests

- [x] 1. mobile/src/features/sharing/ReadPasswordCard.tsx:51 — Après un refus `ownerSetReadPassword` (rôle changé ailleurs), `guarded` recharge la liste en `member` : la carte disparaît et le message d'erreur avec elle (cas limite « Rôle changé ailleurs », FR-040, T023/T024). Correction : afficher l'erreur hors de la partie réservée au propriétaire, comme `share.regenerate-error`, et tester ce refus dans `mobile/__tests__/screens/share.test.tsx` avec une liste rechargée en `member`.
- [x] 2. mobile/app/(app)/lists/[listId]/settings.tsx:31 — Même défaut pour `DeleteListCard` : après un refus `ownerDeleteList`, la carte disparaît et `settings.delete-error` avec elle (FR-040, T036). Correction : afficher le refus au niveau de l'écran.
- [x] 3. mobile/__tests__/screens/settings.test.tsx:112 — Le test du refus `ownerDeleteList` recharge une liste encore `owner` : il ne vérifie pas le changement de rôle (FR-040, T032). Correction : servir `{ ...list, role: "member" }` sur `GET /lists/w`, vérifier que le message reste et que la carte disparaît.
- [x] 4. mobile/src/features/lists/DeleteListCard.tsx:90 — `share.alone-delete` n'est désactivé que par `busy` : si le réseau coupe après le refus `aloneMustDelete`, la suppression part hors ligne (FR-041, SC-006). Correction : prop `disabled={!online}`, testée dans `share.test.tsx`.
- [x] 5. mobile/__tests__/data/sharing.test.ts:101 — La branche `notMember` de `guarded` (rechargement puis liste introuvable) n'a pas de test (US2 scénario 7, T005). Correction : cas `notMember` (403) suivi d'un `GET /lists/w` en 404, qui vérifie que la liste est `missing`.
- [x] 6. mobile/__tests__/screens/settings.test.tsx:120 — T032 demande aussi « liste `localOnly` : bouton désactivé » ; seul le hors ligne est testé. Correction : ajouter le cas avec un `createList` en attente.
- [x] 7. mobile/__tests__/screens/share.test.tsx:168 — Aucun test du cas limite « Double appui » (T007, T015). Correction : avec une réponse en attente, vérifier que `share.send-invite` et `share.leave` sont désactivés et qu'un second appui n'envoie rien.
- [x] 8. specs/017-mobile-sharing/quickstart.md:31 — Le scénario 5 de la story 2 (propriétaire qui quitte, le membre le plus ancien devient propriétaire, FR-023) n'est vérifié ni par un test ni à la main. Correction : ajouter l'étape alex quitte, camille voit « Protéger l'accès ».
- [x] 9. specs/017-mobile-sharing/quickstart.md:40 — Pas d'étape pour remplacer un mot de passe existant (story 3 scénario 4, FR-030). Correction : enregistrer un second mot de passe et essayer les deux dans Safari.
- [x] 10. specs/017-mobile-sharing/tasks.md:167 — T045 est coché alors que la note dit que le quickstart n'a pas été refait en entier (principe IV). Correction : dérouler au moins les étapes que la suite e2e ne joue pas (anglais, Safari, hors ligne), ou décocher T045.
- [x] 11. specs/017-mobile-sharing/contracts/screens.md:15 — Le contrat ne cite pas `share.regenerate-error`, `share.alone-delete-error`, `settings.delete-error`. Correction : les ajouter.

## Constitution et sécurité

- [x] 12. mobile/src/data/sharing.ts:17 — Après un refus `notMember` (retiré ou liste supprimée ailleurs), le 404 de `refreshList` (store.ts:105-108) ne retire que la copie locale : les changements de la liste restent dans la file d'attente (règle « après départ, retrait ou suppression, rien ne reste sur le téléphone », principe II). Correction : appeler aussi `discardList(listId)` dans ce cas, comme `dropList`.

## Duplication

- [x] 13. mobile/app/(app)/lists/[listId]/share.tsx:35 — Le bloc titre + description refait à la main ce que fait `mobile/src/ui/PageTitle.tsx`, avec un style écrit dans l'écran (règle « Un écran n'écrit aucun style en dur »). Correction : utiliser `PageTitle` (en lui ajoutant le poids `heading` s'il le faut).
- [x] 14. mobile/src/features/sharing/MembersCard.tsx:45 — `busy` / `error` / `run` recopient `useServerAction`, pour garder en plus le code de l'erreur. Correction : faire rendre ce code par `useServerAction` (`mobile/src/features/errors.ts`).
- [x] 15. mobile/__tests__/screens/share.test.tsx:246 — `renderTeam`, `renderOwner` et deux rendus en ligne refont le montage de `renderShare`. Correction : un paramètre `routes` à `renderShare`, comme `renderSettings` dans `settings.test.tsx:51`.
- [x] 16. mobile/__tests__/screens/share.test.tsx:68 — `setOnline` est recopié ici et dans `settings.test.tsx:37`, en plus de six autres fichiers. Correction : un helper `mobile/__tests__/helpers/network.ts`.
- [x] 17. mobile/.maestro/flows/017-us2-members.yaml:38 — « retour à Mes listes puis déconnexion » répété quatre fois (us2 ×2, us3:69, us4:47). Correction : sous-parcours `back-and-logout.yaml`.
- [x] 18. mobile/.maestro/flows/017-us2-members.yaml:61 — Le tap facultatif « Ouvrir|Open » et la suite `app-link.js` + `openLink` sont répétés (us2 ×2, us3:75, us4:54). Correction : mettre le tap dans `open-mail-link.yaml` et créer `open-app-link.yaml`.

## Conventions

- [x] 19. mobile/src/features/lists/DeleteListCard.tsx:31 — La confirmation ouverte depuis l'onglet Partage (`share.alone-delete`) porte le testID `settings.delete-confirm` (règle `<écran>.<élément>`, FR-044). Correction : passer le préfixe à `useDeleteList` (`share.delete-confirm` sur Partage), et reprendre le parcours 017-us5 et `share.test.tsx`.

## i18n

Aucun point.
