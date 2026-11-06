# Revue de code

## Fichiers relus

```text
c259a4125d953084ded0541cbaf9a289ed41b1e3  app/globals.css
b8c821ffd55f0ffb41772266d78efdd7888d3032  components/site/delete-account-dialog.tsx
10d6278b7bd1b873e7bf655f48dd86abfd225e30  components/site/email-change-form.tsx
3bc4f617e7e3952948668c45ecb719ead5d48965  components/site/login-form.tsx
413a6c459af55203d8b9573b042da984dcf86ee0  components/site/password-form.tsx
16953870e5a04bea9f6fde90f0df68d4e98b9d96  components/site/read-password-form.tsx
f802f95d746f23a835380846af403fdcb5a81d0f  components/site/read-unlock-form.tsx
717e69b75ca4a5699f58ebc24151ef5a93196503  components/site/register-form.tsx
4e05db3ef35408b95bb8c8ef5234544c84dacb43  components/site/reset-password-form.tsx
a40ee9bd4ee1d70de3001e3563dff18d0a45a82f  components/ui/password-input.tsx
624c876e3b9647ead34790ea2b8174d0f881d8ad  locales/en/common.json
1eb836322a2eb26e85fadd962de5a60f39dc2756  locales/fr/common.json
092c09744403c35c6d6292bbe6f3579c9c90fa8e  mobile/.maestro/flows/016-us2-show-password.yaml
249d62de7227c7e0394b3617276df0a08902a7cf  mobile/__tests__/e2e/coverage.test.ts
a7a252f30b3dc74e60a33dad1e43aed51a1b7602  mobile/__tests__/e2e/test-ids.test.ts
1ba6d62f3a732ce5c1f90d8bb8636d28a625f9e4  mobile/__tests__/screens/account.test.tsx
7a1483237a629c5ec59266c8153347e891d7f712  mobile/__tests__/screens/delete-account.test.tsx
2f2e815cc9e252eba6f9e0299bf6fb5d6e0888d2  mobile/__tests__/screens/followed-lists.test.tsx
db682e10d419c4e90570c357aa0d0ebd40872640  mobile/__tests__/screens/guest-reserve.test.tsx
83a57091a6ea7782fd0da2b70df2d8febb3cd9c5  mobile/__tests__/screens/legal.test.tsx
a89288169bb4ae5ae7051b487bc519f6327a8d28  mobile/__tests__/screens/links-reset-password.test.tsx
cbc76b55fb111af7693f4cfd4f011c0f40c73b66  mobile/__tests__/screens/login.test.tsx
295fd09109a17744f7c12fc1b58691cb97f69ea5  mobile/__tests__/ui/password-fields.test.ts
6528b25eef8460f97a4828524576124e9d34d0f0  mobile/__tests__/ui/password-input.test.tsx
680136c1ecf06216d45a91038213900edfc2b3f7  mobile/app/(app)/delete-account.tsx
5b790761af5ff07df34098715e3f1dc9e4bdc356  mobile/app/(app)/shared/follow.tsx
d1b59366f5b4e86ee2e660671aad3aa693b06777  mobile/app/(auth)/login.tsx
af012a197003cf629daa147d7335fb96f8b4bb6b  mobile/app/(auth)/register.tsx
77424e3d76bf20c881c70fea406d0da3f1c80b99  mobile/app/guest/[readToken]/index.tsx
bd29ed66ded2c0252d99e79e8d2ded57b7b8c44d  mobile/app/links/reset-password/[token].tsx
e60d269800450829ee329e134fea90956832ca69  mobile/src/features/account/EmailCard.tsx
55c1f529884cf903cdcca13c9005653babdd5f4c  mobile/src/features/account/PasswordForm.tsx
17f24e87af522b70dc6ef4d3f9dd44ad785ca3f3  mobile/src/ui/Accordion.tsx
5b322ca7b0f5d83503272b281c670bdd7a7eac9a  mobile/src/ui/Input.tsx
2467a9d014a99eba3f41d487d3e6ed959edecc43  mobile/src/ui/PasswordInput.tsx
a1f237cc1d8e0b049c8ef3357d0f896cc84e5b70  src/site/password-reveal.ts
cd99caa799d418c266b7a423c89926114469ec15  tests/domain/helpers/render-password-input.tsx
de13090a4634bb816cd799d368872e7684b7162c  tests/domain/password-input.test.ts
```

## Règles métier et tests

- [x] mobile/src/ui/PasswordInput.tsx:34 — Quand l'écran a vidé le champ (après un envoi), la condition de re-masquage reste vraie : toucher l'œil sur le champ vide ne fait rien tant que la personne n'a rien tapé, et le libellé reste « Afficher le mot de passe » (FR-002, US2 scénario 1). Correction : remettre `typed` à `""` en même temps que le re-masquage, pour que la condition ne joue qu'une fois, et ajouter le cas au test du composant.
- [x] tests/domain/password-input.test.ts:56 — Côté site, aucun test ne vérifie la bascule elle-même (champ en `type="text"`, libellé « Masquer le mot de passe » / « Hide password », puis l'inverse) ni l'état propre à chaque champ (FR-002, FR-003, US2 scénarios 1 à 3) ; seul le rendu initial l'est (la bascule a été vérifiée à la main dans un navigateur). Correction : rendre le composant dans un DOM léger et cliquer l'œil, ou isoler type et libellé dans une fonction pure testée. Corrigé par une fonction pure (`src/site/password-reveal.ts`, partagée avec l'app) ; l'état propre à chaque champ reste vérifié à la main (le dépôt n'a pas de DOM de test).
- [x] mobile/.maestro/flows/016-us2-show-password.yaml:40 — T019 (cochée) annonce le re-masquage au retour d'Inscription, mais le parcours s'arrête aux bascules sur Connexion ; ce cas est dans `exclusions.md` sans que la tâche le dise. Correction : corriger le libellé de T019 pour renvoyer à la ligne d'exclusion (ou ajouter l'aller-retour au parcours).
- [x] app/globals.css:187 — La règle masque aussi `::-ms-clear` sur tous les `input` du site, champs texte compris, ce que T014 ne demande pas. Correction : limiter `::-ms-clear` aux champs de `PasswordInput` (`[data-slot="password-input"] input::-ms-clear`) et le noter dans tasks.md.
- [x] specs/016-password-field/tasks.md:105 — T021 (commit de l'US2) n'est pas cochée alors que le commit 64ea406 existe. Correction : cocher T021.

## Constitution et sécurité

Aucun point.

## Duplication

- [x] mobile/src/ui/PasswordInput.tsx:15 — `EYE_SIZE = 44` et `hitSlop={{ top: 4, bottom: 4 }}` réécrivent `tokens.touchTarget` (`mobile/src/theme/tokens.ts:32`), déjà utilisé par `mobile/src/ui/Button.tsx:62`. Correction : largeur `tokens.touchTarget`, hitSlop vertical `(tokens.touchTarget - tokens.controlHeight.default) / 2`, comme `Button`.

## Conventions

Aucun point.

## i18n

Aucun point.
