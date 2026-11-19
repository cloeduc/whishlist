import { parsePrice } from "./price";

/**
 * Amount a participant puts in a group gift (028), in cents. Pure module, shared with the app
 * (like `price.ts`): typed like a price, positive, at most 100 000 €.
 */
export const MAX_AMOUNT_CENTS = 10_000_000;

export function validAmount(cents: number | null): boolean {
  return cents === null || (Number.isInteger(cents) && cents >= 1 && cents <= MAX_AMOUNT_CENTS);
}

/** Amount as typed (« 18,50 » or « 18.50 »): null when empty, "invalid" when not a positive amount within the limit. */
export function parseAmount(input: string | null | undefined): number | null | "invalid" {
  const cents = parsePrice(input ?? "");
  if (cents === null) return null;
  if (cents === "invalid") return "invalid";
  return validAmount(cents) ? cents : "invalid";
}

/** Amount as typed on the site (text) or already in cents (API): null when empty, "invalid" otherwise. */
export function amountFrom(input: string | number | null | undefined): number | null | "invalid" {
  if (typeof input === "string") return parseAmount(input);
  if (input === null || input === undefined) return null;
  return validAmount(input) ? input : "invalid";
}
