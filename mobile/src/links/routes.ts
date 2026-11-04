import { siteOrigin } from "@/api/client";

import { APP_SCHEME, appPathForSiteUrl } from "../../../src/site/app-links";

/**
 * App screen for a received address (universal link, App Link or `ohyoushouldnt://` scheme),
 * or `null` if the app does not handle it. Only addresses of this build's server are recognized.
 */
export function appPathForUrl(url: string): string | null {
  const host = siteOrigin().replace(/^https?:\/\//, "");
  return appPathForSiteUrl(url, { apiHost: host, scheme: APP_SCHEME });
}
