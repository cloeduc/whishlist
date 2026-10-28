import { Redirect, Stack } from "expo-router";

import { useSession } from "@/auth/session";

/** Écrans sans connexion ; une personne connectée va à ses listes. */
export default function AuthLayout() {
  const session = useSession();
  if (session.status === "signedIn") return <Redirect href="/" />;
  if (session.status === "mustChangePassword") return <Redirect href="/change-password" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
