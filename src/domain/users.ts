import { findMembership, clone } from "./access";
import { hashPassword, verifyPassword } from "./passwords";
import { newId } from "./tokens";
import type { Database, User } from "./types";

export interface Ok<T> {
  ok: true;
  doc: Database;
  value: T;
}

export interface Err {
  ok: false;
  error: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function registerUser(
  doc: Database,
  input: { email: string; password: string; displayName: string; now?: Date; id?: string },
): Ok<User> | Err {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const password = input.password;
  if (!email || !email.includes("@") || !password || !displayName) {
    return { ok: false, error: "registerFields" };
  }
  if (doc.users.some((u) => u.email === email)) {
    return { ok: false, error: "emailTaken" };
  }
  const user: User = {
    id: input.id ?? newId(),
    email,
    passwordHash: hashPassword(password),
    displayName,
    createdAt: (input.now ?? new Date()).toISOString(),
    mustChangePassword: false,
  };
  const next = clone(doc);
  next.users.push(user);
  return { ok: true, doc: next, value: user };
}

export function authenticate(doc: Database, email: string, password: string): User | null {
  const user = doc.users.find((u) => u.email === normalizeEmail(email));
  if (!user) {
    hashPassword(password);
    return null;
  }
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export function changePassword(
  doc: Database,
  input: { userId: string; password: string; currentPassword?: string },
): Ok<User> | Err {
  const password = input.password;
  if (!password) return { ok: false, error: "passwordRequired" };
  const next = clone(doc);
  const user = next.users.find((entry) => entry.id === input.userId);
  if (!user) return { ok: false, error: "accountMissing" };
  if (input.currentPassword !== undefined) {
    if (!verifyPassword(input.currentPassword, user.passwordHash)) {
      return { ok: false, error: "wrongCurrentPassword" };
    }
  }
  user.passwordHash = hashPassword(password);
  user.mustChangePassword = false;
  return { ok: true, doc: next, value: user };
}

export function setUserEmail(
  doc: Database,
  input: { userId: string; email: string },
): Ok<User> | Err {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) return { ok: false, error: "emailInvalid" };
  if (doc.users.some((u) => u.email === email && u.id !== input.userId)) {
    return { ok: false, error: "emailTaken" };
  }
  const next = clone(doc);
  const user = next.users.find((entry) => entry.id === input.userId);
  if (!user) return { ok: false, error: "accountMissing" };
  user.email = email;
  return { ok: true, doc: next, value: user };
}

export function updateDisplayName(
  doc: Database,
  input: { userId: string; displayName: string },
): Ok<User> | Err {
  const displayName = input.displayName.trim();
  if (!displayName) return { ok: false, error: "displayNameRequired" };
  if (displayName.length > 80) return { ok: false, error: "displayNameTooLong" };
  const next = clone(doc);
  const user = next.users.find((entry) => entry.id === input.userId);
  if (!user) return { ok: false, error: "accountMissing" };
  user.displayName = displayName;
  return { ok: true, doc: next, value: user };
}

export { findMembership };
