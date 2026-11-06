"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/** `notice` and `footer` are rendered by the page (server components such as `LinkButton`). */
export function LoginForm({ next, notice, footer }: { next: string; notice: ReactNode; footer: ReactNode }) {
  const { t } = useTranslation("auth");
  const [state, formAction, pending] = useActionState(loginAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <input type="hidden" name="next" value={next} />
        {notice}
        <FormRefusal message={state ? state.error === "rate" ? t("login.rateLimited") : t("login.badCredentials") : null} />
        <Field>
          <FieldLabel htmlFor="email">{t("login.email")}</FieldLabel>
          <Input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values.email} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{t("login.password")}</FieldLabel>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </Field>
        <Button type="submit" disabled={pending}>
          {t("login.submit")}
        </Button>
        {footer}
      </FieldGroup>
    </form>
  );
}
