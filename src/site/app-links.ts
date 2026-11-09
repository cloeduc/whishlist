/**
 * Site links the app can open (feature 011, contracts/links.md). Pure module, reused by the app:
 * the same table gives the domain association files (`/.well-known/…`), the Android intent
 * filters of `mobile/app.config.ts` and the app screen for a received address.
 */

/** Identifier of the published app (iOS and Android). The development variant is not associated with the domain. */
export const APP_BUNDLE_ID = "app.ohyoushouldnt.mobile";

/** The app's own scheme: same paths as the site (`ohyoushouldnt://confirm-email/…`). */
export const APP_SCHEME = "ohyoushouldnt";

import { internalPath, stripLocalePrefix } from "../i18n/locale-path";
import routes from "./app-link-routes.json";
import { canonicalSitePath, legacySitePatterns, segments } from "./legacy-paths";

type Params = Record<string, string>;

export interface AppLinkRoute {
  /** Site path without language prefix; `:param` matches a non-empty segment, without `/`. */
  sitePattern: string;
  /** Path of the app screen, with the same `:param`. */
  appPattern: string;
  /** Query keys passed to the screen; the others are ignored. */
  keepQuery: readonly string[];
}

/**
 * The table lives in `app-link-routes.json`: `mobile/app.config.ts` reads it too, and Expo's config
 * loader reads JSON but not a TypeScript module outside `mobile/`.
 * No `/lists/:id`: the app opens these site pages on purpose (« Gérer le partage sur le site »),
 * and a claimed link would reopen the app instead of the browser.
 */
export const APP_LINK_ROUTES: readonly AppLinkRoute[] = routes.map((route) => ({
  sitePattern: route.site,
  appPattern: route.app,
  keepQuery: route.keepQuery,
}));

/** `/links/invite/:token` + `{ token }` → `/links/invite/<token>` (parameters already encoded). */
function fillPattern(pattern: string, params: Params): string {
  return pattern.replace(/:([A-Za-z]+)/g, (_match, name: string) => params[name] ?? "");
}

const EN_PREFIX = "/en";

function decodeSegment(raw: string): string | null {
  try {
    const decoded = decodeURIComponent(raw);
    return decoded === "" || decoded.includes("/") ? null : decoded;
  } catch {
    return null;
  }
}

function parseQuery(search: string): Map<string, string> {
  const query = new Map<string, string>();
  for (const pair of search.split("&")) {
    if (!pair) continue;
    const [rawKey, ...rest] = pair.split("=");
    try {
      const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
      if (!query.has(key)) query.set(key, decodeURIComponent(rest.join("=").replace(/\+/g, " ")));
    } catch {
      // Badly encoded pair: ignored.
    }
  }
  return query;
}

function matchRoute(route: AppLinkRoute, actual: string[]): Params | null {
  const pattern = segments(route.sitePattern);
  if (actual.length !== pattern.length) return null;
  const params: Params = {};
  for (const [index, part] of pattern.entries()) {
    if (part.startsWith(":")) {
      const value = decodeSegment(actual[index]);
      if (value === null) return null;
      params[part.slice(1)] = encodeURIComponent(value);
    } else if (part !== actual[index]) {
      return null;
    }
  }
  return params;
}

/**
 * Path of the app screen for a site address, or `null` if the app does not handle it.
 * Accepted forms: `http(s)://<apiHost>/…`, `<scheme>://…` (the host is the first segment),
 * `<scheme>:///…`, or a bare path. The `/en` prefix is ignored: the app follows the phone's language.
 */
export function appPathForSiteUrl(url: string, options: { apiHost: string; scheme?: string }): string | null {
  const scheme = options.scheme ?? APP_SCHEME;
  let rest: string;
  const web = /^https?:\/\/([^/?#]*)(.*)$/i.exec(url);
  if (web) {
    if (web[1].toLowerCase() !== options.apiHost.toLowerCase()) return null;
    rest = web[2];
  } else if (url.toLowerCase().startsWith(`${scheme.toLowerCase()}://`)) {
    rest = `/${url.slice(scheme.length + 3).replace(/^\/+/, "")}`;
  } else if (internalPath(url)) {
    rest = url;
  } else {
    return null;
  }

  const [beforeHash] = rest.split("#");
  const queryStart = beforeHash.indexOf("?");
  const rawPath = queryStart === -1 ? beforeHash : beforeHash.slice(0, queryStart);
  const search = queryStart === -1 ? "" : beforeHash.slice(queryStart + 1);
  if (rawPath !== "" && !internalPath(rawPath)) return null;
  // A former French address (feature 018) opens the same screen as the new one.
  const canonical = canonicalSitePath(stripLocalePrefix(rawPath.replace(/\/+$/, "") || "/").path, search ? `?${search}` : "");
  const pathSegments = segments(canonical.path);

  for (const route of APP_LINK_ROUTES) {
    const params = matchRoute(route, pathSegments);
    if (!params) continue;
    const query = parseQuery(canonical.search.replace(/^\?/, ""));
    const kept = route.keepQuery.flatMap((key) => {
      const value = query.get(key);
      return value ? [`${encodeURIComponent(key)}=${encodeURIComponent(value)}`] : [];
    });
    return kept.length ? `${fillPattern(route.appPattern, params)}?${kept.join("&")}` : fillPattern(route.appPattern, params);
  }
  return null;
}

/** Path pattern for the Apple file: `:param` → `*`. */
function applePattern(sitePattern: string): string {
  return sitePattern.replace(/:[A-Za-z]+/g, "*");
}

/**
 * Site path patterns claimed by the app: those of the table and their former French forms (feature 018),
 * which emails sent before the change still carry.
 */
export function claimedSitePatterns(): string[] {
  const current = APP_LINK_ROUTES.map((route) => route.sitePattern);
  return [...current, ...legacySitePatterns(current)];
}

function withEnglish(paths: string[]): string[] {
  return [...new Set(paths.flatMap((path) => [path, `${EN_PREFIX}${path}`]))];
}

/** Content of `/.well-known/apple-app-site-association` (iOS universal links). */
export function appleAssociation(teamId: string) {
  return {
    applinks: {
      details: [
        {
          appIDs: [`${teamId}.${APP_BUNDLE_ID}`],
          components: withEnglish(claimedSitePatterns().map(applePattern)).map((path) => ({ "/": path })),
        },
      ],
    },
  };
}

const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/** Content of `/.well-known/assetlinks.json` (Android App Links); malformed fingerprints are ignored. */
export function androidAssociation(fingerprints: readonly string[]) {
  const valid = fingerprints.map((value) => value.trim().toUpperCase()).filter((value) => FINGERPRINT.test(value));
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: APP_BUNDLE_ID, sha256_cert_fingerprints: valid },
    },
  ];
}

/** Prefixes of the Android intent filters: the fixed part of each claimed path, with and without `/en`. */
export function androidPathPrefixes(): string[] {
  return withEnglish(claimedSitePatterns().map((pattern) => pattern.split(":")[0]));
}
