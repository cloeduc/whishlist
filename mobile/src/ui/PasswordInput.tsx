import { useFocusEffect } from "expo-router";
import { EyeIcon, EyeOffIcon } from "lucide-react-native";
import { useCallback, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { tokens } from "@/theme/tokens";

import { useAccordionExpanded } from "./Accordion";
import { Input } from "./Input";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "secureTextEntry" | "autoCapitalize" | "autoCorrect" | "spellCheck" | "trailing">;

/** Touch area of the eye: 44 × 44 at least (FR-006), in a box 40 high. */
const EYE_SIZE = 44;

/**
 * The one password field of the app (spec 016), `components/ui/password-input.tsx` on the site:
 * the keyboard neither capitalises nor corrects what is typed, and an eye on the right shows or
 * masks it (`<testID>-reveal`). `testID`, `accessibilityLabel`, `autoComplete` and
 * `textContentType` go to the field itself, so the e2e flows, the keychain and the iOS strong
 * password sheet keep working. Masked by default, and masked again (FR-005) when the screen
 * loses focus, when the card holding it collapses, and when the screen empties the field
 * (after a submit), but not when the person erases it.
 */
export function PasswordInput({ value, onChangeText, testID, ...props }: PasswordInputProps) {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);
  // Last text the person typed: an empty value they did not type comes from the screen.
  const [typed, setTyped] = useState(value);
  const expanded = useAccordionExpanded();

  useFocusEffect(useCallback(() => () => setVisible(false), []));
  if (visible && (!expanded || (value === "" && typed !== ""))) setVisible(false);

  const Icon = visible ? EyeOffIcon : EyeIcon;
  return (
    <Input
      {...props}
      testID={testID}
      value={value}
      onChangeText={(text) => {
        setTyped(text);
        onChangeText?.(text);
      }}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      trailing={
        <Pressable
          testID={testID ? `${testID}-reveal` : undefined}
          accessibilityRole="button"
          accessibilityLabel={visible ? t("passwordField.hide") : t("passwordField.show")}
          onPress={() => setVisible((shown) => !shown)}
          hitSlop={{ top: 4, bottom: 4 }}
          style={{ width: EYE_SIZE, alignSelf: "stretch", alignItems: "center", justifyContent: "center" }}
        >
          <Icon size={16} color={tokens.colors.black} />
        </Pressable>
      }
    />
  );
}
