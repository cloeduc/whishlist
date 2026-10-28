import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { tokens } from "@/theme/tokens";

import { PressableShadow, Shadow } from "./Shadow";
import { Text } from "./Text";

const spacing = tokens.space[4];

/** `components/ui/card.tsx` : fond blanc, bordure, ombre, marges 16. Cliquable : s'enfonce à l'appui. */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const boxStyle = [{ paddingVertical: spacing, gap: spacing }, style];
  if (!onPress) {
    return (
      <Shadow testID={testID} style={boxStyle}>
        {children}
      </Shadow>
    );
  }
  return (
    <PressableShadow
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      boxTestID={testID}
      boxStyle={boxStyle}
    >
      {children}
    </PressableShadow>
  );
}

export function CardHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: spacing, flexDirection: "row", gap: spacing, alignItems: "flex-start" }}>
      <View style={{ flex: 1, gap: tokens.space[1] }}>{children}</View>
      {action}
    </View>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <Text weight="heading" accessibilityRole="header">
      {children}
    </Text>
  );
}

export function CardDescription({ children }: { children: ReactNode }) {
  return (
    <Text size="sm" color={tokens.colors.mutedForeground}>
      {children}
    </Text>
  );
}

export function CardContent({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ paddingHorizontal: spacing, gap: spacing }, style]}>{children}</View>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.space[2],
        padding: spacing,
        marginBottom: -spacing,
        borderTopWidth: tokens.borderWidth,
        borderTopColor: tokens.colors.black,
      }}
    >
      {children}
    </View>
  );
}
