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
 * and its translated error kept to show it below the form, fields kept (FR-014). `code` is the
 * server's error code, for a screen that offers something after a given refusal.
 */
export function useServerAction<A extends unknown[]>(action: (...args: A) => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ text: string; code: string | null } | null>(null);
  const setError = useCallback((text: string | null) => setFailure(text === null ? null : { text, code: null }), []);
  const run = useCallback(
    async (...args: A): Promise<boolean> => {
      setBusy(true);
      setFailure(null);
      try {
        await action(...args);
        return true;
      } catch (caught) {
        setFailure({ text: errorText(caught), code: caught instanceof ApiError ? caught.code : null });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [action],
  );
  return { busy, error: failure?.text ?? null, code: failure?.code ?? null, setError, run };
}
