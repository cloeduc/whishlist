import { findMembership } from "../../domain/access";
import { createWishlist } from "../../domain/import";
import { addPerson, addType } from "../../domain/items";
import { updateWishlistSettings } from "../../domain/membership";
import type { WishlistTheme } from "../../domain/types";
import { readDocument, updateDocument } from "../../store/db";
import { toListSummary, toMemberListView, type ListSummaryView, type MemberListView } from "../api/views";
import { activeUser, type CommandContext, type CommandResult } from "./context";

export async function listMine(ctx: CommandContext): Promise<CommandResult<{ lists: ListSummaryView[] }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const doc = await readDocument();
  const lists = doc.memberships
    .filter((membership) => membership.userId === active.user.id)
    .flatMap((membership) => {
      const wishlist = doc.wishlists.find((entry) => entry.id === membership.wishlistId);
      return wishlist ? [toListSummary(doc, wishlist, membership.role, ctx.locale, ctx.origin)] : [];
    });
  return { ok: true, lists };
}

export async function readMemberList(
  ctx: CommandContext,
  input: { wishlistId: string },
): Promise<CommandResult<{ list: MemberListView }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  return memberListView(ctx, input.wishlistId, active.user.id);
}

/** Vue membre relue après une écriture (création, réglages, invitation acceptée). */
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

/** Une liste naît avec sa première catégorie et son premier « qui ». */
export async function createList(
  ctx: CommandContext,
  input: { title: string; category: string; person: string },
): Promise<CommandResult<{ list: MemberListView }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const category = input.category.trim();
  const person = input.person.trim();
  if (!category) return { ok: false, error: "listNeedsCategory" };
  if (!person) return { ok: false, error: "listNeedsPerson" };
  const actorId = active.user.id;
  const created = await updateDocument<CommandResult<{ wishlistId: string }>>((doc) => {
    const list = createWishlist(doc, { ownerId: actorId, title: input.title, importTemplate: false });
    if (!list.ok) return { doc, result: list };
    const wishlistId = list.wishlist.id;
    const withType = addType(list.doc, { wishlistId, actorId, label: category });
    if (!withType.ok) return { doc, result: withType };
    const withPerson = addPerson(withType.doc, { wishlistId, actorId, label: person });
    if (!withPerson.ok) return { doc, result: withPerson };
    return { doc: withPerson.doc, result: { ok: true, wishlistId } };
  });
  if (!created.ok) return created;
  return memberListView(ctx, created.wishlistId, actorId);
}

/** Réglages de la liste ; un champ absent reste tel quel. */
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
