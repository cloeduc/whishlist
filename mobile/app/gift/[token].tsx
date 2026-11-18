import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Share, View } from "react-native";
import { useTranslation } from "react-i18next";

import { parseAmount } from "../../../src/domain/amount";
import { formatPrice, priceInput } from "../../../src/domain/price";
import { withLocale } from "../../../src/i18n/locale-path";
import { groupGiftSummaryText } from "../../../src/site/group-gift-text";

import { siteOrigin, type Schemas } from "@/api/client";
import { useServerAction } from "@/features/errors";
import {
  deleteGroupGiftMessage,
  joinGroupGift,
  leaveGroupGift,
  postGroupGiftMessage,
  setGroupGiftAmount,
  setGroupGiftStatus,
  unlockGroupGift,
} from "@/features/group-gift/api";
import { useGroupGift } from "@/features/group-gift/useGroupGift";
import { currentLocale, intlLocale } from "@/i18n";
import { useOnline } from "@/network";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { BackLink } from "@/ui/BackLink";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Empty } from "@/ui/Empty";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { NetworkNote } from "@/ui/NetworkNote";
import { PasswordInput } from "@/ui/PasswordInput";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";

/** Only web links open: an idea's address comes from the list, not from this phone (011). */
function webUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

/**
 * A group gift (028), opened from the guest view or by its own link, like the site's `/g/<token>`: the idea
 * and the list's title (never the list's link), the participants and what is left, then « Participer », or
 * one's participation (amount with an account, « Le cadeau est complet », « Retirer ma participation ») and
 * the gift's link to share. Always online, like a reservation.
 */
export default function GroupGiftScreen() {
  const { t } = useTranslation(["public", "mobile"]);
  const { token } = useLocalSearchParams<{ token: string }>();
  const { state, reload, replace } = useGroupGift(token);

  if (state.status === "loading") {
    return (
      <Screen testID="gift.screen">
        <BackLink />
        <Text>{t("mobile:loading")}</Text>
      </Screen>
    );
  }
  if (state.status === "missing") {
    return (
      <Screen testID="gift.screen">
        <BackLink />
        <Empty testID="gift.missing" title={t("public:groupGift.missing")} description={t("public:groupGift.missingHint")} />
      </Screen>
    );
  }
  if (state.status === "failed") {
    return (
      <Screen testID="gift.screen">
        <BackLink />
        <Alert testID="gift.error" variant="destructive">
          {state.message}
        </Alert>
        <Button testID="gift.retry" title={t("mobile:retry")} variant="neutral" onPress={reload} />
      </Screen>
    );
  }
  if (state.status === "locked") return <Unlock token={token} title={state.title} onUnlocked={reload} />;
  return <Ready token={token} gift={state.gift} reload={reload} replace={replace} />;
}

/** The list is protected: its password, as for the list itself. */
function Unlock({ token, title, onUnlocked }: { token: string; title: string; onUnlocked: () => void }) {
  const { t } = useTranslation("public");
  const online = useOnline();
  const [password, setPassword] = useState("");
  const unlock = useServerAction(
    useCallback(async () => {
      await unlockGroupGift(token, password);
      onUnlocked();
    }, [token, password, onUnlocked]),
  );
  return (
    <Screen testID="gift.screen">
      <BackLink />
      <Card>
        <CardHeader>
          <CardTitle>{t("unlock.heading")}</CardTitle>
          <CardDescription>{title ? `${title} — ${t("unlock.description")}` : t("unlock.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Field label={t("unlock.password")} description={t("unlock.passwordHint")}>
            <PasswordInput
              testID="gift.password"
              accessibilityLabel={t("unlock.password")}
              value={password}
              onChangeText={setPassword}
              autoComplete="off"
            />
          </Field>
          {unlock.error ? (
            <Alert testID="gift.unlock-error" variant="destructive">
              {unlock.error}
            </Alert>
          ) : null}
          <Button
            testID="gift.unlock"
            title={t("unlock.submit")}
            fullWidth
            disabled={!online || unlock.busy || !password}
            onPress={() => void unlock.run()}
          />
          <NetworkNote />
        </CardContent>
      </Card>
    </Screen>
  );
}

function Ready({
  token,
  gift,
  reload,
  replace,
}: {
  token: string;
  gift: Schemas["GroupGift"];
  reload: () => void;
  replace: (gift: Schemas["GroupGift"]) => void;
}) {
  const { t } = useTranslation(["public", "mobile"]);
  const locale = intlLocale(currentLocale());
  const price = (cents: number | null) => formatPrice(cents, locale);
  const link = webUrl(gift.item.url);
  return (
    <Screen testID="gift.screen" onRefresh={reload}>
      <BackLink />
      <View style={{ gap: tokens.space[2] }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space[1] }}>
          <Badge variant="neutral">{t("groupGift.badge")}</Badge>
          {gift.me ? <Badge>{t("groupGift.mine")}</Badge> : null}
          {gift.status === "complete" ? <Badge testID="gift.complete-badge">{t("groupGift.complete")}</Badge> : null}
        </View>
        <Text size="title" accessibilityRole="header">
          {gift.item.name}
        </Text>
        <Text color={tokens.colors.mutedForeground}>{t("groupGift.fromList", { title: gift.listTitle })}</Text>
        {gift.item.priceLabel ? (
          <Text size="title" weight="heading">
            {gift.item.priceLabel}
          </Text>
        ) : null}
        {gift.item.description ? <Text>{gift.item.description}</Text> : null}
        {link ? (
          <Button
            title={t("buyLink")}
            accessibilityLabel={t("buyLinkAria", { name: gift.item.name })}
            variant="link"
            size="sm"
            onPress={() => void Linking.openURL(link)}
          />
        ) : null}
      </View>

      <Card>
        <CardHeader>
          <Text testID="gift.summary" weight="heading">
            {groupGiftSummaryText(t, gift, locale)}
          </Text>
          {gift.totalCents > 0 ? (
            <CardDescription>{t("groupGift.totalLine", { amount: price(gift.totalCents) })}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <Text weight="heading">{t("groupGift.participantsTitle")}</Text>
          {gift.participations
            ? gift.participations.map((participation, index) => (
                <View key={participation.reservationId ?? index} style={{ gap: tokens.space[1] }}>
                  <Text testID={`gift.participant-${index}`}>
                    {`${participation.name ?? t("groupGift.anonymous")} · ${
                      participation.amountCents !== null ? price(participation.amountCents) : t("groupGift.amountUnknown")
                    }`}
                  </Text>
                  {participation.note ? (
                    <Text size="sm" color={tokens.colors.mutedForeground}>
                      {participation.note}
                    </Text>
                  ) : null}
                </View>
              ))
            : gift.participantNames.map((name, index) => (
                <Text key={index} testID={`gift.participant-${index}`}>
                  {name ?? t("groupGift.anonymous")}
                </Text>
              ))}
        </CardContent>
      </Card>

      {gift.me?.reservationId ? (
        <Mine token={token} gift={gift} me={gift.me} reservationId={gift.me.reservationId} reload={reload} replace={replace} />
      ) : gift.status === "open" ? (
        <Join token={token} reload={reload} />
      ) : (
        <Alert testID="gift.closed">{t("groupGift.closed")}</Alert>
      )}

      {gift.thread ? <Thread token={token} messages={gift.thread.messages} reload={reload} /> : null}

      {gift.me ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("groupGift.invite")}</CardTitle>
            <CardDescription>{t("groupGift.inviteHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              testID="gift.share"
              title={t("mobile:groupGift.share")}
              variant="neutral"
              onPress={() => {
                const url = `${siteOrigin()}${withLocale(currentLocale(), `/g/${token}`)}`;
                void Share.share({ message: t("mobile:groupGift.shareMessage", { name: gift.item.name, url }) });
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </Screen>
  );
}

function Join({ token, reload }: { token: string; reload: () => void }) {
  const { t } = useTranslation(["public", "errors"]);
  const online = useOnline();
  const [amount, setAmount] = useState("");
  const [fromName, setFromName] = useState("");
  const [note, setNote] = useState("");
  const amountCents = parseAmount(amount);
  const join = useServerAction(
    useCallback(async () => {
      if (amountCents === "invalid") return;
      await joinGroupGift(token, { fromName, note, amountCents });
      reload();
    }, [token, fromName, note, amountCents, reload]),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("groupGift.joinTitle")}</CardTitle>
        <CardDescription>{t("groupGift.noPurchaseHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field
          label={t("groupGift.amount")}
          description={t("groupGift.amountHint")}
          error={amountCents === "invalid" ? t("errors:invalidAmount") : undefined}
        >
          <Input
            testID="gift.amount"
            accessibilityLabel={t("groupGift.amount")}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            maxLength={12}
          />
        </Field>
        <Field label={t("reserve.fromName")}>
          <Input
            testID="gift.from-name"
            accessibilityLabel={t("reserve.fromName")}
            value={fromName}
            onChangeText={setFromName}
            autoComplete="name"
            maxLength={200}
          />
        </Field>
        <Field label={t("reserve.note")} description={t("groupGift.privacyHint")}>
          <Input
            testID="gift.note"
            accessibilityLabel={t("reserve.note")}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={2000}
          />
        </Field>
        {join.error ? (
          <Alert testID="gift.join-error" variant="destructive">
            {join.error}
          </Alert>
        ) : null}
        <Button
          testID="gift.join"
          title={t("groupGift.joinSubmit")}
          fullWidth
          disabled={!online || join.busy || amountCents === "invalid"}
          onPress={() => void join.run()}
        />
        <NetworkNote />
      </CardContent>
    </Card>
  );
}

function Mine({
  token,
  gift,
  me,
  reservationId,
  reload,
  replace,
}: {
  token: string;
  gift: Schemas["GroupGift"];
  me: Schemas["GroupGiftParticipation"];
  reservationId: string;
  reload: () => void;
  replace: (gift: Schemas["GroupGift"]) => void;
}) {
  const { t } = useTranslation(["public", "errors"]);
  const online = useOnline();
  const locale = intlLocale(currentLocale());
  const [confirm, setConfirm] = useState<"leave" | "complete" | null>(null);
  const [amount, setAmount] = useState(priceInput(me.amountCents, locale));
  const amountCents = parseAmount(amount);
  const leave = useServerAction(
    useCallback(async () => {
      await leaveGroupGift(token, reservationId);
      reload();
    }, [token, reservationId, reload]),
  );
  const status = useServerAction(
    useCallback(
      async (next: "open" | "complete") => {
        replace(await setGroupGiftStatus(token, next));
      },
      [token, replace],
    ),
  );
  const save = useServerAction(
    useCallback(async () => {
      if (amountCents === "invalid") return;
      replace(await setGroupGiftAmount(token, reservationId, amountCents));
    }, [token, reservationId, amountCents, replace]),
  );
  const error = leave.error ?? status.error ?? save.error;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("groupGift.yourPart")}</CardTitle>
        <CardDescription>
          {me.amountCents !== null
            ? t("groupGift.yourAmount", { amount: formatPrice(me.amountCents, locale) })
            : t("groupGift.amountUnknown")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {me.editable ? (
          <Field
            label={t("groupGift.changeAmount")}
            description={t("groupGift.changeAmountHint")}
            error={amountCents === "invalid" ? t("errors:invalidAmount") : undefined}
          >
            <View style={{ flexDirection: "row", gap: tokens.space[2] }}>
              <View style={{ flex: 1 }}>
                <Input
                  testID="gift.my-amount"
                  accessibilityLabel={t("groupGift.changeAmount")}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  maxLength={12}
                />
              </View>
              <Button
                testID="gift.save-amount"
                title={t("groupGift.saveAmount")}
                variant="neutral"
                disabled={!online || save.busy || amountCents === "invalid"}
                onPress={() => void save.run()}
              />
            </View>
          </Field>
        ) : (
          <Text size="sm" color={tokens.colors.mutedForeground}>
            {t("groupGift.noAccountHint")}
          </Text>
        )}
        {gift.status === "complete" ? (
          <Text size="sm" color={tokens.colors.mutedForeground}>
            {t("groupGift.completeHint")}
          </Text>
        ) : null}
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space[2] }}>
          {gift.status === "open" ? (
            <Button
              testID="gift.complete"
              title={t("groupGift.markComplete")}
              size="sm"
              disabled={!online || status.busy}
              onPress={() => setConfirm("complete")}
            />
          ) : (
            <Button
              testID="gift.reopen"
              title={t("groupGift.reopen")}
              size="sm"
              variant="neutral"
              disabled={!online || status.busy}
              onPress={() => void status.run("open")}
            />
          )}
          <Button
            testID="gift.leave"
            title={t("groupGift.leave")}
            size="sm"
            variant="neutral"
            disabled={!online || leave.busy}
            onPress={() => setConfirm("leave")}
          />
        </View>
        <NetworkNote />
      </CardContent>
      <ConfirmDialog
        visible={confirm === "complete"}
        title={t("groupGift.markCompleteTitle")}
        body={t("groupGift.markCompleteBody")}
        confirmLabel={t("groupGift.markComplete")}
        keepLabel={t("groupGift.markCompleteKeep")}
        onConfirm={() => {
          setConfirm(null);
          void status.run("complete");
        }}
        onKeep={() => setConfirm(null)}
        testID="gift.complete-confirm"
      />
      <ConfirmDialog
        visible={confirm === "leave"}
        title={t("groupGift.leaveTitle")}
        body={t("groupGift.leaveBody")}
        confirmLabel={t("groupGift.leaveConfirm")}
        keepLabel={t("groupGift.leaveKeep")}
        destructive
        onConfirm={() => {
          setConfirm(null);
          void leave.run();
        }}
        onKeep={() => setConfirm(null)}
        testID="gift.leave-confirm"
      />
    </Card>
  );
}

/** The participants' thread (US5), for a participant with an account. No live update: pull to refresh. */
function Thread({
  token,
  messages,
  reload,
}: {
  token: string;
  messages: Schemas["GroupGiftMessage"][];
  reload: () => void;
}) {
  const { t } = useTranslation(["public", "errors"]);
  const online = useOnline();
  const [body, setBody] = useState("");
  const dates = new Intl.DateTimeFormat(intlLocale(currentLocale()), { dateStyle: "short", timeStyle: "short" });
  const send = useServerAction(
    useCallback(async () => {
      await postGroupGiftMessage(token, body);
      setBody("");
      reload();
    }, [token, body, reload]),
  );
  const remove = useServerAction(
    useCallback(
      async (messageId: string) => {
        await deleteGroupGiftMessage(token, messageId);
        reload();
      },
      [token, reload],
    ),
  );
  const error = send.error ?? remove.error;
  return (
    <Card testID="gift.thread">
      <CardHeader>
        <CardTitle>{t("groupGift.thread")}</CardTitle>
        <CardDescription>{t("groupGift.threadHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <Text size="sm" color={tokens.colors.mutedForeground}>
            {t("groupGift.threadEmpty")}
          </Text>
        ) : null}
        {messages.map((message, index) => (
          <View key={message.id} testID={`gift.message-${index}`} style={{ gap: tokens.space[1] }}>
            <Text size="sm" color={tokens.colors.mutedForeground}>
              {`${message.mine ? t("groupGift.you") : (message.authorName ?? t("groupGift.formerParticipant"))} · ${dates.format(
                new Date(message.createdAt),
              )}`}
            </Text>
            <Text>{message.body}</Text>
            {message.mine ? (
              <Button
                testID={`gift.delete-message-${index}`}
                title={t("groupGift.deleteMessage")}
                accessibilityLabel={t("groupGift.deleteMessageAria", { date: dates.format(new Date(message.createdAt)) })}
                variant="link"
                size="sm"
                disabled={!online || remove.busy}
                onPress={() => void remove.run(message.id)}
              />
            ) : null}
          </View>
        ))}
        <Field label={t("groupGift.message")}>
          <Input
            testID="gift.message"
            accessibilityLabel={t("groupGift.message")}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
          />
        </Field>
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        <Button
          testID="gift.send"
          title={t("groupGift.send")}
          disabled={!online || send.busy || !body.trim()}
          onPress={() => void send.run()}
        />
        <NetworkNote />
      </CardContent>
    </Card>
  );
}
