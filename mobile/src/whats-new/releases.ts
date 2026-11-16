/**
 * Versions whose news the app announces (022), oldest first. Each one has its sentences in
 * `locales/{fr,en}/mobile.json` under `whatsNew.releases.<x_y_z>` (checked by a test).
 */
export const RELEASES: readonly string[] = ["1.1.1"];

/** i18next splits keys on dots: `1.1.1` → `1_1_1`. */
export function releaseKey(version: string): string {
  return version.replaceAll(".", "_");
}
