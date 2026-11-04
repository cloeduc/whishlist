import { Text as NativeText, type TextProps } from "react-native";

import { fonts, tokens } from "@/theme/tokens";

type Size = keyof typeof tokens.fontSize;

/**
 * Text in Geist. The weight goes through the family (Geist 500 / 700), the only reliable way
 * on Android; the size follows the phone setting (FR-033).
 */
export function Text({
  size = "base",
  weight = "base",
  color = tokens.colors.black,
  underline = false,
  style,
  ...props
}: TextProps & { size?: Size; weight?: "base" | "heading"; color?: string; underline?: boolean }) {
  return (
    <NativeText
      {...props}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: tokens.fontSize[size],
          // The site's line height (`leading-normal` ≈ 1.5; tighter for titles).
          lineHeight: Math.round(tokens.fontSize[size] * (size === "title" ? 1.2 : 1.45)),
          color,
          textDecorationLine: underline ? "underline" : "none",
        },
        style,
      ]}
    />
  );
}
