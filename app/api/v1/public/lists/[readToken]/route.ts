import { guestProofs } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, withApi } from "@/src/server/api/http";
import { readPublicList } from "@/src/server/commands/public-list";

export const runtime = "nodejs";

export const GET = withApi<{ readToken: string }>(async (api, { readToken }) => {
  // Since 1.11.0: a client that knows group gifts asks for them (028); an older app sees them as reservations.
  const groupGifts = api.req.nextUrl.searchParams.get("groupGifts") === "true";
  const result = await readPublicList(await commandContext(api), {
    readToken,
    groupGifts,
    ...guestProofs(api.req, readToken),
  });
  if (!result.ok) {
    const extra = "title" in result ? { title: result.title } : undefined;
    return apiError(result.error, api.locale, api.cors, extra);
  }
  return apiJson(result.list, 200, api.cors);
});

export const OPTIONS = apiPreflight;
