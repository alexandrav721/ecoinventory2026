import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CLARET, HAIRLINE, INK, LoopMark, MUTED, PAPER } from "@/components/brand";

/**
 * The page you get when there isn't one.
 *
 * It was the stock scaffold: "404" over "Oops! Page not found" on a grey
 * ground, with a console.error firing on every miss. Three things wrong
 * with that. It is the one page a visitor reaches by accident, so it is
 * pure signal about how carefully the rest was made; "Oops!" is not a voice
 * this brand uses anywhere else; and logging the attempted path to the
 * console on a public site is noise at best.
 *
 * It now does the only useful thing a 404 can: says plainly what happened
 * and offers the three places the visitor was probably heading.
 */
const NotFound = () => {
  const { pathname } = useLocation();

  /* PageTitle maps known routes and falls back to the site title, which it
     cannot help doing — it has no way to know a path is a miss. This
     component does know, and its effect runs after PageTitle's, so it gets
     the last word. */
  useEffect(() => {
    document.title = "Not found · Loop";
  }, [pathname]);

  return (
    <div
      className="min-h-screen px-6 py-16 md:px-12"
      style={{ background: PAPER, color: INK }}
    >
      <div className="mx-auto max-w-[620px]">
        <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-70">
          <LoopMark size={30} />
          <span
            className="text-[26px] italic leading-none"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            Loop
          </span>
        </Link>

        <h1
          className="mt-16 text-[38px] leading-[1.06] md:text-[52px]"
          style={{
            fontFamily: "Instrument Serif, Georgia, serif",
            letterSpacing: "-0.015em",
          }}
        >
          There's nothing at
          <br />
          <span className="italic" style={{ color: CLARET }}>
            this address.
          </span>
        </h1>

        <p className="mt-6 text-[16px] leading-[1.62]" style={{ color: "#4A4540" }}>
          Either the link was wrong, or something that used to live here
          doesn't any more. Nothing is broken — this page just doesn't exist.
        </p>

        {/* The path, quietly, because a person reporting a dead link needs
            to be able to read it back to you. */}
        <p
          className="mt-3 text-[13px]"
          style={{ color: MUTED, fontFamily: "ui-monospace, monospace" }}
        >
          {pathname}
        </p>

        <nav className="mt-12">
          {[
            ["/", "The front page", "What Loop is, and what's on it today."],
            ["/community", "Browse what's on Loop", "Every offered thing, with its real price."],
            ["/support", "Help and support", "If something is genuinely broken, tell us."],
          ].map(([to, title, body]) => (
            <Link
              key={to}
              to={to}
              className="block py-5 transition-opacity hover:opacity-70"
              style={{ borderTop: `1px solid ${HAIRLINE}` }}
            >
              <span className="text-[17px] font-semibold" style={{ color: CLARET }}>
                {title} &rarr;
              </span>
              <span className="mt-1 block text-[15px]" style={{ color: MUTED }}>
                {body}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default NotFound;
