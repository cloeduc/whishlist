import { Share } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";

import { CopyLinkField } from "./CopyLinkField";

/**
 * « Gérer la liste à plusieurs », as on the site: the invite link to copy, plus its own share
 * button (017, research R4). The « Partager » button of the public link never sends this one.
 * Works offline: the link is in the local copy.
 */
export function InviteCard({ title, inviteUrl }: { title: string; inviteUrl: string }) {
  const { t } = useTranslation(["list", "mobile"]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("list:share.collabTitle")}</CardTitle>
        <CardDescription>{t("list:share.collabDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <CopyLinkField
          label={t("list:share.inviteLink")}
          value={inviteUrl}
          copyLabel={t("list:share.copyInvite")}
          fieldTestID="share.invite-link"
          copyTestID="share.copy-invite"
          copiedTestID="share.invite-copied"
        />
        <Button
          testID="share.share-invite"
          title={t("mobile:sharing.shareInvite")}
          variant="neutral"
          fullWidth
          // The link is in the message: `url` as well would double it on iOS.
          onPress={() => void Share.share({ title, message: t("mobile:sharing.inviteMessage", { title, url: inviteUrl }) })}
        />
      </CardContent>
    </Card>
  );
}
