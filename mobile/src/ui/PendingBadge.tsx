import { useTranslation } from "react-i18next";

import { Badge } from "./Badge";

/** Badge jaune « En attente » sur une idée ou une liste pas encore envoyée (FR-026). */
export function PendingBadge() {
  const { t } = useTranslation("mobile");
  return (
    <Badge variant="highlight" testID="pending-badge">
      {t("offline.pending")}
    </Badge>
  );
}
