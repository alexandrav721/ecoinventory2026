import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Gives each route its own browser-tab title.
 *
 * All forty-three routes shared the one `<title>` in index.html, which is a
 * problem in three specific places: /privacy, /terms and /support are the
 * URLs handed to Apple, and a reviewer opening the privacy policy saw a tab
 * that didn't say Privacy. Search engines also index same-titled pages as
 * near-duplicates, so the legal pages competed with the landing page.
 *
 * Done with a hook rather than react-helmet because it is eleven lines and a
 * dependency is not worth it. The default is the landing page's own title,
 * so any route not listed here still reads correctly rather than inheriting
 * whatever the last page set.
 *
 * Titles are "Thing · Loop" — the distinguishing word first, because tabs
 * truncate from the right and "Loop — Borrow & l…" told you nothing.
 */

const SITE = "Loop — borrow and lend with your neighbors";

/** Exact paths. Anything dynamic is handled by the prefix list below. */
const EXACT: Record<string, string> = {
  "/": SITE,
  "/privacy": "Privacy Policy · Loop",
  "/terms": "Terms of Service · Loop",
  "/support": "Help & Support · Loop",
  "/auth": "Sign in · Loop",
  "/reset-password": "Reset your password · Loop",
  "/community": "Browse what's near you · Loop",
  "/marketplace": "Browse what's near you · Loop",
  "/people": "People on Loop · Loop",
  "/welcome": "How Loop works · Loop",
  "/how-it-works": "How Loop works · Loop",
  "/home": "Home · Loop",
  "/dashboard": "Your inventory · Loop",
  "/insights": "Insights · Loop",
  "/me": "Your profile · Loop",
  "/settings": "Settings · Loop",
  "/declutter": "Declutter · Loop",
  "/events": "Events · Loop",
  "/articles": "Articles · Loop",
};

/** Path prefixes, longest first so /marketplace/item beats /marketplace. */
const PREFIX: [string, string][] = [
  ["/marketplace/item/", "Item · Loop"],
  ["/invite/", "You're invited to Loop"],
  ["/profile/", "Member profile · Loop"],
  ["/articles/", "Articles · Loop"],
];

export function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const exact = EXACT[pathname];
    if (exact) {
      document.title = exact;
      return;
    }
    const prefix = PREFIX.find(([p]) => pathname.startsWith(p));
    document.title = prefix ? prefix[1] : SITE;
  }, [pathname]);

  return null;
}
