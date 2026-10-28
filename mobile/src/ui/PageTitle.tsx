import type { ReactNode } from "react";
import { View } from "react-native";

import { tokens } from "@/theme/tokens";

import { Text } from "./Text";

/** Titre d'écran du site (`h1 text-2xl font-medium`), avec son texte d'introduction et une action à droite. */
export function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <View style={{ gap: tokens.space[2] }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: tokens.space[3] }}>
        <Text size="2xl" accessibilityRole="header">
          {title}
        </Text>
        {action}
      </View>
      {description ? <Text color={tokens.colors.mutedForeground}>{description}</Text> : null}
    </View>
  );
}
