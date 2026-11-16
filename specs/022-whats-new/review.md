# Revue de code

Revue complète de la feature 022, depuis `f0f20e1`.

## Fichiers relus

```text
ece626afa111ed2b81d4f19ae6c3c521cb6b3fc0  locales/en/content.json
9dbdbd2bbdca468cf3aac4258d1125afec968752  locales/en/mobile.json
79aca9056d50a644897e4c53208c299fe6ab2480  locales/fr/content.json
e730e04fb777446a4db2b1bea4a681a823ad5da0  locales/fr/mobile.json
c18af085e4136636b701556bcc8b44f19dc7d4be  mobile/.maestro/flows/022-us1-fresh-install.yaml
a57b34fba7655567fe11226956c170464234f239  mobile/.maestro/flows/022-us2-whats-new-screen.yaml
d4c49557174f5c5e61b5372a974110f7ab2a0082  mobile/__tests__/e2e/coverage.test.ts
724926c847fdbd8a8ddcb628352c454f15b0558a  mobile/__tests__/features/update-prompt.test.tsx
1a40970213a98d28c2e1c6314a3f1e5e6ee510b9  mobile/__tests__/features/whats-new.test.tsx
580fb646d9c89753fa7bdb0d091bdae7d6498d97  mobile/__tests__/helpers/app-version.ts
e171df7c5539cefecd02e42230cc3807941a815c  mobile/__tests__/screens/account.test.tsx
eff0f7324633b8c266142593d22cfc4ff2c01b0a  mobile/__tests__/screens/whats-new.test.tsx
a13cf3fb10c74ef638110ea324a6af505305a503  mobile/__tests__/whats-new/policy.test.ts
f170b957bc7141850bc265c14f199e406ee02738  mobile/__tests__/whats-new/releases.test.ts
1572ba68a980a18f99780073dbdc98fed87cdab6  mobile/__tests__/whats-new/state.test.ts
139013d9cc0416a744743dbf70076325495b798f  mobile/app/(app)/account.tsx
0286d3803541180b91c30d1c75cfba552e1bb540  mobile/app/(app)/whats-new.tsx
74af5bdac6c7f6c4fd03a3e23979f13c40cc7d0d  mobile/app/_layout.tsx
e80fb2f070b2d4384f660d7e151bd73b5aec1e11  mobile/src/features/update/UpdatePrompt.tsx
535381b0115ec47573a8f88d29781a455c8526c7  mobile/src/features/whats-new/WhatsNew.tsx
b781e1d547e02fa22c28f2747bd2c99c5e71a83a  mobile/src/whats-new/policy.ts
6335a3ae8bd2336a0a836a836449cf439611779f  mobile/src/whats-new/releases.ts
0f70d10458434a3fdc55aca7bf0f4e962d4c2b69  mobile/src/whats-new/state.ts
```

## Règles métier et tests

- [x] mobile/src/features/update/UpdatePrompt.tsx:48 — Une mise à jour Android déjà en cours (`updateInProgress`) est relancée tout de suite, même pendant la pause : l'écran de Google Play peut passer par-dessus « Quoi de neuf » (FR-008, T011, contrat). Correction : la garder en attente comme `androidOffer` et la lancer quand `paused` repasse à faux.
- [x] mobile/__tests__/features/whats-new.test.tsx:53 — Pas de test de fermeture par le geste du système (FR-003, T010). Correction : fermer par le fond (`common:actions.close`) et vérifier fenêtre fermée, `lastSeen` = `1.1.1`, `onShownChange(false)`.
- [x] mobile/__tests__/features/whats-new.test.tsx:90 — Pas de test d'erreur de stockage (T010) ; sans `onShownChange(false)`, la 021 resterait bloquée (FR-008). Correction : rejet de `getLastSeenVersion` ou `hasPastUsage` → pas de fenêtre, `onShownChange(false)`.
- [x] mobile/__tests__/features/update-prompt.test.tsx:96 — Pas de test du retour au premier plan pendant la pause (iOS et Android), ni du cas Android `updateInProgress` pendant la pause (FR-008, T009). Correction : `AppState` → `active` avec `paused` vrai : rien ; puis une seule offre quand `paused` passe à faux.
- [x] specs/022-whats-new/quickstart.md:13 — La section US1 propose un build de développement, où la fenêtre est coupée (`__DEV__`) ; les étapes 2 à 7 n'y montrent rien (T014). Correction : n'annoncer que deux builds Release de numéros différents, installés l'un par-dessus l'autre.
- [x] specs/022-whats-new/quickstart.md:21 — « App ouverte par un lien » (FR-008) et « version sans nouveautés » (US1-4, FR-007) ne sont vérifiés nulle part de bout en bout. Correction : deux étapes au quickstart, et un test dans `whats-new.test.tsx` (installée `1.1.2`, vue `1.1.1`, pas de nouveautés → pas de fenêtre, `lastSeen` = `1.1.2`).

## Constitution et sécurité

- [x] locales/fr/content.json:175 (et en) — `privacy.appBody` parle de « deux réglages du téléphone » gardés à la déconnexion ; la 022 en ajoute un troisième (`device.whatsNew.lastSeenVersion`). Correction : « trois réglages », en ajoutant « la dernière version dont vous avez vu les nouveautés » / “the last version whose news you saw”.

## Duplication

- [x] mobile/src/features/whats-new/WhatsNew.tsx:27 — `ReleaseNotes` refait le style de `ContentText` (`mobile/src/ui/ContentSection.tsx:68`). Correction : rendre chaque phrase avec `ContentText`.
- [x] mobile/__tests__/screens/whats-new.test.tsx:15 — `installVersion` est recopié depuis `mobile/__tests__/features/whats-new.test.tsx:11`. Correction : un helper partagé, `mobile/__tests__/helpers/app-version.ts`.
- [x] mobile/__tests__/screens/whats-new.test.tsx:12 — Le mock de `@/whats-new/releases` réécrit `releaseKey`. Correction : `...jest.requireActual("@/whats-new/releases")` et ne remplacer que `RELEASES`.

## Conventions

Aucun point.

## i18n

- [x] mobile/app/(app)/whats-new.tsx:24 — En français, l'entrée « Nouveautés » ouvre un écran titré « Quoi de neuf » (`whatsNew.title`). Correction : titrer l'écran avec une clé « Nouveautés » / “What's new” et garder `whatsNew.title` pour la fenêtre.
