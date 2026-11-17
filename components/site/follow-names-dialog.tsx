"use client";

import { useId, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { FormRefusal } from "@/components/site/form-refusal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { renameFollowedListAction } from "@/src/server/actions";

export type FollowNames = {
  readToken: string;
  /** The title chosen by the list's members. */
  title: string;
  customTitle: string | null;
  ownerName: string | null;
  customOwnerName: string | null;
};

/** « Renommer » on a followed list (024): the subscriber's own names, seen by them only. */
export function FollowNamesDialog({ names, displayedTitle }: { names: FollowNames; displayedTitle: string }) {
  const { t } = useTranslation(["public", "home"]);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState(names.customTitle ?? "");
  const [customOwnerName, setCustomOwnerName] = useState(names.customOwnerName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: { customTitle: string | null; customOwnerName: string | null }) {
    setError(null);
    startTransition(async () => {
      const result = await renameFollowedListAction({
        readToken: names.readToken,
        customTitle: next.customTitle,
        customOwnerName: next.customOwnerName,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setCustomTitle(names.customTitle ?? "");
          setCustomOwnerName(names.customOwnerName ?? "");
        }
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" aria-label={t("home:followed.renameAria", { title: displayedTitle })} />}
      >
        {t("home:followed.rename")}
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save({ customTitle, customOwnerName });
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("followNames.title")}</DialogTitle>
            <DialogDescription>{t("followNames.body")}</DialogDescription>
          </DialogHeader>
          <FormRefusal code={error} />
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={`${id}-title`}>{t("followNames.listName")}</FieldLabel>
              <Input
                id={`${id}-title`}
                value={customTitle}
                placeholder={names.title}
                onChange={(event) => setCustomTitle(event.target.value)}
              />
              <FieldDescription>{t("followNames.listNameHint", { title: names.title })}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-person`}>{t("followNames.person")}</FieldLabel>
              <Input
                id={`${id}-person`}
                value={customOwnerName}
                placeholder={names.ownerName ?? undefined}
                onChange={(event) => setCustomOwnerName(event.target.value)}
              />
              {names.ownerName ? (
                <FieldDescription>{t("followNames.personHint", { name: names.ownerName })}</FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="link" disabled={pending} onClick={() => save({ customTitle: null, customOwnerName: null })}>
              {t("followNames.reset")}
            </Button>
            <Button type="submit" disabled={pending}>
              {t("followNames.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
