import { router, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { parseAmount } from "../../../../src/domain/amount";

import { ApiError, type Schemas } from "@/api/client";
import { reserveGuestItem } from "@/features/guest/api";
import { useGuestList } from "@/features/guest/useGuestList";
import { useServerAction } from "@/features/errors";
import { useOnline } from "@/network";
import { ListThemeProvider } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { BackLink } from "@/ui/BackLink";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { RadioGroup, RadioGroupItem } from "@/ui/RadioGroup";
import { NetworkNote } from "@/ui/NetworkNote";
import { Screen } from "@/ui/Screen";
import { Select } from "@/ui/Select";
import { Text } from "@/ui/Text";

/**
 * « Réserver un cadeau » of the guest view (011, US4), like the site's `/l/{readToken}/reserve`: the chosen
 * idea, or a category then an idea, the optional name and message. « Réserver seul » or « Lancer un
 * cadeau commun » (028) with an optional amount. Always online: a reservation is never queued (FR-010b).
 * An idea taken in the meantime is refused by the server.
 */
export default function GuestReserve() {
  const { t } = useTranslation(["public", "mobile"]);
  const { readToken, itemId, typeId } = useLocalSearchParams<{ readToken: string; itemId?: string; typeId?: string }>();
  const { state, reload } = useGuestList(readToken);

  if (state.status !== "ready") {
    return (
      <Screen testID="guest-reserve.screen">
        <BackLink />
        {state.status === "loading" ? <Text>{t("mobile:loading")}</Text> : null}
        {state.status === "failed" ? (
          <>
            <Alert variant="destructive">{state.message}</Alert>
            <Button title={t("mobile:retry")} variant="neutral" onPress={reload} />
          </>
        ) : null}
        {state.status === "missing" ? <Alert variant="destructive">{t("public:missingList")}</Alert> : null}
        {state.status === "locked" ? (
          // The password is entered on the list view.
          <Button title={t("public:reserve.back")} onPress={() => router.replace(`/guest/${readToken}` as Href)} />
        ) : null}
      </Screen>
    );
  }
  return (
    <ListThemeProvider theme={state.list.theme}>
      <ReserveForm readToken={readToken} list={state.list} itemId={itemId} typeId={typeId} reload={reload} />
    </ListThemeProvider>
  );
}

function ReserveForm({
  readToken,
  list,
  itemId,
  typeId,
  reload,
}: {
  readToken: string;
  list: Schemas["PublicList"];
  itemId?: string;
  typeId?: string;
  reload: () => void;
}) {
  const { t } = useTranslation(["public", "errors"]);
  const online = useOnline();
  // An idea that is a group gift is joined from its own screen, not reserved here (028).
  const free = list.items.filter((item) => !item.mine && !item.groupGift);
  const picked = itemId ? free.find((item) => item.id === itemId) : undefined;
  const categories = [...list.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((category) => free.some((item) => item.typeId === category.id));
  const [category, setCategory] = useState(categories.some((entry) => entry.id === typeId) ? typeId! : "");
  const choices = category ? free.filter((item) => item.typeId === category) : free;
  const [chosen, setChosen] = useState("");
  const target = picked?.id ?? (choices.some((item) => item.id === chosen) ? chosen : "");
  const [fromName, setFromName] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"single" | "group">("single");
  const [amount, setAmount] = useState("");
  const amountCents = mode === "group" ? parseAmount(amount) : null;

  // No useCallback: the React Compiler already memoizes this component.
  const reserve = useServerAction(async () => {
    let groupGiftToken: string | null;
    try {
      ({ groupGiftToken } = await reserveGuestItem(readToken, {
        itemId: target,
        typeId: category || undefined,
        fromName,
        note,
        group: mode === "group" && amountCents !== "invalid" ? { amountCents } : undefined,
      }));
    } catch (error) {
      // Idea taken in the meantime (on the site or another phone): the reloaded list no longer offers it.
      if (error instanceof ApiError && error.status === 409) reload();
      throw error;
    }
    // A group gift opens on its own screen, where others' participations and its link are.
    if (groupGiftToken) {
      router.replace(`/gift/${groupGiftToken}` as Href);
      return;
    }
    // Back to the list view already open (it reloads on return), without stacking it a second time.
    if (router.canGoBack()) router.back();
    else router.replace(`/guest/${readToken}` as Href);
  });

  const unavailable = Boolean(itemId) && !picked;
  return (
    <Screen testID="guest-reserve.screen">
      <BackLink />
      <Text size="title" accessibilityRole="header">
        {t("reserve.title")}
      </Text>
      <Text color={tokens.colors.mutedForeground}>{t("reserve.listContext", { title: list.title })}</Text>
      {unavailable ? (
        <Alert testID="guest-reserve.unavailable" variant="destructive">
          {t("reserve.unavailable")}
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{picked ? t("reserve.offerTitle", { name: picked.name }) : t("reserve.typeTitle")}</CardTitle>
          <CardDescription>{mode === "group" ? t("groupGift.noPurchaseHint") : t("reserve.noPurchaseHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {!picked ? (
            <>
              {categories.length > 1 ? (
                <Field label={t("reserve.filterLabel")}>
                  <Select
                    label={t("reserve.filterLabel")}
                    value={category}
                    options={[
                      { value: "", label: t("reserve.allTypes") },
                      ...categories.map((entry) => ({ value: entry.id, label: entry.label })),
                    ]}
                    onChange={(value) => {
                      setCategory(value);
                      setChosen("");
                    }}
                  />
                </Field>
              ) : null}
              <Field label={t("reserve.giftLabel")}>
                <Select
                  label={t("reserve.giftLabel")}
                  value={target}
                  placeholder={t("reserve.giftLabel")}
                  options={choices.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={setChosen}
                />
              </Field>
            </>
          ) : null}
          <RadioGroup testID="guest-reserve.mode" label={t("reserve.modeLabel")} value={mode} onChange={setMode}>
            <RadioGroupItem
              testID="guest-reserve.mode-single"
              value="single"
              label={t("reserve.modeSingle")}
              description={t("reserve.modeSingleHint")}
            />
            <RadioGroupItem
              testID="guest-reserve.mode-group"
              value="group"
              label={t("reserve.modeGroup")}
              description={t("reserve.modeGroupHint")}
            />
          </RadioGroup>
          {mode === "group" ? (
            <Field
              label={t("groupGift.amount")}
              description={t("groupGift.amountHint")}
              error={amountCents === "invalid" ? t("errors:invalidAmount") : undefined}
            >
              <Input
                testID="guest-reserve.amount"
                accessibilityLabel={t("groupGift.amount")}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </Field>
          ) : null}
          <Field label={t("reserve.fromName")}>
            <Input
              testID="guest-reserve.from-name"
              accessibilityLabel={t("reserve.fromName")}
              value={fromName}
              onChangeText={setFromName}
              autoComplete="name"
              maxLength={200}
            />
          </Field>
          <Field
            label={t("reserve.note")}
            description={mode === "group" ? t("groupGift.privacyHint") : t("reserve.privacyHint")}
          >
            <Input
              testID="guest-reserve.note"
              accessibilityLabel={t("reserve.note")}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={2000}
            />
          </Field>
          {reserve.error ? (
            <Alert testID="guest-reserve.error" variant="destructive">
              {reserve.error}
            </Alert>
          ) : null}
          <Button
            testID="guest-reserve.submit"
            title={t("reserve.submit")}
            fullWidth
            disabled={!online || reserve.busy || !target || amountCents === "invalid"}
            onPress={() => void reserve.run()}
          />
          <NetworkNote />
        </CardContent>
      </Card>
    </Screen>
  );
}
