# Implementation Plan: Gérer le partage d'une liste dans l'app mobile

**Branch**: `017-mobile-sharing` | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/017-mobile-sharing/spec.md`

## Summary

L'onglet Partage de l'app reprend, carte pour carte, l'onglet Partage du site : lien d'invitation (copie et envoi par le téléphone), invitation par e-mail, remplacement du lien (propriétaire), mot de passe de lecture (propriétaire), membres (retrait par le propriétaire, quitter). L'onglet Réglages gagne la carte « Supprimer la liste » (propriétaire). Le serveur et le contrat d'API ne changent pas : toutes les routes existent depuis la 004 (research R1). Côté app : un module d'appels directs `data/sharing.ts` sur le modèle des réglages, des cartes dans `features/sharing/`, un nettoyage local après « Quitter » ou « Supprimer », et un parcours Maestro par story.

## Technical Context

**Language/Version**: TypeScript 6 ; app Expo SDK 58 (React Native 0.88, React 19.3), Expo Router

**Primary Dependencies**: `openapi-fetch` (client typé du contrat 004), `react-i18next`, `expo-clipboard`, `Share` de React Native, composants `mobile/src/ui/` (dont `PasswordInput` de la 016 et `ConfirmDialog`). Aucune dépendance nouvelle.

**Storage**: rien côté serveur. Sur le téléphone : copie des listes et file des changements dans la base SQLite locale (`mobile/src/offline/`), sans migration ; trois fonctions en plus (data-model.md).

**Testing**: `jest-expo` + Testing Library (`mobile/__tests__/`, faux `fetch`, base en mémoire) ; Maestro (`mobile/.maestro/flows/017-us*.yaml`) ; tests de domaine du serveur inchangés (`npm test`, règles de partage déjà couvertes depuis 001/004).

**Target Platform**: iOS (simulateur de référence iPhone 17 Pro Max, iOS 26.5) et Android ; serveur Next.js existant inchangé.

**Project Type**: app mobile cliente d'une API web existante.

**Performance Goals**: chaque action répond en moins d'une seconde sur un réseau normal (un appel + un rechargement de la liste) ; SC-002 : inviter en moins de 30 s.

**Constraints**: hors ligne, cartes lisibles depuis la copie et actions de gestion désactivées (FR-041) ; textes du site mot pour mot (SC-004) ; aucun style en dur dans les écrans ; fidélité aux captures du site.

**Scale/Scope**: 2 écrans modifiés (Partage, Réglages), 6 composants nouveaux, 1 module de données, 3 fonctions locales, 4 clés i18n par langue, 5 parcours e2e nouveaux et 1 modifié.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Données personnelles hors dépôt | Parcours e2e et quickstart sur comptes fictifs `@example.test` et comptes créés par la suite. | ✅ |
| II. Lecture sans compte, écriture par les membres | Aucune règle d'accès changée ; l'app appelle les routes membres et affiche les refus du serveur. Le mot de passe de lecture reste optionnel et posé par le propriétaire. | ✅ |
| III. Réservation sans collision | Non touché. La suppression de la liste efface ses réservations, comme sur le site. | ✅ |
| IV. Tranches testables | 5 stories indépendantes, chacune avec son parcours Maestro et son passage dans quickstart.md. | ✅ |
| V. Simplicité | Pas de file hors ligne pour ces actions, pas de route nouvelle, pas de dépendance nouvelle. Sert directement à partager une liste. | ✅ |
| Hébergement Docker | Aucune variable d'environnement ni service nouveau ; l'invitation par e-mail reste optionnelle (sans e-mail configuré : message `mailNotConfigured`, lien toujours copiable). | ✅ |

Re-vérification après la phase 1 : inchangée, aucune violation.

## Project Structure

### Documentation (this feature)

```text
specs/017-mobile-sharing/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── screens.md       # onglets Partage et Réglages, rôle par rôle, testID
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
mobile/
├── app/(app)/lists/[listId]/
│   ├── share.tsx                 # modifié : en-tête + 5 cartes, plus de lien vers le site
│   └── settings.tsx              # modifié : carte « Supprimer la liste » (propriétaire)
├── src/
│   ├── data/
│   │   ├── sharing.ts            # nouveau : sendInvite, regenerateInvite, setReadPassword, clearReadPassword,
│   │   │                         #   removeMember, leaveList, deleteList (appel direct, puis refreshList ou forgetList)
│   │   └── store.ts              # modifié : forgetList(listId), usePendingCountFor(listId)
│   ├── offline/
│   │   └── outbox.ts             # modifié : discardList(listId)
│   └── features/
│       ├── sharing/              # nouveau
│       │   ├── CopyLinkField.tsx    # extrait de share.tsx (lien public, lien d'invitation)
│       │   ├── InviteCard.tsx       # « Gérer la liste à plusieurs »
│       │   ├── InviteEmailCard.tsx  # « Inviter par e-mail » + « Remplacer le lien » (propriétaire)
│       │   ├── ReadPasswordCard.tsx # « Protéger l'accès à votre liste » (propriétaire)
│       │   └── MembersCard.tsx      # « Gérer les membres », quitter, proposition de suppression
│       └── lists/
│           └── DeleteListCard.tsx   # carte + hook useDeleteList(listId), réutilisé par MembersCard
├── __tests__/
│   ├── data/sharing.test.ts         # nouveau : appels, rechargement, nettoyage après quitter / supprimer
│   ├── offline/outbox.test.ts       # modifié : discardList
│   └── screens/
│       ├── share.test.tsx           # modifié : cartes par rôle, hors ligne, liste locale, refus
│       └── settings.test.tsx        # nouveau : carte de suppression par rôle, hors ligne
└── .maestro/
    ├── flows/017-us1-invite.yaml, 017-us2-members.yaml, 017-us3-read-password.yaml,
    │         017-us4-regenerate.yaml, 017-us5-delete-list.yaml   # nouveaux
    ├── flows/005-us4-share.yaml     # modifié : lien d'invitation absent du champ de lecture, plus de l'écran
    └── exclusions.md                # contenu reçu par l'app de partage, limite d'envoi (429)

locales/{fr,en}/mobile.json          # clé `sharing` (shareInvite, inviteMessage, pendingLost_one/_other, offline) ;
                                     # retrait de share.manageOnSite
specs/005-mobile-list-app/design-reference.md   # ligne d'écart « Liste – Partage » mise à jour
```

**Structure Decision**: tout se passe dans `mobile/` (app cliente sans règle métier propre, AGENTS.md), plus les fichiers de traduction partagés. Rien dans `src/`, `app/` ni le contrat de la 004. Les composants métier vont dans `mobile/src/features/sharing/` (pendants de `components/site/`) ; les primitives restent celles de `mobile/src/ui/`.

## Phases d'implémentation (pour /speckit-tasks)

1. **Fondations** : `discardList`, `forgetList`, `usePendingCountFor`, `data/sharing.ts`, `CopyLinkField` extrait (sans changement visible), clés i18n.
2. **US1 (P1)** : `InviteCard`, `InviteEmailCard` (sans le remplacement), modification de `005-us4-share.yaml`, parcours `017-us1`.
3. **US2 (P1)** : `MembersCard` (retrait, quitter, nettoyage ; refus `aloneMustDelete` affiché seul pour l'instant), parcours `017-us2`.
4. **US3 (P2)** : `ReadPasswordCard`, avis de la carte 1 à jour, parcours `017-us3`.
5. **US4 (P3)** : « Remplacer le lien d'invitation », parcours `017-us4`.
6. **US5 (P3)** : `DeleteListCard` dans Réglages, `useDeleteList`, bouton « Supprimer la liste » après `aloneMustDelete` dans `MembersCard`, parcours `017-us5`.
7. **Finition** : retrait de `manageOnSite`, design-reference.md, captures, comparaison côte à côte FR/EN, quickstart déroulé.

Chaque story finit par son commit (template de tâches du projet).

## Complexity Tracking

Aucune violation de la constitution : section sans objet.
