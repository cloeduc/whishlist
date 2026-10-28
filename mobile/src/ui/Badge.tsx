import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";
import { Text } from "./Text";

export type BadgeVariant = "default" | "highlight" | "neutral" | "destructive";

/** `components/ui/badge.tsx` : hauteur 24, bordure, ombre, texte 12 gras. */
export function Badge({
  children,
  variant = "neutral",
  icon,
  testID,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  testID?: string;
}) {
  const palette = useTheme();
  const background = {
    default: palette.main,
    highlight: palette.highlight,
    neutral: tokens.colors.white,
    destructive: palette.destructive,
  }[variant];
  const color = variant === "default" || variant === "destructive" ? tokens.colors.white : tokens.colors.black;
  return (
    <Shadow testID={testID} containerStyle={{ alignSelf: "flex-start" }} style={{ backgroundColor: background }}>
      <View
        style={{
          minHeight: 24 - 2 * tokens.borderWidth,
          paddingHorizontal: tokens.space[2],
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.space[1],
        }}
      >
        {icon}
        <Text size="xs" weight="heading" color={color} numberOfLines={1}>
          {children}
        </Text>
      </View>
    </Shadow>
  );
}
