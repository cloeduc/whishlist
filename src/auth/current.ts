import { cookies, headers } from "next/headers";
import { cache } from "react";
import { originFromEnv, originFromHeaders } from "./origin";
import { readSession, SESSION_COOKIE, sessionSecret } from "./session";
import { getDocument } from "../store/db";
import type { User } from "../domain/types";

export const currentUser = cache(async (): Promise<User | null> => {
  const secret = sessionSecret();
  if (!secret) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = readSession(token, secret);
  if (!userId) return null;
  const doc = await getDocument();
  return doc.users.find((user) => user.id === userId) ?? null;
});

/** Base URL publique. Prod : `APP_ORIGIN` (évite Host-header poisoning sur reset/invite). */
export async function origin(): Promise<string> {
  const configured = originFromEnv();
  if (configured) return configured;
  const h = await headers();
  return originFromHeaders({
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });
}

export function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}
