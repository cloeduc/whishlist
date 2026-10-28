import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";
import { Text } from "./Text";

/** `components/ui/alert.tsx` : blanche (info) ou rouge à texte blanc (erreur), avec actions. */
export function Alert({
  title,
  children,
  variant = "default",
  actions,
  testID,
}: {
  title?: string;
  children?: ReactNode;
  variant?: "default" | "destructive";
  actions?: ReactNode;
  testID?: string;
}) {
  const palette = useTheme();
  const destructive = variant === "destructive";
  const color = destructive ? tokens.colors.white : tokens.colors.black;
  return (
    <Shadow
      testID={testID}
      style={{
        backgroundColor: destructive ? palette.destructive : tokens.colors.white,
        paddingHorizontal: 10,
        paddingVertical: tokens.space[2],
        gap: 2,
      }}
    >
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ gap: 2 }}>
        {title ? (
          <Text size="sm" weight="heading" color={color}>
            {title}
          </Text>
        ) : null}
        {typeof children === "string" ? (
          <Text size="sm" color={color}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
      {actions ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space[3], marginTop: tokens.space[2] }}>
          {actions}
        </View>
      ) : null}
    </Shadow>
  );
}
