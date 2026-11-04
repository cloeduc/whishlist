import type { ItemFields } from "../commands/items";
import { text, type JsonBody } from "./http";

/** Contract `ItemInput` body → command fields. */
export function itemFieldsFrom(wishlistId: string, body: JsonBody, itemId?: string): ItemFields {
  return {
    wishlistId,
    itemId,
    name: text(body.name),
    typeId: text(body.typeId),
    personId: text(body.personId),
    url: text(body.url),
    imageUrl: text(body.imageUrl),
    price: text(body.price),
    priority: text(body.priority),
    // Missing (client older than 1.5.0): not passed on, the stored value is kept.
    secondHandOk: typeof body.secondHandOk === "boolean" ? body.secondHandOk : undefined,
    // Missing (client older than 1.5.0): not passed on, the stored description is kept. null clears it.
    description: typeof body.description === "string" || body.description === null ? body.description : undefined,
  };
}
