import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf, Apple, Facebook, Phone, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import authHero from "@/assets/auth-hero.jpg";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        const { error } = await supabase.auth.signUp({
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
        toast.success(t('auth.signUpSuccess'));
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.authError'));
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

  const handleSocialAuth = async (provider: 'apple' | 'facebook' | 'google') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || t('auth.authError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-subtle px-4 py-8">
      <div className="w-full max-w-md mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.home')}
        </Link>
      </div>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-eco flex items-center justify-center">
              <Leaf className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? t('auth.welcomeBack') : t('auth.joinEco')}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? t('auth.signInDesc')
              : t('auth.createAccountDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={!usePhone ? "default" : "outline"}
              onClick={() => setUsePhone(false)}
              className="flex-1"
            >
              Email
            </Button>
            <Button
              type="button"
              variant={usePhone ? "default" : "outline"}
              onClick={() => setUsePhone(true)}
              className="flex-1"
            >
              <Phone className="w-4 h-4 mr-2" />
              Phone
            </Button>
          </div>

          {usePhone ? (
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.pleaseWait') : 'Send Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.pleaseWait') : isLogin ? t('auth.signIn') : t('auth.signUp')}
            </Button>
          </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialAuth('google')}
              disabled={loading}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLogin ? 'Sign in' : 'Sign up'} with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialAuth('apple')}
              disabled={loading}
              className="w-full"
            >
              <Apple className="w-5 h-5 mr-2" />
              {isLogin ? 'Sign in' : 'Sign up'} with Apple
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialAuth('facebook')}
              disabled={loading}
              className="w-full"
            >
              <Facebook className="w-5 h-5 mr-2" />
              {isLogin ? 'Sign in' : 'Sign up'} with Facebook
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin
                ? t('auth.noAccount')
                : t('auth.haveAccount')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
