import { useTranslation } from "react-i18next";

import { useOnline } from "@/network";
import { tokens } from "@/theme/tokens";

import { Text } from "./Text";

/** Under an action that requires the server: why it is unavailable offline (FR-029b). */
export function NetworkNote({ message }: { message?: string }) {
  const { t } = useTranslation("mobile");
  const online = useOnline();
  if (online) return null;
  return (
    <Text size="sm" color={tokens.colors.mutedForeground} accessibilityLiveRegion="polite">
      {message ?? t("offline.needsNetwork")}
    </Text>
  );
}
