# Bug Verification: Images d'idées cassées (adresse de page en image, texte alternatif affiché)

- **Slug**: broken-idea-images
- **Tested**: 2026-11-24
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

Sur une base de démo, deux idées de la liste publique ont reçu une image cassée (l'adresse de leur page, et une image en 404) : la liste affiche un emplacement neutre avec une icône cadeau, plus de texte alternatif. La saisie d'une adresse de page comme image est refusée. Aucune régression dans la suite.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix), affichage | base de démo, `image_url` de `demo-list:roman` = `https://example.com/roman` et de `demo-list:carnet` = `https://example.com/missing-cover.jpg`, `/l/demo-list-lecture` ouverte dans Chrome | pass | aucun `<img>` cassé dans le DOM ; deux emplacements `role="img"` aux noms des idées ; capture : carré neutre avec l'icône cadeau |
| Reproduction (post-fix), saisie | `saveItem` sur une copie de la base de démo, réseau réel | pass | image = lien de l'idée → `imageIsPage` ; image = page HTML `https://example.com/` → `imageNotImage` ; vraie image PNG → enregistrée |
| New / updated tests | `node --test tests/domain/image-url.test.ts tests/domain/items.test.ts` | pass | |
| Regression suite | `npm test` | pass | 536 pass, 0 fail |
| Lint / type-check | `npm run lint`, `npm run typecheck` | pass | |
| Enrichissement (`enrichFromUrl`) | — | not-run | demande une vraie page produit ; même `sameAddress` / `probeImage` que la saisie, testés |
| App mobile | — | not-run | aucun changement (voir fix.md) |

## Output Excerpts

```
page as image: { ok: false, error: 'imageIsPage' }
html page as image: { ok: false, error: 'imageNotImage' }
real image: true
ℹ pass 536
ℹ fail 0
```

## Residual Risks

- Une image servie avec un mauvais type (`text/plain`…) par un hébergeur sera refusée à la saisie.
- Une adresse de page d'un site qui bloque les robots (403) reste acceptée si elle diffère du lien de l'idée ; l'affichage neutre couvre ce cas.
- Les 5 idées de prod restent à corriger par leur propriétaire.

## Recommendation

Fermer le bug après déploiement : vérifié sur la base de démo (affichage et saisie).
