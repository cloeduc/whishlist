"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { FormRefusal } from "@/components/site/form-refusal";
import { ReservationCard } from "@/components/site/reservation-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { OffrirRow } from "@/src/domain/offrir";
import { cancelReservationAction, revealReservationsAction } from "@/src/server/actions";

/**
 * Reservations tab in surprise mode (020): nothing is in the page until the member confirms.
 * The rows live in this component only: reloading or leaving the tab hides them again.
 */
export function ReservationsReveal({ wishlistId }: { wishlistId: string }) {
  const { t } = useTranslation("list");
  const [open, setOpen] = useState(false);
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button" variant="outline" disabled={pending} />}>
          {t("surprise.reveal")}
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("surprise.revealTitle")}</DialogTitle>
            <DialogDescription>{t("surprise.revealBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>{t("surprise.revealKeep")}</DialogClose>
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
                startTransition(async () => {
                  const result = await revealReservationsAction(wishlistId);
                  if (result.ok) setOffers(result.offers);
                  else setError(result.error);
                });
              }}
            >
              {t("surprise.revealConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
