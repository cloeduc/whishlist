import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Schemas } from "@/api/client";
import { useServerAction } from "@/features/errors";
import { useOnline } from "@/network";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Stars } from "@/ui/Stars";
import { Text } from "@/ui/Text";

import { cancelGuestReservation } from "./api";

/** Only web links open: an idea's address comes from the list, not from this phone (011). */
function webUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

/**
 * An idea of the guest view, like the site `PublicItemCard`: name, priority, price, « pour qui », link,
 * then « Réserver ce cadeau », or the cancellation of one's own reservation.
 */
export function GuestItemCard({
  index,
  readToken,
  list,
  item,
  onCancelled,
}: {
  index: number;
  readToken: string;
  list: Schemas["PublicList"];
  item: Schemas["PublicItem"];
  onCancelled: () => void;
}) {
  const { t } = useTranslation("public");
  const online = useOnline();
  const [confirming, setConfirming] = useState(false);
  const person = list.people.find((entry) => entry.id === item.personId)?.label ?? "";
  const link = webUrl(item.url);
  const cancel = useServerAction(
    useCallback(async () => {
      if (!item.reservationId) return;
      await cancelGuestReservation(readToken, item.reservationId);
      onCancelled();
    }, [readToken, item.reservationId, onCancelled]),
  );

  return (
    <Card testID={`guest.item-${index}`}>
      <CardHeader
        action={
          item.priceLabel ? (
            <Text size="title" weight="heading">
              {item.priceLabel}
            </Text>
          ) : undefined
        }
      >
        <CardTitle>{item.name}</CardTitle>
        <Stars value={item.priority} />
      </CardHeader>
      <CardContent>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: tokens.space[1] }}>
          {person ? <Badge variant="neutral">{person}</Badge> : null}
          {item.mine ? <Badge>{t("reservation.mine")}</Badge> : null}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: tokens.space[2] }}>
          {item.mine && item.reservationId ? (
            <Button
              testID={`guest.cancel-${index}`}
              title={t("reservation.cancel")}
              variant="neutral"
              size="sm"
              disabled={!online || cancel.busy}
              onPress={() => setConfirming(true)}
            />
          ) : (
            <Button
              testID={`guest.offer-${index}`}
              title={t("iOffer")}
              accessibilityLabel={t("iOfferAria", { name: item.name })}
              size="sm"
              onPress={() => router.push(`/guest/${readToken}/reserve?itemId=${encodeURIComponent(item.id)}` as Href)}
            />
          )}
          {link ? (
            <Button
              testID={`guest.link-${index}`}
              title={t("buyLink")}
              accessibilityLabel={t("buyLinkAria", { name: item.name })}
              variant="link"
              size="sm"
              onPress={() => void Linking.openURL(link)}
            />
          ) : null}
        </View>
        {cancel.error ? <Alert variant="destructive">{cancel.error}</Alert> : null}
      </CardContent>
      <ConfirmDialog
        visible={confirming}
        title={t("reservation.cancelTitle")}
        body={t("reservation.cancelBody")}
        confirmLabel={t("reservation.cancelConfirm")}
        keepLabel={t("reservation.cancelKeep")}
        destructive
        onConfirm={() => {
          setConfirming(false);
          void cancel.run();
        }}
        onKeep={() => setConfirming(false)}
        testID={`guest.cancel-confirm-${index}`}
      />
    </Card>
  );
}
