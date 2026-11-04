"use client";

import { Smartphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Locale } from "@/src/i18n/config";
import { phonePlatform, type PhonePlatform } from "@/src/site/device";

/** The platform does not change during the visit: nothing to listen to. */
function subscribe(): () => void {
  return () => undefined;
}

function readPlatform(): PhonePlatform | null {
  const data = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  return phonePlatform(navigator.userAgent, data?.mobile);
}

type Badge = { platform: PhonePlatform; href: string; src: string; alt: string; className: string };

/**
 * Header « l'app sur votre téléphone » icon (011, US3), only on a phone and if a store listing
 * is set. It rings 5 times for one second when shown (bounded CSS animation, `phone-ring`),
 * stops as soon as it is touched, and opens the badges dialog, the phone's badge first.
 */
export function GetAppButton(props: { appStoreUrl: string | null; playStoreUrl: string | null; locale: Locale }) {
  // The layout stays mounted from page to page: the key remounts the button, which rings on each page shown.
  return <PhoneButton key={usePathname()} {...props} />;
}

function PhoneButton({
  appStoreUrl,
  playStoreUrl,
  locale,
}: {
  appStoreUrl: string | null;
  playStoreUrl: string | null;
  locale: Locale;
}) {
  const { t } = useTranslation("common");
  // On the server, and on first render, the device is unknown: nothing is rendered.
  const platform = useSyncExternalStore(subscribe, readPlatform, () => null);
  const [ringing, setRinging] = useState(true);
  if (!platform || (!appStoreUrl && !playStoreUrl)) return null;

  const badges: Badge[] = [];
  if (appStoreUrl) {
    badges.push({
      platform: "ios",
      href: appStoreUrl,
      src: `/badges/${locale}/app-store.svg`,
      alt: t("getApp.appStore"),
      className: "h-12",
    });
  }
  if (playStoreUrl) {
    // Google's PNG has a transparent margin: taller so it looks the size of the Apple badge.
    badges.push({
      platform: "android",
      href: playStoreUrl,
      src: `/badges/${locale}/google-play.png`,
      alt: t("getApp.googlePlay"),
      className: "h-[4.5rem] -my-3",
    });
  }
  badges.sort((a, b) => Number(b.platform === platform) - Number(a.platform === platform));

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="neutral"
            size="icon-sm"
            aria-label={t("getApp.button")}
            onClick={() => setRinging(false)}
          />
        }
      >
        <Smartphone aria-hidden className={cn(ringing && "phone-ring")} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("getApp.title")}</DialogTitle>
          <DialogDescription>{t("getApp.description")}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col items-center gap-4 py-2">
          {badges.map((badge) => (
            <li key={badge.platform}>
              <a href={badge.href} target="_blank" rel="noopener" className="block">
                {/* Badges officiels, servis tels quels (public/badges/README.md). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={badge.src} alt={badge.alt} className={cn("w-auto", badge.className)} />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t("getApp.trademarks")}</p>
      </DialogContent>
    </Dialog>
  );
}
