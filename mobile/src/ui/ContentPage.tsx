import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { Text } from "./Text";

/**
 * En-tête des pages de contenu du site (`components/site/content-page.tsx`) :
 * sur-titre en majuscules espacées, grand titre, introduction grise, puis les sections.
 */
export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const palette = useTheme();
  return (
    <View style={{ gap: tokens.space[6] }}>
      <View style={{ gap: tokens.space[3] }}>
        <Text
          size="sm"
          weight="heading"
          color={palette.main}
          style={{ textTransform: "uppercase", letterSpacing: tokens.fontSize.sm * 0.16 }}
        >
          {eyebrow}
        </Text>
        <Text size="title" weight="heading" accessibilityRole="header">
          {title}
        </Text>
        <Text size="lg" color={tokens.colors.mutedForeground}>
          {intro}
        </Text>
      </View>
      {children}
    </View>
  );
}
