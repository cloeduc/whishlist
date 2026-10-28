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
 * Racine : police, textes, session restaurée pendant que le cadeau s'affiche (SC-004),
 * puis les écrans. Chaque groupe de routes redirige selon l'état de la session :
 * (auth) sans connexion, change-password si le mot de passe doit changer (FR-005), (app) connecté.
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
  // À chaque connexion : la file gardée après un 401 part pour le même compte (T072).
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
