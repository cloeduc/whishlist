/** A trimmed text, or null when nothing is left (optional fields of lists, ideas and subscriptions). */
export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}
