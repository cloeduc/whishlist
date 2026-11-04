import { origin } from "../../auth/current";
import type { CommandContext } from "../commands/context";
import type { ApiRequestContext } from "./http";
import { optionalApiUser } from "./auth";

/** Command context for an API request (the bearer's account, if any). */
export async function commandContext(api: ApiRequestContext): Promise<CommandContext> {
  const [user, base] = await Promise.all([optionalApiUser(api.req), origin()]);
  return { user, ip: api.ip, locale: api.locale, origin: base };
}
