import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { tokens } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { ModalCard } from "@/ui/ConfirmDialog";
import { Text } from "@/ui/Text";
import { whatsNewFor } from "@/whats-new/policy";
import { RELEASES, releaseKey } from "@/whats-new/releases";
import { getLastSeenVersion, hasPastUsage, setLastSeenVersion } from "@/whats-new/state";

/** Sentences of one version, from `whatsNew.releases.<x_y_z>`; nothing if the key is missing. */
export function useReleaseNotes(): (version: string) => string[] {
  const { t } = useTranslation("mobile");
  return (version) => {
    const value: unknown = t(`whatsNew.releases.${releaseKey(version)}`, { returnObjects: true });
    return Array.isArray(value) ? value.filter((sentence): sentence is string => typeof sentence === "string") : [];
  };
}

/** The sentences of one version, as a list. */
export function ReleaseNotes({ sentences }: { sentences: string[] }) {
  return (
    <View style={{ gap: tokens.space[1] }}>
      {sentences.map((sentence) => (
        <Text key={sentence} color={tokens.colors.mutedForeground} style={{ lineHeight: tokens.lineHeight.relaxed }}>
          {`• ${sentence}`}
        </Text>
      ))}
    </View>
  );
}

/**
 * « Quoi de neuf » (022): at the first launch of a newer version, the news of each version missed since
 * the last one seen on this phone, newest first; « C'est noté » closes it for good. Nothing after a fresh
 * install. `onShownChange` (a stable function, such as a state setter) tells the root whether the dialog is (or may still be) shown, so that the update
 * prompt (021) waits for its turn. `enabled`: off in development builds.
 */
export function WhatsNew({
  enabled = !__DEV__,
  onShownChange,
}: {
  enabled?: boolean;
  onShownChange?: (shown: boolean) => void;
}) {
  const { t } = useTranslation(["mobile", "common"]);
  const notes = useReleaseNotes();
  const installed = Constants.expoConfig?.version ?? null;
  const [versions, setVersions] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled || !installed) {
      onShownChange?.(false);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const decision = whatsNewFor({
          installed,
          lastSeen: await getLastSeenVersion(),
          hasPastUsage: await hasPastUsage(),
          releases: RELEASES,
        });
        if (decision.markSeen) await setLastSeenVersion(installed);
        if (active) setVersions(decision.show);
        onShownChange?.(decision.show.length > 0);
      } catch {
        // No dialog rather than an error.
        onShownChange?.(false);
      }
    })();
    return () => {
      active = false;
    };
    // The root passes a state setter (stable): the decision is taken once per launch.
  }, [enabled, installed, onShownChange]);

  const close = () => {
    setVersions([]);
    onShownChange?.(false);
    if (installed) void setLastSeenVersion(installed).catch(() => undefined);
  };

  return (
    <ModalCard visible={versions.length > 0} title={t("mobile:whatsNew.title")} dismissLabel={t("common:actions.close")} onDismiss={close}>
      <View testID="whats-new.dialog" style={{ gap: tokens.space[4] }}>
        {versions.map((version) => (
          <View key={version} testID={`whats-new.version-${releaseKey(version)}`} style={{ gap: tokens.space[2] }}>
            <Text weight="heading">{t("mobile:whatsNew.version", { version })}</Text>
            <ReleaseNotes sentences={notes(version)} />
          </View>
        ))}
        <Button testID="whats-new.done" title={t("mobile:whatsNew.done")} fullWidth onPress={close} />
      </View>
    </ModalCard>
  );
}
