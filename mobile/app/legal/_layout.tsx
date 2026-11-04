import { Stack } from "expo-router";

import { tokens } from "@/theme/tokens";

/** Legal pages: readable signed in or not, and even during a forced password change (FR-034). */
export default function LegalLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.colors.background } }} />;
}
