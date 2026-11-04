import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, ok } from "@/api/client";
import { updateMe, useSession } from "@/auth/session";
import { useServerAction } from "@/features/errors";
import { useOnline } from "@/network";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { CollapsibleCard } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { NetworkNote } from "@/ui/NetworkNote";
import { Text } from "@/ui/Text";

/**
 * « Adresse de connexion » card of « Mon compte » (010, US3), like the site one: new address and
 * current password. The server returns the account: either a pending change (link sent to the new
 * address), or the address already changed (server without email sending). Collapsed by default, like the others (009).
 */
export function EmailCard() {
  const { t } = useTranslation("auth");
  const session = useSession();
  const online = useOnline();
  const user = session.status === "signedIn" ? session.user : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = useServerAction(
    useCallback(async () => {
      setFeedback(null);
      const me = await ok(api.POST("/me/email", { body: { email: email.trim(), currentPassword: password } }));
      await updateMe(me);
      setEmail("");
      setPassword("");
      setFeedback(me.pendingEmail ? t("account.emailChange.sent") : t("account.emailChange.changed", { email: me.email }));
    }, [email, password, t]),
  );
  const cancel = useServerAction(
    useCallback(async () => {
      setFeedback(null);
      await updateMe(await ok(api.DELETE("/me/email")));
      setFeedback(t("account.emailChange.cancelled"));
    }, [t]),
  );

  return (
    <CollapsibleCard testID="account.email" title={t("account.emailChange.title")} description={t("account.emailChange.descriptionNoMail")}>
      <Text size="sm">{t("account.emailChange.current", { email: user?.email ?? "" })}</Text>
      {feedback ? <Alert testID="account.email-saved">{feedback}</Alert> : null}
      {user?.pendingEmail ? (
        <>
          <Alert testID="account.email-pending">{t("account.emailChange.pending", { email: user.pendingEmail })}</Alert>
          {cancel.error ? <Alert variant="destructive">{cancel.error}</Alert> : null}
          <Button
            testID="account.email-cancel"
            title={t("account.emailChange.cancel")}
            variant="neutral"
            fullWidth
            disabled={!online || cancel.busy}
            onPress={() => void cancel.run()}
          />
        </>
      ) : null}
      <Field label={t("account.emailChange.newEmail")}>
        <Input
          testID="account.email-new"
          accessibilityLabel={t("account.emailChange.newEmail")}
          value={email}
          onChangeText={setEmail}
          editable={online}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </Field>
      <Field label={t("account.emailChange.currentPassword")}>
        <Input
          testID="account.email-password"
          accessibilityLabel={t("account.emailChange.currentPassword")}
          value={password}
          onChangeText={setPassword}
          editable={online}
          secureTextEntry
          autoComplete="current-password"
        />
      </Field>
      {submit.error ? <Alert variant="destructive">{submit.error}</Alert> : null}
      <Button
        testID="account.email-submit"
        title={t("account.emailChange.submit")}
        fullWidth
        disabled={!online || submit.busy || !email.trim() || !password}
        onPress={() => void submit.run()}
      />
      <NetworkNote />
    </CollapsibleCard>
  );
}
