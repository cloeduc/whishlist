# Bug Fix: Confirmation d'adresse e2e bloquée dans Safari

- **Slug**: e2e-confirm-email-safari
- **Fixed**: 2026-11-06
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Les sous-parcours Maestro qui passent par Safari ferment la bulle de première ouverture de Safari (iOS 26) avant d'agir sur la page. Le site n'est pas modifié : il n'est pas en cause.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `mobile/.maestro/subflows/dismiss-safari-tip.yaml` | added | Ferme la bulle si `id: TipView` est visible (tap sur `id: xmark.circle.fill`) |
| `mobile/.maestro/subflows/confirm-email.yaml` | modified | Deux `retry` : fermer la bulle puis attendre « Confirmer » ; fermer la bulle, taper « Confirmer » s'il est encore là, attendre le texte de succès |
| `mobile/.maestro/subflows/share-from-safari.yaml` | modified | Ferme la bulle avant de taper `MoreMenuButton`, dans un `retry` |
| `mobile/__tests__/e2e/test-ids.test.ts` | modified | `TipView` et `xmark.circle.fill` ajoutés aux identifiants du système |
| `mobile/.maestro/README.md` | modified | Un paragraphe sur la bulle de Safari |

## Diff Highlights

```yaml
- retry:
    maxRetries: 2
    commands:
      - runFlow: dismiss-safari-tip.yaml
      - runFlow:
          when:
            visible: ${output.t.auth.confirmEmail.submit}
          commands:
            - tapOn: ${output.t.auth.confirmEmail.submit}
      - extendedWaitUntil:
          visible: ${DONE}
          timeout: 20000
```

L'assertion reste la même : le texte de succès doit apparaître. Un `POST` réussi fait disparaître le bouton, donc un nouvel essai ne confirme pas deux fois.

## Tests Added or Updated

- `mobile/__tests__/e2e/test-ids.test.ts` — accepte les deux identifiants de Safari, comme `MoreMenuButton` et `ShareButton`.
- Pas de test de domaine : la cause n'est pas dans le site.

## Local Verification

- `npm run lint`, `npm run typecheck` → OK ; `npm test` → 398 pass, 0 fail ; `npm --prefix mobile run lint`, `typecheck` → OK ; `npm --prefix mobile test` → 40 suites, 264 tests passés.
- Simulateur : voir `test.md`.

## Deviations from Assessment

- La première version n'attendait la bulle qu'autour du tap. Un essai a montré qu'elle peut aussi s'ouvrir avant que « Confirmer » soit visible : l'attente de la page est passée dans un `retry` qui ferme la bulle.

## Follow-ups

- La boîte « Ouvrir dans « Oh, mais fallait pas ! » ? » des parcours 011 (liens `ohyoushouldnt://`) reste ouverte et fait échouer 011-us1, puis 011-us2, 012-us2 et 012-us3. C'est un autre bug, à traiter à part.
- `share-from-safari.yaml` (015-us1) n'a pas été rejoué sur le simulateur avec la bulle ouverte.
