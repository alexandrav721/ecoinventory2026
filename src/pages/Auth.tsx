import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Apple, Phone, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { CLARET, FAINT, HAIRLINE, INK, LoopLockup, LoopMark, MUTED, PAPER } from "@/components/brand";

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  /* The address we just sent a confirmation link to. Non-null means "show
     the check-your-email screen". Signing up used to toast "Account
     created." and navigate straight to /dashboard — but this project has
     email confirmation ON (mailer_autoconfirm is false), so there is no
     session yet and the new member landed on a dashboard they could not
     use, never having been told an email was on its way. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* Which social providers this Supabase project actually has configured.
     The Apple button was rendered unconditionally, and the website's
     project has no Apple provider — so it was a button that could only
     ever fail. /auth/v1/settings is a public endpoint that lists them, so
     the page can just ask instead of assuming. Null = still asking; both
     buttons stay enabled until we know, so a slow network never hides a
     working one. */
  const [providers, setProviders] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${base}/auth/v1/settings`, {
          headers: { apikey: key },
        });
        const json = await res.json();
        if (!cancelled) setProviders(json?.external ?? {});
      } catch {
        /* Leave it null — both buttons stay live rather than disappearing
           because one fetch failed. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const providerReady = (name: string) => {
    /* APPLE IS NEVER OFFERED ON THE WEB, even though /auth/v1/settings
       reports it enabled. That endpoint reports whether a provider is
       switched on, NOT whether it has usable web credentials — asked
       directly, /auth/v1/authorize?provider=apple answers
       "Unsupported provider: missing OAuth secret" on both projects.
       The iPhone signs in with Apple natively, through a different
       credential that the web flow cannot use. So the button could only
       ever fail, and a button that can only fail is worse than no
       button. Delete this branch if a web Apple credential is ever
       added. */
    if (name === "apple") return false;
    return providers === null ? true : providers[name] === true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your inbox.");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validation = authSchema.safeParse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t('auth.signInSuccess'));
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        /* Supabase returns a session only when confirmation is switched
           off. Branch on the fact rather than on an assumption, so this
           keeps working whichever way that setting is left. */
        if (data.session) {
          toast.success(t('auth.signUpSuccess'));
          navigate("/dashboard");
        } else {
          setSentTo(email);
        }
      }
    } catch (error: any) {
      /* "Invalid login credentials" is what Supabase says both when the
         password is wrong AND when the account has no password at all —
         which is every account created with Google. Saying only that sends
         people round the password-reset loop for an account that never had
         a password to reset. */
      const raw = String(error?.message ?? "");
      if (/invalid login credentials/i.test(raw)) {
        toast.error(
          "That email and password don't match. If you signed up with Google, use the Google button — a Google account has no password here."
        );
      } else {
        toast.error(raw || t('auth.authError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // For login, user needs to enter OTP (this would require a separate OTP input step)
        toast.info("Phone sign-in requires OTP verification. Please check your SMS.");
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        });
        if (error) throw error;
      } else {
        // For signup with phone
        toast.info("Please check your phone for the verification code.");
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.authError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * GOOGLE / APPLE SIGN-IN WAS BROKEN ON EVERY HOST EXCEPT LOVABLE'S.
   *
   * This used to call a Lovable wrapper (src/integrations/lovable/index.ts)
   * which navigates the browser to `/~oauth/initiate?provider=...`. That
   * path exists only on Lovable's own hosting. Anywhere else — Cloudflare
   * Pages, celebrateloop.com, localhost — it hits the SPA fallback and the
   * app renders its own "404: non-existent route /~oauth/initiate".
   * Confirmed live in a browser, which is the only way this shows up:
   * nothing throws, nothing logs, you just land on a 404.
   *
   * Anyone who signed up with Google was therefore locked out completely:
   * the Google button 404s, and they have no password to fall back on.
   *
   * It now uses Supabase's own OAuth, which both projects already have
   * Google configured for (GET /auth/v1/settings confirms it). No Lovable
   * hosting, no extra service in the path.
   *
   * ONE THING TO KNOW ABOUT redirectTo: Supabase only honours a redirect
   * that matches the project's allow-list (Auth -> URL Configuration).
   * A URL that is NOT on the list does not error — it silently falls back
   * to the project's Site URL, so you end up signed in on a different
   * domain. That is why this sends the bare origin, which is the form most
   * likely to be covered, and why the toast below says where you will
   * land if it is not.
   */
  const handleSocialAuth = async (provider: 'apple' | 'google') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      /* No navigate() here: signInWithOAuth hands the browser to the
         provider. The old code's navigate("/dashboard") ran on a page that
         was already leaving, which is part of why the failure was silent. */
    } catch (error: any) {
      toast.error(
        error?.message
          ? `${provider === 'google' ? 'Google' : 'Apple'} sign-in failed: ${error.message}`
          : t('auth.authError')
      );
      setLoading(false);
    }
  };

  /* ── Shared field + button styling ──────────────────────────────────
     Deliberately not the shadcn <Card> / <Input> / <Button> defaults. This
     page is the front door's doorhandle, and it was wearing a different
     design system: a bordered card floating on grey, a segmented
     Email|Phone control, and — worst — a left panel still advertising "You
     already own four umbrellas" and the colour tiles, both of which were
     cut from the landing page. The site and its sign-in page were selling
     two different products.

     Same vocabulary as the landing page now: paper ground, one centred
     column, hairline rounded fields, an ink pill, Instrument Serif italic
     for the one line that carries the page. */
  const fieldCls =
    "w-full rounded-full px-5 py-3.5 text-base outline-none transition-colors focus:border-current";
  const fieldStyle = {
    background: PAPER,
    color: INK,
    border: `1px solid ${HAIRLINE}`,
  } as const;
  const pillCls =
    "w-full inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-60";

  const label = (htmlFor: string, text: string) => (
    <label
      htmlFor={htmlFor}
      className="block text-[13px] font-semibold mb-1.5"
      style={{ color: MUTED }}
    >
      {text}
    </label>
  );

  return (
    <div className="min-h-screen" style={{ background: PAPER, color: INK }}>
      <header className="px-5 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="inline-flex items-center hover:opacity-70">
            <LoopLockup size={28} type={22} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm hover:opacity-70"
            style={{ color: MUTED }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("nav.home")}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-sm px-5 pb-20 pt-6 sm:pt-12">
        {sentTo ? (
          /* ── Check your email ──────────────────────────────────────────
             The screen that did not exist. Signing up navigated to
             /dashboard with no session, so the one thing a new member
             needed to know — that a link is on its way — was never said. */
          <div className="text-center">
            <div className="flex justify-center">
              <LoopMark size={44} />
            </div>
            <h1
              className="mt-7 text-[30px] italic leading-tight"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              Check your email
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "#4A4540" }}
            >
              We sent a link to <strong style={{ color: INK }}>{sentTo}</strong>.
              Tap it and you're in. It can take a minute, and it sometimes
              lands in spam.
            </p>
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setIsLogin(true);
              }}
              className="mt-8 text-sm font-semibold hover:opacity-70"
              style={{ color: CLARET }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="flex justify-center">
                <LoopMark size={44} />
              </div>
              <h1
                className="mt-7 text-[30px] italic leading-tight"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                {isForgotPassword
                  ? "Reset your password"
                  : isLogin
                    ? t("auth.welcomeBack")
                    : "Join Loop"}
              </h1>
              <p className="mt-3 text-[15px]" style={{ color: MUTED }}>
                {isForgotPassword
                  ? "We'll email you a link to set a new one."
                  : isLogin
                    ? "Sign in to see what's near you."
                    : "Borrow, lend and rent on your block."}
              </p>
            </div>

            {isForgotPassword ? (
              <>
                <form onSubmit={handleForgotPassword} className="mt-8 space-y-4">
                  <div>
                    {label("reset-email", t("auth.email"))}
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={fieldCls}
                      style={fieldStyle}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={pillCls}
                    style={{ backgroundColor: INK, color: PAPER }}
                  >
                    {loading ? t("auth.pleaseWait") : "Send reset link"}
                  </button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm font-semibold hover:opacity-70"
                    style={{ color: CLARET }}
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            ) : usePhone ? (
              <>
                <form onSubmit={handlePhoneAuth} className="mt-8 space-y-4">
                  <div>
                    {label("phone", "Phone number")}
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+1 555 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className={fieldCls}
                      style={fieldStyle}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={pillCls}
                    style={{ backgroundColor: INK, color: PAPER }}
                  >
                    {loading ? t("auth.pleaseWait") : "Send code"}
                  </button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setUsePhone(false)}
                    className="text-sm font-semibold hover:opacity-70"
                    style={{ color: CLARET }}
                  >
                    Use email instead
                  </button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleAuth} className="mt-8 space-y-4">
                  {!isLogin && (
                    <div>
                      {label("fullName", t("auth.fullName"))}
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={!isLogin}
                        className={fieldCls}
                        style={fieldStyle}
                      />
                    </div>
                  )}
                  <div>
                    {label("email", t("auth.email"))}
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={fieldCls}
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      {label("password", t("auth.password"))}
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-[13px] hover:opacity-70"
                          style={{ color: CLARET }}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className={fieldCls}
                      style={fieldStyle}
                    />
                    {!isLogin && (
                      /* Said nothing, then rejected the password after the
                         fact. authSchema wants 8+ with an upper, a lower
                         and a number — so say that before they type. */
                      <p className="mt-2 text-xs" style={{ color: MUTED }}>
                        At least 8 characters, with a capital, a lowercase
                        and a number.
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={pillCls}
                    style={{ backgroundColor: INK, color: PAPER }}
                  >
                    {loading
                      ? t("auth.pleaseWait")
                      : isLogin
                        ? t("auth.signIn")
                        : "Create account"}
                  </button>
                </form>

                {providerReady("google") || providerReady("apple") ? (
                  <div className="my-7 flex items-center gap-4">
                    <span className="h-px flex-1" style={{ background: HAIRLINE }} />
                    <span className="text-xs" style={{ color: FAINT }}>
                      or
                    </span>
                    <span className="h-px flex-1" style={{ background: HAIRLINE }} />
                  </div>
                ) : (
                  <div className="h-7" />
                )}

                <div className="space-y-3">
                  {providerReady("google") && (
                    <button
                      type="button"
                      onClick={() => handleSocialAuth("google")}
                      disabled={loading}
                      className={pillCls}
                      style={{
                        backgroundColor: PAPER,
                        color: INK,
                        border: `1px solid ${HAIRLINE}`,
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  )}
                  {/* Only when the project actually has Apple configured —
                      this used to render unconditionally, so it was a
                      button that could only ever fail. */}
                  {providerReady("apple") && (
                    <button
                      type="button"
                      onClick={() => handleSocialAuth("apple")}
                      disabled={loading}
                      className={pillCls}
                      style={{
                        backgroundColor: PAPER,
                        color: INK,
                        border: `1px solid ${HAIRLINE}`,
                      }}
                    >
                      <Apple className="w-5 h-5" />
                      Continue with Apple
                    </button>
                  )}
                </div>

                <div className="mt-8 space-y-3 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm hover:opacity-70"
                    style={{ color: MUTED }}
                  >
                    {isLogin ? (
                      <>
                        New here?{" "}
                        <span className="font-semibold" style={{ color: CLARET }}>
                          Create an account
                        </span>
                      </>
                    ) : (
                      <>
                        Already on Loop?{" "}
                        <span className="font-semibold" style={{ color: CLARET }}>
                          Sign in
                        </span>
                      </>
                    )}
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => setUsePhone(true)}
                      className="inline-flex items-center gap-1.5 text-[13px] hover:opacity-70"
                      style={{ color: FAINT }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Use a phone number instead
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Auth;
