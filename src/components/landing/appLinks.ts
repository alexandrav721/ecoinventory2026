/**
 * THIS FILE IS THE SWITCH.
 *
 * It contains nothing except the two links below. Paste a link between the
 * quote marks and the whole website rearranges itself. You do not need to
 * touch anything else, anywhere, ever. If you break this file the site won't
 * build — so change nothing but the text inside the quote marks.
 *
 * 1 — TESTFLIGHT_URL. Do this one now if you want people installing Loop
 *     this week. App Store Connect → Loop → TestFlight → your external
 *     testing group → Public Link → Enable Public Link → copy it. It looks
 *     like https://testflight.apple.com/join/XXXXXXXX
 *     The second it's in here: the hero grows a real black button reading
 *     "Install the beta on your iPhone", the email form moves underneath it,
 *     and a "Get the app" link appears in the menu at the top.
 *
 * 2 — APP_STORE_URL. Paste this the day Apple approves Loop. App Store
 *     Connect → Loop → App Information → the App Store link.
 *     The button changes to "Get Loop — free on the App Store" and the
 *     status line stops saying it isn't released yet.
 *
 * With BOTH empty — which is today — the page says plainly that the app
 * isn't out yet and collects emails instead. That is on purpose: there is no
 * dead button on this site at any stage.
 *
 * ONE RULE FROM APPLE, so nobody catches you out. The black "Download on the
 * App Store" badge is licensed to you "only in connection with Your
 * applications that are available for download on the App Store"
 * (developer.apple.com/app-store/marketing/guidelines — Marketing Agreement).
 * Until Loop is approved you may NOT put that badge on this site: not greyed
 * out, not as a picture, not as a copy you drew yourself. That is why this
 * page uses a claret rule and a sentence instead of a badge.
 */

export const APP_STORE_URL: string = "";
export const TESTFLIGHT_URL: string = "";

/** Whichever link exists, if either does. */
export const APP_LINK: string = APP_STORE_URL || TESTFLIGHT_URL;
