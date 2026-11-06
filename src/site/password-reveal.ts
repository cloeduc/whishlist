/**
 * What a password field shows for its eye state (spec 016): the input type, and the
 * `common` key of the eye's label, which names the action the eye will do. Pure: used by
 * `PasswordInput` on the site and in the app.
 */
export function passwordReveal(visible: boolean): {
  type: "text" | "password";
  labelKey: "passwordField.hide" | "passwordField.show";
} {
  return visible ? { type: "text", labelKey: "passwordField.hide" } : { type: "password", labelKey: "passwordField.show" };
}
