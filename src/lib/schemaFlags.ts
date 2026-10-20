/**
 * Columns the website's database may or may not have.
 *
 * BOTH ARE NOW TRUE, because .env.local points this site at the "Loop"
 * project (taodxvqcgszqkqhtwkqt) — Alexandra's own, the one her iPhone app
 * uses — and that project has rent_price, rent_window, admin_hidden and the
 * mutes table, all verified by probe. If you ever point it back at the old
 * pxktgcwhisjdiquezvav project, set both to false and strip the rent columns
 * out of the four selects again, or every page that names them returns 400.
 *
 * THE WEBSITE AND THE APP POINT AT TWO DIFFERENT SUPABASE PROJECTS:
 *
 *     app      taodxvqcgszqkqhtwkqt.supabase.co   (EXPO_PUBLIC_SUPABASE_URL)
 *     website  pxktgcwhisjdiquezvav.supabase.co   (VITE_SUPABASE_URL)
 *
 * Different projects mean different schemas, different rows and different
 * accounts. `rent_price`, `rent_window` and `admin_hidden` exist on the
 * app's project — its generated types carry them and its migration
 * 20260711000000_rent_window.sql created them — and do NOT exist on the
 * website's, which answers:
 *
 *     column inventory_items.rent_price does not exist
 *
 * Naming a missing column in a select, a filter or an insert makes
 * PostgREST return 400 for the WHOLE query, so one unknown column empties
 * a whole page. That is what this flag is guarding against.
 *
 * TO TURN RENT ON, pick one and then set the flag to true:
 *
 *   1. Run docs/MIGRATION-rent-columns.sql on the website's project. Two
 *      nullable columns and a CHECK; additive, reversible, 30 seconds.
 *   2. Or point the website at the app's project, which already has them —
 *      and which is the only thing that makes "change it on the website
 *      and it shows up in Loop" actually true. See
 *      docs/TWO-DATABASES.md, because that one is a decision, not a patch.
 *
 * Option 2 makes option 1 unnecessary. Either way this becomes `true` and
 * the rent rate, the window picker and the "$8/day" labels start working;
 * nothing else in the codebase needs to change.
 */
export const RENT_COLUMNS_PRESENT = true;

/** Added by the app's moderation work; absent on the website's project. */
export const ADMIN_HIDDEN_COLUMN_PRESENT = true;

/**
 * The rent columns, as a select fragment — "" when they are absent, so a
 * select string can interpolate it without a conditional at every site.
 */
export const RENT_SELECT = RENT_COLUMNS_PRESENT
  ? ", rent_price, rent_window"
  : "";
