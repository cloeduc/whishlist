import { router, type Href } from "expo-router";
import { useState, type ReactNode } from "react";
import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";

import { usePendingCount } from "@/data/store";
import { appPathForUrl } from "@/links/routes";
import type { ViewList } from "@/offline/optimistic";
import { tokens } from "@/theme/tokens";
import { BackLink } from "@/ui/BackLink";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Empty } from "@/ui/Empty";
import { ListCover } from "@/ui/ListCover";
import { LiveGiftMark } from "@/ui/LiveGiftMark";
import { OfflineBanner } from "@/ui/OfflineBanner";
import { PendingBadge } from "@/ui/PendingBadge";
import { PillTabs } from "@/ui/PillTabs";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";

import { useList } from "./ListContext";
import { LIST_TAB_ROUTES, type ListTab } from "./tab-routes";

export type { ListTab };

function tabLabels(list: ViewList, t: (key: string) => string) {
  const active = list.items.filter((item) => !item.archived).length;
  const archived = list.items.length - active;
  return [
    { key: "idees", label: `${t("tabs.idees")} (${active})` },
    { key: "archives", label: `${t("tabs.archives")} (${archived})` },
    // In surprise mode (020) not even the number of reservations is shown.
    {
      key: "reservations",
      label: list.surpriseMode ? t("tabs.reservations") : `${t("tabs.reservations")} (${reservationEntries(list.reservations)})`,
    },
    { key: "partage", label: t("tabs.partage") },
    { key: "reglages", label: t("tabs.reglages") },
  ];
}

function isTab(key: string): key is ListTab {
  return key in LIST_TAB_ROUTES;
}

/**
 * List screen, based on `06-liste-idees.png`: framed gift + title, « Voir la liste partagée »,
 * pill tabs with their counters, then the tab content. Refreshed by pulling (FR-017).
 */
export function ListScreen({ tab, children }: { tab: ListTab; children: (list: ViewList) => ReactNode }) {
  const { t } = useTranslation(["list", "mobile", "home"]);
  const { list, listId, loaded, settled, missing, fetchedAt, refreshing, refresh } = useList();
  const pendingCount = usePendingCount();
  const [askGuestView, setAskGuestView] = useState(false);

  if (missing) {
    return (
      <Screen>
        <BackLink />
        <Empty title={t("mobile:lists.missing")}>
          <Button title={t("home:mine.title")} onPress={() => router.replace("/")} />
        </Empty>
      </Screen>
    );
  }
  if (!list && loaded && settled && !refreshing) {
    // Never opened on this phone, and the server does not answer.
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

  return (
    <Screen
      testID="list.screen"
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
          {list.pending ? <PendingBadge /> : null}
        </View>
      </View>
      {list.readUrl ? (
        <>
          <Button
            testID="list.view-as-guest"
            title={t("list:viewAsGuest")}
            variant="neutral"
            // In surprise mode the guest view would tell reserved ideas apart: warn first (020).
            onPress={() => (list.surpriseMode ? setAskGuestView(true) : viewAsGuest(list.readUrl))}
          />
          <ConfirmDialog
            visible={askGuestView}
            title={t("list:surprise.guestViewTitle")}
            body={t("list:surprise.guestViewBody")}
            confirmLabel={t("list:surprise.guestViewConfirm")}
            keepLabel={t("list:surprise.guestViewKeep")}
            destructive={false}
            testID="list.guest-view-confirm"
            onKeep={() => setAskGuestView(false)}
            onConfirm={() => {
              setAskGuestView(false);
              viewAsGuest(list.readUrl);
            }}
          />
        </>
      ) : null}
      <PillTabs
        tabs={tabLabels(list, (key) => t(`list:${key}`))}
        active={tab}
        onChange={(key) => {
          if (isTab(key) && key !== tab) router.replace(`/lists/${listId}${LIST_TAB_ROUTES[key]}`);
        }}
      />
      {children(list)}
    </Screen>
  );
}

/**
 * « Voir comme un invité »: the app guest view (011), without redirecting members to their list.
 * The public link would open the app itself (universal link), which would bring the member back here.
 */
function viewAsGuest(readUrl: string): void {
  const path = appPathForUrl(readUrl);
  if (path) router.push(`${path}?preview=1` as Href);
  else void Linking.openURL(readUrl);
}

/** Number of cards of the Reservations tab, like the site: a group gift (028) is one card for all its participations. */
function reservationEntries(reservations: { id: string; groupGiftId?: string | null }[]): number {
  return new Set(reservations.map((reservation) => reservation.groupGiftId ?? reservation.id)).size;
}
