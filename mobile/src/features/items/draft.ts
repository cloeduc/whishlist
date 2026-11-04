import { currentLocale } from "@/i18n";
import type { ViewItem } from "@/offline/optimistic";

import type { Draft } from "./ItemForm";

/** Price in cents → input (« 24,90 » in French), read back by the server with `parsePrice`. */
function priceInput(cents: number | null): string {
  if (cents === null) return "";
  const text = (cents / 100).toFixed(2);
  return currentLocale() === "fr" ? text.replace(".", ",") : text;
}

/** Draft of an existing idea for the edit form. */
export function draftOf(item: ViewItem): Draft {
  return {
    name: item.name,
    typeId: item.typeId,
    personId: item.personId,
    url: item.url ?? "",
    imageUrl: item.imageUrl ?? "",
    price: priceInput(item.priceCents),
    priority: item.priority ?? "",
    secondHandOk: item.secondHandOk ?? false,
    description: item.description ?? "",
  };
}

/** A refusal is fixed in the form only if it is about the idea's fields. */
export function fixableInForm(item: ViewItem): boolean {
  return item.rejected?.kind === "createItem" || item.rejected?.kind === "updateItem";
}
