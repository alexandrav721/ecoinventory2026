import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

/**
 * Public Privacy Policy page (celebrateloop.com/privacy) — required by the App
 * Store. Content mirrors legal/privacy-policy.md in the mobile repo. Fill the
 * [BRACKETED] placeholders and have a lawyer review before launch.
 */
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
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Effective date: [EFFECTIVE DATE] · Operator: [LEGAL ENTITY NAME] ·
          Contact: [SUPPORT EMAIL]
        </p>
        <p>
          Loop is a neighbor-to-neighbor marketplace for lending, renting,
          buying, and selling physical items. This policy explains what we
          collect, why, who we share it with, and the choices you have.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          1. Information we collect
        </h2>
        <p className="font-medium">You provide:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Account info</strong> — name, email, and password
            (authentication handled by our provider, Supabase). Sign in with
            Apple or Google shares your name and email with us.
          </li>
          <li>
            <strong>Profile</strong> — display name, optional avatar, and the
            city/area you choose to show.
          </li>
          <li>
            <strong>Listings &amp; content</strong> — item names, descriptions,
            prices, photos you take or upload, collections, and messages.
          </li>
          <li>
            <strong>Transactions</strong> — items bought/sold/rented/borrowed,
            amounts, and request notes.
          </li>
        </ul>
        <p className="font-medium pt-2">Collected automatically / with permission:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Approximate location</strong> (while using the App, with
            permission) — to show items near you and estimate handoff distance.
          </li>
          <li>
            <strong>Contacts</strong> (with permission) — to tell you which
            contacts are already on Loop. Numbers are <strong>hashed on your
            device</strong>; we do not store your raw contacts.
          </li>
          <li>
            <strong>Photos / camera</strong> (with permission) — to add item
            photos and scan receipts.
          </li>
          <li>
            <strong>Usage &amp; diagnostics</strong> — app events, crashes, and
            device/OS info, via our analytics provider (PostHog).
          </li>
          <li>
            <strong>Push token</strong> — if you enable notifications.
          </li>
        </ul>
        <p>
          <strong>Payments</strong> are processed by Stripe. We do not receive
          or store your full card number; we keep transaction metadata (amount,
          status, item, and your Stripe payout identifier).
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          2. How we use information
        </h2>
        <p>
          To operate the marketplace; match you with nearby items and neighbors;
          process and hold/release payments via Stripe; send transactional and
          (if enabled) push notifications; support trust &amp; safety,
          moderation, and fraud prevention; respond to your requests; comply
          with law; and improve the App.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          3. How information is shared
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Other users</strong> — your public profile, listings, and
            messages are visible per your visibility settings.
          </li>
          <li>
            <strong>Service providers</strong> — Stripe (payments), Supabase
            (database, auth, storage, hosting), PostHog (analytics), and our
            push provider, processing data on our behalf.
          </li>
          <li>
            <strong>Legal &amp; safety</strong> — to comply with law, enforce
            our Terms, or protect users.
          </li>
          <li>
            <strong>Business transfers</strong> — in a merger, acquisition, or
            sale of assets.
          </li>
        </ul>
        <p className="font-medium">We do not sell your personal information.</p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          4. Your choices &amp; rights
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Delete your account</strong> any time in Settings → Delete
            account, which removes your account and associated personal data
            (some records may be retained where legally required).
          </li>
          <li>
            Manage location, contacts, photos, and notification permissions in
            your device settings.
          </li>
          <li>
            Depending on where you live (e.g., California/EEA/UK), you may have
            rights to access, correct, delete, or port your data. Contact us at
            [SUPPORT EMAIL] to exercise them.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          5. Data retention
        </h2>
        <p>
          We keep personal data while your account is active and as needed to
          provide the App, then delete or anonymize it, except where longer
          retention is required (e.g., transaction and tax records).
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">6. Security</h2>
        <p>
          We use encryption in transit and access controls. No method is 100%
          secure, but we work to protect your information.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">7. Children</h2>
        <p>
          Loop is not directed to children under 18 and is intended for users
          who can form a binding contract and use payment services.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          8. International users
        </h2>
        <p>
          We operate in the United States; your data may be processed in the
          U.S. and other countries where our providers operate.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">9. Changes</h2>
        <p>
          We may update this policy and will post the new effective date here.
          Material changes will be communicated in-app or by email.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">10. Contact</h2>
        <p>[LEGAL ENTITY NAME] · [SUPPORT EMAIL]</p>

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
