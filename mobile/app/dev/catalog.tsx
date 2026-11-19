import Constants from "expo-constants";
import { Redirect } from "expo-router";
import { useState, type ReactNode } from "react";
import { View } from "react-native";

import { ListThemeProvider } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Badge } from "@/ui/Badge";
import { BrandHeader } from "@/ui/BrandHeader";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CollapsibleCard } from "@/ui/Card";
import { ContentPage } from "@/ui/ContentPage";
import { ContentSection, ContentText } from "@/ui/ContentSection";
import { Empty } from "@/ui/Empty";
import { Field } from "@/ui/Field";
import { GiftMark } from "@/ui/GiftMark";
import { Input } from "@/ui/Input";
import { PillTabs } from "@/ui/PillTabs";
import { RadioGroup, RadioGroupItem } from "@/ui/RadioGroup";
import { Screen } from "@/ui/Screen";
import { Select } from "@/ui/Select";
import { Separator } from "@/ui/Separator";
import { StarPicker, Stars } from "@/ui/Stars";
import { Text } from "@/ui/Text";

// Development screen (T032): all the components, to compare with the site's.
// Hard-coded English sample texts: it exists only in the development client, never in a distributed build.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: tokens.space[3] }}>
      <Text size="lg" weight="heading">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Components() {
  const [tab, setTab] = useState("ideas");
  const [category, setCategory] = useState("books");
  const [priority, setPriority] = useState("3");
  const [mode, setMode] = useState("single");
  return (
    <>
      <Section title="Buttons">
        <Button title="Log in" fullWidth />
        <Button title="View the shared list" variant="neutral" />
        <Button title="Delete" variant="destructive" />
        <Button title="Fill from the link" variant="neutral" disabled fullWidth />
        <Button title="Forgot your password?" variant="link" />
        <View style={{ flexDirection: "row", gap: tokens.space[3] }}>
          <Button title="xs" size="xs" />
          <Button title="sm" size="sm" />
          <Button title="lg" size="lg" />
        </View>
      </Section>
      <Section title="Tabs">
        <PillTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "ideas", label: "Ideas (8)" },
            { key: "archives", label: "Archives (1)" },
            { key: "reservations", label: "Reservations (1)" },
            { key: "share", label: "Sharing" },
            { key: "settings", label: "Settings" },
          ]}
        />
      </Section>
      <Section title="Card and fields">
        <Card>
          <CardHeader>
            <CardTitle>Add a gift idea</CardTitle>
            <CardDescription>Paste a link to fetch the details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Gift name" description="A hint below the field.">
              <Input placeholder="E.g. 18.50" accessibilityLabel="Gift name" />
            </Field>
            <Field label="Price (€)" error="Enter a valid price, for example 18.50.">
              <Input invalid defaultValue="abc" accessibilityLabel="Price" />
            </Field>
            <Field label="Category">
              <Select
                label="Category"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "books", label: "Books" },
                  { value: "games", label: "Games" },
                ]}
              />
            </Field>
            <Field label="How much I want it">
              <StarPicker value={priority} onChange={setPriority} />
            </Field>
          </CardContent>
          <CardFooter>
            <Button title="Add the idea" fullWidth />
          </CardFooter>
        </Card>
        <Card onPress={() => {}} accessibilityLabel="Pressable card">
          <CardHeader>
            <CardTitle>Pressable card</CardTitle>
            <CardDescription>{"It sinks when pressed."}</CardDescription>
          </CardHeader>
        </Card>
        <CollapsibleCard title="Collapsible card" description="Tap the header to expand it.">
          <Field label="Display name">
            <Input accessibilityLabel="Display name" />
          </Field>
        </CollapsibleCard>
        <CollapsibleCard title="Card expanded at first" defaultExpanded>
          <Button title="Save" fullWidth />
        </CollapsibleCard>
      </Section>
      <Section title="Radio group">
        <RadioGroup label="How do you give it?" value={mode} onChange={setMode}>
          <RadioGroupItem value="single" label="Reserve on my own" description="You give the whole gift." />
          <RadioGroupItem value="group" label="Start a group gift" description="Others can chip in." />
        </RadioGroup>
      </Section>
      <Section title="Badges and stars">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space[3] }}>
          <Badge>Alex</Badge>
          <Badge>€24.90</Badge>
          <Badge variant="default">Blue</Badge>
          <Badge variant="highlight">Pending</Badge>
          <Badge variant="destructive">Refused</Badge>
        </View>
        <Stars value="4" />
      </Section>
      <Section title="Alerts and empty state">
        <Alert title="Offline · last updated at 2:05 PM">2 changes pending.</Alert>
        <Alert
          variant="destructive"
          title="This idea no longer exists."
          actions={
            <>
              <Button title="Fix" variant="neutral" size="sm" />
              <Button title="Discard" variant="neutral" size="sm" />
            </>
          }
        />
        <Empty title="No lists" description="Create your first list." />
      </Section>
      <Section title="Content page">
        <ContentPage eyebrow="Legal information" title="Legal notice" intro="Who publishes the site, how it is hosted, and where to write.">
          <ContentSection title="Publisher">
            <ContentText>This site is published on a non-professional basis, by a private individual.</ContentText>
          </ContentSection>
        </ContentPage>
        <Separator />
      </Section>
      <Section title="Gift">
        <View style={{ flexDirection: "row", gap: tokens.space[4], alignItems: "center" }}>
          <GiftMark size={48} />
          <GiftMark size={48} framed={false} />
        </View>
      </Section>
    </>
  );
}

export default function Catalog() {
  if (!Constants.expoConfig?.extra?.devCatalog) return <Redirect href="/" />;
  return (
    <Screen>
      <BrandHeader />
      <Components />
      <Text size="title">List theme</Text>
      <ListThemeProvider theme={{ primary: "#b4235a", accent: "#1f7a4d", highlight: "#f4a300", background: "#fff1f5" }}>
        <View style={{ backgroundColor: "#fff1f5", gap: tokens.space[6], padding: tokens.space[3] }}>
          <Components />
        </View>
      </ListThemeProvider>
    </Screen>
  );
}
