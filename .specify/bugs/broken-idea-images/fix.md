# Bug Fix: Images d'idées cassées (adresse de page en image, texte alternatif affiché)

- **Slug**: broken-idea-images
- **Fixed**: 2026-11-24
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

L'adresse d'image d'une idée est maintenant contrôlée : refusée si c'est le lien de l'idée, vérifiée sur le réseau quand elle est nouvelle (enrichissement et saisie manuelle). Sur le site, une image qui ne charge pas laisse place à un emplacement neutre avec une icône cadeau au lieu du texte alternatif.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `src/domain/image-url.ts` | added | `sameAddress` (pur) et `probeImage` (via `safeHttpGet` : `image` / `notImage` / `unknown`) |
| `src/domain/items.ts` | modified | règle `imageIsPage` dans `createItem` et `updateItem` (en modification, seulement si l'image change) |
| `src/server/commands/items.ts` | modified | `resolveImageUrl` vérifie une image saisie nouvelle (`imageNotImage`) et ignore une image trouvée égale à la page ; `enrichFromUrl` retire une image égale à la page ou qui n'en est pas une |
| `components/site/idea-image.tsx` | added | image d'idée avec repli neutre, y compris pour un échec avant l'hydratation |
| `components/site/public-item-card.tsx`, `app/g/[token]/page.tsx` | modified | utilisent `IdeaImage` |
| `components/site/item-form.tsx` | modified | l'aperçu en échec se cache (le cadre neutre reste) |
| `locales/{fr,en}/errors.json` | modified | `imageIsPage`, `imageNotImage` |
| `tests/domain/image-url.test.ts` | added test | |
| `tests/domain/items.test.ts` | added test | |

## Tests Added or Updated

- `tests/domain/image-url.test.ts` — `sameAddress` (fragment, `/` final, adresses invalides) ; `probeImage` : image, page HTML, 404/410 → refus ; 403, 5xx, sans type, erreur réseau → gardée ; adresse privée jamais appelée.
- `tests/domain/items.test.ts::an idea's image cannot be the idea's own link…` — création et changement refusés, idée déjà enregistrée ainsi toujours modifiable.

## Local Verification

- `npm test` → 536 pass, 0 fail
- `npm run lint` → OK
- `npm run typecheck` → OK

## Deviations from Assessment

- Contrat OpenAPI inchangé : il n'énumère pas les codes d'erreur de validation.
- App mobile inchangée : une `Image` React Native en échec n'affiche pas de texte alternatif (constaté dans l'évaluation).
- Au-delà de la limite de recherches d'image (`item-image`), une image saisie est enregistrée sans vérification plutôt que l'enregistrement refusé (comportement d'avant, attendu par `commands-items.test.ts`).

## Follow-ups

- Les 5 idées de la liste en prod restent à corriger par leur propriétaire (elles s'affichent désormais avec l'emplacement neutre).
