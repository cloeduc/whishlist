import type { Metadata } from "next";
import { ContentPage } from "@/components/site/content-page";
import { getTranslations } from "@/src/i18n/server";
import { publicPageMetadata } from "@/src/site/seo";

type FaqItem = { q: string; a: string };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content");
  return publicPageMetadata({
    title: t("faq.metaTitle"),
    description: t("faq.metaDescription"),
    path: "/faq",
  });
}

export default async function FaqPage() {
  const t = await getTranslations("content");
  const items = t("faq.items", { returnObjects: true }) as unknown as FaqItem[];
  return (
    <ContentPage eyebrow={t("faq.eyebrow")} title={t("faq.title")} intro={t("faq.intro")}>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-base border-2 border-border bg-secondary-background shadow-shadow"
          >
            <summary className="cursor-pointer list-none px-5 py-4 text-lg font-bold marker:hidden">
              <span className="flex items-start justify-between gap-4">
                {item.q}
                <span aria-hidden className="text-main group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="border-t-2 border-border px-5 py-4 leading-7 text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </ContentPage>
  );
}
