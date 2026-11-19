import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Schemas } from "@/api/client";
import { addLabel, type LabelKind } from "@/data/labels";
import { errorText } from "@/features/errors";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";

const texts = {
  types: { label: "categories.newType", placeholder: "categories.newTypePlaceholder", addAria: "categories.addTypeAria" },
  people: { label: "categories.newPerson", placeholder: "categories.newPersonPlaceholder", addAria: "categories.addPersonAria" },
} as const;

/**
 * The « Nouvelle catégorie » (or « qui ») field: a name, « Ajouter », the server's refusal below.
 * Used by the settings (`LabelEditor`) and by the idea form (023), so both follow the same rules:
 * « Ajouter » stays disabled while the name is empty; the server checks the rest (duplicates, rights).
 */
export function NewLabelField({
  listId,
  kind,
  disabled,
  onAdded,
  onCancel,
  inputTestID,
  addTestID,
  cancelTestID,
  errorTestID,
}: {
  listId: string;
  kind: LabelKind;
  disabled: boolean;
  /** The label created (the first one when commas create several). */
  onAdded?: (created: Schemas["Label"]) => void;
  /** Shown as « Annuler » when given. */
  onCancel?: () => void;
  inputTestID?: string;
  addTestID?: string;
  cancelTestID?: string;
  errorTestID?: string;
}) {
  const { t } = useTranslation(["list", "common"]);
  const text = texts[kind];
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const created = await addLabel(listId, kind, draft.trim());
      setDraft("");
      onAdded?.(created);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={t(text.label)}>
      <Input testID={inputTestID} accessibilityLabel={t(text.label)} placeholder={t(text.placeholder)} value={draft} onChangeText={setDraft} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space[2] }}>
        <Button
          testID={addTestID}
          title={t("categories.add")}
          accessibilityLabel={t(text.addAria)}
          variant="neutral"
          size="sm"
          disabled={disabled || busy || !draft.trim()}
          onPress={() => void add()}
        />
        {onCancel ? <Button testID={cancelTestID} title={t("common:actions.cancel")} variant="link" size="sm" onPress={onCancel} /> : null}
      </View>
      {error ? (
        <Alert variant="destructive" testID={errorTestID}>
          {error}
        </Alert>
      ) : null}
    </Field>
  );
}
