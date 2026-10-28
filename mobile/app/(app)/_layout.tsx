import { Redirect, Stack } from "expo-router";

import { useSession } from "@/auth/session";
import { tokens } from "@/theme/tokens";

/** Écrans d'une personne connectée ; sinon la connexion, ou le changement de mot de passe imposé. */
export default function AppLayout() {
  const session = useSession();
  if (session.status === "signedOut") return <Redirect href="/login" />;
  if (session.status === "mustChangePassword") return <Redirect href="/change-password" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.colors.background } }} />;
}
