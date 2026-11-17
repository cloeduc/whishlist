import { useState } from "react";
import { ChevronDownIcon } from "lucide-react-native";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { PressableShadow } from "./Shadow";
import { Text } from "./Text";

export type SelectOption = { value: string; label: string };

/** One row of the sheet (an option or the action). */
const rowStyle = { minHeight: tokens.touchTarget, paddingHorizontal: tokens.space[3], justifyContent: "center" } as const;

/** Last row of the sheet, after the options: an action rather than a value (« + Nouvelle catégorie »). */
export type SelectAction = { label: string; onPress: () => void; disabled?: boolean; hint?: string };

/**
 * `components/ui/native-select.tsx`: a field with a chevron. The choice opens in a sheet
 * at the bottom of the screen, in the site's colors and borders.
 */
export function Select({
  value,
  options,
  onChange,
  label,
  placeholder,
  disabled = false,
  action,
  testID,
  actionTestID,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Field label, announced by the screen reader and reused as the sheet title. */
  label: string;
  placeholder?: string;
  disabled?: boolean;
  action?: SelectAction;
  testID?: string;
  /** On the action row. */
  actionTestID?: string;
}) {
  const [open, setOpen] = useState(false);
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <PressableShadow
        testID={testID}
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder ?? "" }}
        accessibilityState={{ disabled, expanded: open }}
        style={{ opacity: disabled ? 0.5 : 1 }}
        boxStyle={{
          minHeight: tokens.controlHeight.default,
          paddingHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.space[2],
        }}
      >
        <Text size="sm" style={{ flex: 1 }} color={selected ? tokens.colors.black : tokens.colors.mutedForeground} numberOfLines={1}>
          {selected?.label ?? placeholder ?? ""}
        </Text>
        <ChevronDownIcon size={16} color={tokens.colors.mutedForeground} />
      </PressableShadow>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        />
        <View
          style={{
            backgroundColor: palette.background,
            borderTopWidth: tokens.borderWidth,
            borderColor: tokens.colors.black,
            padding: tokens.space[4],
            paddingBottom: tokens.space[4] + insets.bottom,
            gap: tokens.space[3],
            maxHeight: "70%",
          }}
        >
          <Text weight="heading" accessibilityRole="header">
            {label}
          </Text>
          <ScrollView contentContainerStyle={{ gap: tokens.space[3], paddingRight: tokens.shadowOffset, paddingBottom: tokens.shadowOffset }}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <PressableShadow
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  boxStyle={{ ...rowStyle, backgroundColor: active ? palette.main : tokens.colors.white }}
                >
                  <Text size="sm" color={active ? tokens.colors.white : tokens.colors.black}>
                    {option.label}
                  </Text>
                </PressableShadow>
              );
            })}
            {action ? (
              <View style={{ gap: tokens.space[1] }}>
                <PressableShadow
                  testID={actionTestID}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: action.disabled ?? false }}
                  disabled={action.disabled}
                  onPress={() => {
                    setOpen(false);
                    action.onPress();
                  }}
                  style={{ opacity: action.disabled ? 0.5 : 1 }}
                  boxStyle={{ ...rowStyle, backgroundColor: tokens.colors.white }}
                >
                  <Text size="sm" weight="heading">
                    {action.label}
                  </Text>
                </PressableShadow>
                {action.disabled && action.hint ? (
                  <Text size="sm" color={tokens.colors.mutedForeground}>
                    {action.hint}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
