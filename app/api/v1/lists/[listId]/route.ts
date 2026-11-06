import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiNoContent, apiPreflight, isJsonObject, readJsonBody, withApi } from "@/src/server/api/http";
import { readMemberList, updateSettings } from "@/src/server/commands/lists";
import { deleteList } from "@/src/server/commands/sharing";
import type { WishlistTheme } from "@/src/domain/types";

export const runtime = "nodejs";

type Params = { listId: string };

export const GET = withApi<Params>(async (api, { listId }) => {
  const result = await readMemberList(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.list, 200, api.cors);
});

const THEME_KEYS = ["primary", "accent", "highlight", "background"] as const;

/** Theme colors present and of type string; their format is checked by the domain. */
function themeFrom(value: unknown): Partial<WishlistTheme> | undefined {
  if (!isJsonObject(value)) return undefined;
  const theme: Partial<WishlistTheme> = {};
  for (const key of THEME_KEYS) {
    const color = value[key];
    if (typeof color === "string") theme[key] = color;
  }
  return theme;
}

/** A missing field stays as it is. */
export const PATCH = withApi<Params>(async (api, { listId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const { title, subtitle, coverImageUrl, theme } = body.body;
  const optional = (value: unknown) => (typeof value === "string" ? value : undefined);
  const result = await updateSettings(await commandContext(api), {
    wishlistId: listId,
    title: optional(title),
    subtitle: optional(subtitle),
    coverImageUrl: optional(coverImageUrl),
    theme: themeFrom(theme),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.list, 200, api.cors);
});

/** Creator only. */
export const DELETE = withApi<Params>(async (api, { listId }) => {
  const result = await deleteList(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
