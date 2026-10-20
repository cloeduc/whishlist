import Link from "next/link";
import { GiftMark } from "@/components/site/gift-mark";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO_URL } from "@/src/site/links";

/** Landing hors session : brand + pitch + CTA, ambiance cadeau néo-brutale. */
export function GuestHero({
  brand,
  headline,
  body,
  createAccount,
  hasAccount,
  selfHost,
  github,
  support,
  supportHref,
}: {
  brand: string;
  headline: string;
  body: string;
  createAccount: string;
  hasAccount: string;
  selfHost: string;
  github: string;
  support: string;
  supportHref: string | null;
}) {
  return (
    <section className="guest-hero relative isolate overflow-hidden rounded-base border-2 border-border shadow-shadow">
      <div className="guest-hero__glow" aria-hidden />
      <div className="guest-hero__stripes" aria-hidden />
      <div className="relative z-10 flex flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
        <div className="guest-hero__gift flex justify-center sm:justify-start">
          <GiftMark className="size-28 sm:size-36" title={brand} />
        </div>
        <div className="flex max-w-xl flex-col gap-4">
          <p className="guest-hero__brand text-5xl font-black tracking-tight sm:text-6xl">{brand}</p>
          <h1 className="guest-hero__headline text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {headline}
          </h1>
          <p className="guest-hero__body text-pretty text-base text-muted-foreground sm:text-lg">{body}</p>
        </div>
        <div className="guest-hero__cta flex flex-wrap gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/inscription" />}>
            {createAccount}
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/connexion" />}>
            {hasAccount}
          </Button>
          {supportHref ? (
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<a href={supportHref} target="_blank" rel="noreferrer" />}
            >
              {support}
            </Button>
          ) : null}
        </div>
        <p className="guest-hero__footer text-sm text-muted-foreground">
          {selfHost}{" "}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            {github}
          </a>
        </p>
      </div>
    </section>
  );
}
