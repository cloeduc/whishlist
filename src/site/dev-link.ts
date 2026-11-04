import { stripLocalePrefix } from "@/src/i18n/locale-path";

/** Email link that can be shown in dev: a page of this site (`origin`) whose path starts with `page`. */
export function isSiteLink(url: string | null | undefined, origin: string, page: string): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.origin === new URL(origin).origin && stripLocalePrefix(parsed.pathname).path.startsWith(page);
  } catch {
    return false;
  }
}
