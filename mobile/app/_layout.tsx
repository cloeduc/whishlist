import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

import { configureClient } from "@/api/client";
import { restore, useSession } from "@/auth/session";
import { startOfflineEngine } from "@/data/store";
import { syncNow } from "@/offline/sync";
import { i18n } from "@/i18n";
import { watchNetwork } from "@/network";
import { useAppFonts } from "@/theme/fonts";
import { tokens } from "@/theme/tokens";
import { LiveGiftMark } from "@/ui/LiveGiftMark";
import { UpgradeRequired } from "@/features/account/UpgradeRequired";

void SplashScreen.preventAutoHideAsync();

/**
 * Root: font, texts, session restored while the gift is shown (SC-004),
 * then the screens. Each route group redirects based on the session state:
 * (auth) signed out, change-password if the password must change (FR-005), (app) signed in.
 */
export default function RootLayout() {
  const fontsReady = useAppFonts();
  const session = useSession();
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  useEffect(() => {
    configureClient({ onUpgradeRequired: setUpgradeMessage });
    watchNetwork();
    void restore();
  }, []);

  const signedIn = session.status === "signedIn";
  // On each sign-in: the queue kept after a 401 is sent for the same account (T072).
  useEffect(() => {
    if (signedIn) void startOfflineEngine().then(syncNow);
  }, [signedIn]);

  const ready = fontsReady && session.status !== "loading";
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="dark" />
      {!ready ? (
        <LiveGiftMark />
      ) : upgradeMessage !== null ? (
        <UpgradeRequired message={upgradeMessage} />
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.colors.background } }} />
      )}
    </I18nextProvider>
  );
}
