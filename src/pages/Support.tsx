import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

/**
 * Public Support / contact page (celebrateloop.com/support) — required as the
 * App Store listing's Support URL. Fill the [BRACKETED] support email.
 */
const Support = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <Link to="/">
          <Logo size="sm" />
        </Link>
      </div>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <article className="space-y-5 text-foreground/90 leading-relaxed">
        <h1 className="text-3xl font-bold text-foreground">Help &amp; Support</h1>
        <p>
          Need a hand with Loop? We're happy to help — most questions get a reply
          within a day.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">Contact us</h2>
        <p>
          Email{" "}
          <a href="mailto:[SUPPORT EMAIL]" className="underline font-medium">
            [SUPPORT EMAIL]
          </a>{" "}
          with your question. If it's about a specific item or transaction,
          include the item name and the date so we can find it fast.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">
          Common questions
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Payments &amp; payouts:</strong> money is held securely until
            the buyer/borrower confirms they received the item, then released to
            the other person.
          </li>
          <li>
            <strong>Safety:</strong> you can report or block any user from their
            profile or a conversation (the ⋯ menu).
          </li>
          <li>
            <strong>Delete your account:</strong> in the app, go to Settings →
            Delete account. This permanently removes your account and data.
          </li>
          <li>
            <strong>Premium:</strong> manage or cancel a subscription anytime in
            your Apple ID → Subscriptions.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground pt-2">Report a problem</h2>
        <p>
          For safety concerns, abuse, or a transaction dispute, email{" "}
          <a href="mailto:[SUPPORT EMAIL]" className="underline font-medium">
            [SUPPORT EMAIL]
          </a>{" "}
          and we'll review it promptly.
        </p>

        <p className="pt-6 text-sm text-muted-foreground">
          See also our{" "}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" className="underline">
            Terms of Service
          </Link>
          .
        </p>
      </article>
    </main>
  </div>
);

export default Support;
