import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CHAMPAGNE,
  CLARET,
  FAINT,
  HAIRLINE,
  INK,
  LoopMark,
  MUTED,
  PAPER,
} from "@/components/brand";
import { JoinTheList } from "@/components/landing/JoinTheList";
import {
  RealListings,
  useOfferedListings,
} from "@/components/landing/RealListings";
import { Ledger } from "@/components/landing/Ledger";
import { displayText } from "@/lib/displayText";
import { SUPPORT_EMAIL } from "@/lib/contact";

/**
 * celebrateloop.com — the front door, rebuilt 30 Oct 2026.
 *
 * WHAT WAS WRONG WITH THE VERSION BEFORE THIS ONE. It was clear and it was
 * unauthored. Earlier the same day it had been rewritten for clarity — the
 * old hero ("You already own four umbrellas", twelve invented colour tiles)
 * never said neighbor, borrow or lend above the fold — and that fixed the
 * five-second test while leaving a page nothing on which could only have
 * come from this company: a centred hero, then a left-aligned section, then
 * a centred close; seven body sizes arrived at by nudging; py-20 on four
 * consecutive sections; six identical white cards in a four-up grid with a
 * hole in row two; and `font-medium` on a display face that only ships
 * weight 400, so the page believed it had two display weights and had one.
 *
 * THE ARGUMENT THIS VERSION MAKES. Loop's smallness is the one asset a
 * funded competitor cannot buy. Thirteen members, eleven things, four
 * lenders, nobody in the neighbourhood it is opening in — every growth
 * playbook says bury that. Publishing it, counted live, is the most
 * persuasive object a pre-seed founder can hand a partner, because it
 * cannot be faked and it cannot be found out in diligence. So the page is
 * built as a ledger: every claim carries its number, nothing is rounded up,
 * and the photographs are large enough to be evidence rather than
 * decoration.
 *
 * THE AXIS RULE, which is the main anti-template move: nothing on this page
 * is centred. Everything hangs off one left margin, text sits in a 620px
 * measure, and the page is 1100px wide. Mixed alignment is most of what
 * made the previous version read assembled.
 *
 * TWO DOORS, NOT ONE. The old page's only action was surrendering an email
 * for a product that appeared not to exist. A partner must be able to touch
 * the thing without signing up, so "browse what's actually on Loop" sits
 * beside the waitlist and in the nav.
 *
 * Every number here is a query. Typed numbers were already wrong: the brief
 * this was designed from said seven things from three people, and by the
 * time it was built the database said eleven from four.
 */

// ── Fill these in ────────────────────────────────────────────────────────
const APP_STORE_URL = ""; // e.g. "https://apps.apple.com/app/id6772380914"
const TESTFLIGHT_URL = ""; // optional: public TestFlight link while in beta
// ─────────────────────────────────────────────────────────────────────────

const MEASURE = 620;

/**
 * One entrance, on load, for the top of the page only.
 *
 * Scroll-triggered fade-up on every section is the single clearest template
 * tell, so there is none. Under reduced motion this returns true
 * immediately: the resting state must be the finished state, never a
 * paused animation.
 */
function useEntrance(delay: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setOn(true);
      return;
    }
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return on;
}

function enter(on: boolean, shift = 8) {
  return {
    opacity: on ? 1 : 0,
    transform: on ? "none" : `translateY(${shift}px)`,
    transition: "opacity 700ms cubic-bezier(.22,1,.36,1), transform 700ms cubic-bezier(.22,1,.36,1)",
  } as const;
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[30px] leading-[1.06] md:text-[40px]"
      style={{
        fontFamily: "Instrument Serif, Georgia, serif",
        letterSpacing: "-0.015em",
      }}
    >
      {children}
    </h2>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="space-y-5 text-[16px] leading-[1.62]"
      style={{ color: "#4A4540", maxWidth: MEASURE }}
    >
      {children}
    </div>
  );
}

/** The one action. A waitlist while there is no listing; a download after. */
function GetTheApp() {
  const href = APP_STORE_URL || TESTFLIGHT_URL;
  if (!href) return <JoinTheList />;
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-semibold transition-opacity hover:opacity-90"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      {APP_STORE_URL ? "Get Loop — free for iPhone" : "Join the beta"}
    </a>
  );
}

const Landing = () => {
  const offered = useOfferedListings();
  const items = offered?.items ?? null;
  const h1On = useEntrance(0);
  const leadOn = useEntrance(90);
  const photoOn = useEntrance(160);

  /* The hero photograph is whatever is genuinely first on Loop, not a
     chosen asset — if it is ever deleted the page simply shows the next
     real thing. The band then starts from the second item so the same
     object never appears twice. */
  const hero = items?.[0] ?? null;
  const heroName = hero ? displayText(hero.name) : null;
  /* One caption earns a sentence the rest cannot: the owner is reflected in
     the machine's screen, which is the most efficient proof on the site
     that nobody generated these. It only applies to that photograph. */
  const isEspresso = /espresso|terra kaffe/i.test(heroName ?? "");

  return (
    <div style={{ background: PAPER, color: INK }} className="min-h-screen">
      {/* ─── §0 NAV ──────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{
          background: "rgba(255,255,255,0.9)",
          borderBottom: `1px solid ${HAIRLINE}`,
        }}
      >
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4 md:px-12">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-70">
            <LoopMark size={30} />
            <span
              className="text-[26px] italic leading-none"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              Loop
            </span>
          </Link>
          <nav
            className="flex items-center gap-5 text-[14px] sm:gap-7"
            style={{ color: MUTED }}
          >
            {/* The most important item here: a door into the live product
                that costs a visitor nothing. */}
            <Link to="/community" className="hover:opacity-70">
              Browse
            </Link>
            <a href="#how" className="hidden hover:opacity-70 sm:inline">
              How it works
            </a>
            <Link to="/auth" className="hover:opacity-70">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── §1 HERO ─────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-12 md:px-12 md:pb-24 md:pt-[72px]">
        <div className="mx-auto grid max-w-[1100px] gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <p
              className="text-[11px] font-semibold uppercase"
              style={{ letterSpacing: "0.16em", color: CLARET }}
            >
              Opening in the Financial District
            </p>
            <h1
              className="mt-5 text-[46px] leading-[0.96] md:text-[88px]"
              style={{
                fontFamily: "Instrument Serif, Georgia, serif",
                letterSpacing: "-0.02em",
                ...enter(h1On),
              }}
            >
              A closet the size of
              <br />
              <span className="italic" style={{ color: CLARET }}>
                your building.
              </span>
            </h1>
            <p
              className="mt-7 text-[17px] leading-[1.55] md:text-[19px]"
              style={{ color: "#4A4540", maxWidth: 560, ...enter(leadOn) }}
            >
              Loop is how neighbors lend, rent and hand on the things you only
              need for a while. A steam cleaner for a Saturday. A stroller for
              a visit. A dress for one wedding. It's on your floor, or two
              floors up. Ask, walk down, bring it back.
            </p>

            <div className="mt-9" style={{ maxWidth: 460 }}>
              <GetTheApp />
            </div>
            <p className="mt-5">
              <Link
                to="/community"
                className="text-[15px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: CLARET }}
              >
                Or browse what's actually on Loop &rarr;
              </Link>
            </p>
          </div>

          {/* The photograph is evidence, so it is large and it is real. */}
          <div className="md:col-span-5">
            {hero?.image_urls?.[0] && (
              <figure className="m-0" style={{ ...enter(photoOn, 0) }}>
                <div
                  className="w-full overflow-hidden"
                  style={{
                    aspectRatio: "4 / 5",
                    background: HAIRLINE,
                    borderRadius: 2,
                    border: `1px solid ${HAIRLINE}`,
                  }}
                >
                  <img
                    src={hero.image_urls[0]}
                    alt={heroName ?? "A thing on Loop"}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption
                  className="pt-3 text-[13px] leading-[1.45]"
                  style={{ color: MUTED, maxWidth: 320 }}
                >
                  {isEspresso ? (
                    <>
                      The espresso machine on the fourth floor. That's her
                      reflection in the screen — which is how you know nobody
                      generated it.
                    </>
                  ) : (
                    <>
                      {heroName}, photographed by the neighbor who owns it. No
                      stock, nothing generated.
                    </>
                  )}
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* ─── §2 THE LEDGER ───────────────────────────────────────────── */}
      <Ledger />

      {/* ─── §3 EVERYTHING ON LOOP ───────────────────────────────────── */}
      <RealListings
        items={items ? items.slice(1) : null}
        hidden={offered?.hidden ?? []}
      />

      {/* ─── §4 HOW IT GOES ──────────────────────────────────────────── */}
      <section id="how" className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <SectionHead>How it goes.</SectionHead>
          <div className="mt-12">
            {[
              [
                "1",
                "See what's near you.",
                "Things your neighbors have actually offered, and how far away they are. Usually a lobby, a floor, a block.",
              ],
              [
                "2",
                "Ask. They say yes or no.",
                "A real person reads it and answers. No bidding, no haggling, no auction, no algorithm deciding for either of you.",
              ],
              [
                "3",
                "Use it. Bring it back.",
                "You both confirm the handoff. If it was a rental, that's the moment the money moves — Loop holds it until then.",
              ],
            ].map(([n, title, body]) => (
              /* Full-width ruled rows, not a three-up card grid. The numerals
                 are bare serif in a gutter — earned, because the steps really
                 are sequential — not circles, pills or chips. */
              <div
                key={n}
                className="flex gap-6 py-8 md:gap-10"
                style={{ borderTop: `1px solid ${HAIRLINE}` }}
              >
                <span
                  className="shrink-0 text-[28px] leading-none md:text-[32px]"
                  style={{
                    fontFamily: "Instrument Serif, Georgia, serif",
                    color: CLARET,
                    width: 48,
                  }}
                >
                  {n}
                </span>
                <div style={{ maxWidth: 560 }}>
                  <h3 className="text-[19px] font-semibold leading-[1.3]">
                    {title}
                  </h3>
                  <p
                    className="mt-2 text-[16px] leading-[1.62]"
                    style={{ color: "#4A4540" }}
                  >
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── §5 WHY A WHILE — the defensibility argument ─────────────── */}
      <section className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <SectionHead>
            Buying is for forever.
            <br />
            <span className="italic" style={{ color: CLARET }}>
              Most things aren't.
            </span>
          </SectionHead>
          <div className="mt-8">
            <Prose>
              <p>
                The steam cleaner gets used twice. The stroller for eleven
                months. The dress for one night in September. We buy them
                anyway, because at eight o'clock on a Thursday there is
                nowhere else to get one from somebody whose name you know.
              </p>
              <p>
                Loop is built for that window — the while — and not for the
                forever. That's why it isn't a resale app and isn't a feed of
                strangers. It's a list of what's in your building, and who
                will let you use it.
              </p>
              <p>
                And Loop knows what people own, because they put it in
                themselves. So it can answer a question a listings site can't:
                not "who posted a steam cleaner" but "who has one." That gets
                better with every member and it doesn't transfer — a closet in
                your building is worth nothing to anyone in another building.
              </p>
            </Prose>
            <p
              className="mt-12 pt-6 text-[24px] italic leading-[1.3] md:text-[28px]"
              style={{
                fontFamily: "Instrument Serif, Georgia, serif",
                borderTop: `1px solid ${CLARET}`,
                maxWidth: 480,
              }}
            >
              Not "who posted a steam cleaner." Who has one.
            </p>
          </div>
        </div>
      </section>

      {/* ─── §6 THE LENDING SIDE ─────────────────────────────────────── */}
      <section className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          {/* The previous head here read "Your closet is already earning."
              Nobody is earning yet. On a page promising nothing is a guess,
              that was the one headline that was one. */}
          <SectionHead>The lending side is quieter than you'd think.</SectionHead>
          <div className="mt-8">
            <Prose>
              <p>
                Add a thing once. Set a price, or set none and lend it free.
                Then it sits in the background until someone two floors up
                needs it, and the ask comes to you. You say yes or no. There's
                no listing to write and nothing to negotiate.
              </p>
              <p>
                Money moves through Stripe. Loop holds it until you both
                confirm the handoff, then it lands in your bank. Loop takes
                10%, minimum a dollar. That's the whole business model — no
                subscription, no listing fee, nothing to cancel. US only for
                now.
              </p>
            </Prose>
          </div>
        </div>
      </section>

      {/* ─── §7 WHO'S BUILDING IT ────────────────────────────────────── */}
      <section className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <SectionHead>Who's building it.</SectionHead>
          <div className="mt-8">
            <Prose>
              <p>
                I'm Alexandra Vargas. I'm not an engineer. I built Loop anyway
                — the iPhone app, the payments, the escrow, this page —
                because I kept lending things to people in my building and
                kept thinking there should be somewhere to put that.
              </p>
              <p>
                I'm opening in the Financial District because it's dense, it's
                vertical, and it's full of apartments that are smaller than
                the things inside them. One building at a time, starting with
                whichever one fills up first on the list.
              </p>
            </Prose>
          </div>
        </div>
      </section>

      {/* ─── §8 NOTHING HERE IS A GUESS ──────────────────────────────── */}
      <section
        className="px-6 py-20 md:px-12 md:py-24"
        style={{ background: CHAMPAGNE }}
      >
        <div className="mx-auto max-w-[1100px]">
          <SectionHead>Nothing here is a guess.</SectionHead>
          <ul className="mt-10" style={{ maxWidth: MEASURE }}>
            {[
              "Every photograph is a real thing a real member owns, taken on their own phone.",
              "Every number on this page is the real number — including the small ones, including the zero.",
              "No invented demand. No borrowed install counts. No reviews we didn't get, no logos we didn't earn.",
              "When a number changes, this page changes. When something isn't true yet, it isn't here.",
            ].map((line) => (
              <li
                key={line}
                className="py-4 text-[16px] leading-[1.62]"
                style={{ borderTop: `1px solid ${HAIRLINE}`, color: "#4A4540" }}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── §9 CLOSING ASK ──────────────────────────────────────────── */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <SectionHead>
            One building
            <br />
            <span className="italic" style={{ color: CLARET }}>
              at a time.
            </span>
          </SectionHead>
          <p
            className="mt-6 text-[17px] leading-[1.55]"
            style={{ color: "#4A4540", maxWidth: 520 }}
          >
            Borrowing only works if it's close, so Loop turns on one block at a
            time. The list is how I decide which one is next — if you're in
            FiDi, that's the entire vote.
          </p>
          <div className="mt-9" style={{ maxWidth: 460 }}>
            <GetTheApp />
          </div>
        </div>
      </section>

      {/* ─── §10 FOOTER ──────────────────────────────────────────────── */}
      <footer
        className="px-6 py-10 md:px-12"
        style={{ borderTop: `1px solid ${HAIRLINE}` }}
      >
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-70">
              <LoopMark size={26} />
              <span
                className="text-[18px] italic"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                Loop
              </span>
            </Link>
            <nav
              className="flex flex-wrap items-center gap-6 text-[14px]"
              style={{ color: MUTED }}
            >
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
          <p className="mt-8 text-[12px] leading-[1.6]" style={{ color: FAINT }}>
            Investing or writing about Loop? {SUPPORT_EMAIL}
            <br />© {new Date().getFullYear()} Loop · Financial District,
            Manhattan
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
