import type { ReactNode } from "react";
import { View } from "react-native";

import { tokens } from "@/theme/tokens";

import { Text } from "./Text";

/**
 * Site screen title (`h1 text-2xl font-medium`), with its intro text and an action on the right.
 * `weight="heading"` for the site's bold titles (`text-2xl font-bold`, such as the share tab's).
 */
export function PageTitle({
  title,
  description,
  action,
  weight,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  weight?: "base" | "heading";
}) {
  return (
    <View style={{ gap: tokens.space[2] }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: tokens.space[3] }}>
        <Text size="2xl" weight={weight} accessibilityRole="header">
          {title}
        </Text>
        {action}
      </View>
      {description ? <Text color={tokens.colors.mutedForeground}>{description}</Text> : null}
    </View>
  );
}
