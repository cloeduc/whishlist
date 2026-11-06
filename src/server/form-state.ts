/**
 * State a site form gets back when its action refuses it (`useActionState`): the error code and
 * what the person typed, so the form can show it again. Never a password, never the anti-bot field.
 * `attempt` counts refusals: the form uses it as its `key`, so it is rebuilt from `values` and the
 * password fields come back empty. `null` = nothing sent yet; a success has no state (the action redirects).
 */
export type FormState = { error: string; values: Record<string, string>; attempt: number } | null;

/** The state of a refused form: `error`, the kept `fields` of `formData`, and one more attempt. */
export function refusal(
  prev: FormState,
  error: string,
  formData: FormData,
  fields: readonly string[],
): NonNullable<FormState> {
  return { error, values: keptValues(formData, fields), attempt: (prev?.attempt ?? 0) + 1 };
}

/** The listed fields of `formData`, as strings (missing field or file → ""). */
export function keptValues(formData: FormData, fields: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}

// Fields each form keeps after a refusal (specs/015-nextjs-audit/contracts/form-states.md).
export const REGISTER_KEPT_FIELDS = ["displayName", "email"] as const;
export const LOGIN_KEPT_FIELDS = ["email"] as const;
export const FORGOT_PASSWORD_KEPT_FIELDS = ["email"] as const;
export const RESET_PASSWORD_KEPT_FIELDS = [] as const;
export const CHANGE_PASSWORD_KEPT_FIELDS = [] as const;
export const DISPLAY_NAME_KEPT_FIELDS = ["displayName"] as const;
export const EMAIL_CHANGE_KEPT_FIELDS = ["email"] as const;
export const NEW_LIST_KEPT_FIELDS = ["title", "category", "person"] as const;
export const LIST_SETTINGS_KEPT_FIELDS = [
  "title",
  "subtitle",
  "coverImageUrl",
  "primary",
  "accent",
  "highlight",
  "background",
] as const;
export const RESERVATION_KEPT_FIELDS = ["itemId", "fromName", "note"] as const;
export const READ_UNLOCK_KEPT_FIELDS = [] as const;
export const INVITE_EMAIL_KEPT_FIELDS = ["email"] as const;
export const READ_PASSWORD_KEPT_FIELDS = [] as const;
