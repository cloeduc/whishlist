import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Schemas } from "@/api/client";
import { cancelReservation } from "@/data/labels";
import { revealReservations } from "@/data/sharing";
import { errorText } from "@/features/errors";
import { ListScreen } from "@/features/lists/ListScreen";
import { useOnline } from "@/network";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Empty } from "@/ui/Empty";
import { NetworkNote } from "@/ui/NetworkNote";
import { Text } from "@/ui/Text";

type Reservation = Schemas["MemberReservation"];

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
  const [toCancel, setToCancel] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {reservations.length === 0 ? <Empty title={t("reservations.empty")} /> : null}
      {reservations.map((reservation) => (
        <Card key={reservation.id} testID={`reservations.item-${reservation.id}`}>
          <CardContent>
            <View style={{ gap: tokens.space[1] }}>
              <Text weight="heading">{reservation.itemName}</Text>
              {reservation.fromName ? (
                <Text size="sm" color={tokens.colors.mutedForeground}>
                  {t("reservations.from", { name: reservation.fromName })}
                </Text>
              ) : null}
            </View>
            {reservation.note ? <Text testID={`reservations.note-${reservation.id}`}>{reservation.note}</Text> : null}
            <Button title={t("reservations.cancel")} variant="neutral" disabled={!online} onPress={() => setToCancel(reservation)} />
          </CardContent>
        </Card>
      ))}
      {reservations.length > 0 ? <NetworkNote /> : null}
      <ConfirmDialog
        visible={toCancel !== null}
        title={t("reservations.cancelTitle")}
        body={t("reservations.cancelBody")}
        confirmLabel={t("reservations.cancelConfirm")}
        keepLabel={t("reservations.cancelKeep")}
        onKeep={() => setToCancel(null)}
        onConfirm={() => {
          const reservation = toCancel;
          setToCancel(null);
          if (!reservation) return;
          setError(null);
          cancelReservation(listId, reservation.id)
            .then(() => onCancelled?.())
            .catch((caught: unknown) => setError(errorText(caught)));
        }}
      />
    </>
  );
}
