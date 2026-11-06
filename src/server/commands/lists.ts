import "server-only";
import { findMembership } from "../../domain/access";
import { idTaken, isClientId } from "../../domain/client-ids";
import { createWishlist } from "../../domain/import";
import { listDefaults, memberListTitles, numberedTitle } from "../../domain/list-defaults";
import { addPerson, addType, splitLabels } from "../../domain/items";
import { updateWishlistSettings } from "../../domain/membership";
import { followedListsOf } from "../../domain/subscription";
import type { WishlistTheme } from "../../domain/types";
import { readDocument, updateDocument } from "../../store/db";
import { getTranslationsFor } from "../../i18n/server";
import {
  toListSummary,
  toMemberListView,
  toSubscribedListSummary,
  type ListSummaryView,
  type MemberListView,
  type SubscribedListSummaryView,
} from "../api/views";
import { activeUser, verifiedUser, type CommandContext, type CommandResult } from "./context";

export async function listMine(
  ctx: CommandContext,
): Promise<CommandResult<{ lists: ListSummaryView[]; subscriptions: SubscribedListSummaryView[] }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const doc = await readDocument();
  const lists = doc.memberships
    .filter((membership) => membership.userId === active.user.id)
    .flatMap((membership) => {
      const wishlist = doc.wishlists.find((entry) => entry.id === membership.wishlistId);
      return wishlist ? [toListSummary(doc, wishlist, membership.role, ctx.locale, ctx.origin)] : [];
    });
  const subscriptions = followedListsOf(doc, active.user.id).map(({ wishlist, subscription }) =>
    toSubscribedListSummary(doc, wishlist, subscription, ctx.locale, ctx.origin),
  );
  return { ok: true, lists, subscriptions };
}

export async function readMemberList(
  ctx: CommandContext,
  input: { wishlistId: string },
): Promise<CommandResult<{ list: MemberListView }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  return memberListView(ctx, input.wishlistId, active.user.id);
}

/** Member view read again after a write (creation, settings, accepted invitation). */
export async function memberListView(
  ctx: CommandContext,
  wishlistId: string,
  userId: string,
): Promise<CommandResult<{ list: MemberListView }>> {
  const doc = await readDocument();
  const membership = findMembership(doc, wishlistId, userId);
  const wishlist = doc.wishlists.find((entry) => entry.id === wishlistId);
  if (!membership || !wishlist) return { ok: false, error: "notMember" };
  return { ok: true, list: toMemberListView(doc, wishlist, membership.role, ctx.locale, ctx.origin) };
}

/**
 * A list is born with its first category and its first « qui »; an empty field takes its default value.
 * The client can choose their identifiers: a resend of the same `id` by a member
 * returns the existing list (`replayed`) instead of creating a second one.
 */
export async function createList(
  ctx: CommandContext,
  input: { title: string; category: string; person: string; id?: string; categoryId?: string; personId?: string },
): Promise<CommandResult<{ list: MemberListView; replayed: boolean }>> {
  const active = verifiedUser(ctx);
  if (!active.ok) return active;
  const ids = [input.id, input.categoryId, input.personId].filter((id) => id !== undefined);
  if (!ids.every(isClientId)) return { ok: false, error: "idInvalid" };
  const actorId = active.user.id;
  // Non-blocking fields: left empty, they take default values, in the language of the
  // request (URL language on the site, `Accept-Language` for the API).
  // A comma-separated entry creates several; the account name, the default value, is never split.
  const defaults = listDefaults(active.user.displayName, await getTranslationsFor(ctx.locale, "home"));
  const typed = { categories: splitLabels(input.category), persons: splitLabels(input.person) };
  const categories = typed.categories.length > 0 ? typed.categories : [defaults.category];
  const persons = typed.persons.length > 0 ? typed.persons : [defaults.person];
  // Resend detected in the same write as the creation: two simultaneous sends make only one list.
  const created = await updateDocument<CommandResult<{ wishlistId: string; replayed: boolean }>>((doc) => {
    const { id } = input;
    if (id && doc.wishlists.some((list) => list.id === id)) {
      const replayed = findMembership(doc, id, actorId) !== null;
      return { doc, result: replayed ? { ok: true, wishlistId: id, replayed } : { ok: false, error: "idConflict" } };
    }
    if (ids.some((taken) => idTaken(doc, taken))) return { doc, result: { ok: false, error: "idConflict" } };
    const title =
      input.title.trim() ||
      numberedTitle(defaults.titleBase, memberListTitles(doc.memberships, doc.wishlists, actorId));
    const list = createWishlist(doc, { ownerId: actorId, title, importTemplate: false, id });
    if (!list.ok) return { doc, result: list };
    const wishlistId = list.wishlist.id;
    // « Wilh, Nathan » creates two « qui », as in the settings. The identifier chosen by the
    // client only applies to the first: it sent only one.
    let current = list.doc;
    for (const [index, label] of categories.entries()) {
      const saved = addType(current, { wishlistId, actorId, label, id: index === 0 ? input.categoryId : undefined });
      if (!saved.ok) return { doc, result: saved };
      current = saved.doc;
    }
    for (const [index, label] of persons.entries()) {
      const saved = addPerson(current, { wishlistId, actorId, label, id: index === 0 ? input.personId : undefined });
      if (!saved.ok) return { doc, result: saved };
      current = saved.doc;
    }
    return { doc: current, result: { ok: true, wishlistId, replayed: false } };
  });
  if (!created.ok) return created;
  const view = await memberListView(ctx, created.wishlistId, actorId);
  return view.ok ? { ...view, replayed: created.replayed } : view;
}

/** List settings; a missing field stays as is. */
export async function updateSettings(
  ctx: CommandContext,
  input: {
    wishlistId: string;
    title?: string;
    subtitle?: string | null;
    coverImageUrl?: string | null;
    theme?: Partial<WishlistTheme> | null;
  },
): Promise<CommandResult<{ list: MemberListView }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const saved = await updateDocument<CommandResult>((doc) => {
    const result = updateWishlistSettings(doc, { ...input, actorId: active.user.id });
    return result.ok ? { doc: result.doc, result: { ok: true } } : { doc, result };
  });
  if (!saved.ok) return saved;
  return memberListView(ctx, input.wishlistId, active.user.id);
}
