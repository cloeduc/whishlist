# Bug Verification: Confirmation d'adresse e2e bloquée dans Safari

- **Slug**: e2e-confirm-email-safari
- **Tested**: 2026-11-06
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

Dans les mêmes conditions (`next dev` à froid, bulle de Safari réarmée), `010-us1` échoue avec les anciens sous-parcours et passe avec la correction : la bulle est fermée, le `POST` arrive, le texte de succès s'affiche. Aucune régression dans les vérifications du dépôt.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (avant correction) | Sous-parcours de 9811b76, `next dev` à froid, bulle réarmée, `npm --prefix mobile run e2e -- .maestro/flows/010-us1-verify-email.yaml` | fail (attendu) | `GET /confirmer-email/<jeton>` seul, aucun `POST` ; « Confirmer » encore affiché à l'échec : le tap n'a fait que fermer la bulle |
| Reproduction (après correction) | Mêmes conditions, sous-parcours de 85a4b85 | pass | `Tap on id: xmark.circle.fill COMPLETED`, puis `GET`, `POST`, `GET …?ok=verify` |
| Sans bulle (Safari déjà utilisé) | même commande, 3 exécutions | pass | La branche `TipView` est sautée, rien ne change |
| Suite des parcours qui confirment une adresse | 005-us1, 005-us2, 006-us1, 006-us3, 010-us1, 010-us2, 010-us3 (avant correction, Safari déjà utilisé) | pass | Les sept passent dès que la bulle est absente |
| Tests mis à jour | `npm --prefix mobile test` | pass | 40 suites, 264 tests (dont `test-ids.test.ts`) |
| Régression site | `npm test` | pass | 398 pass, 0 fail |
| Lint / types | `npm run lint`, `npm run typecheck`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` | pass | |
| `share-from-safari.yaml` (015-us1) avec la bulle | — | not-run | Le simulateur devait être rendu à WHIS-1 |

Environnement : iPhone 17 Pro Max iOS 26.5 (E26F103A-…), app Release pointée sur `http://localhost:3010`, MailDev sur 1026/1081 (`E2E_MAILDEV_URL`), `E2E_LANG=fr`.

Réarmer la bulle (pour rejouer la preuve) : Safari arrêté, clé `WBSOnboardingStatesDefaultsKeyV0.2 → TipForMoreButton` retirée de `com.apple.mobilesafari.plist` (conteneur de Safari), dossier `.tipkit` du groupe `com.apple.mobilesafari` déplacé, `cfprefsd` relancé. Sans `next dev` à froid, la page se charge avant la bulle et l'ancien parcours passe parfois : l'échec dépend du moment où la bulle s'ouvre.

## Output Excerpts

Avant :

```
✗ 010 US1 — Confirm your address after signing up
    screenshot: …/step-071-assertCondition-${DONE}.png
 GET /confirmer-email/kCVusBHH9ofmCEHGeeYkZ_kUQSgyvEi1teqSnn7Rd10 200 in 2.3s
```

Après :

```
✓ 010 US1 — Confirm your address after signing up  83 s
 GET /confirmer-email/FjSh…Xaw 200 in 2.7s
 GET /confirmer-email/FjSh…Xaw?ok=verify 200 in 24ms
 POST /confirmer-email/FjSh…Xaw 200 in 69ms
onCommandFinished: Tap on id: xmark.circle.fill COMPLETED
```

## Residual Risks

- La bulle est propre à iOS 26.5 ; une autre version peut en montrer une autre, que `dismiss-safari-tip.yaml` ne connaît pas.
- `share-from-safari.yaml` corrigé sans être rejoué avec la bulle ouverte.
- Les parcours 011-us1 et 011-us2, puis 012-us2 et 012-us3 par contrecoup, échouent pour une autre raison : la boîte « Ouvrir dans … ? » d'un lien `ohyoushouldnt://`. La suite complète n'est donc pas encore verte.

## Recommendation

Fermer ce bug : vérifié de bout en bout sur le simulateur, avant et après. Ouvrir un bug séparé pour la boîte « Ouvrir dans … ? » des parcours 011.
