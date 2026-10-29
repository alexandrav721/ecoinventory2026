import { Link } from "react-router-dom";
import {
  CHAMPAGNE,
  CLARET,
  HAIRLINE,
  INK,
  LoopMark,
  MUTED,
  PAPER,
} from "@/components/brand";
import { JoinTheList } from "@/components/landing/JoinTheList";
import { RealListings } from "@/components/landing/RealListings";
import { SUPPORT_EMAIL } from "@/lib/contact";

/**
 * celebrateloop.com — the front door.
 *
 * REWRITTEN 28 Oct 2026, and it is worth recording what was wrong, because
 * the old version was better built than it was aimed.
 *
 * It opened with "You already own four umbrellas" and a wall of twelve
 * invented colour tiles. Clever, well made, and it failed the five-second
 * test: the words "neighbor", "borrow" and "lend" did not appear above the
 * fold at all. A stranger on a phone could tell you Loop was an iPhone app
 * in FiDi that had something to do with owning too many water bottles. They
 * could not tell you it involved other people — which is the entire product.
 *
 * Worse, the promise it made was the wrong one. "An app that remembers your
 * stuff so you stop re-buying it" is a personal-inventory pitch, and this
 * codebase already knows how that ends: "Every inventory app dies the same
 * way: logging feels like work." The inventory is not the hook. It is the
 * moat behind the hook. The hook is that a neighbour two doors down has the
 * steam cleaner.
 *
 * So: the headline now says what Loop is, the real photographs moved up to
 * sit directly under it as proof the thing exists, and three sections that
 * made the same joke three times are gone — the hours calculator, the
 * repeats carousel and the fifth-one bars. The page went from roughly eight
 * phone screens to four. Pile.tsx is left on disk, unimported, rather than
 * deleted, in case any of it is wanted again.
 *
 * Brand: white ground, claret accent, Instrument Serif italic for display —
 * the mobile app's palette, in ecoinventory-mobile/src/lib/tokens.ts.
 *
 * Deliberately no invented social proof: no install counts, no press logos,
 * no testimonials. The photographs are the proof, and they are real.
 */

// ── Fill these in ────────────────────────────────────────────────────────
const APP_STORE_URL = ""; // e.g. "https://apps.apple.com/app/id6772380914"
const TESTFLIGHT_URL = ""; // optional: public TestFlight link while in beta
// ─────────────────────────────────────────────────────────────────────────

/**
 * The one action on the page.
 *
 * While there is no listing to link to, this is the waitlist form — a dead
 * "Coming soon" pill collects nothing from someone who arrived ready. Fill
 * in APP_STORE_URL and every one of these becomes a download button.
 */
function GetTheApp({ dark = false }: { dark?: boolean }) {
  const href = APP_STORE_URL || TESTFLIGHT_URL;
  if (!href) return <JoinTheList dark={dark} />;
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold transition-opacity hover:opacity-90"
      style={{ backgroundColor: dark ? PAPER : INK, color: dark ? INK : PAPER }}
    >
      {APP_STORE_URL ? "Get Loop — free for iPhone" : "Join the beta"}
    </a>
  );
}

/** One step of "How it goes". The number is the structure, not decoration. */
function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p
        className="text-[13px] font-semibold tabular-nums"
        style={{ color: CLARET }}
      >
        {n}
      </p>
      <h3 className="mt-2 text-[17px] font-semibold leading-snug">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: "#4A4540" }}>
        {body}
      </p>
    </div>
  );
}

const Landing = () => {
  return (
    <div style={{ background: PAPER, color: INK }} className="min-h-screen">
      {/* Nav */}
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{
          /* Was a cream band (#FAF6EE) on a white page — a visible seam
             across the top, left over from the pre-September palette. */
          background: "rgba(255,255,255,0.88)",
          borderBottom: `1px solid ${HAIRLINE}`,
        }}
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

      {/* ─── HERO ────────────────────────────────────────────────────────
          One idea, one action, one screen. The old hero had four ideas to
          understand before a visitor could do anything. */}
      <section className="mx-auto max-w-3xl px-5 pb-12 pt-12 text-center md:pb-16 md:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: CLARET }}>
          FiDi first
        </p>
        <h1
          className="mx-auto mt-4 max-w-[13ch] text-[clamp(2.6rem,8vw,4.4rem)] font-medium leading-[1.02]"
          style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
        >
          Borrow it from
          <br />
          <span className="italic" style={{ color: CLARET }}>
            a neighbor.
          </span>
        </h1>
        <p
          className="mx-auto mt-6 max-w-[46ch] text-[17px] leading-relaxed"
          style={{ color: "#4A4540" }}
        >
          Loop is where neighbors lend, rent and pass on the things you only
          need for a while. A steam cleaner. A stroller. A dress for one
          wedding. See what's on your block, ask, and go pick it up.
        </p>
        <div className="mt-9 flex justify-center">
          <GetTheApp />
        </div>
      </section>

      {/* ─── PROOF · real things, before any argument ──────────────────── */}
      <RealListings />

      {/* ─── HOW IT GOES · answers "what happens after I tap" ──────────── */}
      <section id="how" className="mx-auto max-w-5xl px-5 py-20">
        <h2
          className="text-[clamp(1.8rem,4vw,2.6rem)] font-medium"
          style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
        >
          How it goes
        </h2>
        <div className="mt-9 grid gap-9 md:grid-cols-3 md:gap-10">
          <Step
            n="1"
            title="See what's near you"
            body="Things your neighbors have offered, with how far away they are."
          />
          <Step
            n="2"
            title="Ask. They say yes or no."
            body="A real person on the other end. Most handoffs happen in a lobby."
          />
          <Step
            n="3"
            title="Use it. Give it back."
            body="You both confirm. If it was a rental, the money moves then."
          />
        </div>
      </section>

      {/* ─── THE OTHER SIDE · why you'd put your own things in ─────────── */}
      <section style={{ background: CHAMPAGNE }} className="px-5 py-20">
        <div className="mx-auto max-w-2xl">
          <h2
            className="text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.1]"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            Your closet is already earning.
            <br />
            It just isn't <span className="italic" style={{ color: CLARET }}>collecting</span>.
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "#4A4540" }}>
            Add a thing once, set a price once, and it works in the
            background. When a neighbor wants it, the ask comes to you — no
            listing, no haggling. You say yes or no. Money lands in your bank
            through Stripe, after you both confirm the handoff. US only for
            now.
          </p>
          <p className="mt-6 text-[15px] italic" style={{ color: MUTED }}>
            Loop knows your closet, so the money finds you.
          </p>
        </div>
      </section>

      {/* ─── TRUST · the most distinctive thing on the page, kept short ── */}
      <section className="px-5 py-16">
        <div
          className="mx-auto max-w-xl"
          style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: 28 }}
        >
          <h2 className="text-[15px] font-semibold">Nothing here is a guess.</h2>
          <ul className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed" style={{ color: "#4A4540" }}>
            <li>Every photograph on this page is a real thing a real member owns.</li>
            <li>Totals come from prices people typed. What's blank stays blank.</li>
            <li>No invented demand, no borrowed install counts, no reviews we didn't get.</li>
          </ul>
        </div>
      </section>

      {/* ─── CLOSING · the second and last ask ─────────────────────────── */}
      <section className="px-5 pb-24 pt-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05]"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            FiDi first.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px]" style={{ color: MUTED }}>
            Borrowing only works if it's close, so Loop opens one neighborhood
            at a time. The list is how we decide which block to turn on next.
          </p>
          <div className="mt-8 flex justify-center">
            <GetTheApp />
          </div>
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
