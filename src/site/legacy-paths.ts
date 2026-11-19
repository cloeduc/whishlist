/**
 * Former French addresses of the site (feature 018). Pure module, reused by the app: the same table
 * drives the redirects of `proxy.ts`, the translation of return paths (`next`) and the links the app
 * recognizes. The table lives in `legacy-paths.json` because `mobile/app.config.ts` reads it too.
 * A row is never removed: old emails, bookmarks and app versions keep these addresses forever.
 */
import { internalPath, stripLocalePrefix, withLocale } from "../i18n/locale-path";
import table from "./legacy-paths.json";

export interface LegacyPathRule {
  /** Former path, compared segment by segment as a prefix; `:name` matches one non-empty segment. */
  from: string;
  /** New path, with the same `:name` segments. */
  to: string;
}

export interface LegacyParamRule {
  from: string;
  to: string;
  /** Translation of known values; an unknown value is kept. */
  values?: Readonly<Record<string, string | undefined>>;
  /** The value is an internal address, itself translated. */
  path?: boolean;
}

export const LEGACY_PATHS: readonly LegacyPathRule[] = table.paths;
export const LEGACY_PARAMS: readonly LegacyParamRule[] = table.params;

const PARAM_BY_NAME = new Map(LEGACY_PARAMS.map((rule) => [rule.from, rule]));

/** `/a/b` → `["a", "b"]`; an empty segment (`/a//b`) stays empty. */
export function segments(path: string): string[] {
  return path === "/" ? [] : path.split("/").slice(1);
}

/** New path for a former one (without language prefix), or `null` if no row matches. */
function translatePath(path: string): string | null {
  const actual = segments(path);
  for (const rule of LEGACY_PATHS) {
    const from = segments(rule.from);
    if (actual.length < from.length) continue;
    const params = new Map<string, string>();
    const matches = from.every((part, index) => {
      if (part.startsWith(":")) {
        if (!actual[index]) return false;
        params.set(part.slice(1), actual[index]);
        return true;
      }
      return part === actual[index];
    });
    if (!matches) continue;
    const head = segments(rule.to).map((part) => (part.startsWith(":") ? (params.get(part.slice(1)) ?? "") : part));
    return `/${[...head, ...actual.slice(from.length)].join("/")}`;
  }
  return null;
}

/** Translated query string (with `?`, or empty) and whether anything changed. */
function translateQuery(search: string): { search: string; changed: boolean } {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return { search: "", changed: false };
  const params = new URLSearchParams(raw);
  const present = new Set(params.keys());
  const out: [string, string][] = [];
  let changed = false;
  for (const [key, value] of params) {
    const rule = PARAM_BY_NAME.get(key);
    if (!rule) {
      out.push([key, value]);
      continue;
    }
    if (rule.to !== key && present.has(rule.to)) {
      changed = true;
      continue;
    }
    let next = rule.values && Object.prototype.hasOwnProperty.call(rule.values, value) ? (rule.values[value] ?? value) : value;
    if (rule.path) next = canonicalInternalPath(next) ?? next;
    if (rule.to !== key || next !== value) changed = true;
    out.push([rule.to, next]);
  }
  if (!changed) return { search, changed };
  const query = new URLSearchParams(out).toString();
  return { search: query ? `?${query}` : "", changed };
}

/**
 * Canonical form of a site path (without language prefix) and its query: a former address becomes
 * the new one, renamed parameters get their new name and value. Other parameters keep their order.
 */
export function canonicalSitePath(path: string, search: string): { path: string; search: string; changed: boolean } {
  // A path that is not internal (`//host`, left once `/en` is stripped from `/en//host`) is never rewritten:
  // rebuilt without its prefix, it would point to another site.
  if (internalPath(path) === null) return { path, search, changed: false };
  const translated = translatePath(path);
  const query = translateQuery(search);
  return {
    path: translated ?? path,
    search: query.search,
    changed: translated !== null || query.changed,
  };
}

/**
 * Canonical form of a full internal address (`/en/listes/x?onglet=partage#a` → `/en/lists/x?tab=sharing#a`),
 * or `null` if it is not an internal address of the site (`//host`, `https://…`).
 */
export function canonicalInternalPath(value: string | null | undefined): string | null {
  const address = internalPath(value);
  if (address === null) return null;
  const hashStart = address.indexOf("#");
  const beforeHash = hashStart === -1 ? address : address.slice(0, hashStart);
  const hash = hashStart === -1 ? "" : address.slice(hashStart);
  const queryStart = beforeHash.indexOf("?");
  const rawPath = queryStart === -1 ? beforeHash : beforeHash.slice(0, queryStart);
  const search = queryStart === -1 ? "" : beforeHash.slice(queryStart);
  const { locale, path } = stripLocalePrefix(rawPath);
  const canonical = canonicalSitePath(path, search);
  if (!canonical.changed) return address;
  return internalPath(`${withLocale(locale, canonical.path)}${canonical.search}${hash}`);
}

/**
 * Former forms of site path patterns (`/invite/:token` → `/inviter/:token`), for the declarations
 * that must keep claiming the old addresses (domain association files, Android intent filters).
 * A pattern without a former form gives nothing.
 */
export function legacySitePatterns(patterns: readonly string[]): string[] {
  return patterns.flatMap((pattern) => {
    const actual = segments(pattern);
    return LEGACY_PATHS.flatMap((rule) => {
      const to = segments(rule.to);
      if (actual.length < to.length || !to.every((part, index) => part === actual[index])) return [];
      return [`/${[...segments(rule.from), ...actual.slice(to.length)].join("/")}`];
    });
  });
}

/**
 * Former paths of the rows whose new path is one of `prefixes` or lies under it (`/inviter/` for `/invite/`),
 * so that a list of private paths also covers their former forms. A trailing `/` of the prefix is kept;
 * rows with a `:param` segment are left out (their prefix is already in the list, e.g. `/l/`).
 */
export function formerPathsUnder(prefixes: readonly string[]): string[] {
  return prefixes.flatMap((prefix) => {
    const base = prefix.replace(/\/$/, "");
    const slash = prefix.endsWith("/") ? "/" : "";
    return LEGACY_PATHS.filter(
      (rule) => !rule.from.includes(":") && (rule.to === base || rule.to.startsWith(`${base}/`)),
    ).map((rule) => `${rule.from}${slash}`);
  });
}
