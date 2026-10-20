import Link from "next/link";
import { GiftMark } from "@/components/site/gift-mark";
import { Button } from "@/components/ui/button";

/** Landing hors session : brand + pitch + CTA, ambiance cadeau néo-brutale. */
export function GuestHero({
  brand,
  headline,
  body,
  createAccount,
  createHint,
  hasAccount,
}: {
  brand: string;
  headline: string;
  body: string;
  createAccount: string;
  createHint: string;
  hasAccount: string;
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
          <h1 className="guest-hero__brand text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {brand}
          </h1>
          <p className="guest-hero__headline text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {headline}
          </p>
          <p className="guest-hero__body text-pretty text-base text-muted-foreground sm:text-lg">{body}</p>
        </div>
        <div className="guest-hero__cta flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/inscription" />}>
              {createAccount}
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/connexion" />}>
              {hasAccount}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{createHint}</p>
        </div>
      </div>
    </section>
  );
}
