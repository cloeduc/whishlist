import { redirect } from "next/navigation";
import { currentUser } from "./current";
import type { User } from "../domain/types";
import { getLocale } from "../i18n/server";
import { withLocale } from "../i18n/locale-path";

export async function requireUser(options?: {
  allowMustChangePassword?: boolean;
}): Promise<User> {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) redirect(withLocale(locale, "/connexion"));
  if (user.mustChangePassword && !options?.allowMustChangePassword) {
    redirect(withLocale(locale, "/compte"));
  }
  return user;
}
