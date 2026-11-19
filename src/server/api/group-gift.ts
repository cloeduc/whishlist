import "server-only";
import { amountFrom } from "../../domain/group-gift";

/** `amountCents` of a JSON body (028): missing or null → null; an integer within the limit; anything else is invalid. */
export function amountField(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null) return null;
  return typeof value === "number" ? amountFrom(value) : "invalid";
}
