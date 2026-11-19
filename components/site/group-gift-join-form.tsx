"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { GiverFields } from "@/components/site/giver-fields";
import { joinGroupGiftAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/**
 * « Participer » to a group gift (028): name, message and amount, all optional.
 * The `website` field is an anti-bot honeypot and must stay empty.
 */
export function GroupGiftJoinForm({ token }: { token: string }) {
  const { t } = useTranslation(["public", "errors"]);
  const [state, formAction, pending] = useActionState(joinGroupGiftAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <FormRefusal code={state?.error} />
        <input type="hidden" name="token" value={token} />
        <GiverFields honeypotId="website-gift" values={state?.values} group />
        <Button type="submit" disabled={pending}>
          {t("groupGift.joinSubmit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
