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
 * Android: Google Play's flexible update (download in the background, then the library installs it
 * and restarts the app); refusing Google's offer waits 7 days. No dialog of the app.
 * The update is only advised: any failure (offline, store unreachable) stays silent.
 * `enabled`: off in development builds, where no store version exists.
 */
export function UpdatePrompt({ enabled = !__DEV__ && Platform.OS !== "web" }: { enabled?: boolean }) {
  const { t } = useTranslation("mobile");
  const [offer, setOffer] = useState<{ storeVersion: string | null } | null>(null);
  const checking = useRef(false);
  /** Store version offered on Android, kept for a refusal reported later by `updateCancelled`. */
  const offered = useRef<string | null>(null);

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
        // Android: an update already accepted (still downloading, or downloaded while the app was closed)
        // is resumed or installed now, whatever « Plus tard » said about later versions (FR-004).
        if (Platform.OS === "android" && info.updateInProgress) {
          await InAppUpdates.startUpdate();
          return;
        }
        const storeVersion = info.storeVersion ?? null;
        if (!shouldPrompt({ storeVersion, snooze: await getSnooze(), now })) return;
        if (Platform.OS === "ios") setOffer({ storeVersion });
        if (Platform.OS === "android" && info.flexibleAllowed) {
          offered.current = storeVersion;
          // Flexible only: the update stays « conseillée », never the full-screen immediate flow.
          await InAppUpdates.startUpdate(false);
        }
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
    // Android: Google's offer refused, same rule as « Plus tard ».
    const unsubscribe = InAppUpdates.addUpdateListener("updateCancelled", () => {
      if (Platform.OS !== "android") return;
      void setSnooze({ storeVersion: offered.current, at: new Date() }).catch(() => undefined);
    });
    return () => {
      subscription.remove();
      unsubscribe();
    };
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
