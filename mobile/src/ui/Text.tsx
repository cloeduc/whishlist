import { Text as NativeText, type TextProps } from "react-native";

import { fonts, tokens } from "@/theme/tokens";

type Size = keyof typeof tokens.fontSize;

/**
 * Texte en Geist. Le poids passe par la famille (Geist 500 / 700), seule façon fiable
 * sur Android ; la taille suit le réglage du téléphone (FR-033).
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
          // Interlignage du site (`leading-normal` ≈ 1,5 ; titres plus serrés).
          lineHeight: Math.round(tokens.fontSize[size] * (size === "title" ? 1.2 : 1.45)),
          color,
          textDecorationLine: underline ? "underline" : "none",
        },
        style,
      ]}
    />
  );
}
