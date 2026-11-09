# Bug Verification: Pages du site rechargées en boucle dans Safari pendant la suite e2e (next dev)

- **Slug**: e2e-safari-dev-reload-loop
- **Tested**: 2026-11-09
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

Avec un `.next/` neuf, plus aucune boucle de rechargement. Les 11 parcours qui échouaient le 2026-11-08 sur la confirmation d'adresse passent tous. Les vérifications de l'app ne montrent aucune régression.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Boucle, onglets restaurés | Safari relancé sur le simulateur avec ses 7 onglets du site, requêtes comptées 30 s | pass | 1 `GET`, contre une dizaine par seconde avant |
| Parcours en échec le 2026-11-08 (1/2) | `npm --prefix mobile run e2e -- --platform ios` 010-us1, 006-us1, 005-us2 | pass | 3/3 (`tmp/e2e/results/20261109-094312-ios`) |
| Parcours en échec le 2026-11-08 (2/2) | même commande, 005-us1, 006-us3, 010-us2, 010-us3, 011-us2, 012-us2, 017-us4, 017-us5 | pass | 8/8 en 17 min (`tmp/e2e/results/20261109-095313-ios`) |
| Journal du serveur | comptes sur le journal de `next dev` après les 11 parcours | pass | 27 `GET /confirmer-email`, 13 `POST`, 0 « Compiled » (avant : 15 342 `GET`, 6 `POST`) |
| Tests de l'app | `npm --prefix mobile test` | pass | 44 suites, 336 tests |
| Langue du code | `node --conditions=react-server --import tsx --test tests/domain/code-language.test.ts` | pass | 3/3 (nouveau commentaire de `e2e.mjs`) |
| Lint | `npm --prefix mobile run lint` | pass | |
| Suite complète | — | skipped | Les 16 autres parcours ne passent pas par la confirmation dans Safari ; elle sera jouée pour la tâche T026 de la 018 |
| Reproduction du déclencheur | build de production dans le dossier de `next dev` | not-run | Hypothèse non prouvée (l'ancien `.next/` est supprimé) |

Environnement : iPhone 17 Pro Max iOS 26.5 (E26F103A-…), app Release pointée sur `http://localhost:3010`, `next dev` (Next 16.4.2) avec un `.next/` neuf, MailDev sur 1026/1081, `E2E_LANG=fr`.

## Output Excerpts

```
E2E flows — ios — fr — 2026-11-09 09:43
  ✓ 010 US1 — Confirm your address after signing up  77 s
  ✓ 006 US1 — Delete your account                    168 s
  ✓ 005 US2 — See your lists and create one          119 s
3 passed, 0 failed, 0 not run

E2E flows — ios — fr — 2026-11-09 09:53
  ✓ 005 US1, 006 US3, 010 US2, 010 US3, 011 US2, 012 US2, 017 US4, 017 US5
8 passed, 0 failed, 0 not run
```

## Residual Risks

- Le déclencheur n'est pas prouvé. Si la boucle revient avec un `.next/` neuf et sans build dans le dossier, le remède du README ne suffira plus : passer au serveur de production (alternative de l'assessment).
- La consigne de ne pas travailler dans le dossier servi pendant la suite n'est qu'écrite, rien ne la vérifie.
- 017-us3 (`share.password-error` introuvable) n'a pas été rejoué : autre cause, hors de ce bug.

## Recommendation

Fermer le bug : les 11 parcours en échec passent, et le serveur ne montre plus de recompilation en boucle. Si le symptôme revient, rouvrir avec le journal du serveur et l'état de `.next/` au moment de l'échec.
