"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect as navigationRedirect } from "next/navigation";
import { cookieSecure, currentUser } from "../auth/current";
import {
  grantReservationClaim,
  listClaimedReservationIds,
  revokeReservationClaim,
} from "../auth/reservation-claim";
import { grantReadUnlock, hasReadUnlock } from "../auth/read-unlock";
import { SESSION_COOKIE, SESSION_TTL_SEC, sessionSecret, signSession } from "../auth/session";
import {
  CHANGE_PASSWORD_KEPT_FIELDS,
  DISPLAY_NAME_KEPT_FIELDS,
  EMAIL_CHANGE_KEPT_FIELDS,
  FORGOT_PASSWORD_KEPT_FIELDS,
  INVITE_EMAIL_KEPT_FIELDS,
  LIST_SETTINGS_KEPT_FIELDS,
  LOGIN_KEPT_FIELDS,
  NEW_LIST_KEPT_FIELDS,
  READ_PASSWORD_KEPT_FIELDS,
  READ_UNLOCK_KEPT_FIELDS,
  refusal,
  REGISTER_KEPT_FIELDS,
  RESERVATION_KEPT_FIELDS,
  RESET_PASSWORD_KEPT_FIELDS,
  type FormState,
} from "./form-state";
import { mailConfigured } from "./mail";
import { isRateLimitError } from "./rate-limit";
import { actionContext } from "./action-context";
import { deleteOwnAccount } from "./commands/account";
import { createMyApiKey, revokeMyApiKey } from "./commands/api-keys";
import {
  changeOwnPassword,
  checkCredentials,
  register,
  requestPasswordReset,
  resetPasswordWithLink,
  updateOwnDisplayName,
} from "./commands/auth";
import {
  cancelOwnEmailChange,
  confirmEmailWithToken,
  requestOwnEmailChange,
  resendEmailVerification,
} from "./commands/email";
import { manageLabel, reorderTypes, type LabelInput } from "./commands/labels";
import { createList, updateSettings } from "./commands/lists";
import {
  clearReadPassword,
  deleteList,
  joinInvite,
  leave,
  regenerateInvite,
  removeMember,
  sendInvite,
  setReadPassword,
} from "./commands/sharing";
import {
  cancelReservationAsMember,
  copyItem,
  deleteItem,
  enrichFromUrl,
  moveItem,
  saveItem,
  setItemArchived,
  setItemType,
  type TransferFields,
} from "./commands/items";
import {
  cancelOwn,
  reserve,
  subscribeToList,
  unlockPublicList,
  unsubscribeFromList,
} from "./commands/public-list";
import type { LlmImpact } from "../domain/llm-impact";
import { isLocale, localeCookie, type Locale } from "../i18n/config";
import { internalPath, withLocale } from "../i18n/locale-path";
import { getLocale } from "../i18n/server";


const ADMIN_ONGLETS = new Set(["idees", "archives", "reservations", "partage", "reglages"]);

async function localeRedirect(path: string): Promise<never> {
  const locale = await getLocale();
  navigationRedirect(withLocale(locale, path));
}

async function redirectToList(
  wishlistId: string,
  formData: FormData,
  error?: string,
  ok?: string,
): Promise<never> {
  const raw = String(formData.get("onglet") ?? "");
  const mapped = raw === "categories" ? "reglages" : raw;
  const onglet = ADMIN_ONGLETS.has(mapped) ? mapped : "idees";
  const params = new URLSearchParams();
  if (onglet !== "idees") params.set("onglet", onglet);
  if (error) params.set("e", error);
  if (ok) params.set("ok", ok);
  const query = params.toString();
  return localeRedirect(query ? `/listes/${wishlistId}?${query}` : `/listes/${wishlistId}`);
}

function nextPath(value: FormDataEntryValue | null): string {
  return internalPath(value) ?? "/";
}

async function openSession(userId: string, sessionVersion = 0) {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET missing");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(userId, secret, Date.now(), sessionVersion), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function registerAction(prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const dest = nextPath(formData.get("next"));
  const refused = (error: string) => refusal(prev, error, formData, REGISTER_KEPT_FIELDS);
  let result: Awaited<ReturnType<typeof register>>;
  try {
    result = await register(await actionContext(), { email, password, displayName, next: dest });
  } catch (error) {
    if (isRateLimitError(error)) return refused("rate");
    throw error;
  }
  if (!result.ok) return refused(result.error === "passwordTooShort" ? "password" : "fields");
  // Email already registered: same screen, no sign-in (an email was sent).
  if (result.user) await openSession(result.user.id, result.user.sessionVersion ?? 0);
  // Never a plain link in production (the command does not return it).
  const link = result.verificationUrl ? `&lien=${encodeURIComponent(result.verificationUrl)}` : "";
  const failed = result.mailFailed ? "&envoi=echec" : "";
  return localeRedirect(`/inscription?ok=1&next=${encodeURIComponent(dest)}${link}${failed}`);
}

export async function loginAction(prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const dest = nextPath(formData.get("next"));
  let checked: Awaited<ReturnType<typeof checkCredentials>>;
  try {
    checked = await checkCredentials(await actionContext(), { email, password });
  } catch (error) {
    if (isRateLimitError(error)) return refusal(prev, "rate", formData, LOGIN_KEPT_FIELDS);
    throw error;
  }
  if (!checked.ok) return refusal(prev, "1", formData, LOGIN_KEPT_FIELDS);
  const user = checked.user;
  await openSession(user.id, user.sessionVersion ?? 0);
  if (user.mustChangePassword) return localeRedirect("/compte");
  return localeRedirect(dest);
}

export async function updateDisplayNameAction(prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return localeRedirect("/connexion");
  if (user.mustChangePassword) return localeRedirect("/compte");
  const displayName = String(formData.get("displayName") ?? "");
  const result = await updateOwnDisplayName(await actionContext(), { displayName });
  if (!result.ok) return refusal(prev, result.error, formData, DISPLAY_NAME_KEPT_FIELDS);
  return localeRedirect("/compte?ok=name");
}

/** Account page: new API key; the token is returned once, to be copied. */
export async function createApiKeyAction(input: {
  name: string;
}): Promise<{ ok: true; token: string; keyId: string } | { ok: false; error: string }> {
  await memberId();
  // A server action can also be called by hand: the input is not necessarily the form's.
  const name = typeof input?.name === "string" ? input.name : "";
  try {
    const result = await createMyApiKey(await actionContext(), { name });
    if (!result.ok) return { ok: false, error: result.error };
    // The page comes back with the action's response: the key list is up to date without a second request.
    refresh();
    return { ok: true, token: result.token, keyId: result.key.id };
  } catch (error) {
    if (isRateLimitError(error)) return { ok: false, error: "rateLimited" };
    throw error;
  }
}

/** Revoke a key (confirmation dialog of the Account page). */
export async function revokeApiKeyFormAction(formData: FormData) {
  await memberId();
  const result = await revokeMyApiKey(await actionContext(), { keyId: String(formData.get("keyId") ?? "") });
  return localeRedirect(result.ok ? "/compte?k=revoked#cles" : `/compte?k=${result.error}#cles`);
}

export async function changePasswordAction(prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return localeRedirect("/connexion");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const refused = (error: string) => refusal(prev, error, formData, CHANGE_PASSWORD_KEPT_FIELDS);
  if (!password || password !== confirm) return refused("mismatch");
  let result: Awaited<ReturnType<typeof changeOwnPassword>>;
  try {
    result = await changeOwnPassword(await actionContext(), { password, currentPassword });
  } catch (error) {
    if (isRateLimitError(error)) return refused("rateLimited");
    throw error;
  }
  if (!result.ok) {
    const code =
      result.error === "wrongCurrentPassword" || result.error.includes("actuel")
        ? "current"
        : result.error === "passwordTooShort"
          ? "password"
          : "1";
    return refused(code);
  }
  await openSession(user.id, result.user.sessionVersion ?? 0);
  return localeRedirect(user.mustChangePassword ? "/" : "/compte?ok=1");
}

export async function deleteAccountAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  let result: Awaited<ReturnType<typeof deleteOwnAccount>>;
  try {
    result = await deleteOwnAccount(await actionContext(), { password });
  } catch (error) {
    if (isRateLimitError(error)) return localeRedirect("/compte?d=rateLimited#supprimer");
    throw error;
  }
  if (!result.ok) {
    if (result.error === "unauthorized") return localeRedirect("/connexion");
    return localeRedirect(`/compte?d=${result.error}#supprimer`);
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return localeRedirect("/connexion?deleted=1");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return localeRedirect("/");
}

export async function requestPasswordResetAction(prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  let result: Awaited<ReturnType<typeof requestPasswordReset>>;
  try {
    result = await requestPasswordReset(await actionContext(), { email });
  } catch (error) {
    if (isRateLimitError(error)) return refusal(prev, "rate", formData, FORGOT_PASSWORD_KEPT_FIELDS);
    throw error;
  }
  // Never a plain link in production (the command does not return it).
  if (result.ok && result.resetUrl) {
    return localeRedirect(`/mot-de-passe-oublie?ok=1&lien=${encodeURIComponent(result.resetUrl)}`);
  }
  return localeRedirect(`/mot-de-passe-oublie?ok=1${mailConfigured() ? "" : "&sansmail=1"}`);
}

export async function resetPasswordAction(prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  let result: Awaited<ReturnType<typeof resetPasswordWithLink>>;
  try {
    result = await resetPasswordWithLink(await actionContext(), { token, password, signIn: false });
  } catch (error) {
    if (isRateLimitError(error)) return refusal(prev, "rate", formData, RESET_PASSWORD_KEPT_FIELDS);
    throw error;
  }
  if (!result.ok) {
    const code = result.error === "passwordTooShort" ? "password" : "1";
    return refusal(prev, code, formData, RESET_PASSWORD_KEPT_FIELDS);
  }
  await openSession(result.userId, result.sessionVersion);
  return localeRedirect("/");
}

/** « Renvoyer le lien » from the banner or the link page: back to the original page with the result. */
export async function resendEmailVerificationAction(formData: FormData) {
  const back = nextPath(formData.get("back"));
  const join = back.includes("?") ? "&" : "?";
  let result: Awaited<ReturnType<typeof resendEmailVerification>>;
  try {
    result = await resendEmailVerification(await actionContext());
  } catch (error) {
    if (isRateLimitError(error)) return localeRedirect(`${back}${join}verify=rate`);
    throw error;
  }
  if (!result.ok) {
    if (result.error === "unauthorized") return localeRedirect("/connexion");
    if (result.error === "mustChangePassword") return localeRedirect("/compte");
    return localeRedirect(`${back}${join}verify=already`);
  }
  // Never a plain link in production (the command does not return it).
  if (result.verificationUrl) {
    return localeRedirect(`${back}${join}verify=sent&lien=${encodeURIComponent(result.verificationUrl)}`);
  }
  return localeRedirect(`${back}${join}verify=${result.sent ? "sent" : "failed"}`);
}

/** « Adresse de connexion » card of « Mon compte » (010, US3). */
export async function requestEmailChangeAction(prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return localeRedirect("/connexion");
  if (user.mustChangePassword) return localeRedirect("/compte");
  let result: Awaited<ReturnType<typeof requestOwnEmailChange>>;
  try {
    result = await requestOwnEmailChange(await actionContext(), {
      email: String(formData.get("email") ?? ""),
      currentPassword: String(formData.get("currentPassword") ?? ""),
    });
  } catch (error) {
    if (isRateLimitError(error)) return refusal(prev, "rateLimited", formData, EMAIL_CHANGE_KEPT_FIELDS);
    throw error;
  }
  if (!result.ok) return refusal(prev, result.error, formData, EMAIL_CHANGE_KEPT_FIELDS);
  if (!result.me.pendingEmail) return localeRedirect("/compte?email=changed#email");
  // Never a plain link in production (the command does not return it).
  const link = result.confirmUrl ? `&lien=${encodeURIComponent(result.confirmUrl)}` : "";
  return localeRedirect(`/compte?email=${result.sent || result.confirmUrl ? "pending" : "failed"}${link}#email`);
}

export async function cancelEmailChangeAction() {
  const result = await cancelOwnEmailChange(await actionContext());
  if (!result.ok) {
    if (result.error === "unauthorized") return localeRedirect("/connexion");
    return localeRedirect(`/compte?ee=${encodeURIComponent(result.error)}#email`);
  }
  return localeRedirect("/compte?email=cancelled#email");
}

/** « Confirmer » button of the page of the link received by email. */
export async function confirmEmailAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const suite = nextPath(formData.get("suite"));
  const page = `/confirmer-email/${encodeURIComponent(token)}`;
  let result: Awaited<ReturnType<typeof confirmEmailWithToken>>;
  try {
    result = await confirmEmailWithToken(await actionContext(), { token, suite });
  } catch (error) {
    if (isRateLimitError(error)) return localeRedirect(`${page}?e=rate`);
    throw error;
  }
  if (!result.ok) return localeRedirect(`${page}?e=${encodeURIComponent(result.error)}`);
  const query = new URLSearchParams({ ok: result.purpose });
  if (result.suite && result.suite !== "/") query.set("suite", result.suite);
  // The confirmed account is the session's: the page can show its new address.
  if (result.ownAccount) query.set("compte", "1");
  return localeRedirect(`${page}?${query.toString()}`);
}

export async function createListAction(prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return localeRedirect("/connexion");
  if (user.mustChangePassword) return localeRedirect("/compte");
  const result = await createList(await actionContext(), {
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    person: String(formData.get("person") ?? ""),
  });
  if (!result.ok) return refusal(prev, result.error, formData, NEW_LIST_KEPT_FIELDS);
  return localeRedirect(`/listes/${result.list.id}`);
}

async function memberId(): Promise<string> {
  const user = await currentUser();
  if (!user) return localeRedirect("/connexion");
  if (user.mustChangePassword) return localeRedirect("/compte");
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
  secondHandOk: boolean;
  description: string;
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
    secondHandOk: formData.get("secondHandOk") === "on",
    description: String(formData.get("description") ?? ""),
  };
}

export async function saveItemAction(
  _prev: SaveItemState,
  formData: FormData,
): Promise<SaveItemState> {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const draft = itemDraftFromForm(formData);
  let result: Awaited<ReturnType<typeof saveItem>>;
  try {
    result = await saveItem(await actionContext(), { ...draft, wishlistId, itemId: itemId || undefined });
  } catch (error) {
    if (isRateLimitError(error)) return { error: "rateLimited", draft };
    throw error;
  }
  if (!result.ok) return { error: result.error, draft };
  return redirectToList(wishlistId, formData);
}

export async function enrichFromUrlAction(input: {
  url: string;
  wishlistId: string;
}): Promise<
  | {
      ok: true;
      name: string;
      price: string;
      imageUrl: string;
      typeId: string;
      description: string;
      usedLlm: boolean;
      impact: LlmImpact | null;
    }
  | { ok: false; error: string }
> {
  await memberId();
  try {
    return await enrichFromUrl(await actionContext(), input);
  } catch (error) {
    if (isRateLimitError(error)) return { ok: false, error: "rateLimited" };
    throw error;
  }
}

export async function reorderTypesAction(input: {
  wishlistId: string;
  orderedTypeIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await memberId();
  return reorderTypes(await actionContext(), input);
}

export async function deleteItemAction(formData: FormData) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const result = await deleteItem(await actionContext(), { wishlistId, itemId });
  if (!result.ok) return redirectToList(wishlistId, formData, result.error);
  return redirectToList(wishlistId, formData);
}

export async function setItemTypeAction(input: {
  wishlistId: string;
  itemId: string;
  typeId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await memberId();
  const result = await setItemType(await actionContext(), input);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function setItemArchivedAction(input: {
  wishlistId: string;
  itemId: string;
  archived: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await memberId();
  const result = await setItemArchived(await actionContext(), input);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

/** Move or copy an idea from the « Modifier l'idée » dialog. */
export async function transferItemAction(
  input: TransferFields & { mode: "move" | "copy" },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await memberId();
  const { mode, ...fields } = input;
  const result = mode === "move" ? await moveItem(await actionContext(), fields) : await copyItem(await actionContext(), fields);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function setItemArchivedFormAction(formData: FormData) {
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  const result = await setItemArchivedAction({ wishlistId, itemId, archived });
  if (!result.ok) return redirectToList(wishlistId, formData, result.error);
  return redirectToList(wishlistId, formData);
}

/** Settings forms: a category or a « qui » added, renamed or removed. */
async function labelFormAction(
  formData: FormData,
  kind: LabelInput["kind"],
  op: LabelInput["op"],
  idField: "typeId" | "personId",
) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await manageLabel(await actionContext(), {
    kind,
    op,
    wishlistId,
    id: String(formData.get(idField) ?? ""),
    label: String(formData.get("label") ?? ""),
  });
  if (!result.ok) return redirectToList(wishlistId, formData, result.error);
  return redirectToList(wishlistId, formData);
}

export async function addTypeAction(formData: FormData) {
  return labelFormAction(formData, "type", "add", "typeId");
}

export async function renameTypeAction(formData: FormData) {
  return labelFormAction(formData, "type", "rename", "typeId");
}

export async function deleteTypeAction(formData: FormData) {
  return labelFormAction(formData, "type", "delete", "typeId");
}

export async function manageLabelAction(input: LabelInput): Promise<{ ok: true } | { ok: false; error: string }> {
  await memberId();
  const result = await manageLabel(await actionContext(), input);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function addPersonAction(formData: FormData) {
  return labelFormAction(formData, "person", "add", "personId");
}

export async function renamePersonAction(formData: FormData) {
  return labelFormAction(formData, "person", "rename", "personId");
}

export async function deletePersonAction(formData: FormData) {
  return labelFormAction(formData, "person", "delete", "personId");
}

export async function cancelReservationAction(formData: FormData) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "");
  const result = await cancelReservationAsMember(await actionContext(), { wishlistId, reservationId });
  if (!result.ok) return redirectToList(wishlistId, formData, result.error);
  return redirectToList(wishlistId, formData);
}

/** Common response of the sharing forms: error on the list, or reported success. */
async function sharingResult(
  wishlistId: string,
  formData: FormData,
  result: { ok: true } | { ok: false; error: string },
  ok?: string,
) {
  if (!result.ok) return redirectToList(wishlistId, formData, result.error);
  return redirectToList(wishlistId, formData, undefined, ok);
}

export async function regenerateInviteAction(formData: FormData) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  return sharingResult(wishlistId, formData, await regenerateInvite(await actionContext(), { wishlistId }));
}

export async function setReadPasswordAction(prev: FormState, formData: FormData): Promise<FormState> {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await setReadPassword(await actionContext(), { wishlistId, password });
  if (!result.ok) return refusal(prev, result.error, formData, READ_PASSWORD_KEPT_FIELDS);
  return redirectToList(wishlistId, formData, undefined, "readPassword");
}

export async function clearReadPasswordAction(formData: FormData) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await clearReadPassword(await actionContext(), { wishlistId });
  return sharingResult(wishlistId, formData, result, "readPasswordCleared");
}

export async function unlockPublicListAction(prev: FormState, formData: FormData): Promise<FormState> {
  const readToken = String(formData.get("readToken") ?? "");
  const password = String(formData.get("password") ?? "");
  const wantSubscribe = String(formData.get("subscribe") ?? "") === "1";
  let result: Awaited<ReturnType<typeof unlockPublicList>>;
  try {
    result = await unlockPublicList(await actionContext(), { readToken, password });
  } catch (error) {
    if (isRateLimitError(error)) return refusal(prev, "rateLimited", formData, READ_UNLOCK_KEPT_FIELDS);
    throw error;
  }
  if (!result.ok) {
    if (result.error === "listMissing") return localeRedirect("/");
    return refusal(prev, "badPassword", formData, READ_UNLOCK_KEPT_FIELDS);
  }
  await grantReadUnlock(result.wishlist);
  if (wantSubscribe) {
    const user = await currentUser();
    if (user && !user.mustChangePassword) {
      let subscribed: Awaited<ReturnType<typeof subscribeToList>>;
      try {
        subscribed = await subscribeToList(await actionContext(), {
          urlOrToken: readToken,
          isUnlocked: () => true,
        });
      } catch (error) {
        // The list is unlocked: only the subscription failed, it is shown without going back through the form.
        if (isRateLimitError(error)) return localeRedirect(`/l/${readToken}?e=rateLimited`);
        throw error;
      }
      if (subscribed.ok) return localeRedirect(`/l/${readToken}?followed=1`);
    }
  }
  return localeRedirect(`/l/${readToken}`);
}

export async function sendInviteAction(prev: FormState, formData: FormData): Promise<FormState> {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const email = String(formData.get("email") ?? "");
  let result: Awaited<ReturnType<typeof sendInvite>>;
  try {
    result = await sendInvite(await actionContext(), { wishlistId, email });
  } catch (error) {
    if (isRateLimitError(error)) return refusal(prev, "rateLimited", formData, INVITE_EMAIL_KEPT_FIELDS);
    throw error;
  }
  if (!result.ok) return refusal(prev, result.error, formData, INVITE_EMAIL_KEPT_FIELDS);
  return redirectToList(wishlistId, formData, undefined, "invite");
}

export async function removeMemberAction(formData: FormData) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  return sharingResult(wishlistId, formData, await removeMember(await actionContext(), { wishlistId, userId }));
}

export async function leaveAction(formData: FormData) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await leave(await actionContext(), { wishlistId });
  if (!result.ok) return redirectToList(wishlistId, formData, result.error);
  return localeRedirect("/");
}

export async function deleteListAction(formData: FormData) {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await deleteList(await actionContext(), { wishlistId });
  if (!result.ok) return redirectToList(wishlistId, formData, result.error);
  return localeRedirect("/");
}

export async function updateWishlistSettingsAction(prev: FormState, formData: FormData): Promise<FormState> {
  await memberId();
  const wishlistId = String(formData.get("wishlistId") ?? "");
  const result = await updateSettings(await actionContext(), {
    wishlistId,
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
    theme: {
      primary: String(formData.get("primary") ?? ""),
      accent: String(formData.get("accent") ?? ""),
      highlight: String(formData.get("highlight") ?? ""),
      background: String(formData.get("background") ?? ""),
    },
  });
  if (!result.ok) return refusal(prev, result.error, formData, LIST_SETTINGS_KEPT_FIELDS);
  return redirectToList(wishlistId, formData);
}

export async function reserveAction(prev: FormState, formData: FormData): Promise<FormState> {
  const readToken = String(formData.get("readToken") ?? "");
  const typeId = String(formData.get("typeId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const fromName = String(formData.get("fromName") ?? "");
  const note = String(formData.get("note") ?? "");
  // Anti-bot honeypot (must stay empty).
  if (String(formData.get("website") ?? "").trim()) {
    return localeRedirect(`/l/${readToken}?ok=1`);
  }
  // The page is refreshed with the refusal: an idea taken in the meantime leaves the choices.
  const backToForm = (error: string) => {
    refresh();
    return refusal(prev, error, formData, RESERVATION_KEPT_FIELDS);
  };
  let result: Awaited<ReturnType<typeof reserve>>;
  try {
    result = await reserve(await actionContext(), {
      readToken,
      itemId,
      typeId,
      fromName,
      note,
      isUnlocked: hasReadUnlock,
    });
  } catch (error) {
    if (isRateLimitError(error)) return backToForm("rateLimited");
    throw error;
  }
  if (!result.ok) {
    if (result.error === "listMissing") return localeRedirect("/");
    if (result.error === "readPasswordRequired") return localeRedirect(`/l/${readToken}`);
    return backToForm(result.error);
  }
  await grantReservationClaim(readToken, result.reservation.id);
  return localeRedirect(`/l/${readToken}?ok=1`);
}

export async function cancelMyReservationAction(formData: FormData) {
  const readToken = String(formData.get("readToken") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "");
  const claimedIds = await listClaimedReservationIds(readToken);
  const result = await cancelOwn(await actionContext(), { readToken, reservationId, claimedIds });
  if (!result.ok) {
    if (result.error === "listMissing") return localeRedirect("/");
    return localeRedirect(`/l/${readToken}?e=${result.error}`);
  }
  await revokeReservationClaim(readToken, reservationId);
  return localeRedirect(`/l/${readToken}`);
}

export async function joinInviteAction(token: string) {
  const user = await currentUser();
  if (!user) return localeRedirect(`/connexion?next=${encodeURIComponent(`/inviter/${token}`)}`);
  if (user.mustChangePassword) return localeRedirect("/compte");
  const result = await joinInvite(await actionContext(), { token });
  if (!result.ok) return localeRedirect(`/inviter/${token}?e=${encodeURIComponent(result.error)}`);
  return localeRedirect(`/listes/${result.list.id}`);
}

export async function subscribeAction(formData: FormData) {
  const readToken = String(formData.get("readToken") ?? "").trim();
  const user = await currentUser();
  if (!user) return localeRedirect(`/connexion?next=${encodeURIComponent(`/l/${readToken}`)}`);
  await memberId();
  let result: Awaited<ReturnType<typeof subscribeToList>>;
  try {
    result = await subscribeToList(await actionContext(), {
      urlOrToken: readToken,
      isUnlocked: hasReadUnlock,
    });
  } catch (error) {
    if (isRateLimitError(error)) return localeRedirect(`/l/${readToken}?e=rateLimited`);
    throw error;
  }
  if (!result.ok) {
    if (result.error === "listMissing") return localeRedirect("/");
    // Unlock expired or password changed: the form keeps the intent to follow the list.
    if (result.error === "readPasswordRequired") {
      return localeRedirect(`/l/${readToken}?e=readPasswordRequired&subscribe=1`);
    }
    return localeRedirect(`/l/${readToken}?e=${encodeURIComponent(result.error)}`);
  }
  return localeRedirect(`/l/${readToken}?followed=1`);
}

export async function subscribeByLinkAction(formData: FormData) {
  const urlOrToken = String(formData.get("urlOrToken") ?? "").trim();
  await memberId();
  let result: Awaited<ReturnType<typeof subscribeToList>>;
  try {
    result = await subscribeToList(await actionContext(), {
      urlOrToken,
      isUnlocked: hasReadUnlock,
    });
  } catch (error) {
    if (isRateLimitError(error)) return localeRedirect("/?fe=rateLimited#suivies");
    throw error;
  }
  if (!result.ok) {
    if ("readToken" in result) {
      return localeRedirect(`/l/${result.readToken}?subscribe=1`);
    }
    return localeRedirect(`/?fe=${encodeURIComponent(result.error)}#suivies`);
  }
  return localeRedirect("/#suivies");
}

export async function unsubscribeAction(formData: FormData) {
  const readToken = String(formData.get("readToken") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  await memberId();
  await unsubscribeFromList(await actionContext(), { readToken });
  if (returnTo === "list") return localeRedirect(`/l/${readToken}`);
  return localeRedirect("/#suivies");
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
