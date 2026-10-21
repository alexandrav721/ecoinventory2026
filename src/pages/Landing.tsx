import { Link } from "react-router-dom";
/* The palette and the mark moved to src/components/brand.tsx so the
   sign-in page stops drawing its own badge. Same literals, one home. */
import {
  CHAMPAGNE,
  CLARET,
  HAIRLINE,
  INK,
  LoopMark,
  MUTED,
  PAPER,
} from "@/components/brand";
import {
  FifthOne,
  Hours,
  OwnFour,
  Pile,
  Repeats,
} from "@/components/landing/Pile";

/**
 * celebrateloop.com — the marketing landing for the Loop iPhone app.
 *
 * Why this exists: the site had no mention of the mobile app anywhere.
 * Logged-out visitors were redirected straight into the old web-app tour, so
 * anyone who heard about Loop and searched for it landed somewhere that never
 * told them there's an app, let alone how to get it. The App Store listing
 * also needs a real marketing URL.
 *
 * Brand: this follows the MOBILE app's palette — white ground, claret accent,
 * Instrument Serif italic (ecoinventory-mobile/src/lib/tokens.ts). Updated Oct
 * 2026; it had been left on the pre-September cream/sage/Fraunces set.
 *
 * Deliberately no invented social proof: no fake install counts, no press
 * logos we haven't earned. Swap APP_STORE_URL in when the listing is live.
 */

// ── Fill these in ────────────────────────────────────────────────────────
const APP_STORE_URL = ""; // e.g. "https://apps.apple.com/app/id6772380914"
const TESTFLIGHT_URL = ""; // optional: public TestFlight link while in beta
const SUPPORT_EMAIL = "[SUPPORT EMAIL]";
// ─────────────────────────────────────────────────────────────────────────

/* Loop's palette, Oct 2026 — the same hex values as the mobile app's
 * src/lib/tokens.ts.
 *
 * These were PAPER / CLARET / INK / CHAMPAGNE, and the header above still explains
 * why: the page was deliberately matched to "the MOBILE app's palette (cream
 * / sage / clay + Fraunces italic)". That was true when it was written. The
 * app rebranded to claret + Instrument Serif in September and this page was
 * never updated, so the front door spent six weeks looking like a different
 * company from the product it was advertising.
 *
 * They are literals rather than CSS tokens because this page renders for
 * logged-out visitors and is styled inline throughout; the rest of the site
 * reads hsl(var(--…)) from src/index.css. If the palette moves again, it
 * moves in tokens.ts first and gets copied here. */
function GetTheApp({ dark = false }: { dark?: boolean }) {
  const href = APP_STORE_URL || TESTFLIGHT_URL;
  const label = APP_STORE_URL
    ? "Download on the App Store"
    : TESTFLIGHT_URL
      ? "Join the beta"
      : "Coming soon to iPhone";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold transition-opacity hover:opacity-90";
  if (!href) {
    return (
      <span
        className={`${base} cursor-default`}
        style={{ backgroundColor: dark ? PAPER : INK, color: dark ? INK : PAPER }}
      >
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={base}
      style={{ backgroundColor: dark ? PAPER : INK, color: dark ? INK : PAPER }}
    >
      {label}
    </a>
  );
}


const Landing = () => {
  return (
    <div style={{ background: PAPER, color: INK }} className="min-h-screen">
      {/* Nav */}
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{ background: "rgba(250,246,238,0.85)", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LoopMark />
            <span
              className="text-2xl italic leading-none"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              Loop
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#how" className="hidden hover:opacity-70 sm:inline" style={{ color: MUTED }}>
              How it works
            </a>
            <Link to="/auth" className="hover:opacity-70" style={{ color: MUTED }}>
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO · beats B (the words) and A (the picture) ───────────
          Both of the founder's first two images are on screen one: the
          headline is "you own four of these and didn't know", and the
          thing beside it is the pile, already wearing its price tags.
          Nothing animates before it is readable — see Pile.tsx. */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 md:grid-cols-[0.95fr_1.05fr] md:gap-14 md:pb-20 md:pt-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: CLARET }}>
            Now in FiDi
          </p>
          <h1
            className="mt-4 text-[clamp(2.4rem,6.2vw,4.2rem)] font-medium leading-[1.02]"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            You already own
            <br />
            {/* "four" and the noun stay on one line: the noun's locked
                min-width was pushing it onto a line of its own. */}
            <span className="whitespace-nowrap">
              four <OwnFour />
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed" style={{ color: "#4A4540" }}>
            Loop remembers what you have. So you stop buying it twice — and
            start renting out the rest.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <GetTheApp />
            <a href="#hours" className="text-sm font-semibold hover:opacity-70" style={{ color: CLARET }}>
              See what it costs you ↓
            </a>
          </div>
          <p className="mt-4 text-xs" style={{ color: MUTED }}>
            iPhone · free to start
          </p>
        </div>
        <Pile />
      </section>

      {/* ─── BEAT C · hours. Early, not buried.
          The panel's sharpest note was that leading with the joke leaves
          the heaviest idea at section five, where nobody reads it. This is
          section two. */}
      <section id="hours" style={{ background: CHAMPAGNE }} className="px-5 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-14">
          <div>
            <h2
              className="text-[clamp(1.9rem,4.2vw,2.9rem)] font-medium leading-[1.08]"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              You paid for this
              <br />
              in <span className="italic" style={{ color: CLARET }}>hours</span>.
            </h2>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed" style={{ color: "#4A4540" }}>
              Not in money. You went to work, you sold the hours, and the
              hours are sitting in your closet.
            </p>
          </div>
          <Hours />
        </div>
      </section>

      {/* ─── BEAT B, expanded ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2
          className="text-[clamp(1.9rem,4.2vw,2.9rem)] font-medium"
          style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
        >
          It's never just umbrellas
        </h2>
        <p className="mt-3 max-w-xl text-[16px]" style={{ color: MUTED }}>
          Loop counts the repeats. It doesn't have an opinion about them.
        </p>
        <div className="mt-9">
          <Repeats />
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-[1fr_0.9fr] md:items-center">
          <div>
            <h3
              className="text-[clamp(1.5rem,3vw,2.1rem)] font-medium leading-tight"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              Four of them. You knew about one.
            </h3>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: "#4A4540" }}>
              The fifth one is the one you were about to buy. That's the whole
              product, really.
            </p>
          </div>
          <FifthOne />
        </div>
      </section>

      {/* ─── THE PROMISE · three things, three lines ───────────────────── */}
      <section id="how" style={{ background: CHAMPAGNE }} className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-[clamp(1.9rem,4.2vw,2.9rem)] font-medium"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            Add a thing. Three things happen.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["It's on your list", "Next time, you'll know you already have one."],
              ["A neighbour can rent it", "They ask in the app. You say yes or no."],
              ["You see what you spent", "Added up from the prices you typed. Nothing guessed."],
            ].map(([t, d], i) => (
              <div key={t}>
                <p
                  className="text-[2.6rem] italic leading-none"
                  style={{ fontFamily: "Instrument Serif, Georgia, serif", color: CLARET }}
                >
                  {i + 1}
                </p>
                <h3 className="mt-3 text-[17px] font-semibold">{t}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: "#4A4540" }}>
                  {d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROOF · the refusals. Deliberately small and plain: this is
          the trust beat, and a card with an icon would undercut it. The
          voice is Insights.tsx's, so the front door and the product agree
          about what is knowable. */}
      <section className="px-5 py-16">
        <div
          className="mx-auto max-w-xl"
          style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: 28 }}
        >
          <h2 className="text-[15px] font-semibold">Nothing here is a guess.</h2>
          <ul className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed" style={{ color: "#4A4540" }}>
            <li>Totals come from prices you typed. What you left blank stays blank.</li>
            <li>Loop doesn't appraise your things, and never shows you a resale price as a fact.</li>
            <li>No invented demand, no borrowed install counts, no reviews we didn't get.</li>
          </ul>
        </div>
      </section>

      {/* ─── CTA · on paper, not another black slab. The page already has
          an ink pill in the hero; a second heavy block here was the thing
          that made the old page read generic. */}
      <section className="px-5 pb-24 pt-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05]"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            Start with four of something.
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[16px]" style={{ color: MUTED }}>
            Add the things you own twice. It takes about two minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <GetTheApp />
          </div>
          <p className="mt-6 text-xs" style={{ color: MUTED }}>
            Loop opens one neighbourhood at a time — borrowing only works if
            it's two blocks away. FiDi first.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${HAIRLINE}` }} className="px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LoopMark size={26} />
            <span className="text-lg italic" style={{ fontFamily: "Instrument Serif, Georgia, serif" }}>
              Loop
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: MUTED }}>
            <Link to="/privacy" className="hover:opacity-70">
              Privacy
            </Link>
            <Link to="/terms" className="hover:opacity-70">
              Terms
            </Link>
            <Link to="/support" className="hover:opacity-70">
              Support
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:opacity-70">
              Contact
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-center text-xs sm:text-left" style={{ color: MUTED }}>
          © {new Date().getFullYear()} Loop
        </p>
      </footer>
    </div>
  );
};

export default Landing;
