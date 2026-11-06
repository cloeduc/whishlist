import type { ComponentProps } from "react";

import { Input } from "./Input";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "secureTextEntry" | "autoCapitalize" | "autoCorrect" | "spellCheck">;

/**
 * The one password field of the app (spec 016), `components/ui/password-input.tsx` on the site:
 * masked, and the keyboard neither capitalises nor corrects what is typed. `testID`,
 * `accessibilityLabel`, `autoComplete` and `textContentType` go to the field itself, so the
 * keychain and the iOS strong password sheet keep working.
 */
export function PasswordInput(props: PasswordInputProps) {
  return <Input {...props} secureTextEntry autoCapitalize="none" autoCorrect={false} spellCheck={false} />;
}
