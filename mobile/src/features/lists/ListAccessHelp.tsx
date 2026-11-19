import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";

import { AuthLayout } from "@/features/account/AuthLayout";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";

/**
 * A list's management address opened by an account that does not manage the list (026), like the
 * site's help page: says nothing about the list, tells which link to ask for, leads back home. An
 * account that already follows the list is offered to open it (`followedReadToken`).
 */
export function ListAccessHelp({ followedReadToken }: { followedReadToken: string | null }) {
  const { t } = useTranslation("list");
  return (
    <AuthLayout title={t("accessHelp.title")} description={t("accessHelp.body")} testID="link-list.help">
      <Text>{t(followedReadToken ? "accessHelp.followedBody" : "accessHelp.howTo")}</Text>
      {followedReadToken ? (
        <Button
          testID="link-list.view-followed"
          title={t("accessHelp.viewFollowed")}
          fullWidth
          onPress={() => router.replace(`/guest/${encodeURIComponent(followedReadToken)}` as Href)}
        />
      ) : null}
      <Button
        testID="link-list.back"
        title={t("accessHelp.backToLists")}
        variant={followedReadToken ? "neutral" : "default"}
        fullWidth
        onPress={() => router.replace("/")}
      />
    </AuthLayout>
  );
}
