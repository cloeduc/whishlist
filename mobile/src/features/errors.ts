import { useCallback, useState } from "react";

import { ApiError, NetworkError } from "@/api/client";
import { i18n, translateError } from "@/i18n";

/** Displayable message for any error: translated server code, or server unreachable (SC-007). */
export function errorText(error: unknown): string {
  if (error instanceof NetworkError) return i18n.t("mobile:offline.unreachable");
  if (error instanceof ApiError) return translateError(error.code);
  return translateError("serverError");
}

/**
 * Action that requires the server (sign-in, account, settings…): busy during the call,
 * and its translated error kept to show it below the form, fields kept (FR-014).
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
