import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { ListThemeProvider } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";
import { Badge } from "@/ui/Badge";
import { Button, type ButtonVariant } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { PillTabs } from "@/ui/PillTabs";
import { Text } from "@/ui/Text";

function style(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style);
}

/** L'ombre du site : une vue noire pleine, décalée de 4/4. */
function expectShadow(testID: string) {
  expect(style(`${testID}-shadow`)).toMatchObject({
    position: "absolute",
    top: tokens.shadowOffset,
    left: tokens.shadowOffset,
    backgroundColor: tokens.colors.black,
  });
}

describe("Button", () => {
  const backgrounds: [ButtonVariant, string][] = [
    ["default", tokens.colors.giftBlue],
    ["neutral", tokens.colors.white],
    ["destructive", tokens.colors.destructive],
  ];

  test.each(backgrounds)("%s: background, 2px border and offset shadow", async (variant, background) => {
    await render(<Button title="OK" variant={variant} testID="button" />);
    expect(style("button-box")).toMatchObject({
      backgroundColor: background,
      borderWidth: tokens.borderWidth,
      borderColor: tokens.colors.black,
      borderRadius: tokens.radius,
    });
    expectShadow("button-box");
  });

  test("link: underlined text, no box", async () => {
    await render(<Button title="Mot de passe oublié ?" variant="link" testID="button" />);
    expect(screen.queryByTestId("button-box")).toBeNull();
    expect(StyleSheet.flatten(screen.getByText("Mot de passe oublié ?").props.style)).toMatchObject({
      textDecorationLine: "underline",
    });
  });

  test("disabled: half opacity", async () => {
    await render(<Button title="OK" disabled testID="button" />);
    expect(style("button")).toMatchObject({ opacity: 0.5 });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("sinks by 4/4 and loses its shadow while pressed, then comes back", async () => {
    await render(<Button title="OK" testID="button" onPress={() => {}} />);
    await fireEvent(screen.getByTestId("button"), "pressIn");
    expect(style("button-box").transform).toEqual([
      { translateX: tokens.shadowOffset },
      { translateY: tokens.shadowOffset },
    ]);
    expect(screen.queryByTestId("button-box-shadow")).toBeNull();
    await fireEvent(screen.getByTestId("button"), "pressOut");
    expect(style("button-box").transform).toBeUndefined();
    expectShadow("button-box");
  });

  test("takes the list theme's primary colour", async () => {
    await render(
      <ListThemeProvider theme={{ primary: "#00a86b" }}>
        <Button title="OK" testID="button" />
      </ListThemeProvider>,
    );
    expect(style("button-box")).toMatchObject({ backgroundColor: "#00a86b" });
  });
});

test("Card, Input and Badge have the border and the shadow", async () => {
  await render(
    <>
      <Card testID="card">
        <Text>Contenu</Text>
      </Card>
      <Input accessibilityLabel="Nom" />
      <Badge testID="badge">24,90 €</Badge>
    </>,
  );
  for (const id of ["card", "badge"]) {
    expect(style(id)).toMatchObject({ borderWidth: tokens.borderWidth, borderColor: tokens.colors.black });
    expectShadow(id);
  }
  const input = screen.getByLabelText("Nom");
  expect(StyleSheet.flatten(input.props.style)).toMatchObject({ fontSize: tokens.fontSize.base });
});

test("Badge: height 24, 12px bold text", async () => {
  await render(<Badge testID="badge">Alex</Badge>);
  const inner = screen.getByTestId("badge").children[0];
  expect(typeof inner === "object" && StyleSheet.flatten(inner.props.style)).toMatchObject({
    minHeight: 24 - 2 * tokens.borderWidth,
  });
  expect(StyleSheet.flatten(screen.getByText("Alex").props.style)).toMatchObject({
    fontSize: 12,
    fontFamily: "Geist_700Bold",
  });
});

test("PillTabs: the active tab is blue with white text", async () => {
  await render(
    <PillTabs
      tabs={[
        { key: "ideas", label: "Idées (8)" },
        { key: "archives", label: "Archives (1)" },
      ]}
      active="ideas"
      onChange={() => {}}
    />,
  );
  expect(style("tab-ideas-box")).toMatchObject({ backgroundColor: tokens.colors.giftBlue });
  expect(StyleSheet.flatten(screen.getByText("Idées (8)").props.style)).toMatchObject({ color: tokens.colors.white });
  expect(style("tab-archives-box")).toMatchObject({ backgroundColor: tokens.colors.white });
  expect(screen.getAllByRole("tab")[0]).toBeSelected();
});
