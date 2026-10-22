import type { Metadata } from "next";
import Image from "next/image";
import { LinkButton } from "@/components/site/link-button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/src/i18n/config";
import { getLocale, getTranslations } from "@/src/i18n/server";
import { publicPageMetadata } from "@/src/site/seo";

type GuideStep = { title: string; body: string };
type GuideScreen = { src: string; alt: string; caption: string };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content");
  return await publicPageMetadata({
    title: t("guide.metaTitle"),
    description: t("guide.metaDescription"),
    path: "/guide",
  });
}

function guideSrc(locale: Locale, name: string) {
  return `/guide/${locale}/${name}.png`;
}

export default async function GuidePage() {
  const [t, locale] = await Promise.all([getTranslations("content"), getLocale()]);
  const steps = t("guide.steps", { returnObjects: true }) as unknown as GuideStep[];
  const screens: GuideScreen[] = [
    {
      src: guideSrc(locale, "inscription"),
      alt: t("guide.screens.accountAlt"),
      caption: t("guide.screens.accountCaption"),
    },
    {
      src: guideSrc(locale, "mes-listes"),
      alt: t("guide.screens.listsAlt"),
      caption: t("guide.screens.listsCaption"),
    },
    {
      src: guideSrc(locale, "nouvelle-idee"),
      alt: t("guide.screens.ideaAlt"),
      caption: t("guide.screens.ideaCaption"),
    },
    {
      src: guideSrc(locale, "reglages"),
      alt: t("guide.screens.settingsAlt"),
      caption: t("guide.screens.settingsCaption"),
    },
    {
      src: guideSrc(locale, "partage"),
      alt: t("guide.screens.sharingAlt"),
      caption: t("guide.screens.sharingCaption"),
    },
    {
      src: guideSrc(locale, "reservations"),
      alt: t("guide.screens.reservationsAlt"),
      caption: t("guide.screens.reservationsCaption"),
    },
  ];

  return (
    <div className="relative left-1/2 w-[min(100vw-1.5rem,68rem)] -translate-x-1/2">
      <main className="flex flex-col gap-14 pb-8 sm:gap-16">
        <header className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-main">
            {t("guide.eyebrow")}
          </p>
          <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl">
            {t("guide.title")}
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">{t("guide.intro")}</p>
        </header>

        <ol className="flex flex-col gap-12 sm:gap-14">
          {steps.map((step, index) => (
            <GuideStepRow
              key={step.title}
              as="li"
              index={index}
              title={step.title.replace(/^\d+\.\s*/, "")}
              body={step.body}
              caption={screens[index].caption}
              screen={screens[index]}
              reverse={index % 2 === 1}
              priority={index < 2}
            />
          ))}
        </ol>

        <section className="grid gap-10">
          <h2 className="text-center text-3xl font-black tracking-tight">{t("guide.extrasTitle")}</h2>
          <GuideStepRow
            as="div"
            title={t("guide.screens.aiTitle")}
            body={t("guide.screens.aiCaption")}
            screen={{
              src: guideSrc(locale, "enrich-ia"),
              alt: t("guide.screens.aiAlt"),
              caption: t("guide.screens.aiCaption"),
            }}
            reverse={false}
          />
          <GuideStepRow
            as="div"
            title={t("guide.screens.categoriesTitle")}
            body={t("guide.screens.categoriesCaption")}
            screen={{
              src: guideSrc(locale, "categories"),
              alt: t("guide.screens.categoriesAlt"),
              caption: t("guide.screens.categoriesCaption"),
            }}
            reverse
          />
        </section>

        <section className="grid gap-10 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow sm:p-8">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
            <h2 className="text-3xl font-black tracking-tight">{t("guide.guestTitle")}</h2>
            <p className="text-pretty text-lg leading-8 text-muted-foreground">
              {t("guide.guestBody")}
            </p>
          </div>
          <div className="grid gap-10">
            <GuideStepRow
              as="div"
              title={t("guide.screens.publicTitle")}
              body={t("guide.screens.publicCaption")}
              screen={{
                src: guideSrc(locale, "liste-partagee"),
                alt: t("guide.screens.publicAlt"),
                caption: t("guide.screens.publicCaption"),
              }}
              reverse={false}
            />
            <GuideStepRow
              as="div"
              title={t("guide.screens.reserveTitle")}
              body={t("guide.screens.reserveCaption")}
              screen={{
                src: guideSrc(locale, "reserver-cadeau"),
                alt: t("guide.screens.reserveAlt"),
                caption: t("guide.screens.reserveCaption"),
              }}
              reverse
            />
          </div>
        </section>

        <aside className="mx-auto flex max-w-2xl flex-col gap-3 rounded-base border-2 border-border bg-main p-6 text-main-foreground shadow-shadow sm:p-8">
          <h2 className="text-2xl font-black tracking-tight">{t("guide.tipTitle")}</h2>
          <p className="text-pretty text-lg leading-8">{t("guide.tipBody")}</p>
        </aside>

        <div className="flex justify-center">
          <LinkButton href="/inscription" size="lg">
            {t("guide.cta")}
          </LinkButton>
        </div>
      </main>
    </div>
  );
}

function GuideStepRow({
  as: Comp = "div",
  index,
  title,
  body,
  caption,
  screen,
  reverse,
  priority = false,
}: {
  as?: "li" | "div";
  index?: number;
  title: string;
  body: string;
  caption?: string;
  screen: GuideScreen;
  reverse: boolean;
  priority?: boolean;
}) {
  return (
    <Comp className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
      <div
        className={cn(
          "flex flex-col gap-4 lg:col-span-5",
          reverse ? "lg:order-2" : "lg:order-1",
        )}
      >
        {typeof index === "number" ? (
          <span className="flex size-12 items-center justify-center rounded-base border-2 border-border bg-main text-xl font-black text-main-foreground shadow-shadow">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}
        <div className="flex flex-col gap-3">
          <h2 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
          <p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {body}
          </p>
          {caption ? (
            <p className="border-l-4 border-main pl-3 text-sm leading-6 text-muted-foreground">
              {caption}
            </p>
          ) : null}
        </div>
      </div>
      <GuideFigure
        screen={screen}
        priority={priority}
        className={cn("lg:col-span-7", reverse ? "lg:order-1" : "lg:order-2")}
      />
    </Comp>
  );
}

function GuideFigure({
  screen,
  priority = false,
  className,
}: {
  screen: GuideScreen;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-base border-2 border-border bg-background shadow-shadow",
        className,
      )}
    >
      <div className="flex h-[20rem] items-start justify-center bg-secondary-background/50 p-2 sm:h-[24rem] sm:p-3">
        <Image
          src={screen.src}
          alt={screen.alt}
          width={1280}
          height={900}
          priority={priority}
          className="h-full w-full object-contain object-top"
        />
      </div>
    </figure>
  );
}
