import { router, type Href } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { followList } from "@/data/subscriptions";
import { errorText } from "@/features/errors";
import { translateError } from "@/i18n";
import { useOnline } from "@/network";
import { Alert } from "@/ui/Alert";
import { BackLink } from "@/ui/BackLink";
import { BrandHeader } from "@/ui/BrandHeader";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { NetworkNote } from "@/ui/NetworkNote";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";

/** Écran « Suivre une liste » : colle un lien public (et saisit le mot de passe de lecture si `423`). */
export default function FollowSharedList() {
  const { t } = useTranslation("mobile");
  const online = useOnline();
  const [urlOrToken, setUrlOrToken] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [lockedTitle, setLockedTitle] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await followList({
        urlOrToken,
        password: needsPassword ? password : undefined,
      });
      if (!result.ok) {
        if ("title" in result) {
          setNeedsPassword(true);
          setLockedTitle(result.title);
          return;
        }
        setError(translateError(result.error));
        return;
      }
      router.replace(`/guest/${result.subscription.readToken}` as Href);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="follow.screen">
      <BrandHeader />
      <BackLink />
      <Card>
        <CardHeader>
          <CardTitle>{t("shared.followTitle")}</CardTitle>
          <CardDescription>{t("shared.followDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Field label={t("shared.linkLabel")}>
            <Input
              testID="follow.link"
              accessibilityLabel={t("shared.linkLabel")}
              placeholder={t("shared.linkPlaceholder")}
              autoCapitalize="none"
              autoCorrect={false}
              value={urlOrToken}
              onChangeText={(value) => {
                setUrlOrToken(value);
                if (needsPassword) {
                  setNeedsPassword(false);
                  setLockedTitle(null);
                  setPassword("");
                }
              }}
            />
          </Field>
          {needsPassword ? (
            <Field label={t("shared.passwordLabel")} description={t("shared.passwordHint")}>
              {lockedTitle ? (
                <Text weight="heading" testID="follow.locked-title">
                  {lockedTitle}
                </Text>
              ) : null}
              <Input
                testID="follow.password"
                accessibilityLabel={t("shared.passwordLabel")}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Field>
          ) : null}
          {error ? (
            <Alert variant="destructive" testID="follow.error">
              {error}
            </Alert>
          ) : null}
          <NetworkNote />
          <Button
            testID="follow.submit"
            title={t("shared.submitFollow")}
            fullWidth
            disabled={busy || !online}
            onPress={() => void submit()}
          />
        </CardContent>
      </Card>
    </Screen>
  );
}
