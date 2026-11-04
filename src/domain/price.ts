export function parsePrice(input: string): number | null | "invalid" {
  const trimmed = input.trim().replace(",", ".");
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return "invalid";
  const cents = Math.round(Number(trimmed) * 100);
  if (!Number.isInteger(cents) || cents < 0) return "invalid";
  return cents;
}

/** Localized display; currency unchanged (EUR). */
export function formatPrice(cents: number | null, locale = "fr-FR"): string | null {
  if (cents === null) return null;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Price as it is typed (form, MCP tools): « 18,50 » in French, « 18.50 » by default; "" without a price. */
export function priceInput(cents: number | null, locale = "en-US"): string {
  if (cents === null) return "";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(cents / 100);
}
