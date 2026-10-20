import { cookies, headers } from "next/headers";
import { cache } from "react";
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

export async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0]!.trim();
  return `${proto}://${host}`;
}

export function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}
