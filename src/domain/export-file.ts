import type { Locale } from "../i18n/config";

const EXPORT_FILE_WORD: Record<Locale, string> = { fr: "donnees", en: "data" };

/** Nom du fichier d'export : `ohyoushouldnt-donnees-AAAA-MM-JJ.json`, `ohyoushouldnt-data-…` en anglais. */
export function exportFileName(exportedAt: string, locale: Locale): string {
  return `ohyoushouldnt-${EXPORT_FILE_WORD[locale]}-${exportedAt.slice(0, 10)}.json`;
}

/** Un fichier d'export, quelle que soit sa langue. */
export function isExportFileName(name: string): boolean {
  return Object.values(EXPORT_FILE_WORD).some((word) => name.startsWith(`ohyoushouldnt-${word}-`));
}
