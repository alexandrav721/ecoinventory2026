import { CLARET, HAIRLINE, INK, MUTED, PAPER } from "@/components/brand";
import { JoinTheList } from "@/components/landing/JoinTheList";
import { APP_LINK, APP_STORE_URL, TESTFLIGHT_URL } from "@/components/landing/appLinks";

/**
 * The app, said out loud.
 *
 * THE BUG THIS FIXES. The previous version read
 *   `const href = APP_STORE_URL || TESTFLIGHT_URL; if (!href) return <JoinTheList />;`
 * so the moment any link was pasted in, BOTH email forms vanished from the
 * page. The brief was a link AND recording emails; the code treated them as
 * mutually exclusive, which would have quietly deleted the waitlist on the
 * day it became most useful.
 *
 * WHY THERE IS NO APPLE BADGE. The black "Download on the App Store" badge
 * is licensed only "in connection with Your applications that are available
 * for download on the App Store". Loop is not, yet — so the badge may not
 * appear here at all, not greyed out and not redrawn. A claret rule and one
 * honest sentence turn the missing button into the page's fifth honesty
 * exhibit rather than a gap to apologise for.
 *
 * AND NO DEAD CONTROL, at any stage. With no link there is no button,
 * because the only thing this page can actually achieve today is taking an
 * email. When a link exists the button leads, and the list is demoted rather
 * than deleted — the closing section's whole argument is that the list
 * decides which building turns on next.
 */
export function GetTheApp({
  variant,
  source,
  style,
}: {
  variant: "hero" | "closing";
  source: string;
  style?: React.CSSProperties;
}) {
  const label = APP_STORE_URL
    ? "Loop for iPhone — out now, free"
    : TESTFLIGHT_URL
      ? "Loop for iPhone — in beta"
      : "Loop for iPhone — built, not yet released";

  const sentence = APP_STORE_URL
    ? "It's on the App Store, it's free to download, and it takes a minute. If you're in the Financial District, the list still decides which building turns on next."
    : TESTFLIGHT_URL
      ? "The app is built and in people's hands. Apple hasn't reviewed it yet, so you get it the way my members did — straight from me."
      : "It's built, and it's in my members' hands. It just isn't in the App Store yet — so there's no button here pretending it is.";

  return (
    <div style={{ maxWidth: 460, ...style }}>
      {/* The status line belongs in the hero only. The closing section gets
          the action alone — saying the same status twice is nagging. A
          claret rule appears in exactly one other place on this page (the
          pull-quote), so the device already means "this line matters". */}
      {variant === "hero" && (
        <div style={{ borderTop: `1px solid ${CLARET}`, paddingTop: 14 }}>
          <p
            className="text-[12px] font-semibold uppercase sm:text-[13px]"
            style={{ letterSpacing: "0.09em", color: MUTED }}
          >
            {label}
          </p>
          <p
            className="mt-2.5 text-[16px] leading-[1.55] md:text-[17px]"
            style={{ color: INK }}
          >
            {sentence}
          </p>
        </div>
      )}

      {APP_LINK ? (
        <>
          <a
            href={APP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full px-7 py-4 text-base font-semibold transition-opacity hover:opacity-90 sm:w-auto"
            style={{ backgroundColor: INK, color: PAPER }}
          >
            {APP_STORE_URL
              ? "Get Loop — free on the App Store"
              : "Install the beta on your iPhone"}
          </a>
          <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
            {APP_STORE_URL
              ? "Free to download. iPhone only for now."
              : "Through TestFlight, Apple's own beta app. It's the real thing — the same build my members use. Needs an iPhone and an Apple Account."}
          </p>
          {/* Demoted, never deleted. */}
          <div className="mt-7 pt-6" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
            <p className="text-[14px]" style={{ color: MUTED }}>
              In FiDi? Put your building on the list — that's the whole vote.
            </p>
            <div className="mt-4">
              <JoinTheList source={source} />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6">
          <JoinTheList source={source} />
        </div>
      )}
    </div>
  );
}
