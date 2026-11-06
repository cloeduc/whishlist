"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { unlockPublicListAction } from "@/src/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_READ_PASSWORD_LENGTH } from "@/src/domain/read-password";

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
  const shown = state ? t(state.error === "rateLimited" ? "unlock.rateLimited" : "unlock.badPassword") : error;
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
              {shown ? (
                <Alert variant="destructive">
                  <AlertDescription>{shown}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="read-password">{passwordLabel}</FieldLabel>
                <Input
                  id="read-password"
                  name="password"
                  type="password"
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
