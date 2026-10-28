import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { EFFECTIVE_DATE, LEGAL_ENTITY, SUPPORT_EMAIL } from "@/lib/contact";

/**
 * Public Terms of Service page (celebrateloop.com/terms). Content mirrors
 * legal/terms-of-service.md in the mobile repo.
 *
 * Contact details come from src/lib/contact.ts; LEGAL_ENTITY is the one
 * placeholder left on purpose. Still wants a lawyer's read before launch.
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
        <h1 className="font-display-italic text-[34px] leading-[44px]  text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE} · Operator: {LEGAL_ENTITY} ·
          Contact: {SUPPORT_EMAIL}
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

        {/* Rewritten 28 Oct 2026. The previous version said funds "are held
            by our payment processor", which is not what happens: Stripe
            charges the card and the money lands in LOOP's own balance, where
            it stays until both sides confirm. Loop takes custody. Saying
            otherwise understated what Loop does with other people's money.
            It also said only that "Loop charges a service fee disclosed at
            checkout", which omitted the $1 floor — the thing that actually
            surprises people, because below $10 the real share is above 10%.
            The table states it outright. */}
        <h2 className="text-xl font-semibold text-foreground pt-4">
          5. Money: who holds it, what we take, when it moves
        </h2>
        <p>
          <strong className="text-foreground">Loop holds your money.</strong>{" "}
          This is the part worth understanding. When you pay for something, the
          money does not go to the seller and it does not sit with Stripe on
          their behalf. Stripe charges your card and the funds land in Loop's
          own account. We hold them, and we only pass them to the seller when
          the conditions below are met. We chose this because borrows can run
          for weeks and a card authorization expires in seven days — holding
          real money is the only way to make a three-week rental safe for both
          sides.
        </p>
        <p>
          <strong className="text-foreground">What Loop charges.</strong> Our
          fee is 10% of the item price, with a minimum of $1.00 per
          transaction, and it comes out of the seller's payout. The buyer pays
          the listed price and no buyer fee. The $1 minimum matters most on
          cheap things, so here it is plainly:
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="p-3 font-semibold text-foreground">Price</th>
                <th className="p-3 font-semibold text-foreground">Loop's fee</th>
                <th className="p-3 font-semibold text-foreground">Seller gets</th>
                <th className="p-3 font-semibold text-foreground">Loop's share</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[
                ["$2.00", "$1.00", "$1.00", "50%"],
                ["$5.00", "$1.00", "$4.00", "20%"],
                ["$10.00", "$1.00", "$9.00", "10%"],
                ["$25.00", "$2.50", "$22.50", "10%"],
                ["$200.00", "$20.00", "$180.00", "10%"],
              ].map((row) => (
                <tr key={row[0]} className="border-t">
                  {row.map((cell, i) => (
                    <td key={i} className="p-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          On anything at $10 or above, the fee is a flat 10%. Below $10, the $1
          floor takes over, so our share is higher than 10% — on a $2 rental it
          is half. We would rather you see this in a table than discover it on
          your payout screen. The fee is shown before you confirm, every time.
          There is no listing fee, no monthly fee, and no fee if nothing sells.
        </p>
        <p>
          <strong className="text-foreground">Courier delivery</strong> is
          extra, paid by the buyer on top of the item price, and passed to the
          courier company. It is not part of Loop's fee and we don't mark it up.
        </p>
        <p className="font-semibold text-foreground pt-2">
          When the money is released to the seller
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong className="text-foreground">Normally</strong> — when both of
            you confirm the handoff in the app. You each tap Confirm; when the
            second tap lands, the transfer goes out.
          </li>
          <li>
            <strong className="text-foreground">If you're the buyer</strong> and
            you've got your item, you can confirm receipt on your own and
            release the money without waiting for the seller.
          </li>
          <li>
            <strong className="text-foreground">If a courier delivered it</strong>{" "}
            and the buyer doesn't confirm within 72 hours of delivery, we
            confirm on their behalf and pay the seller. A neutral courier has
            already reported the item delivered; leaving the seller unpaid
            forever isn't a fair outcome.
          </li>
        </ul>
        <p className="font-semibold text-foreground pt-2">
          When the money comes back to the buyer
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong className="text-foreground">Seller never responds</strong> —
            if a paid sale sits waiting on the seller for more than 72 hours, we
            refund the buyer automatically and relist the item.
          </li>
          <li>
            <strong className="text-foreground">Borrow request dies</strong> — if
            you paid a rental fee and the request is declined, cancelled or
            expires, we refund the fee automatically.
          </li>
          <li>
            <strong className="text-foreground">Payment never completes</strong>{" "}
            — an unfinished payment is cleaned up after 24 hours.
          </li>
        </ul>
        <p>You don't have to chase any of this. It runs on its own.</p>
        <p>
          <strong className="text-foreground">
            If the seller hasn't set up payouts yet,
          </strong>{" "}
          they can still sell. The money stays held and transfers the moment
          they finish their Stripe payout setup. Nothing is lost.
        </p>
        <p>
          <strong className="text-foreground">Disputes freeze the money.</strong>{" "}
          Either side can raise a dispute in the app. While a dispute is open
          the funds stay with Loop — not released and not refunded — until it is
          resolved. Loop is not a party to your transaction, so arguments about
          an item's condition are primarily between the two of you; we will help
          mediate, and we can refund or release, but we are not an insurer and
          we do not guarantee any item.
        </p>
        <p>
          <strong className="text-foreground">Stripe's terms.</strong> Payments
          and payouts run through Stripe, so transacting on Loop means Stripe's
          terms apply to you too. Receiving payouts requires completing Stripe's
          seller onboarding, including their identity checks.
        </p>

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
          liability for any claim is limited to the greater of $100 or the fees you
          paid Loop in the six months before the claim.
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
          These Terms are governed by the laws of the State of New York, without
          regard to conflict-of-laws rules. Any dispute will be brought in the
          state or federal courts located in New York County, New York.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          13. Contact
        </h2>
        <p>{LEGAL_ENTITY} · {SUPPORT_EMAIL}</p>

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
