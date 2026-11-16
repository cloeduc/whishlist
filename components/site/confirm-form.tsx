"use client";

import { useState } from "react";
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

type Variant = "default" | "outline" | "destructive" | "secondary" | "ghost" | "link" | "neutral";

/**
 * What the confirm button does: submit a server action with hidden fields, follow a link,
 * or run a callback of the calling component.
 */
type Confirm =
  | { action: (formData: FormData) => void | Promise<void>; fields: Record<string, string>; href?: never; onConfirm?: never }
  | { href: string; action?: never; fields?: never; onConfirm?: never }
  | { onConfirm: () => void; action?: never; fields?: never; href?: never };

/** Button that opens a confirmation before acting. */
export function ConfirmForm({
  title,
  description,
  confirmLabel,
  cancelLabel,
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "default",
  confirmVariant = "destructive",
  disabled = false,
  className,
  ...confirm
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  triggerLabel: string;
  triggerVariant?: Variant;
  triggerSize?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  confirmVariant?: Variant;
  disabled?: boolean;
  className?: string;
} & Confirm) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant={triggerVariant} size={triggerSize} className={className} disabled={disabled} />
        }
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
          {confirm.href !== undefined ? (
            <a href={confirm.href} className={buttonVariants({ variant: confirmVariant })}>
              {confirmLabel}
            </a>
          ) : confirm.onConfirm ? (
            <Button
              type="button"
              variant={confirmVariant}
              onClick={() => {
                setOpen(false);
                confirm.onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          ) : (
            <form action={confirm.action}>
              {Object.entries(confirm.fields ?? {}).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              <Button type="submit" variant={confirmVariant}>
                {confirmLabel}
              </Button>
            </form>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
