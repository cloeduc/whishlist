import { ScrollView, View } from "react-native";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { PressableShadow } from "./Shadow";
import { Text } from "./Text";

export type PillTab = { key: string; label: string };

/**
 * Onglets en pastilles du site (Idées, Archives…) : actif bleu à texte blanc, inactif blanc.
 * `scroll` : une barre qui défile au lieu de passer à la ligne (design-reference.md, « Onglets »).
 */
export function PillTabs({
  tabs,
  active,
  onChange,
  scroll = false,
}: {
  tabs: PillTab[];
  active: string;
  onChange: (key: string) => void;
  scroll?: boolean;
}) {
  const palette = useTheme();
  const pills = tabs.map((tab) => {
    const selected = tab.key === active;
    return (
      <PressableShadow
        key={tab.key}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onPress={() => onChange(tab.key)}
        hitSlop={8}
        testID={`tab-${tab.key}`}
        boxTestID={`tab-${tab.key}-box`}
        sink={!selected}
        boxStyle={{
          backgroundColor: selected ? palette.main : tokens.colors.white,
          paddingHorizontal: tokens.space[3],
          minHeight: 28,
          justifyContent: "center",
        }}
      >
        <Text size="sm" color={selected ? tokens.colors.white : tokens.colors.black}>
          {tab.label}
        </Text>
      </PressableShadow>
    );
  });
  const rowStyle = {
    flexDirection: "row" as const,
    gap: tokens.space[2],
    paddingRight: tokens.shadowOffset,
    paddingBottom: tokens.shadowOffset,
  };
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={rowStyle}>
        {pills}
      </ScrollView>
    );
  }
  return (
    <View accessibilityRole="tablist" style={[rowStyle, { flexWrap: "wrap", rowGap: tokens.space[2] }]}>
      {pills}
    </View>
  );
}
