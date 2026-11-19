import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useServerAction } from "@/features/errors";
import { useOnline } from "@/network";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { NetworkNote } from "@/ui/NetworkNote";
import { PasswordInput } from "@/ui/PasswordInput";

/**
 * A protected list's password, like the site's `ReadUnlockForm`: on the list's guest view and on a group
 * gift's screen (028). `title` is the list's title when the screen only knows it from the refusal.
 */
export function UnlockCard({
  title,
  unlock: send,
  onUnlocked,
  passwordTestID,
  errorTestID,
  submitTestID,
}: {
  title?: string;
  unlock: (password: string) => Promise<void>;
  onUnlocked: () => void;
  passwordTestID: string;
  errorTestID: string;
  submitTestID: string;
}) {
  const { t } = useTranslation("public");
  const online = useOnline();
  const [password, setPassword] = useState("");
  const unlock = useServerAction(
    useCallback(async () => {
      await send(password);
      onUnlocked();
    }, [send, password, onUnlocked]),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("unlock.heading")}</CardTitle>
        <CardDescription>{title ? `${title} — ${t("unlock.description")}` : t("unlock.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field label={t("unlock.password")} description={t("unlock.passwordHint")}>
          <PasswordInput
            testID={passwordTestID}
            accessibilityLabel={t("unlock.password")}
            value={password}
            onChangeText={setPassword}
            autoComplete="off"
          />
        </Field>
        {unlock.error ? (
          <Alert testID={errorTestID} variant="destructive">
            {unlock.error}
          </Alert>
        ) : null}
        <Button
          testID={submitTestID}
          title={t("unlock.submit")}
          fullWidth
          disabled={!online || unlock.busy || !password}
          onPress={() => void unlock.run()}
        />
        <NetworkNote />
      </CardContent>
    </Card>
  );
}
