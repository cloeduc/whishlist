import { guestProofsForList } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, withApi } from "@/src/server/api/http";
import { toGroupGiftView } from "@/src/server/api/views";
import { readGroupGift } from "@/src/server/commands/group-gift";

export const runtime = "nodejs";

export const GET = withApi<{ token: string }>(async (api, { token }) => {
  const result = await readGroupGift(await commandContext(api), { token, ...guestProofsForList(api.req) });
  if (!result.ok) {
    // Only the list's title, never its read link.
    const extra = "title" in result ? { title: result.title } : undefined;
    return apiError(result.error, api.locale, api.cors, extra);
  }
  return apiJson(toGroupGiftView(result.gift, result.wishlist), 200, api.cors);
});

export const OPTIONS = apiPreflight;
