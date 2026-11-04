import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/auth/session";
import { createList, newListDefaults, useMyLists } from "@/data/lists";
import { translateError } from "@/i18n";
import { getChange } from "@/offline/outbox";
import { Alert } from "@/ui/Alert";
import { BackLink } from "@/ui/BackLink";
import { BrandHeader } from "@/ui/BrandHeader";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { Screen } from "@/ui/Screen";

type Ids = { id: string; categoryId: string; personId: string };

/**
 * New list, from `05-nouvelle-liste.png` (FR-011). As on the site, no field is required:
 * each one shows as placeholder the value it will take if left empty. Works offline: the list is created
 * on the phone and sent later (FR-026). `?retry=<seq>`: « Corriger » a refused creation.
 */
export default function NewList() {
  const { t } = useTranslation("home");
  const params = useLocalSearchParams<{ retry?: string }>();
  const retrySeq = params.retry ? Number(params.retry) : null;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [person, setPerson] = useState("");
  const [ids, setIds] = useState<Ids | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const session = useSession();
  const displayName = "user" in session ? (session.user?.displayName ?? "") : "";
  const { lists } = useMyLists();
  // The list taken up by « Corriger » does not count: its own default name must not number it.
  const defaults = useMemo(
    () => newListDefaults(displayName, lists.filter((list) => list.id !== ids?.id).map((list) => list.title), (key, vars) => t(key, vars)),
    [displayName, lists, ids?.id, t],
  );

  // « Corriger »: the form takes back what had been entered, with the same identifiers.
  useEffect(() => {
    if (!retrySeq) return;
    void getChange(retrySeq).then((change) => {
      if (change?.kind !== "createList") return;
      const { payload } = change;
      setTitle(payload.title);
      setCategory(payload.category);
      setPerson(payload.person);
      setIds({ id: payload.id, categoryId: payload.categoryId, personId: payload.personId });
      setError(change.errorCode ? translateError(change.errorCode) : null);
    });
  }, [retrySeq]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await createList({ title, category, person }, defaults, retrySeq, ids);
      if (!result.ok) {
        setError(translateError(result.error));
        return;
      }
      router.replace(`/lists/${result.listId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="new-list.screen">
      <BrandHeader />
      <BackLink />
      <Card>
        <CardHeader>
          <CardTitle>{t("newList.title")}</CardTitle>
          <CardDescription>{t("newList.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Field label={t("newList.titleLabel")}>
            <Input testID="new-list.title" accessibilityLabel={t("newList.titleLabel")} placeholder={defaults.title} value={title} onChangeText={setTitle} />
          </Field>
          <Field label={t("newList.categoryLabel")} description={t("newList.categoryHint")}>
            <Input
              testID="new-list.category"
              accessibilityLabel={t("newList.categoryLabel")}
              placeholder={defaults.category}
              value={category}
              onChangeText={setCategory}
            />
          </Field>
          <Field label={t("newList.personLabel")} description={t("newList.personHint")}>
            <Input testID="new-list.person" accessibilityLabel={t("newList.personLabel")} placeholder={defaults.person} value={person} onChangeText={setPerson} />
          </Field>
          {error ? <Alert variant="destructive" testID="new-list.error">{error}</Alert> : null}
          <Button testID="new-list.submit" title={t("newList.submit")} fullWidth disabled={busy} onPress={() => void submit()} />
        </CardContent>
      </Card>
    </Screen>
  );
}
