# Contrat des écrans : « Quoi de neuf » (022)

Textes dans `locales/{fr,en}/mobile.json`, bloc `whatsNew`. Libellés FR indicatifs ; les phrases de chaque version se valident à la publication (research R9).

## Clés i18n nouvelles

| Clé | FR | EN |
|-----|----|----|
| `mobile:whatsNew.title` | Quoi de neuf | What's new |
| `mobile:whatsNew.version` | Version {{version}} | Version {{version}} |
| `mobile:whatsNew.done` | C'est noté | Got it |
| `mobile:whatsNew.account` | Nouveautés | What's new |
| `mobile:whatsNew.screenEyebrow` | L'application | The app |
| `mobile:whatsNew.screenIntro` | Ce que chaque version a apporté, la plus récente en premier. | What each version brought, newest first. |
| `mobile:whatsNew.releases.1_1_1` | 1 à 5 phrases (research R9) | idem |

## Fenêtre « Quoi de neuf » (US1)

- Composant `mobile/src/features/whats-new/WhatsNew.tsx`, monté dans `mobile/app/_layout.tsx` avant `UpdatePrompt` (FR-008).
- Contenu : titre `whatsNew.title` ; pour chaque version de `show`, un sous-titre `whatsNew.version` et ses phrases en liste ; un seul bouton `whatsNew.done`.
- `testID` : `whats-new.dialog`, `whats-new.version-<x_y_z>`, `whats-new.done`.

## Écran « Nouveautés » (US2)

- `mobile/app/(app)/whats-new.tsx`, sur le modèle de `mobile/app/legal/licenses.tsx` : `BackLink`, `ContentPage` (`screenEyebrow`, `title`, `screenIntro`), une section par version de `RELEASES` jusqu'à la version installée, la plus récente en premier.
- `testID` : `whats-new.screen`, `whats-new.section-<x_y_z>`.
- Entrée : bouton lien `account.whats-new` (`whatsNew.account`) dans `mobile/app/(app)/account.tsx`, juste avant « Licences ».

## `UpdatePrompt` (021)

Nouvelle prop `paused` : tant qu'elle est vraie, la fenêtre iOS reste en attente et la proposition Android n'est pas lancée.
