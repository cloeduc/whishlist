"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieSecure, currentUser, origin } from "../auth/current";
import { SESSION_COOKIE, SESSION_TTL_SEC, sessionSecret, signSession } from "../auth/session";
import { createPasswordReset, resetPasswordWithToken } from "../domain/password-reset";
import { findMembership } from "../domain/access";
import {
  authenticate,
  changePassword,
  normalizeEmail,
  registerUser,
  updateDisplayName,
} from "../domain/users";
import { createWishlist } from "../domain/import";
import type { Wishlist } from "../domain/types";
import { mailConfigured, sendInviteMail, sendPasswordResetMail } from "./mail";
import { isRateLimitError, rateLimitOrThrow } from "./rate-limit";
import {
  acceptInvite,
  deleteWishlist,
  leaveWishlist,
  regenerateInvite,
  removeMember,
  updateWishlistSettings,
} from "../domain/membership";
import {
  addPerson,
  addType,
  cancelReservation,
  createItem,
  deleteItem,
  deletePerson,
  deleteType,
  renamePerson,
  renameType,
  setItemArchived,
  setItemType,
  updateItem,
} from "../domain/items";
import { fetchPageHtml } from "../domain/fetch-page";
import { fetchOgImage } from "../domain/og-image";
import { parsePrice } from "../domain/price";
import { extractProductHints } from "../domain/product-from-url";
import { llmConfigured, refineProductWithLlm } from "../domain/product-llm";
import { reserveItem } from "../domain/reserve";
import { isLocale, localeCookie, type Locale } from "../i18n/config";
import { readDocument, updateDocument } from "../store/db";
function blankUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const ADMIN_ONGLETS = new Set(["idees", "archives", "reservations", "partage", "reglages"]);

function redirectToList(
  wishlistId: string,
  formData: FormData,
  error?: string,
  ok?: string,
): never {
  const raw = String(formData.get("onglet") ?? "");
  const mapped = raw === "categories" ? "reglages" : raw;
  const onglet = ADMIN_ONGLETS.has(mapped) ? mapped : "idees";
  const params = new URLSearchParams();
  if (onglet !== "idees") params.set("onglet", onglet);
  if (error) params.set("e", error);
  if (ok) params.set("ok", ok);
  const query = params.toString();
  redirect(query ? `/listes/${wishlistId}?${query}` : `/listes/${wishlistId}`);
}

async function resolveImageUrl(input: {
  url: string | null;
  manual: string | null;
  previousUrl: string | null;
  previousImage: string | null;
}): Promise<string | null> {
  if (input.manual) return input.manual;
  if (!input.url) return null;
  if (input.url === input.previousUrl && input.previousImage) return input.previousImage;
  return (await fetchOgImage(input.url)) ?? (input.url === input.previousUrl ? input.previousImage : null);
}

function nextPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

async function openSession(userId: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET manquant");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(userId, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const dest = nextPath(formData.get("next"));
  try {
    await rateLimitOrThrow("register", 5, 60 * 60 * 1000);
  } catch (error) {
    if (isRateLimitError(error)) {
      redirect(`/inscription?e=rate&next=${encodeURIComponent(dest)}`);
    }
    throw error;
  }
  const result = await updateDocument((doc) => {
    const created = registerUser(doc, { email, password, displayName });
    return { doc: created.ok ? created.doc : doc, result: created };
  });
  if (!result.ok) {
    const code =
      result.error === "emailTaken" || result.error.includes("déjà")
        ? "email"
        : result.error === "passwordTooShort"
          ? "password"
          : "fields";
    redirect(`/inscription?e=${code}&next=${encodeURIComponent(dest)}`);
  }
  await openSession(result.value.id);
  redirect(dest);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const dest = nextPath(formData.get("next"));
  try {
    await rateLimitOrThrow("login", 20, 15 * 60 * 1000);
  } catch (error) {
    if (isRateLimitError(error)) {
      redirect(`/connexion?e=rate&next=${encodeURIComponent(dest)}`);
    }
    throw error;
  }
  const doc = await readDocument();
  const user = authenticate(doc, email, password);
  if (!user) redirect(`/connexion?e=1&next=${encodeURIComponent(dest)}`);
  await openSession(user.id);
  if (user.mustChangePassword) redirect("/compte");
  redirect(dest);
}

export async function updateDisplayNameAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/connexion");
  if (user.mustChangePassword) redirect("/compte");
  const displayName = String(formData.get("displayName") ?? "");
  const result = await updateDocument((doc) => {
    const saved = updateDisplayName(doc, { userId: user.id, displayName });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirect(`/compte?e=${result.error}`);
  redirect("/compte?ok=name");
}

export async function changePasswordAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/connexion");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  if (!password || password !== confirm) {
    redirect("/compte?e=mismatch");
  }
  const result = await updateDocument((doc) => {
    const saved = changePassword(doc, {
      userId: user.id,
      password,
      currentPassword: user.mustChangePassword ? undefined : currentPassword,
    });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) {
    const code =
      result.error === "wrongCurrentPassword" || result.error.includes("actuel")
        ? "current"
        : result.error === "passwordTooShort"
          ? "password"
          : "1";
    redirect(`/compte?e=${code}`);
  }
  redirect(user.mustChangePassword ? "/" : "/compte?ok=1");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  try {
    await rateLimitOrThrow("password-reset", 5, 60 * 60 * 1000);
  } catch (error) {
    if (isRateLimitError(error)) redirect("/mot-de-passe-oublie?e=rate");
    throw error;
  }
  const result = await updateDocument((doc) => {
    const created = createPasswordReset(doc, { email });
    return { doc: created.doc, result: created };
  });
  let reveal: string | null = null;
  if (result.token && result.email) {
    const base = await origin();
    const resetUrl = `${base}/reinitialiser/${result.token}`;
    const mail = await sendPasswordResetMail({ to: result.email, resetUrl });
    // Jamais de lien en clair en production (même si PASSWORD_RESET_SHOW_LINK=1).
    if (!mail.sent && process.env.NODE_ENV !== "production") {
      reveal = resetUrl;
    }
  }
  if (reveal) {
    redirect(`/mot-de-passe-oublie?ok=1&lien=${encodeURIComponent(reveal)}`);
  }
  redirect(`/mot-de-passe-oublie?ok=1${mailConfigured() ? "" : "&sansmail=1"}`);
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await updateDocument((doc) => {
    const saved = resetPasswordWithToken(doc, { token, password });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) {
    const code = result.error === "passwordTooShort" ? "password" : "1";
    redirect(`/reinitialiser/${encodeURIComponent(token)}?e=${code}`);
  }
  await openSession(result.userId);
  redirect("/");
}

export async function createListAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/connexion");
  if (user.mustChangePassword) redirect("/compte");
  const title = String(formData.get("title") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const person = String(formData.get("person") ?? "").trim();
  if (!category) redirect(`/listes/new?e=${encodeURIComponent("listNeedsCategory")}`);
  if (!person) redirect(`/listes/new?e=${encodeURIComponent("listNeedsPerson")}`);
  type CreateListResult =
    | { ok: true; wishlist: Wishlist }
    | { ok: false; error: string };
  const result = await updateDocument<CreateListResult>((doc) => {
    const created = createWishlist(doc, { ownerId: user.id, title, importTemplate: false });
    if (!created.ok) return { doc, result: created };
    const withType = addType(created.doc, {
      wishlistId: created.wishlist.id,
      actorId: user.id,
      label: category,
    });
    if (!withType.ok) return { doc, result: withType };
    const withPerson = addPerson(withType.doc, {
      wishlistId: created.wishlist.id,
      actorId: user.id,
      label: person,
    });
    if (!withPerson.ok) return { doc, result: withPerson };
    return {
      doc: withPerson.doc,
      result: { ok: true, wishlist: created.wishlist },
    };
  });
  if (!result.ok) redirect(`/listes/new?e=${encodeURIComponent(result.error)}`);
  redirect(`/listes/${result.wishlist.id}`);
}

async function memberId(): Promise<string> {
  const user = await currentUser();
  if (!user) redirect("/connexion");
  if (user.mustChangePassword) redirect("/compte");
  return user.id;
}

export type ItemFormDraft = {
  name: string;
  typeId: string;
  personId: string;
  url: string;
  imageUrl: string;
  price: string;
  priority: string;
};

export type SaveItemState = {
  error: string;
  draft: ItemFormDraft;
} | null;

function itemDraftFromForm(formData: FormData): ItemFormDraft {
  return {
    name: String(formData.get("name") ?? ""),
    typeId: String(formData.get("typeId") ?? ""),
    personId: String(formData.get("personId") ?? ""),
    url: String(formData.get("url") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    price: String(formData.get("price") ?? ""),
    priority: String(formData.get("priority") ?? ""),
  };
}

export async function saveItemAction(
  _prev: SaveItemState,
  formData: FormData,
): Promise<SaveItemState> {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const draft = itemDraftFromForm(formData);
  const fail = (error: string): SaveItemState => ({ error, draft });
  const price = parsePrice(draft.price);
  if (price === "invalid") return fail("priceInvalid");
  const itemId = String(formData.get("itemId") ?? "");
  const url = blankUrl(draft.url);
  const manualImage = blankUrl(draft.imageUrl);
  const current = itemId
    ? (await readDocument()).items.find((item) => item.id === itemId && item.wishlistId === wishlistId)
    : null;
  const imageUrl = await resolveImageUrl({
    url,
    manual: manualImage,
    previousUrl: current?.url ?? null,
    previousImage: current?.imageUrl ?? null,
  });
  const fields = {
    wishlistId,
    actorId,
    name: draft.name,
    typeId: draft.typeId,
    personId: draft.personId,
    url,
    imageUrl,
    priceCents: price,
    priority: draft.priority,
  };
  const result = await updateDocument((doc) => {
    const saved = itemId
      ? updateItem(doc, { ...fields, itemId })
      : createItem(doc, fields);
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) return fail(result.error);
  redirectToList(wishlistId, formData);
}

export async function enrichFromUrlAction(input: {
  url: string;
  wishlistId: string;
}): Promise<
  | { ok: true; name: string; price: string; imageUrl: string; typeId: string; usedLlm: boolean }
  | { ok: false; error: string }
> {
  const actorId = await memberId();
  try {
    await rateLimitOrThrow(`enrich:${actorId}`, 30, 60 * 60 * 1000);
  } catch (error) {
    if (isRateLimitError(error)) return { ok: false, error: "rateLimited" };
    throw error;
  }
  const wishlistId = input.wishlistId.trim();
  const trimmed = input.url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { ok: false, error: "urlInvalid" };
  }
  const doc = await readDocument();
  if (!findMembership(doc, wishlistId, actorId)) {
    return { ok: false, error: "notMember" };
  }
  const types = doc.types
    .filter((type) => type.wishlistId === wishlistId)
    .map((type) => ({ id: type.id, label: type.label }));
  const page = await fetchPageHtml(trimmed);
  if (!page) return { ok: false, error: "pageLoadFailed" };
  let hints = extractProductHints(page.html, page.finalUrl);
  const usedLlm = llmConfigured();
  if (usedLlm) {
    hints = await refineProductWithLlm(page.finalUrl, page.html, hints, types);
  }
  if (!hints.name && !hints.price && !hints.imageUrl) {
    return {
      ok: false,
      error: usedLlm ? "enrichEmpty" : "enrichEmptyNoLlm",
    };
  }
  return {
    ok: true,
    name: hints.name ?? "",
    price: hints.price ?? "",
    imageUrl: hints.imageUrl ?? "",
    typeId: hints.typeId ?? "",
    usedLlm,
  };
}

export async function deleteItemAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = deleteItem(doc, { wishlistId, actorId, itemId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function setItemTypeAction(input: {
  wishlistId: string;
  itemId: string;
  typeId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorId = await memberId();
  const result = await updateDocument((doc) => {
    const saved = setItemType(doc, {
      wishlistId: input.wishlistId,
      actorId,
      itemId: input.itemId,
      typeId: input.typeId,
    });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function setItemArchivedAction(input: {
  wishlistId: string;
  itemId: string;
  archived: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorId = await memberId();
  const result = await updateDocument((doc) => {
    const saved = setItemArchived(doc, {
      wishlistId: input.wishlistId,
      actorId,
      itemId: input.itemId,
      archived: input.archived,
    });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function setItemArchivedFormAction(formData: FormData) {
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  const result = await setItemArchivedAction({ wishlistId, itemId, archived });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function addTypeAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const label = String(formData.get("label") ?? "");
  const result = await updateDocument((doc) => {
    const saved = addType(doc, { wishlistId, actorId, label });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function renameTypeAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const typeId = String(formData.get("typeId") ?? "");
  const label = String(formData.get("label") ?? "");
  const result = await updateDocument((doc) => {
    const saved = renameType(doc, { wishlistId, actorId, typeId, label });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function deleteTypeAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const typeId = String(formData.get("typeId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = deleteType(doc, { wishlistId, actorId, typeId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function manageLabelAction(input: {
  kind: "type" | "person";
  op: "add" | "rename" | "delete";
  wishlistId: string;
  id?: string;
  label?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorId = await memberId();
  const wishlistId = input.wishlistId;
  const result = await updateDocument((doc) => {
    let saved:
      | { ok: true; doc: typeof doc }
      | { ok: false; error: string };
    if (input.kind === "type") {
      if (input.op === "add") {
        saved = addType(doc, { wishlistId, actorId, label: input.label ?? "" });
      } else if (input.op === "rename") {
        saved = renameType(doc, {
          wishlistId,
          actorId,
          typeId: input.id ?? "",
          label: input.label ?? "",
        });
      } else {
        saved = deleteType(doc, { wishlistId, actorId, typeId: input.id ?? "" });
      }
    } else if (input.op === "add") {
      saved = addPerson(doc, { wishlistId, actorId, label: input.label ?? "" });
    } else if (input.op === "rename") {
      saved = renamePerson(doc, {
        wishlistId,
        actorId,
        personId: input.id ?? "",
        label: input.label ?? "",
      });
    } else {
      saved = deletePerson(doc, { wishlistId, actorId, personId: input.id ?? "" });
    }
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function addPersonAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const label = String(formData.get("label") ?? "");
  const result = await updateDocument((doc) => {
    const saved = addPerson(doc, { wishlistId, actorId, label });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function renamePersonAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const label = String(formData.get("label") ?? "");
  const result = await updateDocument((doc) => {
    const saved = renamePerson(doc, { wishlistId, actorId, personId, label });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function deletePersonAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = deletePerson(doc, { wishlistId, actorId, personId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function cancelReservationAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = cancelReservation(doc, { wishlistId, actorId, reservationId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function regenerateInviteAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = regenerateInvite(doc, { wishlistId, actorId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function sendInviteAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/connexion");
  if (user.mustChangePassword) redirect("/compte");
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email || !email.includes("@")) {
    redirectToList(wishlistId, formData, "emailRequired");
  }
  const doc = await readDocument();
  if (!findMembership(doc, wishlistId, user.id)) {
    redirectToList(wishlistId, formData, "notMember");
  }
  const list = doc.wishlists.find((entry) => entry.id === wishlistId);
  if (!list) redirectToList(wishlistId, formData, "listMissing");
  const base = await origin();
  const inviteUrl = `${base}/inviter/${list.inviteToken}`;
  const mail = await sendInviteMail({
    to: email,
    inviteUrl,
    listTitle: list.title,
    fromName: user.displayName,
  });
  if (!mail.sent) {
    redirectToList(wishlistId, formData, mailConfigured() ? "inviteSendFailed" : "mailNotConfigured");
  }
  redirectToList(wishlistId, formData, undefined, "invite");
}

export async function removeMemberAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = removeMember(doc, { wishlistId, actorId, userId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function leaveAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = leaveWishlist(doc, { wishlistId, actorId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirect("/");
}

export async function deleteListAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await updateDocument((doc) => {
    const saved = deleteWishlist(doc, { wishlistId, actorId });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirect("/");
}

export async function updateWishlistSettingsAction(formData: FormData) {
  const actorId = await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const title = String(formData.get("title") ?? "");
  const subtitle = String(formData.get("subtitle") ?? "");
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "");
  const theme = {
    primary: String(formData.get("primary") ?? ""),
    accent: String(formData.get("accent") ?? ""),
    highlight: String(formData.get("highlight") ?? ""),
    background: String(formData.get("background") ?? ""),
  };
  const result = await updateDocument((doc) => {
    const saved = updateWishlistSettings(doc, {
      wishlistId,
      actorId,
      title,
      subtitle,
      coverImageUrl,
      theme,
    });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirectToList(wishlistId, formData, result.error);
  redirectToList(wishlistId, formData);
}

export async function reserveAction(formData: FormData) {
  const readToken = String(formData.get("readToken") ?? "");
  const typeId = String(formData.get("typeId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const fromName = String(formData.get("fromName") ?? "");
  const note = String(formData.get("note") ?? "");
  // Honeypot anti-bot (doit rester vide).
  if (String(formData.get("website") ?? "").trim()) {
    redirect(`/l/${readToken}?ok=1`);
  }
  try {
    await rateLimitOrThrow(`reserve:${readToken.slice(0, 12)}`, 15, 60 * 60 * 1000);
  } catch (error) {
    if (isRateLimitError(error)) {
      const params = new URLSearchParams({ e: "rateLimited" });
      if (typeId) params.set("typeId", typeId);
      if (itemId) params.set("itemId", itemId);
      redirect(`/l/${readToken}/reserver?${params}`);
    }
    throw error;
  }
  const user = await currentUser();
  const doc = await readDocument();
  const wishlist = doc.wishlists.find((w) => w.readToken === readToken);
  if (!wishlist) redirect("/");
  const result = await updateDocument((current) => {
    const saved = reserveItem(current, {
      wishlistId: wishlist.id,
      itemId,
      typeId,
      fromName,
      note,
      userId: user?.id ?? null,
    });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
  if (!result.ok) {
    const params = new URLSearchParams({ e: result.error });
    if (typeId) params.set("typeId", typeId);
    if (itemId) params.set("itemId", itemId);
    redirect(`/l/${readToken}/reserver?${params}`);
  }
  redirect(`/l/${readToken}?ok=1`);
}

export async function joinInviteAction(token: string) {
  const user = await currentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/inviter/${token}`)}`);
  if (user.mustChangePassword) redirect("/compte");
  const result = await updateDocument((doc) => {
    const saved = acceptInvite(doc, { token, userId: user.id });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) redirect(`/inviter/${token}?e=${encodeURIComponent(result.error)}`);
  redirect(`/listes/${result.wishlistId}`);
}

export async function setLocaleAction(locale: Locale) {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(localeCookie, locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
