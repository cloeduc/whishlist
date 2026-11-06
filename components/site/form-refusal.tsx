"use client";

import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Why a form was refused, above its fields. Pass `code` (an error code, translated through the
 * `errors` namespace) or an already translated `message`; nothing is shown without either.
 */
export function FormRefusal({ code, message }: { code?: string | null; message?: string | null }) {
  const { t } = useTranslation("errors");
  const text = message ?? (code ? t(code, { defaultValue: code }) : null);
  if (!text) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}
