import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BUDGETS, filterAndSortPublicItems, parseBudget } from "../../../../src/domain/filters";
import type { Schemas } from "@/api/client";
import { usePendingCount, useSharedList } from "@/data/store";
import {
  cancelSharedReservation,
  reserveSharedItem,
  unfollowList,
  unlockSharedList,
} from "@/data/subscriptions";
import { errorText } from "@/features/errors";
import { translateError } from "@/i18n";
import { useOnline } from "@/network";
import { ListThemeProvider, useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";
import { AccordionChevron, AccordionContent, AccordionTrigger, useAccordion } from "@/ui/Accordion";
import { Alert } from "@/ui/Alert";
import { BackLink } from "@/ui/BackLink";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog, ModalCard } from "@/ui/ConfirmDialog";
import { Empty } from "@/ui/Empty";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { ListCover } from "@/ui/ListCover";
import { LiveGiftMark } from "@/ui/LiveGiftMark";
import { NetworkNote } from "@/ui/NetworkNote";
import { OfflineBanner } from "@/ui/OfflineBanner";
import { PillTabs } from "@/ui/PillTabs";
import { Screen } from "@/ui/Screen";
import { Shadow } from "@/ui/Shadow";
import { Stars } from "@/ui/Stars";
import { Text } from "@/ui/Text";

type PublicList = Schemas["PublicList"];
type PublicItem = Schemas["PublicItem"];

function SharedCategorySection({
  category,
  items,
  people,
  online,
  onOffer,
  onCancel,
}: {
  category: PublicList["categories"][number];
  items: PublicItem[];
  people: PublicList["people"];
  online: boolean;
  onOffer: (item: PublicItem) => void;
  onCancel: (item: PublicItem) => void;
}) {
  const { t } = useTranslation("public");
  const palette = useTheme();
  const { expanded, shown, toggle, progress } = useAccordion(true);

  return (
    <Shadow>
      <AccordionTrigger
        expanded={expanded}
        onPress={toggle}
        testID={`shared.category-${category.id}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.space[2],
          paddingVertical: tokens.space[3],
          paddingHorizontal: tokens.space[3],
        }}
      >
        <Text weight="heading" numberOfLines={1} style={{ flex: 1 }}>
          {category.label}
        </Text>
        <Text size="xs" color={tokens.colors.mutedForeground}>
          {items.length}
        </Text>
        <AccordionChevron progress={progress} color={tokens.colors.black} testID={`shared.category-${category.id}-chevron`} />
      </AccordionTrigger>
      <AccordionContent
        expanded={expanded}
        progress={progress}
        mounted={shown}
        testID={`shared.category-${category.id}-content`}
        style={{
          gap: tokens.space[3],
          paddingHorizontal: tokens.space[3],
          paddingBottom: tokens.space[3] + tokens.shadowOffset,
        }}
      >
        {items.map((item) => {
          const person = people.find((entry) => entry.id === item.personId)?.label ?? "";
          return (
            <Shadow
              key={item.id}
              testID={`shared.item-${item.id}`}
              style={{ backgroundColor: palette.background, padding: tokens.space[3], gap: tokens.space[2] }}
            >
              <Text weight="heading">{item.name}</Text>
              <Stars value={item.priority} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space[1] }}>
                {person ? <Badge>{person}</Badge> : null}
                {item.priceLabel ? <Badge>{item.priceLabel}</Badge> : null}
                {item.mine ? <Badge>{t("reservation.mine")}</Badge> : null}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: tokens.space[2] }}>
                {item.url ? (
                  <Button
                    title={t("buyLink")}
                    accessibilityLabel={t("buyLinkAria", { name: item.name })}
                    variant="neutral"
                    size="sm"
                    onPress={() => void Linking.openURL(item.url!)}
                    testID={`shared.buy-${item.id}`}
                  />
                ) : null}
                {item.mine && item.reservationId ? (
                  <Button
                    title={t("reservation.cancel")}
                    variant="neutral"
                    size="sm"
                    disabled={!online}
                    onPress={() => onCancel(item)}
                    testID={`shared.cancel-${item.id}`}
                  />
                ) : (
                  <Button
                    title={t("iOffer")}
                    accessibilityLabel={t("iOfferAria", { name: item.name })}
                    size="sm"
                    disabled={!online}
                    onPress={() => onOffer(item)}
                    testID={`shared.offer-${item.id}`}
                  />
                )}
              </View>
            </Shadow>
          );
        })}
      </AccordionContent>
    </Shadow>
  );
}

/** Consultation publique d'une liste suivie (idées, filtres, réservation et annulation de ses réservations). */
export default function SharedListScreen() {
  const { readToken } = useLocalSearchParams<{ readToken: string }>();
  const { t } = useTranslation(["public", "mobile", "home"]);
  const online = useOnline();
  const pendingCount = usePendingCount();
  const { list, loaded, settled, missing, locked, fetchedAt, refreshing, refresh } = useSharedList(readToken);

  const [who, setWho] = useState<string>("all");
  const [budget, setBudget] = useState<string>("all");
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const [offeringItem, setOfferingItem] = useState<PublicItem | null>(null);
  const [fromName, setFromName] = useState("");
  const [note, setNote] = useState("");
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reserveBusy, setReserveBusy] = useState(false);

  const [cancellingItem, setCancellingItem] = useState<PublicItem | null>(null);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function submitUnlock() {
    setUnlockBusy(true);
    setUnlockError(null);
    try {
      const result = await unlockSharedList(readToken, password);
      if (!result.ok) {
        setUnlockError(translateError(result.error));
        return;
      }
      setPassword("");
    } catch (caught) {
      setUnlockError(errorText(caught));
    } finally {
      setUnlockBusy(false);
    }
  }

  async function submitReserve() {
    if (!offeringItem) return;
    setReserveBusy(true);
    setReserveError(null);
    try {
      const result = await reserveSharedItem(readToken, {
        itemId: offeringItem.id,
        fromName,
        note,
      });
      if (!result.ok) {
        setReserveError(translateError(result.error));
        return;
      }
      setOfferingItem(null);
      setFromName("");
      setNote("");
    } catch (caught) {
      setReserveError(errorText(caught));
    } finally {
      setReserveBusy(false);
    }
  }

  async function confirmCancelReservation() {
    if (!cancellingItem?.reservationId) return;
    const reservationId = cancellingItem.reservationId;
    setCancellingItem(null);
    setActionError(null);
    try {
      const result = await cancelSharedReservation(readToken, reservationId);
      if (!result.ok) setActionError(translateError(result.error));
    } catch (caught) {
      setActionError(errorText(caught));
    }
  }

  async function confirmUnfollowList() {
    setConfirmUnfollow(false);
    setActionError(null);
    try {
      const result = await unfollowList(readToken);
      if (!result.ok) {
        setActionError(translateError(result.error));
        return;
      }
      router.replace("/");
    } catch (caught) {
      setActionError(errorText(caught));
    }
  }

  const unfollowDialog = (
    <ConfirmDialog
      visible={confirmUnfollow}
      title={t("mobile:shared.unfollowTitle")}
      body={t("mobile:shared.unfollowBody")}
      confirmLabel={t("mobile:shared.unfollowConfirm")}
      keepLabel={t("mobile:shared.unfollowKeep")}
      onConfirm={() => void confirmUnfollowList()}
      onKeep={() => setConfirmUnfollow(false)}
      testID="shared.unfollow-confirm"
    />
  );

  if (missing) {
    return (
      <Screen>
        <BackLink />
        <Empty title={t("public:missingList")}>
          <Button title={t("home:mine.title")} onPress={() => router.replace("/")} />
        </Empty>
      </Screen>
    );
  }

  if (locked) {
    return (
      <Screen testID="shared.unlock-screen">
        <BackLink />
        <Card>
          <CardHeader>
            <CardTitle>{t("mobile:shared.unlockTitle")}</CardTitle>
            <CardDescription>{t("mobile:shared.unlockDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label={t("mobile:shared.passwordLabel")}>
              <Input
                testID="shared.unlock-password"
                accessibilityLabel={t("mobile:shared.passwordLabel")}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Field>
            {unlockError ? (
              <Alert variant="destructive" testID="shared.unlock-error">
                {unlockError}
              </Alert>
            ) : null}
            <NetworkNote />
            <Button
              testID="shared.unlock-submit"
              title={t("mobile:shared.unlockSubmit")}
              fullWidth
              disabled={unlockBusy || !online}
              onPress={() => void submitUnlock()}
            />
          </CardContent>
        </Card>
        <Button
          testID="shared.unfollow"
          title={t("mobile:shared.unfollow")}
          variant="neutral"
          disabled={!online}
          onPress={() => setConfirmUnfollow(true)}
        />
        {unfollowDialog}
      </Screen>
    );
  }

  if (!list && loaded && settled && !refreshing) {
    return (
      <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
        <BackLink />
        <Empty title={t("mobile:offline.unreachable")}>
          <Button title={t("mobile:retry")} onPress={() => void refresh()} />
        </Empty>
      </Screen>
    );
  }

  if (!list) return <LiveGiftMark />;

  const activeWho = who !== "all" && list.people.some((p) => p.id === who) ? who : null;
  const activeBudget = parseBudget(budget === "all" ? undefined : budget);
  const filteredItems = filterAndSortPublicItems(list.items, activeWho, activeBudget);
  const categories = [...list.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      category,
      items: filteredItems.filter((item) => item.typeId === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const whoTabs = [
    { key: "all", label: t("mobile:shared.everyone") },
    ...list.people.map((person) => ({ key: person.id, label: person.label })),
  ];
  const budgetTabs = [
    { key: "all", label: t("mobile:shared.allPrices") },
    ...BUDGETS.map(({ id }) => ({ key: id, label: t(`public:budgets.${id}`) })),
  ];

  return (
    <ListThemeProvider theme={list.theme}>
      <Screen
        testID="shared.screen"
        header={<OfflineBanner fetchedAt={fetchedAt} pendingCount={pendingCount} />}
        onRefresh={() => void refresh()}
        refreshing={refreshing}
      >
        <BackLink />
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space[3] }}>
          <ListCover coverImageUrl={list.coverImageUrl} theme={list.theme} size={56} />
          <View style={{ flex: 1, gap: tokens.space[1] }}>
            <Text size="title" accessibilityRole="header">
              {list.title}
            </Text>
            {list.subtitle ? (
              <Text size="sm" color={tokens.colors.mutedForeground}>
                {list.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {list.people.length > 1 ? (
          <View style={{ gap: tokens.space[1] }}>
            <Text size="sm" color={tokens.colors.mutedForeground}>
              {t("mobile:shared.filterWho")}
            </Text>
            <PillTabs tabs={whoTabs} active={activeWho ?? "all"} onChange={setWho} scroll />
          </View>
        ) : null}
        <View style={{ gap: tokens.space[1] }}>
          <Text size="sm" color={tokens.colors.mutedForeground}>
            {t("mobile:shared.filterBudget")}
          </Text>
          <PillTabs tabs={budgetTabs} active={activeBudget ?? "all"} onChange={setBudget} scroll />
        </View>
        {actionError ? <Alert variant="destructive">{actionError}</Alert> : null}
        {categories.length === 0 ? (
          <Empty
            testID="shared.empty"
            title={activeWho || activeBudget ? t("public:emptyFiltered") : t("public:emptyList")}
            description={activeWho || activeBudget ? t("public:emptyHint") : t("public:emptyListHint")}
          />
        ) : (
          <View style={{ gap: tokens.space[3] }}>
            {categories.map(({ category, items }) => (
              <SharedCategorySection
                key={category.id}
                category={category}
                items={items}
                people={list.people}
                online={online}
                onOffer={(item) => {
                  setReserveError(null);
                  setOfferingItem(item);
                }}
                onCancel={(item) => setCancellingItem(item)}
              />
            ))}
          </View>
        )}
        <Button
          testID="shared.unfollow"
          title={t("mobile:shared.unfollow")}
          variant="neutral"
          disabled={!online}
          onPress={() => setConfirmUnfollow(true)}
        />
        <ModalCard
          visible={offeringItem !== null}
          title={t("mobile:shared.offerTitle", { name: offeringItem?.name ?? "" })}
          description={t("mobile:shared.privacyHint")}
          dismissLabel={t("mobile:back")}
          onDismiss={() => setOfferingItem(null)}
        >
          <Field label={t("mobile:shared.fromName")}>
            <Input
              testID="shared.reserve-name"
              accessibilityLabel={t("mobile:shared.fromName")}
              value={fromName}
              onChangeText={setFromName}
            />
          </Field>
          <Field label={t("mobile:shared.note")} description={t("mobile:shared.noPurchaseHint")}>
            <Input
              testID="shared.reserve-note"
              accessibilityLabel={t("mobile:shared.note")}
              value={note}
              onChangeText={setNote}
            />
          </Field>
          {reserveError ? (
            <Alert variant="destructive" testID="shared.reserve-error">
              {reserveError}
            </Alert>
          ) : null}
          <Button
            testID="shared.reserve-submit"
            title={t("mobile:shared.confirmReserve")}
            fullWidth
            disabled={reserveBusy}
            onPress={() => void submitReserve()}
          />
          <Button
            testID="shared.reserve-cancel"
            title={t("mobile:back")}
            variant="neutral"
            fullWidth
            onPress={() => setOfferingItem(null)}
          />
        </ModalCard>
        <ConfirmDialog
          visible={cancellingItem !== null}
          title={t("public:reservation.cancelTitle")}
          body={t("public:reservation.cancelBody")}
          confirmLabel={t("public:reservation.cancelConfirm")}
          keepLabel={t("public:reservation.cancelKeep")}
          onConfirm={() => void confirmCancelReservation()}
          onKeep={() => setCancellingItem(null)}
          testID="shared.cancel-confirm"
        />
        {unfollowDialog}
      </Screen>
    </ListThemeProvider>
  );
}
