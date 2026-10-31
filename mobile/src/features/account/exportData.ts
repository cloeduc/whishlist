import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { exportFileName, isExportFileName } from "../../../../src/domain/export-file";
import { api, ok } from "@/api/client";
import { currentLocale } from "@/i18n";

/** Efface du cache les fichiers d'export (ils contiennent les données du compte). */
export function removeExportFiles(): void {
  for (const entry of Paths.cache.list()) {
    if (entry instanceof File && isExportFileName(entry.name)) entry.delete();
  }
}

/**
 * Télécharge ses données (`GET /me/export`), les écrit dans le cache de l'app, puis ouvre la feuille
 * de partage (enregistrer dans Fichiers, envoyer…). Le fichier d'une demande précédente est effacé.
 */
export async function exportData(dialogTitle: string): Promise<void> {
  const data = await ok(api.GET("/me/export"));
  removeExportFiles();
  const file = new File(Paths.cache, exportFileName(data.exportedAt, currentLocale()));
  file.create();
  await file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle });
}
