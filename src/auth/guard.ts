import { redirect } from "next/navigation";
import { currentUser } from "./current";
import type { User } from "../domain/types";

export async function requireUser(options?: {
  allowMustChangePassword?: boolean;
}): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/connexion");
  if (user.mustChangePassword && !options?.allowMustChangePassword) {
    redirect("/compte");
  }
  return user;
}
