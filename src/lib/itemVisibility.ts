/**
 * itemVisibility.ts — PORTED FROM THE APP. Keep the two byte-identical below.
 *
 * Source: ecoinventory-mobile/src/lib/itemVisibility.ts
 *
 * WHY THE WEBSITE NEEDED THIS, URGENTLY. The app routes every browse
 * surface through the rule below. The website had no equivalent and never
 * read `sharing_level` in browse at all: the community grid selected
 * eleven columns, none of them `sharing_level`, and filtered only on
 * `is_available_for_sharing = true` — a flag BOTH add flows set to true for
 * "Friends only" just as much as for "Public". So every friends-only item
 * in the database was listed on /community and /marketplace, to strangers,
 * and to signed-out visitors, under a heading that invited them to "browse
 * freely".
 *
 * There is no database backstop. The only cross-user SELECT policy on
 * inventory_items is `USING (is_available_for_sharing = true)`, so Postgres
 * will hand a friends-only row to an anonymous client that asks for it. The
 * app is safe because its client filters, not because the data is guarded.
 * This file makes the website filter the same way; the RLS policy that
 * would make it true at the database is written up in
 * docs/RLS-FIX-friends-only.sql and is NOT applied — a production policy
 * change is yours to run.
 *
 * Blocking has the same shape: `mutes` is enforced only on the client, and
 * the word "mutes" did not appear anywhere in this codebase. Somebody
 * blocked on the phone kept appearing on the web.
 *
 * Everything below this header is the app's file verbatim. If the app's
 * rule changes, copy it over again rather than editing this copy.
 */

export type VisibilityItem = {
  user_id: string;
  sharing_level?: string | null;
  image_urls?: string[] | null;
  is_for_sale?: boolean | null;
  is_for_borrow?: boolean | null;
  is_donated?: boolean | null;
};

export type VisibilityContext = {
  /** Mutual follows. A friends-only item needs the owner in here. */
  friendSet: Set<string>;
  /** Blocked / muted owners. Enforced HERE — the database does not. */
  muteSet: Set<string>;
  /**
   * Require at least one photo. True for browse surfaces (the
   * photo-to-be-visible product rule); false when the viewer has typed
   * a search and would rather see a photoless match than nothing.
   */
  requirePhoto?: boolean;
  /**
   * Require the item to actually be offered for something. Browse
   * surfaces set this; a surface that deliberately shows the "owned,
   * not listed" state does not.
   */
  requireOffered?: boolean;
};

export function isItemVisible(
  item: VisibilityItem,
  ctx: VisibilityContext
): boolean {
  if (ctx.muteSet.has(item.user_id)) return false;

  if (ctx.requirePhoto) {
    const photos = Array.isArray(item.image_urls) ? item.image_urls : [];
    if (photos.length === 0) return false;
  }

  if (ctx.requireOffered) {
    const offered =
      !!item.is_for_sale || !!item.is_for_borrow || !!item.is_donated;
    if (!offered) return false;
  }

  const lvl = item.sharing_level as string | null | undefined;
  if (lvl && lvl !== "public" && lvl !== "public_anon") {
    if (lvl === "friends") return ctx.friendSet.has(item.user_id);
    return false; // private, or a level we don't recognise
  }
  return true;
}
