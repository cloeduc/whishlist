import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";

import { tokens } from "@/theme/tokens";

import { Button } from "./Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

/** Modal dialog centered on a dimmed background; with fields, it stays visible above the keyboard. */
export function ModalCard({
  visible,
  title,
  description,
  dismissLabel,
  onDismiss,
  children,
}: {
  visible: boolean;
  title: string;
  description?: string;
  dismissLabel: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      {/* With fields (reservation), the keyboard must not cover the card: it moves up (iOS) and scrolls. */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: tokens.space[4] }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            onPress={onDismiss}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View accessibilityViewIsModal>
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Confirmation in the site's style (`components/site/confirm-form.tsx`): title, text, action and « Conserver ». */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  keepLabel,
  destructive = true,
  onConfirm,
  onKeep,
  testID,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  keepLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onKeep: () => void;
  /** On the action button; `<testID>-keep` on « Conserver ». */
  testID?: string;
}) {
  return (
    <ModalCard visible={visible} title={title} description={body} dismissLabel={keepLabel} onDismiss={onKeep}>
      <Button title={confirmLabel} variant={destructive ? "destructive" : "default"} fullWidth onPress={onConfirm} testID={testID} />
      <Button title={keepLabel} variant="neutral" fullWidth onPress={onKeep} testID={testID ? `${testID}-keep` : undefined} />
    </ModalCard>
  );
}
