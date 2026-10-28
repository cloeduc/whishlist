import type { User } from "../../domain/types";
import type { Locale } from "../../i18n/config";

/**
 * Ce qu'une commande sait de la requête, sans dépendre de Next :
 * les server actions le construisent depuis les cookies, l'API depuis les en-têtes.
 */
export type CommandContext = {
  user: User | null;
  ip: string | null;
  locale: Locale;
  /** Origine publique pour les liens (invitation, reset). */
  origin: string;
};

export type CommandResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Compte connecté qui n'a pas de changement de mot de passe en attente. */
export function activeUser(ctx: CommandContext): { ok: true; user: User } | { ok: false; error: string } {
  if (!ctx.user) return { ok: false, error: "unauthorized" };
  if (ctx.user.mustChangePassword) return { ok: false, error: "mustChangePassword" };
  return { ok: true, user: ctx.user };
}

/**
 * Compte à prendre en compte côté public (accès membre, réservation liée, annulation par compte).
 * Un compte qui doit changer son mot de passe n'agit qu'en invité (FR-023).
 */
export function publicAccount(ctx: CommandContext): User | null {
  return ctx.user && !ctx.user.mustChangePassword ? ctx.user : null;
}
