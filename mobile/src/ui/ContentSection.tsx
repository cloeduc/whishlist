import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";
import { Text } from "./Text";

/**
 * Section de `components/site/content-page.tsx` : carte blanche à bordure et ombre, titre, texte gris.
 * Avec `onPress`, le titre se touche pour déplier le texte (licences).
 */
export function ContentSection({
  title,
  children,
  onPress,
  expanded,
}: {
  title: string;
  children?: ReactNode;
  onPress?: () => void;
  expanded?: boolean;
}) {
  const heading = (
    <Text size="2xl" weight="heading" accessibilityRole="header">
      {title}
    </Text>
  );
  return (
    <Shadow style={{ backgroundColor: tokens.colors.white, padding: tokens.space[5], gap: tokens.space[3] }}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded }}>
          {heading}
        </Pressable>
      ) : (
        heading
      )}
      {children ? <View style={{ gap: tokens.space[3] }}>{children}</View> : null}
    </Shadow>
  );
}

/** Paragraphe d'une section : gris, interligne large (`leading-7`). */
export function ContentText({ children }: { children: ReactNode }) {
  return (
    <Text color={tokens.colors.mutedForeground} style={{ lineHeight: tokens.lineHeight.relaxed }}>
      {children}
    </Text>
  );
}
