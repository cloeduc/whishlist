/**
 * One input → one or more labels. « Wilh, Nathan, Nous deux » makes three.
 * Splits on comma, semicolon and line break; ignores blanks and
 * duplicates (case-insensitive), keeping the input order.
 */
export function splitLabels(raw: string): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const label = part.trim();
    if (!label) continue;
    const key = label.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels;
}
