"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CopyLinkField({
  id,
  label,
  value,
  hint,
  copyLabel,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
  copyLabel?: string;
}) {
  const { t } = useTranslation("list");
  const [copied, setCopied] = useState(false);
  const copyAria = copyLabel ?? t("share.copy");

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Fallback for older contexts: select the input.
      const input = document.getElementById(id);
      if (input instanceof HTMLInputElement) {
        input.select();
        document.execCommand("copy");
        setCopied(true);
      }
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          readOnly
          value={value}
          onClick={copy}
          onFocus={(event) => event.currentTarget.select()}
          className="cursor-pointer"
          aria-describedby={copied ? `${id}-copied` : undefined}
        />
        <Button
          type="button"
          variant={copied ? "default" : "outline"}
          size="icon"
          onClick={copy}
          aria-label={copied ? t("share.copied") : copyAria}
          title={copied ? t("share.copied") : copyAria}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      {copied ? (
        <p id={`${id}-copied`} className="text-sm font-medium text-main" role="status">
          {t("share.copied")}
        </p>
      ) : null}
    </Field>
  );
}
