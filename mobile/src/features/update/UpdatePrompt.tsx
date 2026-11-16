import * as InAppUpdates from "expo-in-app-updates";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { shouldCheck, shouldPrompt } from "@/update/policy";
import { getLastCheckAt, getSnooze, setLastCheckAt, setSnooze } from "@/update/state";

/**
 * « Nouvelle version disponible » (021), mounted once at the root, above every screen.
 * At start-up, and back in the foreground at most once a day, the store is asked for a newer version.
 * iOS: a dialog, « Mettre à jour » opens the App Store page, « Plus tard » waits 7 days.
 * The update is only advised: any failure (offline, store unreachable) stays silent.
 * `enabled`: off in development builds, where no store version exists.
 */
export function UpdatePrompt({ enabled = !__DEV__ && Platform.OS !== "web" }: { enabled?: boolean }) {
  const { t } = useTranslation("mobile");
  const [offer, setOffer] = useState<{ storeVersion: string | null } | null>(null);
  const checking = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const check = async (coldStart: boolean) => {
      if (checking.current) return;
      checking.current = true;
      try {
        const now = new Date();
        if (!shouldCheck({ now, lastCheckAt: await getLastCheckAt(), coldStart })) return;
        await setLastCheckAt(now);
        const info = await InAppUpdates.checkForUpdate();
        if (!info.updateAvailable) return;
        const storeVersion = info.storeVersion ?? null;
        if (!shouldPrompt({ storeVersion, snooze: await getSnooze(), now })) return;
        if (Platform.OS === "ios") setOffer({ storeVersion });
      } catch {
        // Advised only: no store, no network, no message.
      } finally {
        checking.current = false;
      }
    };
    void check(true);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void check(false);
    });
    return () => subscription.remove();
  }, [enabled]);

  return (
    <ConfirmDialog
      visible={offer !== null}
      title={t("update.title")}
      body={t("update.body")}
      confirmLabel={t("update.now")}
      keepLabel={t("update.later")}
      destructive={false}
      testID="update.prompt"
      onConfirm={() => {
        setOffer(null);
        InAppUpdates.startUpdate().catch(() => undefined);
      }}
      onKeep={() => {
        const storeVersion = offer?.storeVersion ?? null;
        setOffer(null);
        void setSnooze({ storeVersion, at: new Date() }).catch(() => undefined);
      }}
    />
  );
}
