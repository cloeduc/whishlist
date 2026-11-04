import type { ReactNode } from "react";
import { FlatList, RefreshControl, ScrollView, View, type ListRenderItem } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

const contentStyle = {
  padding: tokens.space[4],
  // Room for the offset shadow of the last blocks.
  paddingBottom: tokens.space[6] + tokens.shadowOffset,
  gap: tokens.space[6],
};

/**
 * Site background (or the list theme), side margins 16, scrolling.
 * `onRefresh` enables pull to refresh (FR-017).
 */
export function Screen({
  children,
  header,
  onRefresh,
  refreshing = false,
  edges = ["top", "left", "right"],
  testID,
}: {
  children: ReactNode;
  /** Fixed block above the content (offline banner). */
  header?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: Edge[];
  /** `<écran>.screen`: e2e flows wait for it to know the screen is ready. */
  testID?: string;
}) {
  const palette = useTheme();
  return (
    <SafeAreaView testID={testID} edges={edges} style={{ flex: 1, backgroundColor: palette.background }}>
      {header ? <View style={{ paddingHorizontal: tokens.space[4], paddingTop: tokens.space[2] }}>{header}</View> : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        // The number pad (price) has no « OK » key on iOS: scrolling dismisses it.
        keyboardDismissMode="on-drag"
        // The content scrolls above the keyboard: the submit button stays reachable.
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={contentStyle}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.main} colors={[palette.main]} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Same screen as `Screen`, for a long list: only the visible rows are drawn. */
export function ScreenList<T>({
  header,
  data,
  renderItem,
  keyExtractor,
  testID,
}: {
  /** Above the rows, and scrolls with them. */
  header: ReactNode;
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  testID?: string;
}) {
  const palette = useTheme();
  return (
    <SafeAreaView testID={testID} edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<View style={{ gap: tokens.space[6] }}>{header}</View>}
        contentContainerStyle={contentStyle}
      />
    </SafeAreaView>
  );
}
