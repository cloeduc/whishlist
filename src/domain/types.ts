import type { WishlistTheme } from "./theme";

export type { WishlistTheme };

export type Role = "owner" | "member";
export type ViewKind = "all" | "types" | "person";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  /** If true, the session is redirected to the password change. */
  mustChangePassword: boolean;
  /** Incremented on each password change. Older tokens are refused. */
  sessionVersion?: number;
  /** Date the address was confirmed. null: address not verified. */
  emailVerifiedAt: string | null;
}

export interface Wishlist {
  id: string;
  title: string;
  /** Subtitle shown under the title on the public page. */
  subtitle: string | null;
  /** Illustration image (http(s) URL) — otherwise the SVG gift in the theme colors. */
  coverImageUrl: string | null;
  /** The list's own palette (default = gift favicon). */
  theme: WishlistTheme;
  readToken: string;
  inviteToken: string;
  /** If not null, the public page `/l/[readToken]` requires this password (scrypt hash). */
  readPasswordHash: string | null;
  fromTemplate: boolean;
  createdAt: string;
}

export interface Membership {
  wishlistId: string;
  userId: string;
  role: Role;
  joinedAt: string;
  /** « Ne pas voir les cadeaux réservés »: this member does not see reservations on this list. */
  surpriseMode: boolean;
}

export interface Subscription {
  wishlistId: string;
  userId: string;
  /** Hash of the read password when the subscription was created or unlocked. */
  readPasswordHash: string | null;
  createdAt: string;
  /** Name the subscriber gives the list, for them only (024). null: the list's title. */
  customTitle: string | null;
  /** Name the subscriber gives the person whose list it is (024). null: the owner's display name. */
  customOwnerName: string | null;
}

export interface WishType {
  id: string;
  wishlistId: string;
  label: string;
  /** Display order of categories (accordion). */
  sortOrder: number;
}

export interface Person {
  id: string;
  wishlistId: string;
  label: string;
}

export interface View {
  id: string;
  wishlistId: string;
  label: string;
  kind: ViewKind;
  typeIds: string[];
  personId: string | null;
  pinned: boolean;
}

export interface Item {
  id: string;
  wishlistId: string;
  name: string;
  typeId: string;
  url: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  priority: string | null;
  /** The idea is fine second-hand too (books, games…), shown to the giver. */
  secondHandOk: boolean;
  /** Context for the giver: what the product is, why it is wanted, what it will be used for. */
  description: string | null;
  personId: string;
  sortOrder: number;
  archived: boolean;
}

export interface Reservation {
  id: string;
  wishlistId: string;
  itemId: string;
  fromName: string | null;
  note: string | null;
  /** Set if the reservation was made while signed in. */
  userId: string | null;
  createdAt: string;
  /** Group gift this reservation is a participation in (028); null for a reservation on one's own. */
  groupGiftId: string | null;
  /** Amount the participant puts in, in cents (028); null when not given, always null on a reservation on one's own. */
  amountCents: number | null;
}

export type GroupGiftStatus = "open" | "complete";

/** « Cadeau commun » (028): an idea several people chip in for. Exists while it has at least one participation. */
export interface GroupGift {
  id: string;
  wishlistId: string;
  itemId: string;
  /** Token of the gift's own link (/g/<token>), which opens this gift only. */
  token: string;
  status: GroupGiftStatus;
  createdAt: string;
  /** Last time a participant marked it complete. */
  completedAt: string | null;
}

/** A message in the thread of a group gift, written by a participant with an account (028). */
export interface GroupGiftMessage {
  id: string;
  groupGiftId: string;
  /** null once the author's account is deleted. */
  userId: string | null;
  /** Name frozen when written; null → « Ancien participant ». */
  authorName: string | null;
  body: string;
  createdAt: string;
}

export interface PasswordReset {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Address confirmation link: `verify` for the current address, `change` for a new one.
 * At most one request per account and purpose; the token is only stored hashed.
 */
export interface EmailConfirmation {
  id: string;
  userId: string;
  purpose: "verify" | "change";
  /** Address to confirm, normalized. */
  email: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

/** Session of an API client (mobile app). The token is only stored hashed. */
export interface ApiSession {
  id: string;
  userId: string;
  tokenHash: string;
  /** `user.sessionVersion` when issued: a password change makes it expire. */
  sessionVersion: number;
  createdAt: string;
  expiresAt: string;
}

/**
 * API key created by the person (AI assistant, script). It acts for their account, except account
 * actions. Only its hash is kept; `hint` (last 4 characters) helps recognize it in the list.
 */
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  hint: string;
  createdAt: string;
  /** Updated at most once an hour, so as not to write on every request. */
  lastUsedAt: string | null;
}

export interface Database {
  users: User[];
  wishlists: Wishlist[];
  memberships: Membership[];
  subscriptions: Subscription[];
  types: WishType[];
  people: Person[];
  views: View[];
  items: Item[];
  groupGifts: GroupGift[];
  reservations: Reservation[];
  groupGiftMessages: GroupGiftMessage[];
  passwordResets: PasswordReset[];
  apiSessions: ApiSession[];
  emailConfirmations: EmailConfirmation[];
  apiKeys: ApiKey[];
}

export interface SeedFile {
  types: { id: string; label: string }[];
  people: { id: string; label: string }[];
  views: {
    id: string;
    label: string;
    kind: ViewKind;
    typeIds: string[];
    personId: string | null;
    pinned: boolean;
  }[];
  items: {
    id: string;
    name: string;
    typeId: string;
    url: string | null;
    imageUrl?: string | null;
    priceCents: number | null;
    priority: string | null;
    secondHandOk?: boolean;
    description?: string | null;
    personId: string;
    sortOrder: number;
    archived?: boolean;
  }[];
}

export function emptyDatabase(): Database {
  return {
    users: [],
    wishlists: [],
    memberships: [],
    subscriptions: [],
    types: [],
    people: [],
    views: [],
    items: [],
    groupGifts: [],
    reservations: [],
    groupGiftMessages: [],
    passwordResets: [],
    apiSessions: [],
    emailConfirmations: [],
    apiKeys: [],
  };
}
