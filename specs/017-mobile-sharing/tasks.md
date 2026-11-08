---

description: "Task list for feature 017 — sharing management in the mobile app"
---

# Tasks: Gérer le partage d'une liste dans l'app mobile

**Input**: Design documents from `/specs/017-mobile-sharing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/screens.md, quickstart.md

**Tests**: demandés par AGENTS.md (chaque règle et chaque cas limite a son test ; une story de l'app a son parcours Maestro, FR-044) et par la spec.

**Organization**: une phase par user story, chacune close par son commit. Tout le code est dans `mobile/` (plus `locales/`) ; le serveur et le contrat ne changent pas (research R1).

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`/`chore:`, terminé par `(USn)`), sans demander. Setup et Foundational entrent dans le commit de US1. Un fichier touché par deux stories est commité en deux temps. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: peut être fait en parallèle (fichiers différents, pas de dépendance)
- **[Story]**: story concernée (US1 à US5)

Rappels pour toutes les tâches : code, commentaires et descriptions de tests en anglais ; aucun style en dur dans un écran (composer `mobile/src/ui/`) ; textes du site repris mot pour mot depuis `locales/{fr,en}/list.json` (`list:share.*`, `list:confirm.*`, `list:settings.*`, `list:inviteSent`), erreurs via `errorText` (`mobile/src/features/errors.ts`) ; `testID` exactement ceux de [contracts/screens.md](contracts/screens.md).

---

## Phase 1: Setup

**Purpose**: textes propres à l'app

- [X] T001 Ajouter la clé `sharing` dans `locales/fr/mobile.json` et `locales/en/mobile.json` (mêmes clés) : `shareInvite`, `inviteMessage` (variables `{{title}}`, `{{url}}`), `pendingLost_one` / `pendingLost_other` (variable `{{count}}`), `offline` ; textes de départ dans le tableau « Textes propres à l'app » de `specs/017-mobile-sharing/contracts/screens.md` (français vouvoyé, lexique du produit). Ne pas encore retirer `share.manageOnSite` (T046)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: nettoyage local, module d'appels, champ lien + copier — servent à plusieurs stories

- [X] T002 [P] Ajouter `discardList(listId: string): Promise<void>` dans `mobile/src/offline/outbox.ts` : supprime toutes les lignes de la file dont `listId` vaut la liste (en une transaction, comme `discard`), puis prévient les abonnés (`onOutboxChange`) ; test dans `mobile/__tests__/offline/outbox.test.ts` (changements de deux listes : seuls ceux de la liste visée disparaissent ; liste sans changement : rien ne bouge)
- [X] T003 [P] Ajouter dans `mobile/src/data/store.ts` : `forgetList(listId)` (supprime la copie `removeSnapshot(listKey(listId))`, retire la liste de `state.list` **sans** l'ajouter à `state.missing`, puis `refreshLists()`), et `usePendingCountFor(listId)` (nombre de `state.changes` de la liste, à côté de `usePendingCount`) ; tests dans `mobile/__tests__/data/lists.test.ts` ou un nouveau `mobile/__tests__/data/store.test.ts`
- [X] T004 Créer `mobile/src/data/sharing.ts` sur le modèle de `mobile/src/data/labels.ts` (appel direct, aucun passage par la file, research R2) : `sendInvite(listId, email)` → `POST /lists/{listId}/invitations` (`done`) sans rechargement ; `regenerateInvite(listId)` → `POST /lists/{listId}/invite-link` puis `refreshList` ; `setReadPassword(listId, password)` → `PUT /lists/{listId}/read-password` puis `refreshList` ; `clearReadPassword(listId)` → `DELETE …/read-password` puis `refreshList` ; `removeMember(listId, userId)` → `DELETE /lists/{listId}/members/{userId}` puis `refreshList` ; `leaveList(listId)` → `POST /lists/{listId}/leave` puis `discardList` + `forgetList` ; `deleteList(listId)` → `DELETE /lists/{listId}` puis `discardList` + `forgetList`. Un refus (`ApiError`) remonte tel quel ; si son code commence par `owner` ou vaut `notMember`, appeler `refreshList(listId)` avant de relancer l'erreur (research R7) (dépend de T002, T003)
- [X] T005 Tests de `mobile/src/data/sharing.ts` dans `mobile/__tests__/data/sharing.test.ts` (faux `fetch` de `__tests__/helpers/fetch.ts`, base en mémoire) : chaque fonction appelle la bonne route et la bonne méthode ; rechargement de la liste après les actions qui le demandent ; après `leaveList` / `deleteList` : copie supprimée, changements de la liste retirés de la file, liste absente de `missing` ; refus `aloneMustDelete` (400) : rien n'est nettoyé ; refus `ownerRemoveMember` (403) : liste rechargée puis erreur relancée (dépend de T004)
- [X] T006 Extraire le champ lien + copier de `mobile/app/(app)/lists/[listId]/share.tsx` dans `mobile/src/features/sharing/CopyLinkField.tsx` (pendant de `components/site/copy-link-field.tsx`) : props `label`, `value`, `copyLabel`, `fieldTestID`, `copyTestID`, `copiedTestID` ; affiche « Lien copié. » (`list:share.copied`) après copie (`expo-clipboard`). Brancher la carte « Partager avec vos proches » dessus en gardant les `testID` actuels (`share.read-link`, `copy-link`, `share.copied`) : `mobile/__tests__/screens/share.test.tsx` doit rester vert sans changement

**Checkpoint**: fondations prêtes, aucun changement visible

---

## Phase 3: User Story 1 - Inviter quelqu'un à gérer la liste (Priority: P1) 🎯 MVP

**Goal**: tout membre copie ou envoie le lien d'invitation et invite par e-mail depuis l'app.

**Independent Test**: membre de la liste de démo → onglet Partage → copier le lien d'invitation, l'envoyer par la feuille de partage, inviter une adresse et lire l'e-mail dans MailDev (quickstart, story 1).

### Tests for User Story 1

- [X] T007 [P] [US1] Adapter et compléter `mobile/__tests__/screens/share.test.tsx` : le test « never the invite link » (l. 65) vérifie maintenant que le champ `share.read-link` et le message du bouton `share.share` ne contiennent pas `INVITE_URL` (et non plus son absence de l'écran) ; nouveaux cas : en-tête `list:share.title` / `list:share.description` ; carte « Gérer la liste à plusieurs » avec `INVITE_URL` dans `share.invite-link`, copie (`share.copy-invite` → presse-papiers + `share.invite-copied`) ; `share.share-invite` appelle `Share.share` avec un message qui contient le titre et `INVITE_URL`, sans `url` ; invitation par e-mail : succès (`share.invite-sent`, champ vidé), erreurs `emailRequired` (400), `emailNotVerified` (403), `mailNotConfigured` (503), `inviteSendFailed` (502), limite (429) affichées traduites dans `share.invite-error` ; liste `localOnly` : aucune carte nouvelle ; hors ligne : alerte `share.offline`, `share.send-invite` désactivé, copie et partage du lien d'invitation toujours actifs
- [X] T008 [P] [US1] Écrire le parcours `mobile/.maestro/flows/017-us1-invite.yaml` (tag `017-us1`, `name:` en anglais) : connexion `camille@example.test` (membre de la liste de démo), onglet Partage, `share.invite-link` contient `demo-list-invitation`, copie (`share.invite-copied`), `share.share-invite` puis `subflows/close-share-sheet.yaml`, invitation par e-mail à une adresse unique (`scripts/unique.js`) → `share.invite-sent`, puis `subflows/open-mail-link.yaml` avec `KIND: inviter` et `TO` cette adresse : l'invitation s'ouvre dans l'app (`invite.login` visible). Ne rien écrire dans la liste de démo
- [X] T009 [P] [US1] Modifier `mobile/.maestro/flows/005-us4-share.yaml` : remplacer `assertNotVisible: .*demo-list-invitation.*` par une vérification sur le seul champ `share.read-link` (son texte ne contient pas `demo-list-invitation`), le lien d'invitation étant désormais affiché par sa propre carte (research R8)

### Implementation for User Story 1

- [X] T010 [P] [US1] Créer `mobile/src/features/sharing/InviteCard.tsx` : carte « Gérer la liste à plusieurs » (`list:share.collabTitle`, `list:share.collabDescription`), `CopyLinkField` sur `list.inviteUrl` (libellé `list:share.inviteLink`, bouton `list:share.copyInvite`, `testID` `share.invite-link`, `share.copy-invite`, `share.invite-copied`), bouton `share.share-invite` (`mobile:sharing.shareInvite`) qui appelle `Share.share({ title, message: t("mobile:sharing.inviteMessage", { title, url }) })` sans `url` (doublon iOS, research R4)
- [X] T011 [P] [US1] Créer `mobile/src/features/sharing/InviteEmailCard.tsx` : carte « Inviter par e-mail » (`list:share.inviteEmailTitle`, `list:share.inviteEmailDescription`), champ `share.invite-email` (libellé `list:share.inviteEmail`, placeholder `list:share.inviteEmailPlaceholder`, `keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}`), bouton `share.send-invite` (`list:share.sendInvite`) via `useServerAction(sendInvite)` ; succès : champ vidé et `Alert` `share.invite-sent` (`list:inviteSent`) ; erreur : `Alert` `share.invite-error` ; prop `disabled` (hors ligne). Prévoir l'emplacement du bouton propriétaire de US4 sans l'écrire
- [X] T012 [US1] Réécrire `mobile/app/(app)/lists/[listId]/share.tsx` : en-tête `list:share.title` + `list:share.description`, carte 1 (inchangée, via `CopyLinkField`), `InviteCard`, `InviteEmailCard` ; une alerte `share.offline` (`mobile:sharing.offline`) en tête quand `useOnline()` est faux, et `disabled` passé aux cartes ; liste `localOnly` : seul le message `mobile:share.pendingList` (inchangé). Garder pour l'instant le lien « Gérer le partage sur le site » (membres et mot de passe y restent jusqu'à US2/US3) (dépend de T006, T010, T011)
- [X] T013 [US1] Vérifier à la main la story 1 de `specs/017-mobile-sharing/quickstart.md` sur le simulateur de référence, en français puis en anglais, et jouer `017-us1-invite.yaml` et `005-us4-share.yaml` — fait : les deux parcours passent (iOS, FR, 2026-11-06) ; la relecture en anglais est faite avec la comparaison de T042
- [X] T014 [US1] Commit de la story : contrôles verts, puis `feat: invite someone to manage a list from the app (US1)` (avec Setup et Foundational), sans demander

**Checkpoint**: inviter depuis l'app fonctionne seul

---

## Phase 4: User Story 2 - Voir les membres, retirer un membre, quitter la liste (Priority: P1)

**Goal**: carte « Gérer les membres » : liste et rôles, retrait par le propriétaire, quitter.

**Independent Test**: propriétaire retire un membre ; un membre quitte ; une personne seule voit le refus (quickstart, story 2).

### Tests for User Story 2

- [X] T015 [P] [US2] Ajouter à `mobile/__tests__/screens/share.test.tsx` : carte `list:share.members` avec une ligne `share.member-<userId>` par membre (nom — « Propriétaire » / « Membre », libellé « Membre » si `displayName` vide), dans l'ordre du serveur ; propriétaire : `share.remove-<userId>` sur les autres, pas sur lui ; membre : aucun bouton de retrait ; retrait confirmé (`share.remove-confirm`, titre avec le nom) → `DELETE …/members/{userId}` et liste rechargée ; « Garder ce membre » → aucun appel ; quitter confirmé (`share.leave-confirm`) → `POST …/leave` puis `router.replace("/")` ; confirmation de sortie avec `mobile:sharing.pendingLost` quand la liste a des changements en attente, sans sinon ; refus `aloneMustDelete` → message traduit dans `share.members-error`, pas de navigation ; hors ligne : retrait et sortie désactivés, membres visibles
- [X] T016 [P] [US2] Écrire `mobile/.maestro/flows/017-us2-members.yaml` (tag `017-us2`) sur des comptes et une liste créés par le parcours (research R8) : compte A (`subflows/register.yaml`) crée une liste (`subflows/create-list.yaml`), invite l'adresse du compte B par e-mail (carte de US1) puis se déconnecte ; B s'inscrit, ouvre l'invitation (`subflows/open-mail-link.yaml`, `KIND: inviter`) et rejoint ; B → onglet Partage → « Quitter cette liste » → confirmer → « Mes listes » sans la liste ; A se reconnecte, réinvite B, B rejoint ; A voit B « Membre » et le retire (`share.remove-<userId>` ciblé par texte si l'id n'est pas connu) ; A seul → « Quitter cette liste » → message `aloneMustDelete` visible

### Implementation for User Story 2

- [X] T017 [US2] Créer `mobile/src/features/sharing/MembersCard.tsx` : carte « Gérer les membres » (`list:share.members`, `list:share.membersDescription`) ; une ligne par membre `share.member-<userId>` : nom (ou `list:share.member` si vide) — `list:share.owner` / `list:share.member` ; si `list.role === "owner"` et membre ≠ compte connecté : bouton `share.remove-<userId>` (`list:share.remove`) + `ConfirmDialog` (`list:confirm.removeMemberTitle` avec `name`, `removeMemberBody`, `removeMemberConfirm`, `removeMemberKeep`) → `removeMember` ; bouton `share.leave` (`list:share.leave`) + `ConfirmDialog` (`list:confirm.leaveTitle`, `leaveBody` suivi de `mobile:sharing.pendingLost` si `usePendingCountFor(listId) > 0`, `leaveConfirm`, `leaveKeep`) → `leaveList` puis `router.replace("/")` ; erreurs dans `Alert` `share.members-error` ; prop `disabled`. Fait autrement : une seule personne est propriétaire, donc « Retirer » va sur chaque ligne dont le rôle n'est pas `owner`, sans lire la session. (Prévu : l'identifiant du compte connecté vient de la session (`useSession()` de `mobile/src/auth/session.ts` : `user` peut être `null` en `signedIn` avant `refreshMe`, alors s'appuyer sur l'identifiant gardé à la connexion — clé `USER_ID` du stockage sûr, à exposer par un petit accesseur si besoin — plutôt que de montrer « Retirer » sur sa propre ligne).) (dépend de T004)
- [X] T018 [US2] Ajouter `MembersCard` en dernière carte de `mobile/app/(app)/lists/[listId]/share.tsx` (ordre du site)
- [X] T019 [US2] Vérifier à la main la story 2 du quickstart (FR/EN) et jouer `017-us2-members.yaml` — fait : le parcours passe (iOS, FR, 2026-11-06)
- [X] T020 [US2] Commit de la story : contrôles verts, puis `feat: see members, remove a member or leave a list from the app (US2)`, sans demander

**Checkpoint**: US1 et US2 fonctionnent chacune seule

---

## Phase 5: User Story 3 - Protéger la liste par un mot de passe de lecture (Priority: P2)

**Goal**: le propriétaire définit, remplace ou retire le mot de passe de lecture.

**Independent Test**: définir puis retirer le mot de passe et vérifier le lien public (quickstart, story 3).

### Tests for User Story 3

- [X] T021 [P] [US3] Ajouter à `mobile/__tests__/screens/share.test.tsx` : propriétaire : carte `list:share.readPassword`, état `share.password-state` (`readPasswordUnset` puis `readPasswordSet`) ; enregistrement → `PUT …/read-password` avec le mot de passe, champ vidé, `share.password-saved`, avis `password-notice` de la carte 1 visible après rechargement ; refus `readPasswordTooShort` et `passwordRequired` (400) affichés dans `share.password-error` ; `share.clear-password` visible seulement si protégée, confirmé (`share.clear-password-confirm`) → `DELETE …/read-password`, `share.password-cleared`, avis disparu ; membre : pas de carte ; hors ligne : champ et boutons désactivés
- [X] T022 [P] [US3] Écrire `mobile/.maestro/flows/017-us3-read-password.yaml` (tag `017-us3`) sur un compte et une liste créés par le parcours : mot de passe trop court → message ; mot de passe valide → `share.password-saved` et `password-notice` ; « Voir la liste partagée » ou ouverture du lien public déconnecté (`openLink` du lien de lecture via `scripts/app-link.js`) → la vue invité demande le mot de passe ; retour, « Retirer le mot de passe » → confirmer → `share.password-cleared`

### Implementation for User Story 3

- [X] T023 [US3] Créer `mobile/src/features/sharing/ReadPasswordCard.tsx` : carte « Protéger l'accès à votre liste » (`list:share.readPassword`, `list:share.readPasswordHint`) ; état `share.password-state` (`list:share.readPasswordSet` / `readPasswordUnset`) ; champ `share.read-password` = `PasswordInput` de `mobile/src/ui/PasswordInput.tsx` (feature 016), libellé `list:share.readPasswordLabel` ; bouton `share.save-password` (`list:share.readPasswordSave`) via `useServerAction(setReadPassword)` → champ vidé, `Alert` `share.password-saved` (`list:share.readPasswordSaved`) ; si `list.hasReadPassword` : bouton `share.clear-password` (`list:share.readPasswordClear`, variante outline) + `ConfirmDialog` (`list:confirm.clearPassword*`) → `clearReadPassword`, `Alert` `share.password-cleared` (`list:share.readPasswordCleared`) ; erreurs `share.password-error` ; aucune vérification de longueur côté app (le serveur applique « 8 caractères au moins », data-model.md) ; prop `disabled` (dépend de T004)
- [X] T024 [US3] Dans `mobile/app/(app)/lists/[listId]/share.tsx`, afficher `ReadPasswordCard` entre `InviteEmailCard` et `MembersCard` si `list.role === "owner"` ; l'avis `password-notice` de la carte 1 reste affiché à tout membre quand `list.hasReadPassword` (contracts/screens.md, carte 1). Retirer maintenant le lien « Gérer le partage sur le site » et la fonction `adminShareUrl` (plus rien n'en dépend) et adapter le test de `mobile/__tests__/screens/share.test.tsx` qui l'ouvrait (l. ~109) en vérifiant son absence
- [X] T025 [US3] Vérifier à la main la story 3 du quickstart (FR/EN, œil du champ) et jouer `017-us3-read-password.yaml` — fait : le parcours passe (iOS, FR, 2026-11-06), saisies dans le champ mot de passe comprises
- [X] T026 [US3] Commit de la story : contrôles verts, puis `feat: protect a list with a read password from the app (US3)`, sans demander

**Checkpoint**: le propriétaire gère la protection sans le site

---

## Phase 6: User Story 4 - Remplacer le lien d'invitation (Priority: P3)

**Goal**: le propriétaire remplace le lien d'invitation ; l'ancien ne marche plus.

**Independent Test**: remplacer le lien et vérifier que l'ancien est refusé (quickstart, story 4).

### Tests for User Story 4

- [X] T027 [P] [US4] Ajouter à `mobile/__tests__/screens/share.test.tsx` : propriétaire : `share.regenerate` + aide `list:share.regenerateHint` ; confirmation (`share.regenerate-confirm`, `list:confirm.regen*`) → `POST …/invite-link`, liste rechargée, `share.invite-link` affiche le nouveau lien ; « Conserver le lien » → aucun appel ; membre : pas de bouton ; refus `ownerRegenerateInvite` (403) → message affiché et liste rechargée ; hors ligne : bouton désactivé
- [X] T028 [P] [US4] Écrire `mobile/.maestro/flows/017-us4-regenerate.yaml` (tag `017-us4`) sur un compte et une liste créés par le parcours : noter le lien (`copyTextFrom: { id: share.invite-link }`), remplacer et confirmer, vérifier que `share.invite-link` a changé ; ouvrir l'ancien lien (`openLink` après `scripts/app-link.js`) connecté avec un second compte créé par le parcours → invitation refusée (message `inviteLinkBroken`)

### Implementation for User Story 4

- [X] T029 [US4] Dans `mobile/src/features/sharing/InviteEmailCard.tsx`, si `list.role === "owner"` : bouton `share.regenerate` (`list:share.regenerate`, variante outline) + texte `list:share.regenerateHint` + `ConfirmDialog` (`list:confirm.regenTitle`, `regenBody`, `regenConfirm`, `regenKeep`, bouton de confirmation par défaut) → `regenerateInvite` ; erreur affichée dans la carte ; désactivé hors ligne (dépend de T004, T011)
- [X] T030 [US4] Vérifier à la main la story 4 du quickstart et jouer `017-us4-regenerate.yaml` — fait : le parcours passe (iOS, FR, 2026-11-06), `copyTextFrom` fonctionne sur le champ
- [X] T031 [US4] Commit de la story : contrôles verts, puis `feat: replace the invite link from the app (US4)`, sans demander

---

## Phase 7: User Story 5 - Supprimer la liste (Priority: P3)

**Goal**: le propriétaire supprime la liste depuis Réglages ; une personne seule qui veut quitter se voit proposer la suppression.

**Independent Test**: supprimer une liste créée pour l'occasion ; elle disparaît partout (quickstart, story 5).

### Tests for User Story 5

- [X] T032 [P] [US5] Créer `mobile/__tests__/screens/settings.test.tsx` : propriétaire : carte `list:settings.danger` après les éditeurs de catégories et de « qui », bouton `settings.delete-list` ; confirmation (`settings.delete-confirm`, titre `list:confirm.deleteListTitle` avec le titre de la liste, + `mobile:sharing.pendingLost` s'il y a des changements en attente) → `DELETE /lists/{listId}`, copie et changements de la liste retirés, `router.replace("/")` ; « Conserver la liste » → aucun appel ; membre : pas de carte ; hors ligne ou liste `localOnly` : bouton désactivé
- [X] T033 [P] [US5] Ajouter à `mobile/__tests__/screens/share.test.tsx` : après un refus `aloneMustDelete`, le bouton `share.alone-delete` (`list:settings.delete`) ouvre la confirmation de suppression, qui supprime la liste et revient à « Mes listes »
- [X] T034 [P] [US5] Écrire `mobile/.maestro/flows/017-us5-delete-list.yaml` (tag `017-us5`) sur un compte créé par le parcours : créer deux listes ; supprimer la première depuis Réglages (`settings.delete-list` → `settings.delete-confirm`) → « Mes listes » sans elle ; sur la seconde, onglet Partage → « Quitter cette liste » → `share.alone-delete` → confirmer → « Mes listes » sans elle

### Implementation for User Story 5

- [X] T035 [US5] Créer `mobile/src/features/lists/DeleteListCard.tsx` : hook `useDeleteList(list)` (état d'ouverture de la confirmation, `useServerAction(deleteList)`, `router.replace("/")` après succès, `ConfirmDialog` : `list:confirm.deleteListTitle` avec `name`, `deleteListBody` suivi de `mobile:sharing.pendingLost` si `usePendingCountFor(list.id) > 0`, `deleteListConfirm`, `deleteListKeep`, bouton destructif) et composant `DeleteListCard` (carte `list:settings.danger` / `list:settings.dangerHint`, bouton destructif `settings.delete-list` `list:settings.delete`, prop `disabled`) qui l'utilise (dépend de T004)
- [X] T036 [US5] Dans `mobile/app/(app)/lists/[listId]/settings.tsx`, ajouter `DeleteListCard` après les deux `LabelEditor` si `list.role === "owner"`, désactivée comme eux (`!online || list.localOnly`) ; mettre à jour le commentaire d'en-tête (seule l'apparence reste sur le site)
- [X] T037 [US5] Dans `mobile/src/features/sharing/MembersCard.tsx`, quand l'erreur de « Quitter » est `aloneMustDelete`, afficher sous le message le bouton `share.alone-delete` (`list:settings.delete`) qui ouvre la confirmation de `useDeleteList` (research R5) ; l'erreur doit donc garder son code (`ApiError.code`) en plus du texte traduit (dépend de T035) — fait par le composant `AloneDeleteButton` de `DeleteListCard.tsx`, passé à `MembersCard` par `share.tsx` ; 017 ajouté à `mobile/__tests__/e2e/coverage.test.ts`
- [X] T038 [US5] Vérifier à la main la story 5 du quickstart (avec un changement en attente) et jouer `017-us5-delete-list.yaml` — fait : le parcours passe (iOS, FR, 2026-11-07) ; l'avertissement des changements en attente est couvert par `settings.test.tsx` (exclusions.md)
- [X] T039 [US5] Commit de la story : contrôles verts, puis `feat: delete a list from the app (US5)`, sans demander

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T040 [P] Mettre à jour `specs/005-mobile-list-app/design-reference.md` : ligne « Liste – Partage » du tableau des écarts (l. ~116, invitations, mot de passe et membres ne restent plus sur le site) et ligne de correspondance (l. ~88) avec les cartes ajoutées ; mentionner la carte « Supprimer la liste » de l'onglet Réglages
- [X] T041 [P] Ajouter à `mobile/.maestro/exclusions.md` : contenu reçu par l'application choisie dans la feuille de partage pour le lien d'invitation (017-us1), message de limite d'envoi des invitations (429, 8 par heure)
- [X] T042 Refaire si besoin les captures `09-liste-partage.png` et `10-liste-reglages.png` (`DEMO_BASE_URL=http://localhost:3010 npm run demo:capture -- --mobile`), puis comparer côte à côte l'app et le site (propriétaire alex, membre camille ; FR puis EN) ; corriger ou justifier chaque écart dans `design-reference.md` — fait sans refaire les captures du site (la feature ne change pas le site) : comparaison côte à côte FR/EN, alex puis camille ; corrigés : titre de l'onglet en `2xl` gras, « Quitter cette liste » à la largeur de son texte, noms et états en graisse normale (`font-medium` du site)
- [X] T043 Relire les textes de la clé `sharing` (`locales/{fr,en}/mobile.json`) dans l'app : vouvoiement, lexique, pluriel de `pendingLost` — fait : « Send invitation link » aligné sur les textes anglais du site (« invitation link »)
- [X] T044 Jouer toute la suite e2e iOS (`DEMO_PASSWORD=… npm --prefix mobile run e2e`), MailDev sur 1026/1081 : les parcours 017 et ceux qui utilisent la liste de démo passent ensemble — fait le 2026-11-07 : 26 réussis, 1 échec, 1 non joué. L'échec, `009-us4`, ne vient pas de la 017 : rejoué seul il passe ; un autre parcours modifie la liste de démo plus tôt dans la même exécution (9 idées et 2 archives au lieu de 8 et 1). À traiter à part
- [X] T045 Dérouler `specs/017-mobile-sharing/quickstart.md` en entier — 2026-11-07, sur le simulateur (build Release) : parcours 017-us1 à 017-us5 en français (US3 joue aussi le remplacement du mot de passe) ; propriétaire qui quitte, le membre devient propriétaire (parcours ponctuel, non versionné) ; écrans Partage et Réglages en anglais (app relancée en `AppleLanguages (en)`, compte alex). Le mot de passe se vérifie dans la vue invitée de l'app, pas dans Safari (même contrôle du serveur). Le hors ligne n'est vérifié que par les tests jest (`setOnline`) : couper le réseau du simulateur coupe aussi celui de la session. La suite e2e en `E2E_LANG=en` échoue à la confirmation d'adresse (page du site en français, problème des URL anglaises, branche 018)
- [X] T046 Retirer `share.manageOnSite` de `locales/fr/mobile.json` et `locales/en/mobile.json` s'il n'est plus utilisé (`grep -rn manageOnSite mobile/`)
- [X] T047 Commit Polish : contrôles verts, puis `chore: design reference, e2e exclusions and texts for sharing in the app`, sans demander

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** : aucune dépendance.
- **Foundational (T002-T006)** : après Setup ; bloque toutes les stories. T002 et T003 en parallèle ; T004 après eux ; T005 après T004 ; T006 indépendant.
- **US1 (Phase 3)** : après Foundational.
- **US2 (Phase 4)** : après Foundational pour le code ; son parcours e2e (T016) utilise l'invitation par e-mail de US1.
- **US3 (Phase 5)** : après Foundational ; T024 suppose `share.tsx` réécrit (T012).
- **US4 (Phase 6)** : après US1 (modifie `InviteEmailCard`).
- **US5 (Phase 7)** : après Foundational pour `DeleteListCard` ; T037 après US2 (modifie `MembersCard`).
- **Polish** : après toutes les stories.

### Within Each User Story

- Tests et parcours (marqués [P]) en parallèle des composants, dans des fichiers différents.
- Composants avant leur branchement dans l'écran ; vérification manuelle et parcours e2e avant le commit, qui est la dernière tâche de la phase.

### Parallel Opportunities

- T002 / T003 / T006 ; dans US1 : T007, T008, T009, T010, T011 ; dans chaque story suivante, ses tests unitaires et son parcours Maestro.

---

## Parallel Example: User Story 1

```bash
Task: "Adapter mobile/__tests__/screens/share.test.tsx (T007)"
Task: "Parcours mobile/.maestro/flows/017-us1-invite.yaml (T008)"
Task: "Modifier mobile/.maestro/flows/005-us4-share.yaml (T009)"
Task: "Créer mobile/src/features/sharing/InviteCard.tsx (T010)"
Task: "Créer mobile/src/features/sharing/InviteEmailCard.tsx (T011)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational.
2. US1 : inviter depuis l'app. **STOP** : vérifier seule (quickstart story 1), commit.

### Incremental Delivery

1. US1 → inviter.
2. US2 → membres et sortie (le lien vers le site reste pour le mot de passe).
3. US3 → mot de passe ; le lien vers le site disparaît.
4. US4 → remplacer le lien.
5. US5 → suppression, et proposition faite à une personne seule.
6. Polish → design, exclusions, suite e2e complète.

---

## Notes

- Aucune modification de `src/`, `app/` ni du contrat 004 : si une tâche semble l'exiger, s'arrêter et revoir research R1.
- Les parcours qui retirent, quittent, suppriment ou changent un mot de passe n'utilisent jamais la liste de démo partagée (alex / camille), dont dépendent d'autres parcours.
- `copyTextFrom` (T028) n'est encore utilisé par aucun parcours : s'il ne marche pas sur le champ, lire l'ancien lien par une invitation e-mail à soi-même (`subflows/open-mail-link.yaml`, `KIND: inviter`) avant le remplacement.
