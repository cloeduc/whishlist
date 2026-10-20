export function parsePrice(input: string): number | null | "invalid" {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return "invalid";
  const cents = Math.round(Number(trimmed) * 100);
  if (!Number.isInteger(cents) || cents < 0) return "invalid";
  return cents;
}

export function formatPrice(cents: number | null): string | null {
  if (cents === null) return null;
  const euros = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `€${euros}.${rest}`;
}
