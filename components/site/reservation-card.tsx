"use client";

import { useTranslation } from "react-i18next";
import { ConfirmForm } from "@/components/site/confirm-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OffrirRow } from "@/src/domain/offrir";
import { cancelReservationAction } from "@/src/server/actions";

/** One reservation in the list's Reservations tab: idea, giver, note, cancellation by a member. */
export function ReservationCard({
  wishlistId,
  row,
  cancelAction = cancelReservationAction,
}: {
  wishlistId: string;
  row: OffrirRow;
  /** Cancellation: the member action, possibly wrapped by the caller. */
  cancelAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { t } = useTranslation("list");
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
