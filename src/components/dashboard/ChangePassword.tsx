import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Change your password while signed in.
 *
 * WHY THIS EXISTS. Until now the only way to change a Loop password was to
 * claim you had forgotten it and wait for an email — there was no
 * change-password anywhere, on the website or in the app. That is a gap on
 * its own, and worse here than in most products because the recovery email
 * goes through a sender that is explicitly for testing, so "forgot password"
 * works mechanically and often not in practice.
 *
 * IT ASKS FOR THE CURRENT PASSWORD, which Supabase does not require:
 * updateUser({ password }) will change it on the strength of the session
 * alone, so an unattended logged-in browser is enough to lock the owner out
 * of their own account. Re-authenticating first costs one request.
 *
 * SOCIAL SIGN-IN HAS NO PASSWORD. Someone who joined with Apple or Google
 * has none, and showing them this form would be asking for something that
 * does not exist — they are told that instead.
 *
 * The rules match the website's signup and reset screens exactly — eight
 * characters with a capital, a lowercase and a number. Checked rather than
 * assumed: those two already agreed; it was the APP's reset screen that
 * accepted any eight characters, which is fixed in the same change.
 */

const PASSWORD_RULE =
  "At least 8 characters, with a capital, a lowercase and a number.";

function checkPassword(pw: string): string | null {
  if (pw.length < 8) return "That needs to be at least 8 characters.";
  if (pw.length > 100) return "That's longer than 100 characters.";
  if (!/[A-Z]/.test(pw)) return "Add a capital letter.";
  if (!/[a-z]/.test(pw)) return "Add a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Add a number.";
  return null;
}

export function ChangePassword() {
  const [email, setEmail] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      setEmail(u?.email ?? null);
      const ids = (u?.identities ?? []).map((i) => i.provider);
      setHasPassword(ids.length === 0 ? true : ids.includes("email"));
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const problem = checkPassword(next);
    if (problem) return toast.error(problem);
    if (next !== confirm) return toast.error("The two new passwords are different.");
    if (next === current)
      return toast.error("The new one needs to be different from the old one.");

    setBusy(true);
    // Prove it's really them before changing anything.
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (authErr) {
      setBusy(false);
      return toast.error("That current password isn't right.");
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return toast.error(error.message);

    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success(
      "Password changed. You're still signed in here; anywhere else will need the new one."
    );
  };

  if (hasPassword === null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          {hasPassword
            ? PASSWORD_RULE
            : "You signed in with Apple or Google, so Loop never stored a password for you."}
        </CardDescription>
      </CardHeader>
      {hasPassword && (
        <CardContent>
          <form onSubmit={submit} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="cp-current">Current password</Label>
              <Input
                id="cp-current"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-next">New password</Label>
              <Input
                id="cp-next"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-confirm">New password again</Label>
              <Input
                id="cp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={busy || !current || !next || !confirm}>
              {busy ? "Changing…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
