import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiNoContent, apiPreflight, isJsonObject, readJsonBody, withApi } from "@/src/server/api/http";
import { readMemberList, updateSettings } from "@/src/server/commands/lists";
import { deleteList } from "@/src/server/commands/sharing";
import type { WishlistTheme } from "@/src/domain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { listId: string };

export const GET = withApi<Params>(async (api, { listId }) => {
  const result = await readMemberList(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.list, 200, api.cors);
});

const THEME_KEYS = ["primary", "accent", "highlight", "background"] as const;

/** Couleurs du thème présentes et de type texte ; leur format est vérifié par le domaine. */
function themeFrom(value: unknown): Partial<WishlistTheme> | undefined {
  if (!isJsonObject(value)) return undefined;
  const theme: Partial<WishlistTheme> = {};
  for (const key of THEME_KEYS) {
    const color = value[key];
    if (typeof color === "string") theme[key] = color;
  }
  return theme;
}

/** Un champ absent reste tel quel. */
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

/** Créateur seulement. */
export const DELETE = withApi<Params>(async (api, { listId }) => {
  const result = await deleteList(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
