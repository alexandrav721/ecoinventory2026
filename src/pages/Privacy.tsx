import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { EFFECTIVE_DATE, LEGAL_ENTITY, SUPPORT_EMAIL } from "@/lib/contact";

/**
 * Public Privacy Policy (celebrateloop.com/privacy) — one of the three URLs
 * an App Store submission points at, and the one Apple actually reads.
 *
 * REWRITTEN 28 Oct 2026, and the reason matters. This page is replacing a
 * hand-written static page at the same URL, and the version it replaced
 * disclosed things this one did not: Anthropic, session replay, and Expo.
 * Publishing the old version of this file would have silently DELETED
 * disclosures from a URL Apple already has on file — a downgrade, shipped as
 * an upgrade.
 *
 * An audit of both codebases then found the gap was far wider than AI.
 * Twelve companies receive Loop users' data. Four were named in-app, five on
 * the old static site, three here. The two worst omissions were not the
 * obvious one: OpenAI receives users' raw VOICE RECORDINGS through Whisper,
 * and Uber Direct receives BOTH neighbours' full street addresses and phone
 * numbers in a single payload. Neither was named anywhere.
 *
 * So this is written as a strict superset of everything previously
 * disclosed, and section 5 is the complete list rather than a representative
 * one. If a processor is added to the product, it is added here in the same
 * commit. That is the only way this page stays true.
 *
 * Contact details come from src/lib/contact.ts so they cannot drift between
 * Privacy, Terms and Support again.
 */

/** A processor row in section 5. */
type Row = { who: string; what: string; when: string };

const ESSENTIAL: Row[] = [
  {
    who: "Supabase",
    what: "Everything: your account, profile, listings, photos, messages, transactions, contact fingerprints. Our database, login, file storage and server code all run here.",
    when: "Always",
  },
  {
    who: "Stripe",
    what: "Payment and payout data; card details direct from your phone; the amount, item and both user IDs on each transaction. Sellers give Stripe identity and bank details directly.",
    when: "When money moves",
  },
  {
    who: "Apple / Google",
    what: "Your name and email, if you sign in with Apple or Google. Apple also processes any subscription purchase.",
    when: "At sign-in",
  },
  {
    who: "Expo",
    what: "Your push token, and the full text of each notification — which includes the other person's display name and the item's name.",
    when: "Each notification",
  },
  {
    who: "Cloudflare",
    what: "Serves this website, so every visitor's IP address. Also runs the inbox behind our @celebrateloop.com addresses, so any email you send us passes through Cloudflare on its way to us.",
    when: "Always",
  },
];

const OPTIONAL: Row[] = [
  {
    who: "Anthropic",
    what: "Photos, your messages, your first name, your item list, receipt text, whole forwarded emails, and item wording used as a web search query. Full detail in section 4.",
    when: "Using an AI feature",
  },
  {
    who: "OpenAI",
    what: "Your voice recording; the assistant's reply text.",
    when: "Talking to the assistant",
  },
  {
    who: "Replicate",
    what: "The photo you're cleaning up.",
    when: "One-tap photo cleanup",
  },
  {
    who: "PhotoRoom",
    what: "The photo you're cleaning up.",
    when: "One-tap photo cleanup",
  },
  {
    who: "Twilio",
    what: "Your phone number and the verification code.",
    when: "Verifying your phone",
  },
  {
    who: "Uber",
    what: "For courier delivery: the seller's full street address, phone number and name, and the buyer's full street address, phone number, name and delivery notes, plus the item's name and value — so a driver can collect and deliver it. If you meet in person instead, Uber receives nothing.",
    when: "Choosing courier delivery",
  },
  {
    who: "PostHog",
    what: "Your user ID, email, display name, city and state, plus app events, crashes, and masked screen recordings.",
    when: "Always, while you use the app",
  },
  {
    who: "Google Fonts",
    what: "Your IP address and browser, from this website, because we load two typefaces from Google.",
    when: "Visiting this site",
  },
  {
    who: "OpenStreetMap",
    what: "Your postcode, if you set your area by postcode on the website.",
    when: "Setting your area",
  },
];

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-foreground pt-6">{children}</h2>
  );
}

/** A labelled paragraph: the bolded lead-in carries the scanning. */
function Term({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p>
      <strong className="text-foreground">{label}</strong> — {children}
    </p>
  );
}

function ProcessorTable({ rows, caption }: { rows: Row[]; caption: string }) {
  return (
    <div className="pt-2">
      <p className="font-semibold text-foreground">{caption}</p>
      {/* Its own scroll container, so a wide table never makes the page
          itself scroll sideways on a phone. */}
      <div className="mt-3 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left">
              <th className="p-3 font-semibold text-foreground">Who</th>
              <th className="p-3 font-semibold text-foreground">What they get</th>
              <th className="p-3 font-semibold text-foreground">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.who} className="border-t align-top">
                <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                  {r.who}
                </td>
                <td className="p-3">{r.what}</td>
                <td className="p-3 whitespace-nowrap">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <Link to="/">
          <Logo size="sm" />
        </Link>
      </div>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <article className="space-y-5 text-foreground/90 leading-relaxed">
        <h1 className="font-display-italic text-[34px] leading-[44px] text-foreground">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE} · Operator: {LEGAL_ENTITY} ·
          Contact: {SUPPORT_EMAIL}
        </p>
        <p>
          Loop is a neighbor-to-neighbor marketplace for lending, renting,
          borrowing, buying and selling physical things. This page says what we
          collect, why, who else sees it, and what you can do about it. It is
          written to be read, not to be survived.
        </p>

        <H>1. What you give us</H>
        <Term label="Account">
          your name, email and password. Authentication is handled by Supabase,
          our database provider. If you sign in with Apple or Google, we receive
          your name and email from them.
        </Term>
        <Term label="Profile">
          display name, an optional photo, and the city or area you choose to
          show. Optionally a phone number, and, if you want couriered delivery,
          a pickup address.
        </Term>
        <Term label="Listings and content">
          item names, descriptions, prices, the photos you take or upload,
          collections, and the messages you send other people.
        </Term>
        <Term label="Transactions">
          what you bought, sold, rented, lent or borrowed, the amounts, and your
          request notes.
        </Term>

        <H>2. What we collect automatically, or with your permission</H>
        <Term label="Location (only if you allow it)">
          the coordinates your device reports. These are saved to your profile
          and used to show you things nearby, estimate how far a handoff is, and
          place you on the neighborhood map at the precision you pick. On the
          map, every item is snapped to a coarse grid roughly half a mile
          across, so your exact address is never a pin. You can clear your
          coordinates any time by editing your profile, and you can refuse the
          permission outright and still use Loop.
        </Term>
        <Term label="Contacts (only if you allow it)">
          so we can tell you which of your contacts are already here. Phone
          numbers and email addresses are turned into one-way SHA-256
          fingerprints <strong className="text-foreground">on your phone</strong>,
          before anything leaves it. We receive the fingerprints and compare them
          to other members' fingerprints. We never receive, and never store, your
          actual contact list.
        </Term>
        <Term label="Photos and camera (only if you allow it)">
          to add item photos and scan receipts.
        </Term>
        <Term label="Usage and diagnostics">
          app events, crashes, and device and OS information, processed by
          PostHog to keep Loop working.
        </Term>
        <Term label="Session recordings">
          PostHog records a replay of your screen while you use Loop, so we can
          find bugs. Everything you type is masked, every image and photo is
          masked, and we do not record network traffic. We do record the app's
          own debug log lines. Recordings are tied to your account.
        </Term>
        <Term label="Push token">
          if you turn notifications on, so we can deliver them.
        </Term>
        <Term label="AI inputs">see section 4. That section is long on purpose.</Term>

        <H>3. Payments</H>
        <p>
          Card payments are processed by Stripe. Your card number goes from your
          phone straight to Stripe; it never passes through Loop and we never
          store it. We keep transaction records: the amount, the status, the
          item, who was on each side, and your Stripe account identifier for
          payouts.
        </p>
        <p>
          If you want to be paid, Stripe collects identity details from you
          directly as part of their legally required seller checks — typically
          your legal name, date of birth, address and bank details. That happens
          inside Stripe's own flow. We see only whether you passed.
        </p>

        <H>4. AI — exactly what gets sent, when, and how to avoid it</H>
        <p>
          Loop uses outside AI services for a handful of features. Nothing here
          runs quietly in the background. Each one fires because you tapped
          something.
        </p>
        <p>
          <strong className="text-foreground">Anthropic</strong> (the company
          behind the Claude models) receives:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-foreground">The photo itself</strong>, at
            full resolution, when you use photo scanning to add an item. It reads
            the photo and guesses the name, brand, color, condition and likely
            price so you type less.
          </li>
          <li>
            <strong className="text-foreground">
              Your message, any photos you attach, your earlier messages in that
              conversation, your first name, and a list of your items
            </strong>{" "}
            (names, brands, prices, quantities) when you use the Loop assistant.
            The assistant needs to see your inventory to answer questions about
            it.
          </li>
          <li>
            <strong className="text-foreground">The text of a receipt</strong>{" "}
            you paste in.
          </li>
          <li>
            <strong className="text-foreground">The whole email</strong>,
            including who sent it and the subject line, if you use the
            receipt-forwarding address. If you forward an email, everything in
            that email goes to Anthropic.
          </li>
          <li>
            <strong className="text-foreground">
              An item's brand, name, category and description
            </strong>{" "}
            when we look for a clean stock product photo for it. For this feature
            only, that text is used as a live web search query — so the words you
            wrote about your item travel out to a search engine. If that bothers
            you, skip the stock-photo suggestion and keep your own photo.
          </li>
          <li>
            <strong className="text-foreground">
              Item names and descriptions
            </strong>{" "}
            when we auto-categorize, suggest tags, suggest collections, or
            suggest outfits.
          </li>
        </ul>
        <p>
          <strong className="text-foreground">OpenAI</strong> receives{" "}
          <strong className="text-foreground">the audio recording itself</strong>{" "}
          when you talk to the assistant instead of typing — your voice is
          uploaded to OpenAI's Whisper service to be turned into text — and{" "}
          <strong className="text-foreground">the assistant's reply text</strong>,
          when the assistant speaks back to you, so OpenAI can generate the
          spoken audio.
        </p>
        <p>
          <strong className="text-foreground">Replicate</strong> and{" "}
          <strong className="text-foreground">PhotoRoom</strong> receive{" "}
          <strong className="text-foreground">the photo</strong> when you use
          one-tap photo cleanup, to cut the background out.
        </p>
        <p>
          What these companies do with it: under their API terms, none of them
          trains its models on what we send. They may hold it briefly for abuse
          monitoring and then delete it. We do not use your AI inputs for
          anything except giving you back the result you asked for.
        </p>
        <p>
          <strong className="text-foreground">How to avoid all of it.</strong>{" "}
          Every AI feature is optional and every one is triggered by a specific
          tap:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Add items by hand instead of scanning a photo, and no photo is ever
            sent to an AI service.
          </li>
          <li>
            Don't open the assistant, and no message, item list or name is sent.
          </li>
          <li>
            Type to the assistant instead of using the microphone, and no audio
            is sent to OpenAI.
          </li>
          <li>
            Don't use photo cleanup, and no photo goes to Replicate or
            PhotoRoom.
          </li>
          <li>
            Don't set up receipt forwarding, or stop forwarding, and no email is
            parsed.
          </li>
          <li>
            Decline the stock-photo suggestion and your item's wording is never
            used as a web search.
          </li>
        </ul>
        <p>
          Your assistant conversations are stored in your account so the
          assistant remembers context. Deleting your account deletes them. If you
          want a single conversation wiped sooner, email us.
        </p>

        <H>5. Who else processes your data</H>
        <p>
          These companies handle data for us, under their own terms, to make Loop
          work. This is the whole list.
        </p>
        <ProcessorTable
          caption="Essential — Loop does not function without these:"
          rows={ESSENTIAL}
        />
        <ProcessorTable
          caption="Optional — only if you use the feature:"
          rows={OPTIONAL}
        />
        <p>
          <strong className="text-foreground">
            We do not sell your personal information.
          </strong>{" "}
          We do not share it for advertising. Nobody on this list is an
          advertiser.
        </p>

        <H>6. What other members see</H>
        <p>
          Your display name, your photo, the area you choose to show, and the
          items you've made visible. Not your email, not your phone number, not
          your exact address. When a sale or borrow is agreed, the other person
          sees what they need to meet you — and if you choose courier delivery,
          your address goes to the courier company rather than to them.
        </p>

        <H>7. How we use it</H>
        <p>
          To run the marketplace; to show you things near you; to take, hold and
          release payments; to send transactional and, if you've enabled them,
          push notifications; to keep people safe and spot fraud; to answer you;
          to obey the law; and to work out which parts of Loop are broken.
        </p>

        <H>8. Your choices and rights</H>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-foreground">Delete your account</strong> any
            time: Settings → Delete account. It removes your account and your
            personal data, including your assistant conversations. We keep what
            the law makes us keep — transaction and tax records, and the minimum
            needed for fraud prevention.
          </li>
          <li>
            <strong className="text-foreground">Turn off</strong> location,
            contacts, photos and notifications in your phone's settings, at any
            time, without losing access to Loop.
          </li>
          <li>
            <strong className="text-foreground">Skip the AI features</strong>{" "}
            entirely — section 4 says how.
          </li>
          <li>
            Depending on where you live (California, the EEA, the UK and
            others), you can ask us for a copy of your data, ask us to correct or
            delete it, ask us to port it, or object to some processing. Email{" "}
            {SUPPORT_EMAIL} and we'll do it.
          </li>
        </ul>

        <H>9. How long we keep it</H>
        <p>
          While your account is live, and for as long as we need it to run Loop.
          Then we delete or anonymize it — except transaction and tax records,
          which we have to keep.
        </p>

        <H>10. Security</H>
        <p>
          Encrypted in transit, with access controls on who at Loop can see what.
          Database access rules mean members can only read what they're allowed
          to read. No system is perfect; we treat it as our job to limit what's
          exposed if something goes wrong.
        </p>

        <H>11. Children</H>
        <p>
          Loop is for adults. You must be 18 or over, old enough to sign a
          contract and use payment services. We don't knowingly collect anything
          from anyone under 18.
        </p>

        <H>12. Where your data lives</H>
        <p>
          We're in the United States. Your data is processed in the US and in
          other countries where the companies in section 5 operate.
        </p>

        <H>13. Changes</H>
        <p>
          If we change this page we'll update the effective date at the top. If a
          change is significant — a new company on the list in section 5, a new
          thing sent to an AI service — we'll tell you in the app or by email
          before it takes effect.
        </p>

        <H>14. Contact</H>
        <p>
          {LEGAL_ENTITY} · {SUPPORT_EMAIL}
        </p>

        <p className="pt-6 text-sm text-muted-foreground">
          See also our{" "}
          <Link to="/terms" className="underline">
            Terms of Service
          </Link>
          .
        </p>
      </article>
    </main>
  </div>
);

export default Privacy;
