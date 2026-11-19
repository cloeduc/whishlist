"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { GroupGiftMessageView } from "@/src/domain/group-gift";
import { deleteGroupGiftMessageAction, postGroupGiftMessageAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/**
 * The participants' thread of a group gift (028, US5): participants with an account only, oldest first.
 * No live update: the page reloads after a message.
 */
export function GroupGiftThread({
  token,
  messages,
}: {
  token: string;
  /** `dateLabel`: the date, already formatted by the page in the visitor's language. */
  messages: (GroupGiftMessageView & { dateLabel: string })[];
}) {
  const { t } = useTranslation(["public", "errors"]);
  const [state, formAction, pending] = useActionState(postGroupGiftMessageAction, null);
  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("groupGift.threadEmpty")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {messages.map((message) => (
            <li key={message.id} className="flex flex-col gap-1 border-b-2 border-border pb-3 last:border-b-0">
              <p className="text-sm">
                <span className="font-medium">
                  {message.mine ? t("groupGift.you") : (message.authorName ?? t("groupGift.formerParticipant"))}
                </span>
                <span className="text-muted-foreground"> · {message.dateLabel}</span>
              </p>
              <p className="break-words whitespace-pre-line">{message.body}</p>
              {message.mine ? (
                <form action={deleteGroupGiftMessageAction}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="messageId" value={message.id} />
                  <Button
                    type="submit"
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    aria-label={t("groupGift.deleteMessageAria", { date: message.dateLabel })}
                  >
                    {t("groupGift.deleteMessage")}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      <form key={state?.attempt ?? 0} action={formAction} className="flex flex-col gap-3">
        <FormRefusal code={state?.error} />
        <input type="hidden" name="token" value={token} />
        <Field>
          <FieldLabel htmlFor="thread-body">{t("groupGift.message")}</FieldLabel>
          <Textarea id="thread-body" name="body" required maxLength={2000} defaultValue={state?.values.body} />
        </Field>
        <Button type="submit" className="w-fit" disabled={pending}>
          {t("groupGift.send")}
        </Button>
      </form>
    </div>
  );
}
