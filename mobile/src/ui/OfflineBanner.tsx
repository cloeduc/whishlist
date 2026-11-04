import { useTranslation } from "react-i18next";

import { currentLocale, intlLocale } from "@/i18n";
import { useOnline } from "@/network";

import { Alert } from "./Alert";

/**
 * White alert banner at the top of the screen: offline, date of the copy shown,
 * and number of changes waiting to be sent (FR-025, FR-040).
 */
export function OfflineBanner({ fetchedAt, pendingCount }: { fetchedAt: string | null; pendingCount: number }) {
  const { t } = useTranslation("mobile");
  const online = useOnline();
  if (online && pendingCount === 0) return null;
  const time = fetchedAt
    ? new Intl.DateTimeFormat(intlLocale(currentLocale()), { hour: "2-digit", minute: "2-digit" }).format(new Date(fetchedAt))
    : null;
  const pending = pendingCount > 0 ? t("offline.pendingCount", { count: pendingCount }) : undefined;
  if (online) return <Alert testID="offline-banner">{pending}</Alert>;
  return (
    <Alert testID="offline-banner" title={time ? t("offline.banner", { time }) : t("offline.bannerNoDate")}>
      {pending}
    </Alert>
  );
}
