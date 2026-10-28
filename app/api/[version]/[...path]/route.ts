import { apiError, apiPreflight, withApi } from "@/src/server/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Version retirée → 410 ; chemin inconnu de la v1 → 404. */
const unknown = withApi<{ version: string; path: string[] }>(async ({ locale, cors }, { version }) =>
  apiError(version === "v1" ? "notFound" : "apiVersionUnsupported", locale, cors),
);

export const GET = unknown;
export const POST = unknown;
export const PUT = unknown;
export const PATCH = unknown;
export const DELETE = unknown;
export const OPTIONS = apiPreflight;
