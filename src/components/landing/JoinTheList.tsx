import { useId, useState } from "react";
import { CLARET, HAIRLINE, INK, MUTED, PAPER } from "@/components/brand";

/**
 * The waitlist signup — one email in, nothing readable back out.
 *
 * WHY THIS IS HERE. celebrateloop.com was a separate hand-written static
 * page whose only job was collecting addresses, while this React app was
 * the actual website. Two pages, two jobs, one domain between them. This
 * moves the collecting into the real site so a single page can take an
 * email, hand out the App Store link, and be the website — which is what
 * was asked for.
 *
 * WHY IT POSTS WITH fetch AND NOT THE SUPABASE CLIENT. `waitlist` is not
 * in src/integrations/supabase/types.ts (that file was generated before
 * the table existed), so `supabase.from("waitlist")` is a type error and
 * the only ways past it are a cast or regenerating 4,000 lines of types.
 * A plain POST to the REST endpoint needs neither, and it is byte-for-byte
 * the request the old static page made — a request already proven against
 * this table's policy. It reads the same two env vars the generated client
 * reads, so it follows the project automatically.
 *
 * WHY POSTING A PUBLIC KEY FROM THE BROWSER IS SAFE HERE. The anon key is
 * designed to be public and already ships inside the iOS app bundle. The
 * protection is the policy, not the key: celebrateloop-site/waitlist.sql
 * grants INSERT and deliberately grants NO SELECT, and under row-level
 * security anything without a policy is denied. So this form can add an
 * address and cannot read the list back. Alexandra reads her own list in
 * the Supabase Table Editor, which connects as the service role.
 *
 * A 409 IS A SUCCESS. The table has a unique index on lower(email), so a
 * second signup is rejected. Telling someone "you are already on the list"
 * is unfriendly and also discloses that her address is stored, so both
 * outcomes say the same thing.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

/** Where to write to when the form can't. Her own address, from the old page. */
export const FALLBACK_EMAIL = "hello@celebrateloop.com";

/* Deliberately loose. This catches a typo and a pasted sentence; it does not
   try to decide which addresses are real, because that is not decidable and
   every strict email regex on the internet rejects somebody's real inbox.
   The database applies its own floor (an '@', 5–320 characters). */
const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;

type State =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "done" }
  | { phase: "error"; message: string };

export function JoinTheList({ dark = false }: { dark?: boolean }) {
  const id = useId(); // two of these render on one page — ids must differ
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  const ink = dark ? PAPER : INK;
  const onPaper = dark ? INK : PAPER;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase === "sending") return;

    // A bot filled the field no human can see. Thank it and write nothing.
    if (honeypot) {
      setState({ phase: "done" });
      return;
    }

    const value = email.trim();
    if (!LOOKS_LIKE_EMAIL.test(value)) {
      setState({ phase: "error", message: "That email doesn't look quite right." });
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setState({
        phase: "error",
        message: `Our signup form isn't reachable. Email ${FALLBACK_EMAIL} and we'll add you by hand.`,
      });
      return;
    }

    setState({ phase: "sending" });
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          // Ask for nothing back. There is no SELECT policy, so requesting
          // the inserted row would turn a successful write into a failure.
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email: value, source: "site" }),
      });
      if (r.ok || r.status === 409) {
        setState({ phase: "done" });
        return;
      }
      throw new Error(`HTTP ${r.status}`);
    } catch {
      /* Never swallow this. An address typed into a form that quietly
         discards it is worse than no form, so say so and give her
         somewhere else to put it. */
      setState({
        phase: "error",
        message: `Something went wrong on our end. Email ${FALLBACK_EMAIL} and we'll add you by hand.`,
      });
    }
  }

  if (state.phase === "done") {
    return (
      <p
        className="text-[15px] leading-relaxed"
        style={{ color: dark ? PAPER : "#4A4540" }}
        role="status"
      >
        Thank you — you're on the list. We'll be in touch when Loop opens near
        you.
      </p>
    );
  }

  const sending = state.phase === "sending";

  return (
    <div className="w-full max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          Your email address
        </label>
        <input
          id={id}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.phase === "error") setState({ phase: "idle" });
          }}
          aria-invalid={state.phase === "error"}
          className="loop-field min-w-0 flex-1 rounded-full px-5 py-3.5 text-base outline-none transition-colors"
          style={{
            background: dark ? "rgba(255,255,255,0.08)" : PAPER,
            color: ink,
            border: `1px solid ${dark ? "rgba(255,255,255,0.28)" : HAIRLINE}`,
          }}
        />

        {/* Not display:none — some bots skip hidden fields. Off-screen and
            out of the tab order, so nobody using a keyboard or a screen
            reader can land in it by accident. */}
        <input
          type="text"
          name="company"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          disabled={sending}
          className="inline-flex shrink-0 items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: ink, color: onPaper }}
        >
          {sending ? "One moment…" : "Join the FiDi list"}
        </button>
      </form>

      {/* aria-live so the outcome reaches a screen reader; the container is
          always present, because a live region added at the same moment as
          its text is not reliably announced. */}
      <p
        className="mt-3 min-h-[1.25rem] text-xs leading-relaxed"
        style={{
          color:
            state.phase === "error" ? CLARET : dark ? "rgba(255,255,255,0.7)" : MUTED,
        }}
        role="status"
        aria-live="polite"
      >
        {state.phase === "error"
          ? state.message
          : "Free, for iPhone. One email when Loop opens on your block. Nothing else, ever."}
      </p>
    </div>
  );
}
