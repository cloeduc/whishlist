/**
 * Message for a refused read-password unlock, from its error code: the code an action returns
 * (`badPassword`, `rateLimited`) or an older one still found in `?e=` addresses (`bad`, `rate`,
 * `readPasswordRequired`). `null` for no code or an unknown one. Pure: used by the public list page
 * (server) and by the unlock form (client).
 */
export function unlockErrorMessage(code: string | undefined | null, t: (key: string) => string): string | null {
  if (code === "bad" || code === "badPassword") return t("unlock.badPassword");
  if (code === "rate" || code === "rateLimited") return t("unlock.rateLimited");
  if (code === "readPasswordRequired") return t("unlock.passwordRequiredToFollow");
  return null;
}
