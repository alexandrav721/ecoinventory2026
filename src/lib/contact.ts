/**
 * Who to write to, in one place.
 *
 * These were typed as the literal placeholders `[SUPPORT EMAIL]` and
 * `[LEGAL ENTITY NAME]` in four separate files, and all four shipped. The
 * live Privacy, Terms and Support pages told visitors to contact
 * "[SUPPORT EMAIL]" — on the three pages Apple reads before approving an
 * App Store listing. Four copies of a value is why: filling in three of
 * them looks finished.
 *
 * SUPPORT_EMAIL is confirmed: it is the address Alexandra's own
 * celebrateloop.com tells people to write to when the signup form fails.
 */
export const SUPPORT_EMAIL = "hello@celebrateloop.com";

/**
 * The entity that publishes Loop, as it appears in legal copy.
 *
 * NOT INFERRED — copied from what Alexandra already publishes. Her live
 * celebrateloop.com/privacy names "Loop Max Your Stuff LLC" three times,
 * and so does the source it is built from in celebrateloop-site/. This page
 * had been rendering the literal text "[LEGAL ENTITY NAME]" instead, which
 * would have been a downgrade from her own finished legal pages on the three
 * URLs the App Store submission points at.
 *
 * If the LLC is ever renamed, it changes here and all three pages follow.
 */
export const LEGAL_ENTITY = "Loop Max Your Stuff LLC";

/**
 * The date the current Privacy Policy and Terms take effect.
 *
 * Set to the day the corrected pages go live. The convention for a policy's
 * effective date is simply when it starts applying, and these pages have
 * never applied: until today they read "Effective date: [EFFECTIVE DATE]".
 * Change it if a lawyer wants a different one.
 */
export const EFFECTIVE_DATE = "28 October 2026";
