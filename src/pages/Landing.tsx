import { Link } from "react-router-dom";

/**
 * celebrateloop.com — the marketing landing for the Loop iPhone app.
 *
 * Why this exists: the site had no mention of the mobile app anywhere.
 * Logged-out visitors were redirected straight into the old web-app tour, so
 * anyone who heard about Loop and searched for it landed somewhere that never
 * told them there's an app, let alone how to get it. The App Store listing
 * also needs a real marketing URL.
 *
 * Brand: this follows the MOBILE app's palette (cream / sage / clay + Fraunces
 * italic), not the web app's blue theme — the phone app is the product now.
 *
 * Deliberately no invented social proof: no fake install counts, no press
 * logos we haven't earned. Swap APP_STORE_URL in when the listing is live.
 */

// ── Fill these in ────────────────────────────────────────────────────────
const APP_STORE_URL = ""; // e.g. "https://apps.apple.com/app/id6772380914"
const TESTFLIGHT_URL = ""; // optional: public TestFlight link while in beta
const SUPPORT_EMAIL = "[SUPPORT EMAIL]";
// ─────────────────────────────────────────────────────────────────────────

const CREAM = "#FAF6EE";
const SAGE = "#2F5C43";
const PINE = "#182820";
const CLAY = "#FFD9B9";
const LINE = "#E7E1D6";
const MUTED = "#7C7A6E";

/** The app mark — same geometry as the iOS icon. */
function LoopMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden>
      <rect width="1024" height="1024" rx="230" fill={SAGE} />
      <path
        d="M 805 405 A 312 312 0 1 1 619 219"
        fill="none"
        stroke={CLAY}
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M 380 326 L 380 698 L 658 698"
        fill="none"
        stroke={CREAM}
        strokeWidth="88"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        style={{ backgroundColor: dark ? CREAM : PINE, color: dark ? PINE : CREAM }}
      >
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={base}
      style={{ backgroundColor: dark ? CREAM : PINE, color: dark ? PINE : CREAM }}
    >
      {label}
    </a>
  );
}

/** A stylised phone showing the app, drawn rather than screenshotted so it
 *  never goes stale. Swap for a real screenshot once the listing is live. */
function PhoneMock() {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: 260,
        height: 530,
        borderRadius: 46,
        background: PINE,
        padding: 10,
        boxShadow: "0 30px 70px rgba(43,39,35,0.28)",
      }}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{ borderRadius: 37, background: "#FCFAF6" }}
      >
        <div className="px-5 pt-7">
          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
            Near you
          </div>
          <div
            className="mt-1 text-[26px] italic leading-tight"
            style={{ fontFamily: "Fraunces, Georgia, serif", color: PINE }}
          >
            Borrow it from
            <br />
            three doors down
          </div>
        </div>
        <div className="mt-5 space-y-3 px-5">
          {[
            { emoji: "🪜", name: "Extension ladder", price: "$6 / day" },
            { emoji: "💦", name: "Pressure washer", price: "$15 / day" },
            { emoji: "🎂", name: "Stand mixer", price: "$9 / day" },
            { emoji: "⛺", name: "4-person tent", price: "$12 / day" },
          ].map((it) => (
            <div
              key={it.name}
              className="flex items-center gap-3 rounded-2xl px-3 py-3"
              style={{ background: "#FFFFFF", border: `1px solid ${LINE}` }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ background: "#E5ECE3" }}
              >
                {it.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold" style={{ color: PINE }}>
                  {it.name}
                </div>
                <div className="text-[11px]" style={{ color: MUTED }}>
                  {it.price} · 0.3 mi away
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    emoji: "🧹",
    title: "Listing is a game, not a chore",
    body: "Sweep one room: tap what you own and it lists with a price already filled in. Photos come after, in one batch.",
    value: "A whole room listed in about two minutes",
  },
  {
    emoji: "💸",
    title: "The money finds you",
    body: "Once your things are in Loop, you never hunt for a buyer. The moment a neighbor wants one, you get the ping.",
    value: "Passive income from what you already own",
  },
  {
    emoji: "🙋",
    title: "Ask your block first",
    body: "Post what you need and everyone nearby who owns one hears about it instantly. Borrow it for the weekend instead of buying it forever.",
    value: "Stop buying things you'll use twice",
  },
  {
    emoji: "🛡️",
    title: "Built so lending feels safe",
    body: "Real neighbors with ratings. Money held until you confirm the handoff. Block or report anyone, instantly.",
    value: "Escrow on every payment",
  },
];

const BEFORE = [
  "Bought a drill you'll use twice",
  "Closets full of forgotten things",
  "Baby gear rotting in the garage",
  "No idea what any of it's worth",
];
const AFTER = [
  "Borrow it from three doors down",
  "Know exactly what you own",
  "Pass the phase on, get paid",
  "Idle stuff quietly earning",
];

const CREW = [
  { emoji: "🐢", name: "Sage", line: "Every borrow is one less thing built, boxed, and shipped." },
  { emoji: "🦫", name: "Bo", line: "Your drill works nine minutes a year. Put it on payroll." },
  { emoji: "🐿️", name: "Pip", line: "Book club rule #1: nobody buys the same book twice." },
  { emoji: "🦉", name: "Olive", line: "Know what you own and you'll buy less, find it faster." },
];

const Landing = () => {
  return (
    <div style={{ background: CREAM, color: PINE }} className="min-h-screen">
      {/* Nav */}
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{ background: "rgba(250,246,238,0.85)", borderBottom: `1px solid ${LINE}` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LoopMark />
            <span
              className="text-2xl italic leading-none"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
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

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: MUTED }}
          >
            Neighbor-to-neighbor lending
          </p>
          <h1
            className="mt-4 text-[clamp(2.4rem,6vw,4rem)] font-medium leading-[1.05]"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Your street already owns{" "}
            <span className="italic" style={{ color: SAGE }}>
              everything
            </span>{" "}
            you need
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "#4A473D" }}>
            Everyone on your block bought the same drill, the same cooler, the
            same folding chairs — and they all sit still. Loop turns your
            neighborhood into a shared closet, toolshed, and library.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <GetTheApp />
            <a href="#how" className="text-sm font-semibold hover:opacity-70" style={{ color: SAGE }}>
              See how it works →
            </a>
          </div>
        </div>
        <PhoneMock />
      </section>

      {/* Before / After */}
      <section style={{ background: "#F4EFE4" }} className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-[clamp(1.8rem,4vw,2.6rem)] font-medium"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Same house, same stuff
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center" style={{ color: MUTED }}>
            Nothing new gets bought. The things you already own just start
            working for you.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div
              className="rounded-3xl p-7"
              style={{ background: "#EDE8DC", border: `1px solid ${LINE}` }}
            >
              <div className="text-3xl">😮‍💨</div>
              <h3 className="mt-3 text-xl font-semibold" style={{ color: "#6E6C62" }}>
                Before Loop
              </h3>
              <ul className="mt-5 space-y-3">
                {BEFORE.map((b) => (
                  <li key={b} className="flex gap-3" style={{ color: "#6E6C62" }}>
                    <span aria-hidden>✕</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl p-7" style={{ background: PINE }}>
              <div className="text-3xl">🤩</div>
              <h3 className="mt-3 text-xl font-semibold" style={{ color: "#FFFFFF" }}>
                After Loop
              </h3>
              <ul className="mt-5 space-y-3">
                {AFTER.map((a) => (
                  <li key={a} className="flex gap-3" style={{ color: "rgba(255,255,255,0.92)" }}>
                    <span aria-hidden style={{ color: CLAY }}>
                      ✓
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="mx-auto max-w-5xl px-5 py-20">
        <h2
          className="text-center text-[clamp(1.8rem,4vw,2.6rem)] font-medium"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          How Loop works
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl p-7"
              style={{ background: "#FFFFFF", border: `1px solid ${LINE}` }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{ background: "#E5ECE3" }}
              >
                {f.emoji}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 leading-relaxed" style={{ color: MUTED }}>
                {f.body}
              </p>
              <p
                className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold"
                style={{ background: SAGE, color: "#FFFFFF" }}
              >
                👉 {f.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The crew */}
      <section style={{ background: "#F4EFE4" }} className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-[clamp(1.6rem,3.4vw,2.2rem)] font-medium"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Meet the crew
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CREW.map((c) => (
              <div
                key={c.name}
                className="rounded-3xl p-6 text-center"
                style={{ background: CREAM, border: `1px solid ${LINE}` }}
              >
                <div className="text-4xl">{c.emoji}</div>
                <div className="mt-2 font-semibold">{c.name}</div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                  “{c.line}”
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 py-24">
        <div
          className="mx-auto max-w-3xl rounded-[32px] px-8 py-16 text-center"
          style={{ background: PINE }}
        >
          <h2
            className="text-[clamp(1.8rem,4vw,2.8rem)] font-medium"
            style={{ fontFamily: "Fraunces, Georgia, serif", color: "#FFFFFF" }}
          >
            Put your closet to work
          </h2>
          <p className="mx-auto mt-4 max-w-md" style={{ color: "rgba(255,255,255,0.75)" }}>
            Borrow what you'd use once. Lend what's gathering dust. Keep the
            good stuff moving around your block.
          </p>
          <div className="mt-8 flex justify-center">
            <GetTheApp dark />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${LINE}` }} className="px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LoopMark size={26} />
            <span className="text-lg italic" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
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
