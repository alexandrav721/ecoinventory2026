import { useParams } from "react-router-dom";

/**
 * /invite/:token — where every referral link in the app lands.
 *
 * The mobile app builds invite URLs as celebrateloop.com/invite/{token}
 * (see useInvites.ts) and hands them out for the $5-each referral. There was
 * no route here, so every invite ever sent 404'd.
 *
 * What this page does: if the app is installed, the universal link opens it
 * directly and this page is never seen. If it isn't, this is the fallback —
 * explain Loop, keep the token visible so the invite can still be honoured
 * after install, and send them to the App Store.
 *
 * NOTE: deferred deep linking (carrying the token through an App Store
 * install automatically) needs a service like Branch. Until then, showing the
 * code and asking the user to enter it is the honest, working fallback.
 */

const APP_STORE_URL = ""; // same placeholder as Landing.tsx

const CREAM = "#FAF6EE";
const SAGE = "#2F5C43";
const PINE = "#182820";
const CLAY = "#FFD9B9";
const LINE = "#E7E1D6";
const MUTED = "#7C7A6E";

function LoopMark({ size = 44 }: { size?: number }) {
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

const Invite = () => {
  const { token } = useParams<{ token: string }>();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: CREAM, color: PINE }}
    >
      <LoopMark />

      <p className="mt-8 text-xs uppercase tracking-[0.2em]" style={{ color: MUTED }}>
        You've been invited
      </p>
      <h1
        className="mt-3 max-w-lg text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.1]"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        A neighbor wants to share their stuff with you
      </h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed" style={{ color: "#4A473D" }}>
        Loop turns your neighborhood into a shared closet, toolshed, and
        library. Borrow what you'd use once, and earn from what's gathering
        dust. Join with this invite and you both get $5 credit.
      </p>

      {token ? (
        <div
          className="mt-8 rounded-2xl px-6 py-5"
          style={{ background: "#FFFFFF", border: `1px solid ${LINE}` }}
        >
          <div className="text-xs uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Your invite code
          </div>
          <div
            className="mt-1 text-2xl font-semibold tracking-[0.12em]"
            style={{ color: SAGE }}
          >
            {token}
          </div>
          <div className="mt-2 text-xs" style={{ color: MUTED }}>
            Enter this when you sign up if you're not sent there automatically.
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        {APP_STORE_URL ? (
          <a
            href={APP_STORE_URL}
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold"
            style={{ background: PINE, color: CREAM }}
          >
            Get Loop on iPhone
          </a>
        ) : (
          <span
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold"
            style={{ background: PINE, color: CREAM }}
          >
            Coming soon to iPhone
          </span>
        )}
      </div>

      <a href="/" className="mt-6 text-sm hover:opacity-70" style={{ color: SAGE }}>
        What is Loop? →
      </a>
    </div>
  );
};

export default Invite;
