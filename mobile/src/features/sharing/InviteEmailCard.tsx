import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { regenerateInvite, sendInvite } from "@/data/sharing";
import { useServerAction } from "@/features/errors";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { Text } from "@/ui/Text";

/**
 * « Inviter par e-mail », as on the site (`components/site/invite-email-form.tsx`): the person
 * receives the invite link. The server checks the address, the sender's confirmed address and the rate limit.
 * The owner can also replace the invite link here (US4), as on the site.
 */
export function InviteEmailCard({ listId, owner, disabled }: { listId: string; owner: boolean; disabled: boolean }) {
  const { t } = useTranslation("list");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const invite = useServerAction(
    useCallback(async () => {
      setSent(false);
      await sendInvite(listId, email.trim());
      setEmail("");
      setSent(true);
    }, [listId, email]),
  );
  const [replacing, setReplacing] = useState(false);
  const regenerate = useServerAction(useCallback(() => regenerateInvite(listId), [listId]));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("share.inviteEmailTitle")}</CardTitle>
        <CardDescription>{t("share.inviteEmailDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {invite.error ? (
          <Alert testID="share.invite-error" variant="destructive">
            {invite.error}
          </Alert>
        ) : null}
        {sent ? <Alert testID="share.invite-sent">{t("inviteSent")}</Alert> : null}
        <Field label={t("share.inviteEmail")}>
          <Input
            testID="share.invite-email"
            accessibilityLabel={t("share.inviteEmail")}
            placeholder={t("share.inviteEmailPlaceholder")}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setSent(false);
            }}
            editable={!disabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
        </Field>
        <Button
          testID="share.send-invite"
          title={t("share.sendInvite")}
          fullWidth
          disabled={disabled || invite.busy}
          onPress={() => void invite.run()}
        />
        {/* Outside the owner part: a refusal because the role changed elsewhere stays readable. */}
        {regenerate.error ? (
          <Alert testID="share.regenerate-error" variant="destructive">
            {regenerate.error}
          </Alert>
        ) : null}
        {owner ? (
          <>
            <Button
              testID="share.regenerate"
              title={t("share.regenerate")}
              variant="neutral"
              fullWidth
              disabled={disabled || regenerate.busy}
              onPress={() => setReplacing(true)}
            />
            <Text size="sm" color={tokens.colors.mutedForeground}>
              {t("share.regenerateHint")}
            </Text>
          </>
        ) : null}
      </CardContent>
      <ConfirmDialog
        visible={replacing}
        testID="share.regenerate-confirm"
        title={t("confirm.regenTitle")}
        body={t("confirm.regenBody")}
        confirmLabel={t("confirm.regenConfirm")}
        keepLabel={t("confirm.regenKeep")}
        destructive={false}
        onKeep={() => setReplacing(false)}
        onConfirm={() => {
          setReplacing(false);
          void regenerate.run();
        }}
      />
    </Card>
  );
}
