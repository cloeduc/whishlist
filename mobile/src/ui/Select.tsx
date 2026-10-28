import { useState } from "react";
import { ChevronDownIcon } from "lucide-react-native";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { PressableShadow } from "./Shadow";
import { Text } from "./Text";

export type SelectOption = { value: string; label: string };

/**
 * `components/ui/native-select.tsx` : un champ avec chevron. Le choix s'ouvre dans une feuille
 * en bas d'écran, aux couleurs et bordures du site.
 */
export function Select({
  value,
  options,
  onChange,
  label,
  placeholder,
  disabled = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Libellé du champ, annoncé par le lecteur d'écran et repris en titre de la feuille. */
  label: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <PressableShadow
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
                  boxStyle={{
                    minHeight: tokens.touchTarget,
                    paddingHorizontal: tokens.space[3],
                    justifyContent: "center",
                    backgroundColor: active ? palette.main : tokens.colors.white,
                  }}
                >
                  <Text size="sm" color={active ? tokens.colors.white : tokens.colors.black}>
                    {option.label}
                  </Text>
                </PressableShadow>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
