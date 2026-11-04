import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { exportFileName, isExportFileName } from "../../../../src/domain/export-file";
import { api, ok } from "@/api/client";
import { currentLocale } from "@/i18n";

/** Deletes the export files from the cache (they contain the account data). */
export function removeExportFiles(): void {
  for (const entry of Paths.cache.list()) {
    if (entry instanceof File && isExportFileName(entry.name)) entry.delete();
  }
}

/**
 * Downloads one's data (`GET /me/export`), writes it to the app cache, then opens the share
 * sheet (save to Files, send…). The file from a previous request is deleted.
 */
export async function exportData(dialogTitle: string): Promise<void> {
  const data = await ok(api.GET("/me/export"));
  removeExportFiles();
  const file = new File(Paths.cache, exportFileName(data.exportedAt, currentLocale()));
  file.create();
  await file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle });
}
