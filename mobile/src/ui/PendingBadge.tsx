import { useTranslation } from "react-i18next";

import { Badge } from "./Badge";

/** Yellow « En attente » badge on an idea or a list not sent yet (FR-026). */
export function PendingBadge() {
  const { t } = useTranslation("mobile");
  return (
    <Badge variant="highlight" testID="pending-badge">
      {t("offline.pending")}
    </Badge>
  );
}
