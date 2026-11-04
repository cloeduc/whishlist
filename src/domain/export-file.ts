import type { Locale } from "../i18n/config";

const EXPORT_FILE_WORD: Record<Locale, string> = { fr: "donnees", en: "data" };

/** Export file name: `ohyoushouldnt-donnees-AAAA-MM-JJ.json`, `ohyoushouldnt-data-…` in English. */
export function exportFileName(exportedAt: string, locale: Locale): string {
  return `ohyoushouldnt-${EXPORT_FILE_WORD[locale]}-${exportedAt.slice(0, 10)}.json`;
}

/** An export file, whatever its language. */
export function isExportFileName(name: string): boolean {
  return Object.values(EXPORT_FILE_WORD).some((word) => name.startsWith(`ohyoushouldnt-${word}-`));
}
