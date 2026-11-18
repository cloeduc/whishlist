import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { AuthLayout } from "@/features/account/AuthLayout";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";

/**
 * A list's management address opened by an account that does not manage the list (026), like the
 * site's help page: says nothing about the list, tells which link to ask for, leads back home.
 */
export function ListAccessHelp() {
  const { t } = useTranslation("list");
  return (
    <AuthLayout title={t("accessHelp.title")} description={t("accessHelp.body")} testID="link-list.help">
      <Text>{t("accessHelp.howTo")}</Text>
      <Button testID="link-list.back" title={t("accessHelp.backToLists")} fullWidth onPress={() => router.replace("/")} />
    </AuthLayout>
  );
}
