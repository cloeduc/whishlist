import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { tokens } from "@/theme/tokens";
import { PasswordInput } from "@/ui/PasswordInput";

function field() {
  return screen.getByTestId("login.password");
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
