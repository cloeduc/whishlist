import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";

import { fonts, tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";

/**
 * `components/ui/input.tsx` : fond blanc, hauteur 40, bordure et ombre.
 * Au focus, comme sur le site, le champ s'enfonce et perd son ombre.
 * `muted` : champ en lecture seule sur fond atténué (adresse e-mail du compte).
 */
export function Input({
  invalid = false,
  muted = false,
  editable = true,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { invalid?: boolean; muted?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <Shadow
      pressed={focused}
      containerStyle={{ flexGrow: 1, opacity: editable || muted ? 1 : 0.5 }}
      style={{
        borderColor: invalid ? tokens.colors.destructive : tokens.colors.black,
        backgroundColor: muted ? tokens.colors.muted : tokens.colors.white,
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
    </Shadow>
  );
}
