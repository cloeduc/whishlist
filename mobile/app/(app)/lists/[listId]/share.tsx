import * as Clipboard from "expo-clipboard";
import { CopyIcon } from "lucide-react-native";
import { useState } from "react";
import { Linking, Share, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ListScreen } from "@/features/lists/ListScreen";
import { currentLocale, withLocale } from "@/i18n";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { QrCard } from "@/ui/QrCard";
import { Text } from "@/ui/Text";

/** The list's sharing page on the site (invitations, password, members). */
function adminShareUrl(readUrl: string, listId: string): string | null {
  const origin = /^https?:\/\/[^/]+/.exec(readUrl)?.[0];
  return origin ? origin + withLocale(currentLocale(), `/listes/${listId}?onglet=partage`) : null;
}

/**
 * Share tab, from the « Partager avec vos proches » card of `09-liste-partage.png`,
 * plus the QR code and the phone's share sheet (FR-020 to FR-024).
 * The shared link is always `readUrl`, never the invite link (FR-023). Works offline
 * for a list already sent: the link is in the local copy.
 */
export default function ShareTab() {
  const { t } = useTranslation(["list", "mobile"]);
  const [copied, setCopied] = useState(false);
  return (
    <ListScreen tab="partage">
      {(list) => {
        if (list.localOnly || !list.readUrl) return <Alert>{t("mobile:share.pendingList")}</Alert>;
        const readUrl = list.readUrl;
        const admin = adminShareUrl(readUrl, list.id);
        return (
          <>
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
                <Field label={t("list:share.readLink")}>
                  <View style={{ flexDirection: "row", gap: tokens.space[2], alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Input testID="share.read-link" accessibilityLabel={t("list:share.readLink")} value={readUrl} editable={false} muted selectTextOnFocus />
                    </View>
                    <Button
                      size="icon"
                      variant="neutral"
                      accessibilityLabel={t("list:share.copyRead")}
                      icon={<CopyIcon size={16} color={tokens.colors.black} />}
                      onPress={() => {
                        void Clipboard.setStringAsync(readUrl).then(() => setCopied(true));
                      }}
                      testID="copy-link"
                    />
                  </View>
                </Field>
                {copied ? <Alert testID="share.copied">{t("list:share.copied")}</Alert> : null}
              </CardContent>
            </Card>
            {admin ? <Button title={t("mobile:share.manageOnSite")} variant="link" onPress={() => void Linking.openURL(admin)} /> : null}
          </>
        );
      }}
    </ListScreen>
  );
}
