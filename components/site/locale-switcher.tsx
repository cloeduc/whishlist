"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { setLocaleAction } from "@/src/server/actions";
import { isLocale, type Locale } from "@/src/i18n/config";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <NativeSelect
      size="sm"
      value={locale}
      disabled={pending}
      aria-label={t("locale.groupAria")}
      className="shrink-0"
      onChange={(event) => {
        const next = event.target.value;
        if (!isLocale(next) || next === locale) return;
        startTransition(async () => {
          await setLocaleAction(next);
          router.refresh();
        });
      }}
    >
      <NativeSelectOption value="fr">{t("locale.fr")}</NativeSelectOption>
      <NativeSelectOption value="en">{t("locale.en")}</NativeSelectOption>
    </NativeSelect>
  );
}
