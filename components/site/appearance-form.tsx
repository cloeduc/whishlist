"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GiftMark } from "@/components/site/gift-mark";
import { useWishlistTheme } from "@/components/site/wishlist-theme-scope";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_WISHLIST_THEME,
  resolveTheme,
  type WishlistTheme,
} from "@/src/domain/theme";
import { updateWishlistSettingsAction } from "@/src/server/actions";

type Props = {
  wishlistId: string;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  theme: WishlistTheme;
};

export function AppearanceForm({
  wishlistId,
  title,
  subtitle,
  coverImageUrl,
  theme: initialTheme,
}: Props) {
  const { t } = useTranslation("list");
  const { setTheme: setLiveTheme } = useWishlistTheme();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftSubtitle, setDraftSubtitle] = useState(subtitle ?? "");
  const [draftCover, setDraftCover] = useState(coverImageUrl ?? "");
  const [colors, setColors] = useState<WishlistTheme>(initialTheme);
  const [source, setSource] = useState({ title, subtitle, coverImageUrl, initialTheme });
  if (
    source.title !== title ||
    source.subtitle !== subtitle ||
    source.coverImageUrl !== coverImageUrl ||
    source.initialTheme !== initialTheme
  ) {
    setSource({ title, subtitle, coverImageUrl, initialTheme });
    setDraftTitle(title);
    setDraftSubtitle(subtitle ?? "");
    setDraftCover(coverImageUrl ?? "");
    setColors(initialTheme);
  }

  const previewTheme = useMemo(() => resolveTheme(colors), [colors]);

  useEffect(() => {
    setLiveTheme(previewTheme);
  }, [previewTheme, setLiveTheme]);

  function setColor(key: keyof WishlistTheme, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  function resetColors() {
    setColors(DEFAULT_WISHLIST_THEME);
  }

  return (
    <form action={updateWishlistSettingsAction} className="flex flex-col gap-4">
      <input type="hidden" name="wishlistId" value={wishlistId} />
      <input type="hidden" name="onglet" value="reglages" />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="list-title">{t("settings.listTitle")}</FieldLabel>
          <Input
            id="list-title"
            name="title"
            required
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            maxLength={120}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="list-subtitle">{t("settings.subtitle")}</FieldLabel>
          <Textarea
            id="list-subtitle"
            name="subtitle"
            value={draftSubtitle}
            onChange={(e) => setDraftSubtitle(e.target.value)}
            maxLength={280}
            placeholder={t("settings.subtitlePlaceholder")}
            rows={3}
          />
          <FieldDescription>{t("settings.subtitleHint")}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel>{t("settings.colors")}</FieldLabel>
          <FieldDescription>{t("settings.colorsHint")}</FieldDescription>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["primary", "settings.colorPrimary"],
                ["accent", "settings.colorAccent"],
                ["highlight", "settings.colorHighlight"],
                ["background", "settings.colorBackground"],
              ] as const
            ).map(([key, labelKey]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="color"
                  name={key}
                  value={colors[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="size-10 cursor-pointer rounded-base border-2 border-border bg-secondary-background p-0.5 shadow-shadow"
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>{t(labelKey)}</span>
                  <span className="font-mono text-xs font-normal text-muted-foreground uppercase">
                    {colors[key]}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3 w-fit" onClick={resetColors}>
            {t("settings.resetColors")}
          </Button>
        </Field>

        <Field>
          <FieldLabel htmlFor="list-cover">{t("settings.coverImage")}</FieldLabel>
          <Input
            id="list-cover"
            name="coverImageUrl"
            type="url"
            value={draftCover}
            onChange={(e) => setDraftCover(e.target.value)}
            placeholder="https://"
          />
          <FieldDescription>{t("settings.coverImageHint")}</FieldDescription>
          <div className="mt-3 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">{t("settings.coverPreview")}</span>
            {draftCover.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draftCover.trim()}
                alt={t("settings.coverAlt")}
                className="size-28 rounded-base border-2 border-border object-cover shadow-shadow"
                referrerPolicy="no-referrer"
              />
            ) : (
              <GiftMark theme={previewTheme} className="size-28" />
            )}
          </div>
        </Field>
      </FieldGroup>
      <Button type="submit">{t("settings.saveAppearance")}</Button>
    </form>
  );
}
