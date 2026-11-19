import { createContext, useContext, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";
import { Text } from "./Text";

const DOT = 20;

const RadioContext = createContext<{ value: string; onChange: (value: string) => void } | null>(null);

/**
 * `components/ui/radio-group.tsx`: a group of choices (`RadioGroupItem`), one chosen at a time.
 * `label` is the question, read by screen readers and shown above the choices.
 */
export function RadioGroup({
  label,
  value,
  onChange,
  children,
  testID,
}: {
  label: string;
  value: string;
  /** The chosen item's `value`: the screen narrows it to its own choices. */
  onChange: (value: string) => void;
  children: ReactNode;
  testID?: string;
}) {
  return (
    <RadioContext.Provider value={{ value, onChange }}>
      <View testID={testID} accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: tokens.space[2] }}>
        <Text weight="heading">{label}</Text>
        {children}
      </View>
    </RadioContext.Provider>
  );
}

/**
 * One choice: a round box (border, shadow, primary color once chosen, with a white dot) and its label.
 * The whole row is pressable, at the minimum target height.
 */
export function RadioGroupItem({
  value,
  label,
  description,
  testID,
}: {
  value: string;
  label: string;
  description?: string;
  testID?: string;
}) {
  const palette = useTheme();
  const group = useContext(RadioContext);
  const checked = group?.value === value;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      accessibilityHint={description}
      onPress={() => group?.onChange(value)}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: tokens.space[2], minHeight: tokens.touchTarget }}
    >
      <View style={{ paddingTop: 2 }}>
        <Shadow
          radius={DOT / 2}
          style={{
            width: DOT,
            height: DOT,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: checked ? palette.main : tokens.colors.white,
          }}
        >
          {checked ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.colors.white }} /> : null}
        </Shadow>
      </View>
      <View style={{ flex: 1, gap: tokens.space[1] }}>
        <Text>{label}</Text>
        {description ? (
          <Text size="sm" color={tokens.colors.mutedForeground}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
