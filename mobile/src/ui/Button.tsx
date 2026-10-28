import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { PressableShadow } from "./Shadow";
import { Text } from "./Text";

export type ButtonVariant = "default" | "neutral" | "destructive" | "ghost" | "link";
export type ButtonSize = "xs" | "sm" | "default" | "lg" | "icon";

/** Variantes et tailles de `components/ui/button.tsx`. */
export function Button({
  title,
  icon,
  onPress,
  variant = "default",
  size = "default",
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: {
  title?: string;
  /** Icône avant le libellé, ou seule pour `size="icon"`. */
  icon?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const palette = useTheme();
  const background = {
    default: palette.main,
    neutral: tokens.colors.white,
    destructive: palette.destructive,
    ghost: "transparent",
    link: "transparent",
  }[variant];
  const textColor = variant === "default" || variant === "destructive" ? tokens.colors.white : tokens.colors.black;
  const height = size === "icon" ? tokens.controlHeight.default : tokens.controlHeight[size];
  const paddingHorizontal = { xs: 10, sm: 12, default: 16, lg: 32, icon: 0 }[size];

  return (
    <PressableShadow
      onPress={onPress}
      disabled={disabled}
      framed={variant !== "ghost" && variant !== "link"}
      accessibilityRole={variant === "link" ? "link" : "button"}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      // Cible tactile d'au moins 44 même pour les petits boutons.
      hitSlop={Math.max(0, (tokens.touchTarget - height) / 2)}
      testID={testID}
      boxTestID={testID ? `${testID}-box` : undefined}
      boxStyle={{ backgroundColor: background }}
      style={[{ opacity: disabled ? 0.5 : 1, alignSelf: fullWidth ? "stretch" : "flex-start" }, style]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: tokens.space[2],
          minHeight: variant === "link" ? undefined : height,
          width: size === "icon" ? height : undefined,
          paddingHorizontal: variant === "link" ? 0 : paddingHorizontal,
        }}
      >
        {icon}
        {title ? (
          <Text size={size === "xs" ? "xs" : "sm"} color={textColor} underline={variant === "link"}>
            {title}
          </Text>
        ) : null}
      </View>
    </PressableShadow>
  );
}
