import type { LabelInput } from "../commands/labels";
import { manageLabel } from "../commands/labels";
import { commandContext } from "./context";
import { apiError, apiJson, apiNoContent, readJsonBody, text, withApi } from "./http";

/** Routes `types` et `people` : mêmes opérations sur une catégorie ou un « qui ». */
export function labelCollectionRoute(kind: LabelInput["kind"]) {
  return withApi<{ listId: string }>(async (api, { listId }) => {
    const body = await readJsonBody(api.req);
    if (!body.ok) return apiError(body.error, api.locale, api.cors);
    const result = await manageLabel(await commandContext(api), {
      kind,
      op: "add",
      wishlistId: listId,
      label: text(body.body.label),
    });
    if (!result.ok) return apiError(result.error, api.locale, api.cors);
    return apiJson(result.label, 201, api.cors);
  });
}

export function labelItemRoutes<K extends "typeId" | "personId">(kind: LabelInput["kind"], idParam: K) {
  type Params = { listId: string } & Record<K, string>;
  const PATCH = withApi<Params>(async (api, params) => {
    const body = await readJsonBody(api.req);
    if (!body.ok) return apiError(body.error, api.locale, api.cors);
    const result = await manageLabel(await commandContext(api), {
      kind,
      op: "rename",
      wishlistId: params.listId,
      id: params[idParam],
      label: text(body.body.label),
    });
    if (!result.ok) return apiError(result.error, api.locale, api.cors);
    return apiJson(result.label, 200, api.cors);
  });
  const DELETE = withApi<Params>(async (api, params) => {
    const result = await manageLabel(await commandContext(api), {
      kind,
      op: "delete",
      wishlistId: params.listId,
      id: params[idParam],
    });
    if (!result.ok) return apiError(result.error, api.locale, api.cors);
    return apiNoContent(api.cors);
  });
  return { PATCH, DELETE };
}
