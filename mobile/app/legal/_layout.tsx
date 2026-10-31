import { Stack } from "expo-router";

import { tokens } from "@/theme/tokens";

/** Pages légales : lisibles connecté ou non, et même pendant un changement de mot de passe imposé (FR-034). */
export default function LegalLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.colors.background } }} />;
}
