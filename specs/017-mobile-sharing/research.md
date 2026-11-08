# Recherche : gérer le partage d'une liste dans l'app mobile (017)

Pas de point ouvert dans le contexte technique. Les décisions ci-dessous viennent de la lecture du code (`main`, 0fd3395).

## R1 — Le serveur et le contrat ne changent pas

- **Décision** : aucune route, aucune commande et aucune règle métier nouvelle. L'app appelle les routes de la feature 004 déjà en place :

  | Action | Route | Réponse utile |
  |--------|-------|---------------|
  | Vue de la liste (rôle, lien d'invitation, protection, membres) | `GET /lists/{listId}` | `MemberList.role`, `inviteUrl`, `hasReadPassword`, `members[]` |
  | Inviter par e-mail | `POST /lists/{listId}/invitations` | 202 ; 400 `emailRequired`, 403 `emailNotVerified`, 429, 502 `inviteSendFailed`, 503 `mailNotConfigured` |
  | Remplacer le lien d'invitation | `POST /lists/{listId}/invite-link` | 200 `{ inviteUrl, inviteToken }` ; refus `ownerRegenerateInvite` |
  | Définir / remplacer le mot de passe | `PUT /lists/{listId}/read-password` | 204 ; 400 `passwordRequired`, `readPasswordTooShort` ; refus `ownerSetReadPassword` |
  | Retirer le mot de passe | `DELETE /lists/{listId}/read-password` | 204 |
  | Retirer un membre | `DELETE /lists/{listId}/members/{userId}` | 204 ; refus `ownerRemoveMember`, `ownerCannotSelfRemove` |
  | Quitter | `POST /lists/{listId}/leave` | 204 ; 400 `aloneMustDelete` |
  | Supprimer la liste | `DELETE /lists/{listId}` | 204 ; 403 `ownerDeleteList` |

  Les types de ces routes sont déjà dans `mobile/src/api/schema.d.ts` (généré du contrat) : pas de `api:types` à relancer.
- **Pourquoi** : spec, hypothèse « le serveur offre déjà toutes les actions ». La vue membre est construite avec la langue de la requête (`siteUrl(origin, locale, …)`), donc `inviteUrl` est déjà dans la langue de l'app.
- **Alternatives écartées** : une route qui rend la `MemberList` après chaque action, pour éviter le second appel. Non : on garde le motif des réglages (`labels.ts` : action puis `refreshList`), et une liste se recharge en un seul appel.

## R2 — Appels directs, pas de file hors ligne

- **Décision** : un module `mobile/src/data/sharing.ts` sur le modèle de `mobile/src/data/labels.ts` : appel direct (`ok` / `done` de `@/api/client`), puis `refreshList(listId)`. Les écrans passent par `useServerAction` (`mobile/src/features/errors.ts`) : bouton occupé, erreur traduite (`errorText` → `translateError`), champs gardés.
- **Pourquoi** : spec FR-041 et cas limite « Hors ligne » (même règle que FR-029b de la 005). Ces actions touchent aux droits d'autres personnes ; les rejouer plus tard, après d'autres changements, serait surprenant.
- **Alternatives écartées** : ajouter ces actions à la file (`outbox`). Plus complexe (nouveaux `kind`, dépendances, refus différés), sans bénéfice pour des actions rares.

## R3 — Quitter et supprimer : nettoyer le téléphone

- **Décision** : après un 204 de `leave` ou de `DELETE /lists/{listId}`, `sharing.ts` :
  1. retire les changements de la file pour cette liste (nouvelle fonction `discardList(listId)` dans `mobile/src/offline/outbox.ts`, qui supprime toutes les lignes `listId = ?` et prévient les abonnés comme `discard`) ;
  2. retire la copie locale (`removeSnapshot(listKey(listId))`) et la retire de l'état en mémoire (nouvelle fonction `forgetList(listId)` dans `mobile/src/data/store.ts`, sans la marquer `missing` pour ne pas montrer « liste introuvable ») ;
  3. recharge « Mes listes » (`refreshLists`) ; l'écran fait `router.replace("/")`.
- **Pourquoi** : FR-022, FR-026, scénario 5 de la story 2. `refreshList` ne voit un 404 qu'au prochain chargement, et marquerait la liste `missing` (message « liste introuvable ») alors que la personne vient de la quitter elle-même.
- **Avertissement des changements en attente** : le nombre vient de `state.changes` filtré par `listId` (nouveau sélecteur `usePendingCountFor(listId)` à côté de `usePendingCount`). S'il est positif, la confirmation ajoute une phrase propre à l'app (`mobile:sharing.pendingLost`, avec le nombre).
- **Alternatives écartées** : attendre l'envoi des changements avant de quitter. Bloquerait la personne hors ligne pour rien : elle ne pourra plus écrire dans la liste de toute façon.

## R4 — Partager le lien d'invitation : bouton propre à la carte

- **Décision** : la carte « Gérer la liste à plusieurs » a un bouton « Envoyer le lien d'invitation » (texte propre à l'app, `mobile:sharing.shareInvite`) qui ouvre `Share.share` avec le message `mobile:sharing.inviteMessage` (« Rejoignez-moi pour gérer la liste « {{title}} » : {{url}} »). Le message contient l'URL ; on ne passe pas `url` en plus (doublon sur iOS, déjà noté dans `share.tsx`). Le bouton « Partager » de la carte précédente reste sur `readUrl` (FR-013).
- **Pourquoi** : clarification Q1 de la spec.
- **Alternatives écartées** : un seul bouton « Partager » qui demande quel lien envoyer (abandonne FR-023 de la 005).

## R5 — Composants : reprendre le site, extraire ce qui se répète

- **Décision** :
  - `CopyLinkField` : champ en lecture seule + bouton copier + message « Lien copié. », aujourd'hui écrit en ligne dans `share.tsx`. Il sert deux fois (lien public, lien d'invitation) : extrait dans `mobile/src/features/sharing/CopyLinkField.tsx`, pendant de `components/site/copy-link-field.tsx` (composant métier côté site, donc dans `features/`, pas dans `ui/`).
  - Cartes de l'onglet : `InviteCard`, `InviteEmailCard` (avec « Remplacer le lien d'invitation » pour le propriétaire), `ReadPasswordCard`, `MembersCard` dans `mobile/src/features/sharing/`, composées de `Card`, `Field`, `Input`, `PasswordInput` (016), `Button`, `Alert`, `ConfirmDialog` de `mobile/src/ui/`. Aucun style en dur dans les écrans.
  - Suppression de la liste : `DeleteListCard` dans `mobile/src/features/lists/` (onglet Réglages), avec un hook `useDeleteList(listId)` qui porte la confirmation et l'appel, réutilisé par `MembersCard` pour la proposition faite à une personne seule (`aloneMustDelete`).
- **Pourquoi** : AGENTS.md (« Réutiliser l'existant », « Un écran n'écrit aucun style en dur ») ; mémoire « design fidèle au site ».
- **Alternatives écartées** : naviguer vers l'onglet Réglages pour supprimer quand on est seul. Un détour, alors que la confirmation peut s'ouvrir sur place.

## R6 — Textes

- **Décision** : tous les textes de l'onglet Partage et de la carte de suppression viennent des namespaces du site déjà chargés par l'app : `list:share.*`, `list:confirm.*`, `list:settings.danger|dangerHint|delete`, `list:inviteSent`, erreurs via `translateError`. Textes propres à l'app, dans `locales/{fr,en}/mobile.json`, sous une nouvelle clé `sharing` : `shareInvite`, `inviteMessage`, `pendingLost`, `offline` (actions de gestion indisponibles hors ligne). Le bouton proposé à une personne seule reprend `list:settings.delete` (« Supprimer la liste »). Les clés `mobile:share.manageOnSite` et l'URL admin disparaissent ; `mobile:share.passwordNotice` reste pour les membres non propriétaires.
- **Pourquoi** : FR-001, SC-004 ; règle i18n d'AGENTS.md (mêmes clés FR/EN).

## R7 — Rôle et affichage conditionnel

- **Décision** : les cartes et boutons propres au propriétaire se décident sur `list.role === "owner"` de la `MemberList` locale. Une liste créée hors ligne (`localOnly`) garde le message actuel et n'affiche aucune carte de gestion. Hors ligne (`useOnline()` faux), les cartes s'affichent avec le dernier état connu, leurs boutons d'écriture sont désactivés et une seule alerte explique pourquoi (`mobile:sharing.offline`), comme `settings.tsx`.
- Après un refus `owner*` ou `notMember` (rôle changé ailleurs), l'erreur s'affiche et l'écran appelle `refreshList` : les cartes suivent le nouveau rôle, ou l'écran passe à « liste introuvable » (comportement 005).

## R8 — Parcours e2e

- **Décision** : un parcours par story, `mobile/.maestro/flows/017-us{1..5}-*.yaml`. La base e2e n'est remplacée qu'une fois par exécution : les parcours qui retirent, quittent ou suppriment ne touchent pas la liste de démo partagée (alex propriétaire, camille membre), dont dépendent d'autres parcours. Ils travaillent sur des comptes créés par le parcours (`subflows/register.yaml`) et sur une liste créée par le parcours (`subflows/create-list.yaml`). Le second compte rejoint par le lien d'invitation lu dans le champ (`copyTextFrom` puis `openLink: ${maestro.copiedText}`, schéma déjà accepté par 011).
  - US1 : copier le lien (message « Lien copié. »), ouvrir la feuille de partage du lien d'invitation et la fermer (`subflows/close-share-sheet.yaml`), envoyer une invitation par e-mail et lire l'e-mail dans MailDev (`subflows/open-mail-link.yaml`) : le lien ouvre l'invitation.
  - US2 : compte A crée une liste, compte B la rejoint, A voit B « Membre » et le retire ; B rejoint à nouveau puis quitte ; A seul tente de quitter : message `aloneMustDelete` et bouton de suppression.
  - US3 : A définit un mot de passe trop court (refus), puis valide (carte « protégée ») ; déconnecté, le lien public demande le mot de passe ; A le retire.
  - US4 : A remplace le lien ; l'ancien lien est refusé à B.
  - US5 : A supprime une liste depuis Réglages ; elle disparaît de « Mes listes ».
- **À modifier** : `005-us4-share.yaml` vérifie `assertNotVisible: .*demo-list-invitation.*` sur l'onglet entier ; la carte d'invitation l'y fait apparaître. Le contrôle devient : le champ `share.read-link` contient le lien de lecture et pas le lien d'invitation (FR-023 de la 005 reste vrai pour ce champ et pour le bouton « Partager »).
- **Restent manuels** (`exclusions.md`) : le contenu reçu par l'application choisie dans la feuille de partage (déjà exclu pour 005-us4), le message de limite d'envoi (429 après 8 invitations en une heure, trop long à provoquer).

## R9 — Design

- **Décision** : l'écran suit `09-liste-partage.png` (onglet Partage du site, compte propriétaire alex, toutes les cartes) et la carte « Supprimer la liste » de `10-liste-reglages.png`. Les deux captures sont produites par `npm run demo:capture -- --mobile` (`scripts/capture-demo.mjs`, l. 273-274) ; on les refait si elles datent d'avant la 016 (champ mot de passe avec œil), puis on compare côte à côte avec l'app sur la même liste de démo, propriétaire puis membre (camille). Dans `specs/005-mobile-list-app/design-reference.md`, la ligne d'écart « Liste – Partage » (l. 116) et la note « Liste appearance and deletion stay on the site » de `settings.tsx` sont mises à jour.

## R10 — Publication

- **Décision** : fonction nouvelle de l'app, sans changement du serveur : nouvelle version mineure de l'app (1.1.0), sans contrainte de version minimale du serveur (routes en place depuis 004). Les notes de revue App Store peuvent de nouveau mentionner le mot de passe de lecture. Hors code ; noté pour la mise en store.
