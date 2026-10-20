"use client";

import { useState } from "react";
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

/** Bouton qui ouvre une confirmation avant de soumettre une server action. */
export function ConfirmForm({
  title,
  description,
  confirmLabel,
  cancelLabel,
  action,
  fields,
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "default",
  confirmVariant = "destructive",
  className,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  triggerLabel: string;
  triggerVariant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link" | "neutral";
  triggerSize?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  confirmVariant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link" | "neutral";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant={triggerVariant} size={triggerSize} className={className} />}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{cancelLabel}</DialogClose>
          <form action={action}>
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button type="submit" variant={confirmVariant}>
              {confirmLabel}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
