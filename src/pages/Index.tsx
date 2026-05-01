import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, Heart, Play, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/DashboardNav";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import { useDemo } from "@/contexts/DemoContext";
import heroBg from "@/assets/hero-community.jpg";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({ totalItems: 0, totalUsers: 0, itemsShared: 0 });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [heroSearch, setHeroSearch] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearch.trim();
    navigate(q ? `/community?q=${encodeURIComponent(q)}` : "/community");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));

    const fetchStats = async () => {
      const { count: itemsCount } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true });
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      const { count: sharedCount } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("is_available_for_sharing", true);

      setStats({
        totalItems: itemsCount || 0,
        totalUsers: usersCount || 0,
        itemsShared: sharedCount || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isLoggedIn ? (
        <nav className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-6 h-20 flex items-center gap-6">
            <Logo size="sm" />
            <form onSubmit={handleHeroSearch} className="relative flex-1 max-w-xl hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search cameras, bikes, espresso machines…"
                className="h-11 pl-11 pr-4 rounded-full bg-secondary/60 border-transparent focus-visible:bg-background focus-visible:border-foreground/20 text-sm"
              />
            </form>
            <div className="ml-auto">
              <DashboardNav />
            </div>
          </div>
        </nav>
      ) : (
        <nav className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-6 h-20 flex items-center gap-6">
            <Logo size="sm" />

            {/* Search — sits next to logo, like Pickle */}
            <form onSubmit={handleHeroSearch} className="relative flex-1 max-w-xl hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search cameras, bikes, espresso machines…"
                className="h-11 pl-11 pr-4 rounded-full bg-secondary/60 border-transparent focus-visible:bg-background focus-visible:border-foreground/20 text-sm"
              />
            </form>

            <div className="flex items-center gap-6 ml-auto">
              <Link to="/how-it-works" className="text-sm font-medium tracking-wide hover:text-primary transition-colors hidden sm:inline">
                How It Works
              </Link>
              <Link to="/articles" className="text-sm font-medium tracking-wide hover:text-primary transition-colors hidden sm:inline">
                Articles
              </Link>
              <Link to="/founders" className="text-sm font-medium tracking-wide hover:text-primary transition-colors hidden md:flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                Founders
              </Link>
              <Button asChild size="sm" variant="outline" className="rounded-full border-foreground/30 hover:bg-foreground hover:text-background">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* HERO — Full-bleed editorial with search */}
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            width={1920}
            height={1080}
            className="w-full h-full object-cover object-right"
          />
          {/* Left-to-right fade so left side stays clean for type */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
        </div>

        <div className="relative container mx-auto px-6 pt-12 pb-24 md:pt-16 md:pb-40 min-h-[560px] md:min-h-[640px] flex flex-col">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="editorial-rule" />
              <span>Vol. 01 · A different way to own things</span>
            </div>
          </div>

          {/* Bottom-left: massive headline */}
          <div className="mt-auto pt-20 md:pt-32 max-w-4xl">
            <h1 className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] font-light text-foreground">
              Buy less.
              <br />
              <span className="italic font-display-wonk text-primary">Access more.</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 mt-8 max-w-xl leading-relaxed">
              <span className="italic font-display-wonk">Rent</span>, <span className="italic font-display-wonk">donate</span>, and <span className="italic font-display-wonk">buy</span> from neighbors and friends. Your next purchase is probably <span className="italic font-display-wonk">three doors down.</span>
            </p>
            <p className="text-base md:text-lg text-foreground/60 mt-5 max-w-xl leading-relaxed">
              Track everything you already own — we'll flag the <span className="italic font-display-wonk text-foreground/80">duplicates</span>, the <span className="italic font-display-wonk text-foreground/80">excess</span>, and the things gathering dust — so you never re-buy what's already on a shelf.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-10">
              {isLoggedIn ? (
                <Button asChild size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 h-14 px-8 text-base">
                  <Link to="/dashboard">
                    {t('home.hero.goToDashboard')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 h-14 px-8 text-base">
                  <Link to="/auth">
                    Sign up — it's free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="rounded-full border-foreground/30 hover:bg-foreground hover:text-background gap-2 h-14 px-8 text-base">
                <Link to="/demo">
                  <Play className="w-4 h-4" />
                  Try the demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* THE MATH — Big editorial numbers */}
      <section className="border-b border-border/60">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mb-20">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">§ The math</div>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.05] font-light">
              {t('home.math.title')}
            </h2>
            <p className="text-lg text-muted-foreground mt-6 leading-relaxed max-w-xl">
              {t('home.math.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { v: t('home.math.stat1.value'), l: t('home.math.stat1.label'), d: t('home.math.stat1.desc'), num: '01' },
              { v: t('home.math.stat2.value'), l: t('home.math.stat2.label'), d: t('home.math.stat2.desc'), num: '02' },
              { v: t('home.math.stat3.value'), l: t('home.math.stat3.label'), d: t('home.math.stat3.desc'), num: '03' },
            ].map((s) => (
              <div key={s.num} className="py-10 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">{s.num}</div>
                <div className="font-display text-6xl md:text-7xl font-light text-primary mb-3">{s.v}</div>
                <div className="font-display italic text-2xl mb-4">{s.l}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>

          <p className="font-display italic text-2xl md:text-3xl text-foreground/70 mt-20 max-w-2xl leading-snug">
            "{t('home.math.footnote')}"
          </p>
        </div>
      </section>

      {/* FEATURES — Numbered editorial list, asymmetric */}
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-12 gap-12 mb-20">
            <div className="md:col-span-5">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">§ What it does</div>
              <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-light">
                {t('home.features.title')}
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7 md:pt-12">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('home.features.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-16">
            {[
              { n: '01', t: t('home.features.valueTracking.title'), d: t('home.features.valueTracking.desc') },
              { n: '02', t: t('home.features.smartSearch.title'), d: t('home.features.smartSearch.desc') },
              { n: '03', t: t('home.features.communitySharing.title'), d: t('home.features.communitySharing.desc') },
              { n: '04', t: t('home.features.ecoFriendly.title'), d: t('home.features.ecoFriendly.desc') },
            ].map((f) => (
              <div key={f.n} className="group">
                <div className="flex items-baseline gap-6 mb-4">
                  <span className="font-display text-5xl text-primary/60 group-hover:text-primary transition-colors">{f.n}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-light mb-3 leading-tight">{f.t}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="border-b border-border/60">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">§ How it works</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] font-light max-w-3xl mb-20">
            {t('home.howItWorks.title')}
          </h2>

          <div className="space-y-px bg-border">
            {[
              { n: 'I', t: t('home.howItWorks.step1.title'), d: t('home.howItWorks.step1.desc') },
              { n: 'II', t: t('home.howItWorks.step2.title'), d: t('home.howItWorks.step2.desc') },
              { n: 'III', t: t('home.howItWorks.step3.title'), d: t('home.howItWorks.step3.desc') },
            ].map((s) => (
              <div key={s.n} className="bg-background grid md:grid-cols-12 gap-6 py-10 px-2 md:px-6 items-baseline hover:bg-secondary/40 transition-colors">
                <div className="md:col-span-2 font-display text-4xl text-primary italic">{s.n}</div>
                <h3 className="md:col-span-4 font-display text-2xl md:text-3xl font-light">{s.t}</h3>
                <p className="md:col-span-6 text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO VIDEO */}
      {!isLoggedIn && (
        <section className="border-b border-border/60 bg-secondary/30">
          <div className="container mx-auto px-6 py-24 md:py-32">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">§ Watch</div>
                <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-light mb-6">
                  {t('home.demo.title')}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t('home.demo.subtitle')}</p>
              </div>
              <div className="md:col-span-8">
                <div className="relative aspect-video bg-foreground/5 border border-border overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center mb-4 cursor-pointer hover:bg-primary transition-colors">
                      <Play className="w-7 h-7 text-background ml-1" />
                    </div>
                    <p className="text-sm text-muted-foreground italic font-display">{t('home.demo.placeholder')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STATS strip */}
      <section className="border-b border-border/60">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8 md:divide-x divide-border">
            <div className="md:px-8 first:md:pl-0">
              <div className="font-display text-5xl md:text-6xl font-light">{stats.totalItems.toLocaleString()}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">{t('home.stats.totalItems')}</div>
            </div>
            <div className="md:px-8">
              <div className="font-display text-5xl md:text-6xl font-light">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">{t('home.stats.activeMembers')}</div>
            </div>
            <div className="md:px-8 last:md:pr-0">
              <div className="font-display text-5xl md:text-6xl font-light">{stats.itemsShared.toLocaleString()}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">{t('home.stats.itemsShared')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Big editorial */}
      <section className="bg-foreground text-background">
        <div className="container mx-auto px-6 py-24 md:py-40 text-center">
          <h2 className="font-display text-5xl md:text-8xl font-light leading-[0.95] max-w-4xl mx-auto">
            {t('home.cta.title').split('.').map((line, i, arr) => (
              <span key={i}>
                {i === 1 ? <span className="italic font-display-wonk text-primary">{line}.</span> : line + (i < arr.length - 1 && line ? '.' : '')}
                {i < arr.length - 2 && line && <br />}
              </span>
            ))}
          </h2>
          <p className="text-lg text-background/60 mt-10 max-w-xl mx-auto leading-relaxed">
            {t('home.cta.subtitle')}
          </p>
          <Button asChild size="lg" className="rounded-full mt-10 bg-background text-foreground hover:bg-secondary gap-2">
            <Link to="/auth">
              {t('home.cta.button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="font-display text-base normal-case tracking-normal italic">Loop</span>
          <p>{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
