import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Schemas } from "@/api/client";
import { cancelGroupGift, cancelReservation } from "@/data/labels";
import { revealReservations } from "@/data/sharing";
import { errorText } from "@/features/errors";
import { ListScreen } from "@/features/lists/ListScreen";
import { useOnline } from "@/network";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card, CardContent } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Empty } from "@/ui/Empty";
import { NetworkNote } from "@/ui/NetworkNote";
import { Text } from "@/ui/Text";

type Reservation = Schemas["MemberReservation"];

/** A reservation on one's own, or a group gift (028) with each of its participations, like the site's cards. */
type Entry =
  | { kind: "single"; reservation: Reservation }
  | { kind: "gift"; id: string; itemName: string; status: string | null; participants: Reservation[] };

function entriesOf(reservations: Reservation[]): Entry[] {
  const entries: Entry[] = [];
  const gifts = new Map<string, Extract<Entry, { kind: "gift" }>>();
  for (const reservation of reservations) {
    const giftId = reservation.groupGiftId ?? null;
    if (!giftId) {
      entries.push({ kind: "single", reservation });
      continue;
    }
    const known = gifts.get(giftId);
    if (known) {
      known.participants.push(reservation);
      continue;
    }
    const entry = {
      kind: "gift" as const,
      id: giftId,
      itemName: reservation.itemName,
      status: reservation.groupGiftStatus ?? null,
      participants: [reservation],
    };
    gifts.set(giftId, entry);
    entries.push(entry);
  }
  return entries;
}

/**
 * Reservations tab, from `08-liste-reservations.png`: idea, giver, note.
 * Cancelling is a member action that requires the server; offline, read-only.
 * In surprise mode (020) nothing is shown until the member confirms « Voir les réservations ».
 */
export default function Reservations() {
  const { t } = useTranslation("list");
  return (
    <ListScreen tab="reservations">
      {(list) => (
        <>
          <Text size="lg" accessibilityRole="header">
            {t("reservations.title")}
          </Text>
          {list.surpriseMode ? (
            <HiddenReservations listId={list.id} />
          ) : (
            <ReservationRows listId={list.id} reservations={list.reservations} />
          )}
        </>
      )}
    </ListScreen>
  );
}

/**
 * Surprise mode: the rows come from the server on demand and stay in this screen's state only,
 * never in the phone's database. Leaving the screen forgets them.
 */
function HiddenReservations({ listId }: { listId: string }) {
  const { t } = useTranslation("list");
  const online = useOnline();
  const [asking, setAsking] = useState(false);
  const [shown, setShown] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => {
    setError(null);
    revealReservations(listId)
      .then(setShown)
      .catch((caught: unknown) => setError(errorText(caught)));
  };
  if (shown) return <ReservationRows listId={listId} reservations={shown} onCancelled={load} />;
  return (
    <>
      <Text testID="reservations.hidden" color={tokens.colors.mutedForeground}>
        {t("surprise.hiddenHint")}
      </Text>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <Button testID="reservations.reveal" title={t("surprise.reveal")} variant="neutral" disabled={!online} onPress={() => setAsking(true)} />
      <NetworkNote />
      <ConfirmDialog
        visible={asking}
        title={t("surprise.revealTitle")}
        body={t("surprise.revealBody")}
        confirmLabel={t("surprise.revealConfirm")}
        keepLabel={t("surprise.revealKeep")}
        destructive={false}
        testID="reservations.reveal-confirm"
        onKeep={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false);
          load();
        }}
      />
    </>
  );
}

function ReservationRows({
  listId,
  reservations,
  onCancelled,
}: {
  listId: string;
  reservations: Reservation[];
  /** Called after a cancellation, when the rows do not come from the list's copy. */
  onCancelled?: () => void;
}) {
  const { t } = useTranslation("list");
  const online = useOnline();
  const [toCancel, setToCancel] = useState<{ reservation: Reservation; participation: boolean } | null>(null);
  const [giftToCancel, setGiftToCancel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entries = entriesOf(reservations);
  const run = (action: Promise<void>) => {
    setError(null);
    action.then(() => onCancelled?.()).catch((caught: unknown) => setError(errorText(caught)));
  };
  return (
    <>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {entries.length === 0 ? <Empty title={t("reservations.empty")} /> : null}
      {entries.map((entry) =>
        entry.kind === "single" ? (
          <Card key={entry.reservation.id} testID={`reservations.item-${entry.reservation.id}`}>
            <CardContent>
              <View style={{ gap: tokens.space[1] }}>
                <Text weight="heading">{entry.reservation.itemName}</Text>
                {entry.reservation.fromName ? (
                  <Text size="sm" color={tokens.colors.mutedForeground}>
                    {t("reservations.from", { name: entry.reservation.fromName })}
                  </Text>
                ) : null}
              </View>
              {entry.reservation.note ? (
                <Text testID={`reservations.note-${entry.reservation.id}`}>{entry.reservation.note}</Text>
              ) : null}
              <Button
                title={t("reservations.cancel")}
                variant="neutral"
                disabled={!online}
                onPress={() => setToCancel({ reservation: entry.reservation, participation: false })}
              />
            </CardContent>
          </Card>
        ) : (
          <Card key={entry.id} testID={`reservations.group-gift-${entry.id}`}>
            <CardContent>
              <View style={{ gap: tokens.space[1] }}>
                <Text weight="heading">{entry.itemName}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space[1] }}>
                  <Badge variant="neutral">{t("reservations.groupGift", { count: entry.participants.length })}</Badge>
                  {entry.status === "complete" ? <Badge>{t("reservations.groupGiftComplete")}</Badge> : null}
                </View>
              </View>
              {entry.participants.map((participant) => (
                <View key={participant.id} style={{ gap: tokens.space[1] }}>
                  <Text size="sm" color={tokens.colors.mutedForeground}>
                    {t("reservations.from", { name: participant.fromName ?? t("reservations.anonymous") })}
                  </Text>
                  {participant.note ? <Text>{participant.note}</Text> : null}
                  <Button
                    testID={`reservations.cancel-participation-${participant.id}`}
                    title={t("reservations.cancelParticipation")}
                    variant="neutral"
                    size="sm"
                    disabled={!online}
                    onPress={() => setToCancel({ reservation: participant, participation: true })}
                  />
                </View>
              ))}
              <Button
                testID={`reservations.cancel-group-gift-${entry.id}`}
                title={t("reservations.cancelGroupGift")}
                variant="neutral"
                disabled={!online}
                onPress={() => setGiftToCancel(entry.id)}
              />
            </CardContent>
          </Card>
        ),
      )}
      {entries.length > 0 ? <NetworkNote /> : null}
      <ConfirmDialog
        visible={toCancel !== null}
        title={toCancel?.participation ? t("reservations.cancelParticipationTitle") : t("reservations.cancelTitle")}
        body={toCancel?.participation ? t("reservations.cancelParticipationBody") : t("reservations.cancelBody")}
        confirmLabel={
          toCancel?.participation ? t("reservations.cancelParticipationConfirm") : t("reservations.cancelConfirm")
        }
        keepLabel={toCancel?.participation ? t("reservations.cancelParticipationKeep") : t("reservations.cancelKeep")}
        onKeep={() => setToCancel(null)}
        onConfirm={() => {
          const target = toCancel;
          setToCancel(null);
          if (target) run(cancelReservation(listId, target.reservation.id));
        }}
      />
      <ConfirmDialog
        visible={giftToCancel !== null}
        title={t("reservations.cancelGroupGiftTitle")}
        body={t("reservations.cancelGroupGiftBody")}
        confirmLabel={t("reservations.cancelGroupGiftConfirm")}
        keepLabel={t("reservations.cancelGroupGiftKeep")}
        testID="reservations.cancel-group-gift-confirm"
        onKeep={() => setGiftToCancel(null)}
        onConfirm={() => {
          const giftId = giftToCancel;
          setGiftToCancel(null);
          if (giftId) run(cancelGroupGift(listId, giftId));
        }}
      />
    </>
  );
}
