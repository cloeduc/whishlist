/** Maximum length of an idea's description (same order of size as the note left with a reservation). */
export const MAX_DESCRIPTION = 2000;

/** Line breaks kept (the text is shown as written), surrounding whitespace removed, empty → null. */
export function normalizeDescription(value: string | null | undefined): string | null {
  const text = (value ?? "").replace(/\r\n?/g, "\n").trim();
  return text ? text : null;
}
