import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useFocusEffect } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { i18n } from "@/i18n";
import { tokens } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { CollapsibleCard } from "@/ui/Card";
import { PasswordInput } from "@/ui/PasswordInput";

jest.mock("expo-router", () => ({ useFocusEffect: jest.fn() }));

beforeEach(async () => {
  jest.mocked(useFocusEffect).mockReset();
  await i18n.changeLanguage("fr");
});

function field(testID = "login.password") {
  return screen.getByTestId(testID);
}

function eye(testID = "login.password") {
  return screen.getByTestId(`${testID}-reveal`);
}

/** A controlled field, as on the screens; `clear` empties it the way a screen does after a submit. */
function Controlled({ testID = "login.password", initial = "" }: { testID?: string; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <PasswordInput testID={testID} accessibilityLabel={testID} value={value} onChangeText={setValue} />
      <Button title="Vider" testID={`${testID}-clear`} onPress={() => setValue("")} />
    </>
  );
}

test("masked, without auto-capitalisation, auto-correction or suggestions (FR-001)", async () => {
  await render(<PasswordInput testID="login.password" accessibilityLabel="Mot de passe" />);
  expect(field().props).toMatchObject({
    secureTextEntry: true,
    autoCapitalize: "none",
    autoCorrect: false,
    spellCheck: false,
  });
});

test("the field keeps its identifier, label and autofill hints (FR-007, FR-011)", async () => {
  await render(
    <PasswordInput
      testID="login.password"
      accessibilityLabel="Mot de passe"
      autoComplete="new-password"
      textContentType="newPassword"
      value="secret"
    />,
  );
  expect(screen.getByLabelText("Mot de passe")).toBe(field());
  expect(field().props).toMatchObject({ autoComplete: "new-password", textContentType: "newPassword", value: "secret" });
});

test("the same box as Input: font, colour and height", async () => {
  await render(<PasswordInput testID="login.password" />);
  expect(StyleSheet.flatten(field().props.style)).toMatchObject({
    fontSize: tokens.fontSize.base,
    color: tokens.colors.black,
    minHeight: tokens.controlHeight.default - 2 * tokens.borderWidth,
  });
});

test("the eye shows then masks the text, which stays the same, and its label follows (FR-002, FR-003, FR-004)", async () => {
  await render(<Controlled initial="motdepasse" />);
  expect(eye().props.accessibilityRole).toBe("button");
  expect(screen.getByRole("button", { name: "Afficher le mot de passe" })).toBe(eye());
  await fireEvent.press(eye());
  expect(field().props).toMatchObject({ secureTextEntry: false, value: "motdepasse", autoCapitalize: "none", autoCorrect: false });
  expect(screen.getByRole("button", { name: "Masquer le mot de passe" })).toBe(eye());
  await fireEvent.press(eye());
  expect(field().props).toMatchObject({ secureTextEntry: true, value: "motdepasse" });
  expect(screen.getByRole("button", { name: "Afficher le mot de passe" })).toBe(eye());
});

test("in English: « Show password » then « Hide password » (FR-003)", async () => {
  await i18n.changeLanguage("en");
  await render(<PasswordInput testID="login.password" />);
  expect(screen.getByRole("button", { name: "Show password" })).toBe(eye());
  await fireEvent.press(eye());
  expect(screen.getByRole("button", { name: "Hide password" })).toBe(eye());
});

test("each field has its own state: showing one leaves the others masked (US2-3)", async () => {
  await render(
    <>
      <PasswordInput testID="account.password-current" />
      <PasswordInput testID="account.password-next" />
      <PasswordInput testID="account.password-confirm" />
    </>,
  );
  await fireEvent.press(eye("account.password-next"));
  expect(field("account.password-current").props.secureTextEntry).toBe(true);
  expect(field("account.password-next").props.secureTextEntry).toBe(false);
  expect(field("account.password-confirm").props.secureTextEntry).toBe(true);
});

test("the eye is at least 44 × 44 to touch (FR-006)", async () => {
  await render(<PasswordInput testID="login.password" />);
  const style = StyleSheet.flatten(eye().props.style);
  const slop = eye().props.hitSlop ?? {};
  expect(style.width).toBeGreaterThanOrEqual(tokens.touchTarget);
  // Its height is the box's (40, borders included), completed by the hit slop.
  expect(tokens.controlHeight.default + (slop.top ?? 0) + (slop.bottom ?? 0)).toBeGreaterThanOrEqual(tokens.touchTarget);
});

test("a field that cannot be edited (offline) keeps a working eye", async () => {
  await render(<PasswordInput testID="account.email-password" value="secret" editable={false} />);
  await fireEvent.press(eye("account.email-password"));
  expect(field("account.email-password").props).toMatchObject({ secureTextEntry: false, editable: false, value: "secret" });
});

test("leaving the screen masks the text again (FR-005)", async () => {
  await render(<Controlled initial="motdepasse" />);
  await fireEvent.press(eye());
  expect(field().props.secureTextEntry).toBe(false);
  const effect = jest.mocked(useFocusEffect).mock.lastCall![0];
  const cleanup = effect();
  await act(async () => cleanup?.());
  expect(field().props.secureTextEntry).toBe(true);
});

test("emptied by the screen after a submit: masked again; erased by the person: still shown (FR-005)", async () => {
  await render(<Controlled initial="motdepasse" />);
  await fireEvent.press(eye());
  await fireEvent.changeText(field(), "");
  expect(field().props.secureTextEntry).toBe(false);
  await fireEvent.changeText(field(), "nouveau");
  await fireEvent.press(screen.getByTestId("login.password-clear"));
  expect(field().props).toMatchObject({ secureTextEntry: true, value: "" });
  // The eye works again on the emptied field, before anything is typed.
  await fireEvent.press(eye());
  expect(field().props.secureTextEntry).toBe(false);
  expect(screen.getByRole("button", { name: "Masquer le mot de passe" })).toBe(eye());
});

test("collapsing the card that holds the field masks it again (FR-005)", async () => {
  await render(
    <CollapsibleCard testID="account.email" title="E-mail" defaultExpanded>
      <PasswordInput testID="account.email-password" />
    </CollapsibleCard>,
  );
  await fireEvent.press(eye("account.email-password"));
  expect(field("account.email-password").props.secureTextEntry).toBe(false);
  await fireEvent.press(screen.getByTestId("account.email-toggle"));
  await fireEvent.press(screen.getByTestId("account.email-toggle"));
  expect(field("account.email-password").props.secureTextEntry).toBe(true);
});
