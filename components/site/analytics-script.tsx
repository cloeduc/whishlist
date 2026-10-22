import Script from "next/script";
import { headers } from "next/headers";
import { analyticsBeforeSendSource } from "@/src/site/analytics-public";
import { analyticsConfig } from "@/src/server/analytics";
import { siteOrigin } from "@/src/site/seo";

/** Absent tant que l'instance n'a pas configuré Umami. */
export async function AnalyticsScript() {
  const config = analyticsConfig();
  if (!config) return null;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const domain = new URL(siteOrigin()).hostname;
  return (
    <>
      <Script id="analytics-before" strategy="beforeInteractive" nonce={nonce}>
        {analyticsBeforeSendSource()}
      </Script>
      <Script
        src="/u/script.js"
        strategy="afterInteractive"
        nonce={nonce}
        data-website-id={config.websiteId}
        data-host-url="/u"
        data-before-send="umamiBeforeSend"
        data-exclude-search="true"
        data-do-not-track="true"
        data-domains={domain}
      />
    </>
  );
}
