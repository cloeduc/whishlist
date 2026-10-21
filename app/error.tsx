"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation("common");
  return (
    <main className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{t("error.title")}</h1>
      <p className="text-muted-foreground">{t("error.body")}</p>
      <Button type="button" onClick={() => reset()}>
        {t("error.retry")}
      </Button>
    </main>
  );
}
