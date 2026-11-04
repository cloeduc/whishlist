import { stripLocalePrefix } from "../i18n/locale-path";
import { APP_SCHEME } from "../site/app-links";

/*
 * A list's read link, pasted or scanned (012). Pure module, with no server dependency:
 * the mobile app also uses it to filter a scanned QR code before any call.
 */

const RAW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const APP_SCHEME_PREFIX = `${APP_SCHEME}://`;
/** A host name (with a dot, or `localhost`) followed by a path: link pasted without `https://`. */
const HOST_FIRST_PATTERN = /^(?:localhost|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::\d+)?\//i;

/**
 * Extracts a `readToken` from what a person pastes: full link (`https://.../l/<token>`,
 * `https://.../en/l/<token>`, uppercase scheme), link without scheme (`ohyoushouldnt.app/l/<token>`),
 * app link (`ohyoushouldnt://l/<token>`), path (`/l/<token>`), list sub-page
 * (`/l/<token>/reserver?…`) or raw token.
 * Returns `null` if the input does not match a list read link.
 */
export function extractReadToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (RAW_TOKEN_PATTERN.test(trimmed)) return trimmed;

  let pathname: string;
  if (trimmed.toLowerCase().startsWith(APP_SCHEME_PREFIX)) {
    // `ohyoushouldnt://l/<token>`: for `URL`, `l` would be the host; the paths are the site's.
    pathname = `/${trimmed.slice(APP_SCHEME_PREFIX.length)}`;
  } else if (/^https?:\/\//i.test(trimmed) || HOST_FIRST_PATTERN.test(trimmed)) {
    try {
      pathname = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).pathname;
    } catch {
      return null;
    }
  } else {
    pathname = trimmed;
  }

  const { path } = stripLocalePrefix(pathname.split(/[?#]/)[0]);
  const match = /^\/l\/([A-Za-z0-9_-]{8,128})(?:\/.*)?$/.exec(path);
  return match ? match[1] : null;
}
