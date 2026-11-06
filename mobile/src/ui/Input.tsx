import { useState, type ReactNode } from "react";
import { TextInput, type TextInputProps } from "react-native";

import { fonts, tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";

/**
 * `components/ui/input.tsx`: white background, height 40, border and shadow.
 * On focus, as on the site, the field sinks and loses its shadow.
 * `muted`: read-only field on a muted background (account email address).
 * `trailing`: element on the right, inside the box, beside the text (the eye of `PasswordInput`).
 */
export function Input({
  invalid = false,
  muted = false,
  editable = true,
  style,
  onFocus,
  onBlur,
  trailing,
  ...props
}: TextInputProps & { invalid?: boolean; muted?: boolean; trailing?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <Shadow
      pressed={focused}
      containerStyle={{ flexGrow: 1, opacity: editable || muted ? 1 : 0.5 }}
      style={{
        borderColor: invalid ? tokens.colors.destructive : tokens.colors.black,
        backgroundColor: muted ? tokens.colors.muted : tokens.colors.white,
        flexDirection: trailing ? "row" : undefined,
      }}
    >
      <TextInput
        {...props}
        editable={editable}
        aria-invalid={invalid}
        placeholderTextColor={tokens.colors.mutedForeground}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          {
            // Beside a trailing element, the text takes the rest of the width and scrolls in it.
            flex: trailing ? 1 : undefined,
            minHeight: tokens.controlHeight.default - 2 * tokens.borderWidth,
            paddingHorizontal: 10,
            paddingVertical: 4,
            fontFamily: fonts.base,
            fontSize: tokens.fontSize.base,
            color: tokens.colors.black,
          },
          style,
        ]}
      />
      {trailing}
    </Shadow>
  );
}
