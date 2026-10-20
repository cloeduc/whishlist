export const PRIORITY_MAX = 5;

/** Priorité stockée : "1"…"5", ou null. */
export function parsePriority(value: string | null | undefined): number | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  if (!/^[1-5]$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function normalizePriority(
  value: string | null | undefined,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  if (!/^[1-5]$/.test(trimmed)) {
    return { ok: false, error: "priorityRange" };
  }
  return { ok: true, value: trimmed };
}
