# Contrat des écrans : mise à jour disponible (021)

Pas de changement du contrat d'API. Textes dans `locales/{fr,en}/mobile.json` (namespace `mobile`), à côté du bloc `upgrade` existant. Libellés FR indicatifs.

## Clés i18n nouvelles

| Clé | FR | EN |
|-----|----|----|
| `mobile:update.title` | Nouvelle version disponible | New version available |
| `mobile:update.body` | Une nouvelle version de l'application est disponible. Mettez-la à jour pour profiter des dernières nouveautés. | A new version of the app is available. Update it to get the latest features. |
| `mobile:update.now` | Mettre à jour | Update |
| `mobile:update.later` | Plus tard | Later |

## iOS : fenêtre « nouvelle version »

- Composant `mobile/src/features/update/UpdatePrompt.tsx`, monté une fois dans `mobile/app/_layout.tsx`, après la pile d'écrans (par-dessus tout écran, FR-010).
- `ConfirmDialog` (`mobile/src/ui/ConfirmDialog.tsx`, `destructive={false}`) : titre `update.title`, texte `update.body`, action `update.now`, retrait `update.later`.
- `testID` : `update.prompt` (bouton « Mettre à jour »), `update.prompt-keep` (« Plus tard », suffixe `-keep` du `ConfirmDialog`).

## Android

Aucun écran propre à l'app : proposition flexible, puis écran d'installation de Google. `UpdatePrompt` ne rend rien sur Android ; il lance la proposition et écoute `updateCancelled`.

## Écrans non modifiés

`UpgradeRequired` (API trop ancienne, 410) reste tel quel.
