"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendInviteAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/** Sharing tab: invite someone by email. */
export function InviteEmailForm({ wishlistId }: { wishlistId: string }) {
  const { t } = useTranslation(["list", "errors"]);
  const [state, formAction, pending] = useActionState(sendInviteAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <input type="hidden" name="wishlistId" value={wishlistId} />
        <input type="hidden" name="tab" value="sharing" />
        <FormRefusal code={state?.error} />
        <Field>
          <FieldLabel htmlFor="invite-email">{t("share.inviteEmail")}</FieldLabel>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("share.inviteEmailPlaceholder")}
            defaultValue={state?.values.email}
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {t("share.sendInvite")}
        </Button>
      </FieldGroup>
    </form>
  );
}
