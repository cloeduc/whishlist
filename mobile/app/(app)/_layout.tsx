import { Redirect, Stack } from "expo-router";

import { useSession } from "@/auth/session";
import { tokens } from "@/theme/tokens";

/** Screens for a signed-in person; otherwise sign-in, or the forced password change. */
export default function AppLayout() {
  const session = useSession();
  if (session.status === "signedOut") return <Redirect href="/login" />;
  if (session.status === "mustChangePassword") return <Redirect href="/change-password" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.colors.background } }} />;
}
