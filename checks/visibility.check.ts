/**
 * Checks for the visibility rule — the one piece of logic on this site
 * where being wrong means either showing someone's private things or
 * showing a signed-in visitor nothing at all.
 *
 * WHY THIS FILE EXISTS. I shipped a version of useVisibilityContext that
 * treated any failed query as "not ready", and callers render nothing
 * until ready. The `mutes` table does not exist on the website's Supabase
 * project, so every signed-IN visitor would have seen an empty browse
 * grid, an empty people directory and empty profiles — while typecheck
 * passed, the build passed, and every logged-OUT page rendered perfectly.
 * There was no check that could have caught it, so now there is one.
 *
 * Run it:
 *     npm run check
 *
 * There is no test runner in this project and this file does not add one.
 * It is a plain script that exits non-zero on failure, which is all a
 * pre-deploy gate needs.
 */
import { deriveVisibilityCtx } from "@/hooks/useVisibilityContext";
import { isItemVisible } from "@/lib/itemVisibility";

let failures = 0;
let total = 0;

function check(label: string, condition: boolean) {
  total++;
  if (!condition) {
    failures++;
    console.log(`  FAIL  ${label}`);
  } else {
    console.log(`  ok    ${label}`);
  }
}

const loading = { isLoading: true } as never;
const settled = (data: string[]) => ({ data, isLoading: false }) as never;
const errored = {
  error: new Error("Could not find the table 'public.mutes' in the schema cache"),
  isLoading: false,
} as never;

const PUBLIC_ITEM = {
  user_id: "stranger",
  sharing_level: "public",
  image_urls: ["https://example.test/a.jpg"],
  is_for_sale: true,
};
const FRIENDS_ONLY_ITEM = {
  user_id: "pal",
  sharing_level: "friends",
  image_urls: ["https://example.test/b.jpg"],
  is_for_borrow: true,
};
const browse = (ctx: { friendSet: Set<string>; muteSet: Set<string> }) => ({
  friendSet: ctx.friendSet,
  muteSet: ctx.muteSet,
  requirePhoto: true,
  requireOffered: true,
});

console.log("\n  visibility context");

// A signed-out viewer has no friends and no blocks. That is the correct
// answer, not a degraded one, so it must be ready at once — otherwise the
// public browse page waits on queries that will never run.
{
  const ctx = deriveVisibilityCtx({ userId: undefined, friends: loading, mutes: loading });
  check("signed out is ready immediately", ctx.ready === true);
  check("signed out has no friends and no blocks", ctx.friendSet.size === 0 && ctx.muteSet.size === 0);
  check("signed out is not flagged degraded", ctx.degraded === null);
}

// THE REGRESSION. A missing mutes table must not blank the site.
{
  const ctx = deriveVisibilityCtx({ userId: "u1", friends: settled(["pal"]), mutes: errored });
  check("missing mutes table is still READY", ctx.ready === true);
  check("missing mutes reports degraded = mutes", ctx.degraded === "mutes");
  check("missing mutes preserves the friend set", ctx.friendSet.has("pal"));
  check("missing mutes blocks nobody", ctx.muteSet.size === 0);
  check(
    "a public item still renders when mutes is broken",
    isItemVisible(PUBLIC_ITEM as never, browse(ctx)) === true
  );
}

// A failed friends query degrades by HIDING friends-only items, which
// under-shows. That is the safe direction: the worst case is a friend's
// shelf looking emptier than it is.
{
  const ctx = deriveVisibilityCtx({ userId: "u1", friends: errored, mutes: settled([]) });
  check("failed friends query is still READY", ctx.ready === true);
  check("failed friends reports degraded = friends", ctx.degraded === "friends");
  check(
    "friends-only is HIDDEN when friendship cannot be verified",
    isItemVisible(FRIENDS_ONLY_ITEM as never, browse(ctx)) === false
  );
}

{
  const ctx = deriveVisibilityCtx({ userId: "u1", friends: errored, mutes: errored });
  check("both failed is still READY", ctx.ready === true);
  check("both failed reports degraded = both", ctx.degraded === "both");
}

// Genuinely still loading must NOT be ready, or a stranger sees a
// friends-only row for one frame before the sets arrive.
{
  check(
    "friends still loading is NOT ready",
    deriveVisibilityCtx({ userId: "u1", friends: loading, mutes: settled([]) }).ready === false
  );
  check(
    "mutes still loading is NOT ready",
    deriveVisibilityCtx({ userId: "u1", friends: settled([]), mutes: loading }).ready === false
  );
}

{
  const ctx = deriveVisibilityCtx({ userId: "u1", friends: settled(["pal"]), mutes: settled(["blocked"]) });
  check("happy path is ready and not degraded", ctx.ready === true && ctx.degraded === null);
  check(
    "a friend's friends-only item IS visible",
    isItemVisible(FRIENDS_ONLY_ITEM as never, browse(ctx)) === true
  );
  check(
    "a blocked owner's item is hidden",
    isItemVisible({ ...PUBLIC_ITEM, user_id: "blocked" } as never, browse(ctx)) === false
  );
}

console.log("\n  the rule itself");

{
  const none = { friendSet: new Set<string>(), muteSet: new Set<string>() };
  check(
    "private is hidden from everyone",
    isItemVisible({ ...PUBLIC_ITEM, sharing_level: "private" } as never, browse(none)) === false
  );
  check(
    "public_anon is as public as public",
    isItemVisible({ ...PUBLIC_ITEM, sharing_level: "public_anon" } as never, browse(none)) === true
  );
  check(
    "an unrecognised sharing level is hidden, not shown",
    isItemVisible({ ...PUBLIC_ITEM, sharing_level: "weird_new_tier" } as never, browse(none)) === false
  );
  check(
    "a photoless item is kept out of browse",
    isItemVisible({ ...PUBLIC_ITEM, image_urls: [] } as never, browse(none)) === false
  );
  check(
    "an item offered for nothing is kept out of browse",
    isItemVisible(
      { ...PUBLIC_ITEM, is_for_sale: false, is_for_borrow: false, is_donated: false } as never,
      browse(none)
    ) === false
  );
  check(
    "a free giveaway counts as offered",
    isItemVisible(
      { ...PUBLIC_ITEM, is_for_sale: false, is_for_borrow: false, is_donated: true } as never,
      browse(none)
    ) === true
  );
}

console.log(`\n  ${total - failures}/${total} passed${failures ? "  — FAILURES ABOVE" : ""}\n`);
process.exit(failures ? 1 : 0);
