import { Share } from "react-native";
import { useTranslation } from "react-i18next";

import { AloneDeleteButton } from "@/features/lists/DeleteListCard";
import { ListScreen } from "@/features/lists/ListScreen";
import { CopyLinkField } from "@/features/sharing/CopyLinkField";
import { InviteCard } from "@/features/sharing/InviteCard";
import { InviteEmailCard } from "@/features/sharing/InviteEmailCard";
import { MembersCard } from "@/features/sharing/MembersCard";
import { ReadPasswordCard } from "@/features/sharing/ReadPasswordCard";
import { useOnline } from "@/network";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { PageTitle } from "@/ui/PageTitle";
import { QrCard } from "@/ui/QrCard";
import { Text } from "@/ui/Text";

/**
 * Share tab, the site's « Partage » tab card by card (017, contracts/screens.md): public link with
 * the QR code and the phone's share sheet (005, FR-020 to FR-024), then the invite link, the
 * invitation by email, the read password (owner) and the members. The public link's « Partager » never sends the invite link (FR-023).
 * Offline, the links stay readable and copyable; the actions that write are disabled.
 */
export default function ShareTab() {
  const { t } = useTranslation(["list", "mobile"]);
  const online = useOnline();
  return (
    <ListScreen tab="partage">
      {(list) => {
        if (list.localOnly || !list.readUrl) return <Alert>{t("mobile:share.pendingList")}</Alert>;
        const readUrl = list.readUrl;
        return (
          <>
            <PageTitle title={t("list:share.title")} description={t("list:share.description")} weight="heading" />
            {online ? null : <Alert testID="share.offline">{t("mobile:sharing.offline")}</Alert>}
            <Card>
              <CardHeader>
                <CardTitle>{t("list:share.readTitle")}</CardTitle>
                <CardDescription>{t("list:share.readDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {list.hasReadPassword ? <Alert testID="password-notice">{t("mobile:share.passwordNotice")}</Alert> : null}
                <QrCard value={readUrl} accessibilityLabel={t("mobile:share.qrLabel")} />
                <Text size="sm" color={tokens.colors.mutedForeground} style={{ textAlign: "center" }}>
                  {t("mobile:share.qrHint")}
                </Text>
                <Button
                  testID="share.share"
                  title={t("mobile:share.share")}
                  fullWidth
                  // The link is in the message: `url` as well would double it on iOS.
                  onPress={() => void Share.share({ title: list.title, message: t("mobile:share.message", { title: list.title, url: readUrl }) })}
                />
                <CopyLinkField
                  label={t("list:share.readLink")}
                  value={readUrl}
                  copyLabel={t("list:share.copyRead")}
                  fieldTestID="share.read-link"
                  copyTestID="copy-link"
                  copiedTestID="share.copied"
                />
              </CardContent>
            </Card>
            <InviteCard title={list.title} inviteUrl={list.inviteUrl} />
            <InviteEmailCard listId={list.id} owner={list.role === "owner"} disabled={!online} />
            <ReadPasswordCard listId={list.id} owner={list.role === "owner"} protectedList={list.hasReadPassword} disabled={!online} />
            <MembersCard
              listId={list.id}
              role={list.role}
              members={list.members}
              disabled={!online}
              aloneAction={<AloneDeleteButton list={list} disabled={!online} />}
            />
          </>
        );
      }}
    </ListScreen>
  );
}
