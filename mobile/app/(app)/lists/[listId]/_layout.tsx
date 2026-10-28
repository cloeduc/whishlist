import { Stack, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";

import { ListProvider, useList } from "@/features/lists/ListContext";
import { ListThemeProvider } from "@/theme/ListTheme";

function Themed({ children }: { children: ReactNode }) {
  const { list } = useList();
  return <ListThemeProvider theme={list?.theme}>{children}</ListThemeProvider>;
}

/** Les écrans d'une liste partagent ses données et prennent les couleurs de son thème (FR-031). */
export default function ListLayout() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  return (
    <ListProvider listId={listId}>
      <Themed>
        <Stack screenOptions={{ headerShown: false, animation: "none" }}>
          <Stack.Screen name="items/new" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="items/[itemId]" options={{ animation: "slide_from_bottom" }} />
        </Stack>
      </Themed>
    </ListProvider>
  );
}
