"use client";

import { useTranslation } from "react-i18next";
import { ConfirmForm } from "@/components/site/confirm-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OffrirRow } from "@/src/domain/offrir";
import { cancelGroupGiftAction, cancelReservationAction } from "@/src/server/actions";

/**
 * One reservation in the list's Reservations tab: idea, giver, note, cancellation by a member.
 * A group gift (028) is one card with each participant, and its own cancellation.
 */
export function ReservationCard({
  wishlistId,
  row,
  cancelAction = cancelReservationAction,
  cancelGroupGift = cancelGroupGiftAction,
}: {
  wishlistId: string;
  row: OffrirRow;
  /** Cancellation: the member action, possibly wrapped by the caller. */
  cancelAction?: (formData: FormData) => void | Promise<void>;
  cancelGroupGift?: (formData: FormData) => void | Promise<void>;
}) {
  const { t } = useTranslation("list");
  if (row.groupGift) {
    const gift = row.groupGift;
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-balance">{row.itemName}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2">
            <Badge variant="outline">{t("reservations.groupGift", { count: gift.participants.length })}</Badge>
            {gift.status === "complete" ? <Badge variant="secondary">{t("reservations.groupGiftComplete")}</Badge> : null}
            {row.typeLabel ? <Badge variant="secondary">{row.typeLabel}</Badge> : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <ul className="flex w-full flex-col gap-3">
            {gift.participants.map((participant) => (
              <li key={participant.reservationId} className="flex flex-col items-start gap-1 border-t-2 border-border pt-3 first:border-t-0 first:pt-0">
                <p>{t("reservations.from", { name: participant.fromName ?? t("reservations.anonymous") })}</p>
                {participant.note ? <p className="text-muted-foreground">{participant.note}</p> : null}
                <ConfirmForm
                  title={t("reservations.cancelParticipationTitle")}
                  description={t("reservations.cancelParticipationBody")}
                  confirmLabel={t("reservations.cancelParticipationConfirm")}
                  cancelLabel={t("reservations.cancelParticipationKeep")}
                  action={cancelAction}
                  fields={{ wishlistId, reservationId: participant.reservationId, tab: "reservations" }}
                  triggerLabel={t("reservations.cancelParticipation")}
                  triggerVariant="ghost"
                  triggerSize="sm"
                />
              </li>
            ))}
          </ul>
          <ConfirmForm
            title={t("reservations.cancelGroupGiftTitle")}
            description={t("reservations.cancelGroupGiftBody")}
            confirmLabel={t("reservations.cancelGroupGiftConfirm")}
            cancelLabel={t("reservations.cancelGroupGiftKeep")}
            action={cancelGroupGift}
            fields={{ wishlistId, groupGiftId: gift.id, tab: "reservations" }}
            triggerLabel={t("reservations.cancelGroupGift")}
            triggerVariant="outline"
            triggerSize="sm"
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-balance">{row.itemName}</CardTitle>
        {row.typeLabel ? (
          <CardDescription>
            <Badge variant="secondary">{row.typeLabel}</Badge>
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        {row.fromName ? <p>{t("reservations.from", { name: row.fromName })}</p> : null}
        {row.note ? <p className="text-muted-foreground">{row.note}</p> : null}
        <ConfirmForm
          title={t("reservations.cancelTitle")}
          description={t("reservations.cancelBody")}
          confirmLabel={t("reservations.cancelConfirm")}
          cancelLabel={t("reservations.cancelKeep")}
          action={cancelAction}
          fields={{ wishlistId, reservationId: row.reservationId, tab: "reservations" }}
          triggerLabel={t("reservations.cancel")}
          triggerVariant="outline"
          triggerSize="sm"
        />
      </CardContent>
    </Card>
  );
}
