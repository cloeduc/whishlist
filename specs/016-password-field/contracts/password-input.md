# Contract: composants `PasswordInput`

Interface UI des deux composants. Aucune API HTTP n'est touchée (le contrat `specs/004-mobile-api/contracts/openapi.yaml` ne change pas).

## Site — `components/ui/password-input.tsx`

```tsx
<PasswordInput id="password" name="password" required autoComplete="current-password" />
```

- Props : celles d'`Input` (`React.ComponentProps<"input">`) sauf `type`.
- Rendu : `<div data-slot="password-input" class="relative">` contenant
  - l'`input` : `type="password"` (masqué) ou `type="text"` (visible), `autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"`, plus les props reçues ;
  - un `<button type="button" aria-controls={id} aria-label=…>` avec l'icône `Eye` (masqué) ou `EyeOff` (visible), `aria-hidden` sur l'icône.
- Libellé : `common:passwordField.show` quand masqué, `common:passwordField.hide` quand visible.
- Un champ désactivé garde un œil utilisable.

## App — `mobile/src/ui/PasswordInput.tsx`

```tsx
<PasswordInput testID="login.password" accessibilityLabel={t("auth:login.password")}
  value={password} onChangeText={setPassword} autoComplete="current-password" textContentType="password" />
```

- Props : celles d'`Input` (`TextInputProps & { invalid?, muted? }`) sauf `secureTextEntry`, `autoCapitalize`, `autoCorrect`, `spellCheck`, qu'il fixe.
- Le `TextInput` garde `testID` et `accessibilityLabel` ; `secureTextEntry={!visible}`.
- L'œil : `Pressable`, `testID="<testID>-reveal"`, `accessibilityRole="button"`, `accessibilityLabel` = `common:passwordField.show` ou `.hide`, au moins 44 × 44 de zone de toucher, utilisable quand le champ n'est pas modifiable (`editable={false}`).
- Masqué à nouveau quand l'écran perd le focus et quand la valeur passe à `""` sans saisie de la personne.
