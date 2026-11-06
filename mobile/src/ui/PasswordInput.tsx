import { useFocusEffect } from "expo-router";
import { EyeIcon, EyeOffIcon } from "lucide-react-native";
import { useCallback, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { passwordReveal } from "../../../src/site/password-reveal";
import { tokens } from "@/theme/tokens";

import { useAccordionExpanded } from "./Accordion";
import { Input } from "./Input";

const EYE_SLOP = Math.max(0, (tokens.touchTarget - tokens.controlHeight.default) / 2);

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "secureTextEntry" | "autoCapitalize" | "autoCorrect" | "spellCheck" | "trailing">;

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
  if (visible && !expanded) setVisible(false);
  if (value === "" && typed !== "") {
    // Emptied by the screen: masked again, once (the eye works again on the empty field).
    setVisible(false);
    setTyped("");
  }

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
          accessibilityLabel={t(passwordReveal(visible).labelKey)}
          onPress={() => setVisible((shown) => !shown)}
          // Touch area of at least 44 × 44 (FR-006): the box is 40 high, like `Button`.
          hitSlop={{ top: EYE_SLOP, bottom: EYE_SLOP }}
          style={{ width: tokens.touchTarget, alignSelf: "stretch", alignItems: "center", justifyContent: "center" }}
        >
          <Icon size={16} color={tokens.colors.black} />
        </Pressable>
      }
    />
  );
}
