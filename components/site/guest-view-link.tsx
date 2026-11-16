"use client";

import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
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

/**
 * « Voir comme invité » in surprise mode (020): the guest view leaves reserved ideas out, which would
 * tell them apart. The member is warned before it opens.
 */
export function GuestViewLink({ href, label }: { href: string; label: string }) {
  const { t } = useTranslation("list");
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>{label}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("surprise.guestViewTitle")}</DialogTitle>
          <DialogDescription>{t("surprise.guestViewBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t("surprise.guestViewKeep")}</DialogClose>
          <a href={href} className={buttonVariants({ variant: "default" })}>
            {t("surprise.guestViewConfirm")}
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
