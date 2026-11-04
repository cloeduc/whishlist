import { currentUser, origin } from "../auth/current";
import { getLocale } from "../i18n/server";
import type { CommandContext } from "./commands/context";
import { clientIp } from "./rate-limit";

/** Context of the commands shared with the API, read from the site request (session cookie). */
export async function actionContext(): Promise<CommandContext> {
  const [user, ip, locale, base] = await Promise.all([currentUser(), clientIp(), getLocale(), origin()]);
  return { user, ip, locale, origin: base };
}
