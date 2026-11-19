import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { renameFollowedList } from "@/data/subscriptions";
import { useFollowedList } from "@/data/store";
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

/** « Renommer cette liste » (024): the subscriber's own names for a followed list, seen by them only. */
export default function FollowedListNames() {
  const { t } = useTranslation("public");
  const { readToken } = useLocalSearchParams<{ readToken: string }>();
  const followed = useFollowedList(readToken);
  const online = useOnline();
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [customOwnerName, setCustomOwnerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The field starts from the saved name, once the local copy is read.
  const titleValue = customTitle ?? followed?.customTitle ?? "";
  const personValue = customOwnerName ?? followed?.customOwnerName ?? "";

  async function save(names: { customTitle: string | null; customOwnerName: string | null }) {
    if (!followed) return;
    setBusy(true);
    setError(null);
    try {
      const result = await renameFollowedList(readToken, names);
      if (!result.ok) {
        setError(translateError(result.error));
        return;
      }
      router.back();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="guest-names.screen">
      <BrandHeader />
      <BackLink />
      <Card>
        <CardHeader>
          <CardTitle>{t("followNames.title")}</CardTitle>
          <CardDescription>{t("followNames.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Field
            label={t("followNames.listName")}
            description={followed ? t("followNames.listNameHint", { title: followed.title }) : undefined}
          >
            <Input
              testID="guest-names.list-name"
              accessibilityLabel={t("followNames.listName")}
              placeholder={followed?.title}
              value={titleValue}
              onChangeText={setCustomTitle}
            />
          </Field>
          <Field
            label={t("followNames.person")}
            description={followed?.ownerName ? t("followNames.personHint", { name: followed.ownerName }) : undefined}
          >
            <Input
              testID="guest-names.person"
              accessibilityLabel={t("followNames.person")}
              placeholder={followed?.ownerName ?? undefined}
              value={personValue}
              onChangeText={setCustomOwnerName}
            />
          </Field>
          {error ? (
            <Alert variant="destructive" testID="guest-names.error">
              {error}
            </Alert>
          ) : null}
          <NetworkNote />
          <Button
            testID="guest-names.save"
            title={t("followNames.save")}
            fullWidth
            disabled={!online || busy || !followed}
            onPress={() => void save({ customTitle: titleValue, customOwnerName: personValue })}
          />
          <Button
            testID="guest-names.reset"
            title={t("followNames.reset")}
            variant="link"
            disabled={!online || busy || !followed}
            onPress={() => void save({ customTitle: null, customOwnerName: null })}
          />
        </CardContent>
      </Card>
    </Screen>
  );
}
