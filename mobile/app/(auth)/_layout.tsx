import { Redirect, Stack } from "expo-router";

import { useSession } from "@/auth/session";
import { afterSignIn } from "@/links/pending";

/** Signed-out screens; a signed-in person goes to their lists, or to the link that brought them here (011). */
export default function AuthLayout() {
  const session = useSession();
  if (session.status === "signedIn") return <Redirect href={afterSignIn()} />;
  if (session.status === "mustChangePassword") return <Redirect href="/change-password" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
