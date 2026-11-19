# Bug Fix: Pages du site rechargées en boucle dans Safari pendant la suite e2e (next dev)

- **Slug**: e2e-safari-dev-reload-loop
- **Fixed**: 2026-11-09
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

La suite garde `next dev`, démarré avec un `.next/` neuf. Le README de la suite décrit le symptôme (rechargements en boucle dans Safari, « Compiled in 0ms » en rafale), le remède (arrêter le serveur, supprimer `.next/`, relancer) et la précaution à prendre : ne pas builder ni travailler dans le dossier servi pendant la suite. La commande que `e2e.mjs` affiche quand le serveur manque part aussi d'un `.next/` neuf.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `mobile/.maestro/README.md` | modified | Étape 3 : `rm -rf .next &&` avant `npm run dev` ; paragraphe « Pages rechargées en boucle » |
| `mobile/scripts/e2e.mjs` | modified | `serverHint()` : `rm -rf .next &&` en tête de la commande affichée |

## Diff Highlights (optional)

```js
function serverHint(apiUrl) {
  const port = new URL(apiUrl).port || "80";
  // A fresh .next/: a stale dev cache can reload the pages open in Safari endlessly (see README).
  return `rm -rf .next && MAIL_SMTP_URL=smtp://localhost:1025 WISHLIST_DATA_PATH=tmp/e2e/wishlist.json npm run dev -- --port ${port}`;
}
```

## Tests Added or Updated

- Aucun test ajouté : la cause est dans l'environnement (cache de `next dev`), pas dans le code de l'app, du site ou de la commande. La preuve est le run des parcours concernés (voir `test.md`).

## Local Verification

- Commands run: `npm --prefix mobile run lint` → ok ; `npm --prefix mobile test` → 44 suites, 336 tests passés ; `tests/domain/code-language.test.ts` → 3/3.
- Manual checks : `.next/` supprimé et serveur relancé ; Safari relancé avec ses onglets restaurés : 1 `GET` en 30 s ; 010-us1, 006-us1, 005-us2 passent (`tmp/e2e/results/20261109-094312-ios`). Les 8 autres parcours concernés tournent.

## Deviations from Assessment

- Pas de nettoyage des onglets de Safari dans `e2e.mjs` (prévu par l'ancienne recommandation) : avec un `.next/` sain, les onglets restaurés ne rechargent plus, ce nettoyage n'apporte rien.
- `specs/007-mobile-e2e-maestro/contracts/e2e-command.md` non modifié : il cite le message d'origine de la feature 007 (déjà sans `MAIL_SMTP_URL`), c'est un document de la feature, pas la référence courante.

## Follow-ups

- Si la boucle revient avec un `.next/` neuf et sans build dans le dossier, revenir à l'option du serveur de production (voir l'assessment).
- 017-us3 (`share.password-error` introuvable) : autre cause, à traiter à part.
