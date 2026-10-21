import { LinkButton } from "@/components/site/link-button";
import { getTranslations } from "@/src/i18n/server";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{t("notFound.title")}</h1>
      <p className="text-muted-foreground">{t("notFound.body")}</p>
      <LinkButton href="/">{t("notFound.home")}</LinkButton>
    </main>
  );
}
