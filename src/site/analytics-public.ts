import { stripLocalePrefix } from "@/src/i18n/locale-path";
import { formerPathsUnder } from "@/src/site/legacy-paths";

/** The visitor's local choice. Not a cookie. */
export const ANALYTICS_OPTOUT_KEY = "wishlist-analytics-optout";

/** Paths whose address is a capability or a session. Never sent. */
const CURRENT_PRIVATE_PREFIXES = [
  "/l",
  "/lists",
  "/login",
  "/register",
  "/account",
  "/invite",
  "/reset-password",
  "/confirm-email",
  "/change-password",
  "/forgot-password",
  "/u",
];

/** Their former French paths (feature 018) are redirected before rendering, but stay private anyway. */
const PRIVATE_PREFIXES = [...CURRENT_PRIVATE_PREFIXES, ...formerPathsUnder(CURRENT_PRIVATE_PREFIXES)];

/** Accepts a path or an absolute URL. The query and the fragment are ignored. */
export function analyticsTargetAllowed(value: string): boolean {
  try {
    return analyticsCollectAllowed(new URL(value, "https://analytics.invalid").pathname);
  } catch {
    return false;
  }
}

export function analyticsCollectAllowed(pathname: string): boolean {
  const bare = stripLocalePrefix(pathname).path;
  const path = bare.split("?")[0]?.split("#")[0] || "/";
  return !PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** Inline script, with no instance data. When in doubt, sends nothing. */
export function analyticsBeforeSendSource(): string {
  const key = JSON.stringify(ANALYTICS_OPTOUT_KEY);
  const prefixes = JSON.stringify(PRIVATE_PREFIXES);
  return `window.umamiBeforeSend=function(type,payload){try{if(navigator.globalPrivacyControl)return false;if(localStorage.getItem(${key})==="1")return false;var path=new URL((payload&&payload.url)||"/",location.href).pathname;var bare=path==="/en"||path==="/en/"||path==="/fr"||path==="/fr/"?"/":path.indexOf("/en/")===0||path.indexOf("/fr/")===0?(path.slice(3)||"/"):path;var list=${prefixes};for(var i=0;i<list.length;i++){if(bare===list[i]||bare.indexOf(list[i]+"/")===0)return false}}catch(e){return false}return payload}`;
}
