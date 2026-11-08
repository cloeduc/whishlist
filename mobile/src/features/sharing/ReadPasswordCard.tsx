import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { clearReadPassword, setReadPassword } from "@/data/sharing";
import { useServerAction } from "@/features/errors";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { PasswordInput } from "@/ui/PasswordInput";
import { Text } from "@/ui/Text";

/**
 * « Protéger l'accès à votre liste », owner only, as on the site (`components/site/read-password-form.tsx`):
 * sets, replaces or removes the read password. The app never sees the stored password; the server
 * checks its length (8 characters at least) and the owner's role. Mounted for every role: when the
 * role changed elsewhere, the reloaded list removes the card and its refusal stays readable.
 */
export function ReadPasswordCard({
  listId,
  owner,
  protectedList,
  disabled,
}: {
  listId: string;
  owner: boolean;
  protectedList: boolean;
  disabled: boolean;
}) {
  const { t } = useTranslation("list");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState<"saved" | "cleared" | null>(null);
  const [clearing, setClearing] = useState(false);
  const save = useServerAction(
    useCallback(async () => {
      setDone(null);
      await setReadPassword(listId, password);
      setPassword("");
      setDone("saved");
    }, [listId, password]),
  );
  const clear = useServerAction(
    useCallback(async () => {
      setDone(null);
      await clearReadPassword(listId);
      setDone("cleared");
    }, [listId]),
  );
  const error = save.error ?? clear.error;
  const busy = save.busy || clear.busy;
  if (!owner) {
    return error ? (
      <Alert testID="share.password-error" variant="destructive">
        {error}
      </Alert>
    ) : null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("share.readPassword")}</CardTitle>
        <CardDescription>{t("share.readPasswordHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Text size="sm" testID="share.password-state">
          {protectedList ? t("share.readPasswordSet") : t("share.readPasswordUnset")}
        </Text>
        {error ? (
          <Alert testID="share.password-error" variant="destructive">
            {error}
          </Alert>
        ) : null}
        {done === "saved" ? <Alert testID="share.password-saved">{t("share.readPasswordSaved")}</Alert> : null}
        {done === "cleared" ? <Alert testID="share.password-cleared">{t("share.readPasswordCleared")}</Alert> : null}
        <Text size="sm">
          {protectedList ? t("share.readPasswordChange") : t("share.readPasswordDefine")}
        </Text>
        <Field label={t("share.readPasswordLabel")}>
          <PasswordInput
            testID="share.read-password"
            accessibilityLabel={t("share.readPasswordLabel")}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setDone(null);
            }}
            editable={!disabled}
            // Not the account's password: no iOS strong password sheet, nothing saved in the keychain.
            autoComplete="off"
            textContentType="none"
          />
        </Field>
        <Button
          testID="share.save-password"
          title={t("share.readPasswordSave")}
          fullWidth
          disabled={disabled || busy}
          onPress={() => {
            clear.setError(null);
            void save.run();
          }}
        />
        {protectedList ? (
          <Button
            testID="share.clear-password"
            title={t("share.readPasswordClear")}
            variant="neutral"
            fullWidth
            disabled={disabled || busy}
            onPress={() => setClearing(true)}
          />
        ) : null}
      </CardContent>
      <ConfirmDialog
        visible={clearing}
        testID="share.clear-password-confirm"
        title={t("confirm.clearPasswordTitle")}
        body={t("confirm.clearPasswordBody")}
        confirmLabel={t("confirm.clearPasswordConfirm")}
        keepLabel={t("confirm.clearPasswordKeep")}
        onKeep={() => setClearing(false)}
        onConfirm={() => {
          setClearing(false);
          save.setError(null);
          void clear.run();
        }}
      />
    </Card>
  );
}
