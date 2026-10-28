import { useCallback, useState } from "react";

import { ApiError, NetworkError } from "@/api/client";
import { i18n, translateError } from "@/i18n";

/** Message affichable pour toute erreur : code du serveur traduit, ou serveur injoignable (SC-007). */
export function errorText(error: unknown): string {
  if (error instanceof NetworkError) return i18n.t("mobile:offline.unreachable");
  if (error instanceof ApiError) return translateError(error.code);
  return translateError("serverError");
}

/**
 * Action qui exige le serveur (connexion, compte, réglages…) : occupée pendant l'appel,
 * et son erreur traduite gardée pour l'afficher sous le formulaire, champs conservés (FR-014).
 */
export function useServerAction<A extends unknown[]>(action: (...args: A) => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(
    async (...args: A): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        await action(...args);
        return true;
      } catch (caught) {
        setError(errorText(caught));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [action],
  );
  return { busy, error, setError, run };
}
