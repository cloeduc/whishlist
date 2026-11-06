"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createListAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/** New list. The placeholders show what an empty field gives (computed by the page). */
export function NewListForm({
  placeholders,
}: {
  placeholders: { title: string; category: string; person: string };
}) {
  const { t } = useTranslation(["home", "errors"]);
  const [state, formAction, pending] = useActionState(createListAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <FormRefusal code={state?.error} />
        <Field>
          <FieldLabel htmlFor="title">{t("newList.titleLabel")}</FieldLabel>
          <Input
            id="title"
            name="title"
            className="placeholder:italic"
            placeholder={placeholders.title}
            autoComplete="off"
            defaultValue={state?.values.title}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="category">{t("newList.categoryLabel")}</FieldLabel>
          <Input
            id="category"
            name="category"
            className="placeholder:italic"
            placeholder={placeholders.category}
            autoComplete="off"
            defaultValue={state?.values.category}
          />
          <FieldDescription>{t("newList.categoryHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="person">{t("newList.personLabel")}</FieldLabel>
          <Input
            id="person"
            name="person"
            className="placeholder:italic"
            placeholder={placeholders.person}
            autoComplete="off"
            defaultValue={state?.values.person}
          />
          <FieldDescription>{t("newList.personHint")}</FieldDescription>
        </Field>
        <Button type="submit" disabled={pending}>
          {t("newList.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
