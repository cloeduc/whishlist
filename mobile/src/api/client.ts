import Constants from "expo-constants";
import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

export type Schemas = components["schemas"];

/** Server refusal: `{ error: { code, message } }` (contract 004). */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly title: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Server unreachable (no network, timeout). */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super("network", { cause });
    this.name = "NetworkError";
  }
}

type ClientHooks = {
  getToken: () => string | null;
  getLocale: () => string;
  onUnauthorized: () => void;
  onUpgradeRequired: (message: string) => void;
};

const hooks: ClientHooks = {
  getToken: () => null,
  getLocale: () => "fr",
  onUnauthorized: () => {},
  onUpgradeRequired: () => {},
};

/** Plugs the session, the language and the global screens (401, 410) into the client. */
export function configureClient(next: Partial<ClientHooks>): void {
  Object.assign(hooks, next);
}

/** Site address, set at build time (`EXPO_PUBLIC_API_URL`). */
export function siteOrigin(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl;
  const origin = typeof configured === "string" && configured ? configured : "http://localhost:3000";
  return origin.replace(/\/$/, "");
}

export function apiBaseUrl(): string {
  return `${siteOrigin()}/api/v1`;
}

async function send(request: Request): Promise<Response> {
  const token = hooks.getToken();
  if (token) request.headers.set("Authorization", `Bearer ${token}`);
  request.headers.set("Accept-Language", hooks.getLocale());
  request.headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await globalThis.fetch(request);
  } catch (error) {
    throw new NetworkError(error);
  }
  if (response.status === 401) hooks.onUnauthorized();
  if (response.status === 410) {
    hooks.onUpgradeRequired((await apiErrorFrom(response.clone(), undefined)).message);
  }
  return response;
}

export const api = createClient<paths>({ baseUrl: apiBaseUrl(), fetch: send });

function isErrorBody(value: unknown): value is Schemas["Error"] & { title?: unknown } {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const error = value.error;
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}

/** Server error built from the response (and from the body already read by openapi-fetch, if there is one). */
export async function apiErrorFrom(response: Response, body: unknown): Promise<ApiError> {
  let parsed = body;
  if (parsed === undefined) parsed = await response.json().catch(() => undefined);
  if (isErrorBody(parsed)) {
    const title = typeof parsed.title === "string" ? parsed.title : null;
    return new ApiError(parsed.error.code, response.status, parsed.error.message, title);
  }
  return new ApiError(response.status >= 500 ? "serverError" : "unexpected", response.status, response.statusText);
}

type Answer<T> = { data?: T; error?: unknown; response: Response };

/** Returns the body of a successful response, or throws the server's `ApiError`. */
export async function ok<T>(request: Promise<Answer<T>>): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok || data === undefined) throw await apiErrorFrom(response, error);
  return data;
}

/** For responses without a body (204). */
export async function done(request: Promise<{ error?: unknown; response: Response }>): Promise<Response> {
  const { error, response } = await request;
  if (!response.ok) throw await apiErrorFrom(response, error);
  return response;
}
