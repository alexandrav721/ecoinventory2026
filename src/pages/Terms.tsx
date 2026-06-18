import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

/**
 * Public Terms of Service page (celebrateloop.com/terms). Content mirrors
 * legal/terms-of-service.md in the mobile repo. Fill the [BRACKETED]
 * placeholders and have a lawyer review before launch.
 */
const Terms = () => (
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
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Effective date: [EFFECTIVE DATE] · Operator: [LEGAL ENTITY NAME] ·
          Contact: [SUPPORT EMAIL]
        </p>
        <p>
          By creating an account or using Loop (the "App"), you agree to these
          Terms. If you do not agree, do not use the App.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          1. Eligibility
        </h2>
        <p>
          You must be at least 18 and able to form a binding contract. You agree
          to provide accurate information, keep your account secure, and are
          responsible for activity under your account.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          2. What Loop is — and isn't
        </h2>
        <p>
          Loop is a <strong>platform</strong> that lets neighbors lend, rent,
          borrow, buy, and sell physical items with one another. <strong>Loop is
          not a party to transactions between users.</strong> We do not own,
          inspect, or guarantee listed items. Users are solely responsible for
          their listings, items, communications, handoffs, returns, and conduct.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          3. Acceptable use &amp; prohibited items
        </h2>
        <p>
          You agree not to list, request, or exchange anything illegal, stolen,
          recalled, counterfeit, hazardous, or otherwise prohibited (including
          weapons, regulated substances, and items you don't have the right to
          share), and not to harass, defraud, or abuse other users, post
          objectionable content, or circumvent fees.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          4. Content &amp; objectionable-content policy
        </h2>
        <p>
          You retain ownership of content you post (including item photos) and
          grant Loop a non-exclusive, worldwide license to host and display it
          to operate the App. <strong>Loop has zero tolerance for objectionable
          content or abusive behavior.</strong> You can report content or users
          and block users in the App. We review reports and may remove content,
          suspend, or permanently remove violators, typically within 24 hours of
          a report.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          5. Transactions, payments &amp; fees
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Payments are processed by Stripe; by transacting you also agree to
            Stripe's applicable terms. Payouts require Stripe Connect onboarding.
          </li>
          <li>
            For paid transactions, funds are held by our payment processor and
            released to the seller/owner after the buyer/borrower confirms
            receipt or the item is returned, per the in-app flow.
          </li>
          <li>
            Loop charges a service fee disclosed at checkout. Rental fees,
            deposits, durations, and return conditions are set between users.
          </li>
          <li>
            Refunds, cancellations, and disputes follow the in-app process. As
            Loop is not a party to transactions, disputes about item condition
            or completion are primarily between the users involved; Loop may, at
            its discretion, help mediate.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          6. Rentals, returns &amp; responsibility
        </h2>
        <p>
          Borrowers must return items on time and in the agreed condition.
          Owners are responsible for the safety and accurate description of
          items they lend. You assume the risks of meeting, handing off,
          lending, and borrowing with other users.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          7. Disclaimers
        </h2>
        <p className="uppercase text-sm">
          The App and all content and items are provided "as is" and "as
          available," without warranties of any kind. Loop does not warrant the
          quality, safety, legality, or accuracy of any listing or user.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          8. Limitation of liability
        </h2>
        <p className="uppercase text-sm">
          To the maximum extent permitted by law, Loop and its operators will
          not be liable for any indirect, incidental, special, or consequential
          damages, or for disputes, items, or conduct between users. Our total
          liability for any claim is limited to [AMOUNT — e.g. the greater of
          $100 or fees you paid Loop in the prior 6 months].
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          9. Indemnification
        </h2>
        <p>
          You agree to indemnify and hold Loop harmless from claims arising out
          of your content, items, transactions, or violation of these Terms.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          10. Termination
        </h2>
        <p>
          You may delete your account any time in Settings → Delete account. We
          may suspend or terminate accounts that violate these Terms or create
          risk for the community.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          11. Changes
        </h2>
        <p>
          We may update these Terms and will post the new effective date.
          Continued use after changes means you accept them.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          12. Governing law &amp; disputes
        </h2>
        <p>
          These Terms are governed by the laws of [STATE / JURISDICTION], without
          regard to conflict-of-laws rules. [Optional arbitration / venue clause
          — have your attorney draft.]
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          13. Contact
        </h2>
        <p>[LEGAL ENTITY NAME] · [SUPPORT EMAIL]</p>

        <p className="pt-6 text-sm text-muted-foreground">
          See also our{" "}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </article>
    </main>
  </div>
);

export default Terms;
