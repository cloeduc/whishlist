"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { unlockPublicListAction } from "@/src/server/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { MIN_READ_PASSWORD_LENGTH } from "@/src/domain/read-password";
import { FormRefusal } from "@/components/site/form-refusal";
import { unlockErrorMessage } from "@/src/site/read-unlock";

export function ReadUnlockForm({
  readToken,
  title,
  heading,
  description,
  passwordLabel,
  passwordHint,
  submit,
  error,
  subscribe,
}: {
  readToken: string;
  title: string;
  heading: string;
  description: string;
  passwordLabel: string;
  passwordHint: string;
  submit: string;
  error: string | null;
  subscribe?: boolean;
}) {
  const { t } = useTranslation("public");
  const [state, formAction, pending] = useActionState(unlockPublicListAction, null);
  // A refusal of this form wins over the error the page read in its address (subscription flow).
  const shown = state ? (unlockErrorMessage(state.error, t) ?? t("unlock.badPassword")) : error;
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          <CardDescription>
            {title} — {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={state?.attempt ?? 0} action={formAction}>
            <FieldGroup>
              <input type="hidden" name="readToken" value={readToken} />
              {subscribe ? <input type="hidden" name="subscribe" value="1" /> : null}
              <FormRefusal message={shown} />
              <Field>
                <FieldLabel htmlFor="read-password">{passwordLabel}</FieldLabel>
                <PasswordInput
                  id="read-password"
                  name="password"
                  required
                  minLength={MIN_READ_PASSWORD_LENGTH}
                  autoComplete="current-password"
                  autoFocus
                />
                <FieldDescription>{passwordHint}</FieldDescription>
              </Field>
              <Button type="submit" disabled={pending}>
                {submit}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
