"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmForm } from "@/components/site/confirm-form";
import { FormRefusal } from "@/components/site/form-refusal";
import { ReservationCard } from "@/components/site/reservation-card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { OffrirRow } from "@/src/domain/offrir";
import { cancelReservationAction, revealReservationsAction } from "@/src/server/actions";

/**
 * Reservations tab in surprise mode (020): nothing is in the page until the member confirms.
 * The rows live in this component only: reloading or leaving the tab hides them again.
 */
export function ReservationsReveal({ wishlistId }: { wishlistId: string }) {
  const { t } = useTranslation("list");
  const [offers, setOffers] = useState<OffrirRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (offers) {
    if (offers.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("reservations.empty")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
    }
    // After a cancellation the page comes back on the same address: the reservations are hidden again.
    const cancelAndHide = async (formData: FormData) => {
      setOffers(null);
      await cancelReservationAction(formData);
    };
    return offers.map((row) => (
      <ReservationCard key={row.reservationId} wishlistId={wishlistId} row={row} cancelAction={cancelAndHide} />
    ));
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground">{t("surprise.hiddenHint")}</p>
      <FormRefusal code={error ?? undefined} />
      <ConfirmForm
        title={t("surprise.revealTitle")}
        description={t("surprise.revealBody")}
        confirmLabel={t("surprise.revealConfirm")}
        cancelLabel={t("surprise.revealKeep")}
        triggerLabel={t("surprise.reveal")}
        confirmVariant="default"
        disabled={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await revealReservationsAction(wishlistId);
            if (result.ok) setOffers(result.offers);
            else setError(result.error);
          })
        }
      />
    </div>
  );
}
