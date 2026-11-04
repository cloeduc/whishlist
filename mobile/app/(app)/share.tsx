import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { useMyLists } from "@/data/store";
import { clearPendingLink } from "@/links/pending";
import { sharedIdea } from "@/features/incoming/sharedIdea";
import { useSharedPayloads } from "@/features/incoming/useSharedPayloads";
import { tokens } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Empty } from "@/ui/Empty";
import { GiftMark } from "@/ui/GiftMark";
import { ListCover } from "@/ui/ListCover";
import { LiveGiftMark } from "@/ui/LiveGiftMark";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";

/**
 * « Ajouter à une liste »: a link (or a text) shared from another app becomes an idea.
 * The list is chosen (screen skipped if there is only one), then the form opens, link filled in,
 * and fills itself from the link if there is a network.
 */
export default function ShareScreen() {
  const { t } = useTranslation(["mobile", "list"]);
  const { payloads, clear: clearSharedPayloads } = useSharedPayloads();
  const idea = sharedIdea(payloads);
  const { lists, loaded } = useMyLists();

  // Arrived here (after sign-in if needed): the pending link is consumed.
  useEffect(() => clearPendingLink(), []);

  function open(listId: string) {
    if (!idea) return;
    clearSharedPayloads();
    router.replace({
      pathname: "/lists/[listId]/items/new",
      params: { listId, url: idea.url, name: idea.name, fill: idea.url ? "1" : "", from: "share" },
    });
  }

  function cancel() {
    clearSharedPayloads();
    router.replace("/");
  }

  const only = loaded && lists.length === 1 ? lists[0] : undefined;
  useEffect(() => {
    if (only && idea) open(only.id);
    // A single list: go straight to it, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [only?.id, idea?.url, idea?.name]);

  if (!loaded || (only && idea)) return <LiveGiftMark />;

  return (
    <Screen testID="incoming.screen">
      {!idea ? (
        <Empty testID="incoming.nothing" title={t("incoming.nothingTitle")} description={t("incoming.nothingBody")} media={<GiftMark size={64} />}>
          <Button title={t("incoming.cancel")} variant="neutral" onPress={cancel} testID="incoming.cancel" />
        </Empty>
      ) : lists.length === 0 ? (
        <Empty testID="incoming.no-list" title={t("incoming.noListTitle")} description={t("incoming.noListBody")} media={<GiftMark size={64} />}>
          <Button title={t("list:mine.newList")} onPress={() => router.replace("/lists/new")} testID="incoming.new-list" />
          <Button title={t("incoming.cancel")} variant="link" onPress={cancel} testID="incoming.cancel" />
        </Empty>
      ) : (
        <View style={{ gap: tokens.space[3] }}>
          <Card>
            <CardHeader>
              <CardTitle>{t("incoming.title")}</CardTitle>
              <CardDescription>{t("incoming.hint")}</CardDescription>
            </CardHeader>
            <CardContent>
              {idea.name ? <Text weight="heading">{idea.name}</Text> : null}
              {idea.url ? (
                <Text size="sm" color={tokens.colors.mutedForeground} numberOfLines={2} testID="incoming.url">
                  {idea.url}
                </Text>
              ) : null}
            </CardContent>
          </Card>
          {lists.map((list) => (
            <Card
              key={list.id}
              testID={`incoming.list-${list.id}`}
              onPress={() => open(list.id)}
              accessibilityLabel={list.title}
              style={{ paddingVertical: tokens.space[3] }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space[3], paddingHorizontal: tokens.space[3] }}>
                <ListCover coverImageUrl={list.coverImageUrl} theme={list.theme} size={40} framed={false} />
                <Text weight="heading">{list.title}</Text>
              </View>
            </Card>
          ))}
          <Button title={t("incoming.cancel")} variant="link" onPress={cancel} testID="incoming.cancel" />
        </View>
      )}
    </Screen>
  );
}
