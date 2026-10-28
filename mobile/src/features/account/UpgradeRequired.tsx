import { useTranslation } from "react-i18next";

import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { BrandHeader } from "@/ui/BrandHeader";
import { Screen } from "@/ui/Screen";

/** Le serveur ne prend plus en charge cette version (410) : écran plein, sans autre action. */
export function UpgradeRequired({ message }: { message: string }) {
  const { t } = useTranslation("mobile");
  return (
    <Screen>
      <BrandHeader />
      <Card>
        <CardHeader>
          <CardTitle>{t("upgrade.title")}</CardTitle>
          <CardDescription>{message || t("upgrade.body")}</CardDescription>
        </CardHeader>
      </Card>
    </Screen>
  );
}
