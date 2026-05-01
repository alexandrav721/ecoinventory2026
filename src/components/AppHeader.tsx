import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import NotificationBell from "@/components/NotificationBell";
import ProfileDropdown from "@/components/ProfileDropdown";
import { useDemo } from "@/contexts/DemoContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

/**
 * Unified app header used across authenticated pages.
 * Layout: Logo + Search on the left, actions on the right, nav below.
 */
export const AppHeader = () => {
  const { isDemoMode } = useDemo();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isDemoMode) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  return (
    <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-14 gap-4">
          {/* Left: Logo + Search (Pickle-style) */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-eco flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <h1 className="text-lg font-bold">{t('dashboard.title')}</h1>
              {isDemoMode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Demo
                </span>
              )}
            </div>
          </Link>

          <div className="shrink-0 w-full max-w-sm">
            <HeaderSearch />
          </div>

          {/* Right: Nav menu items + actions */}
          <div className="flex-1 flex items-center justify-end gap-1 min-w-0 overflow-x-auto">
            <DashboardNav />
            <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l ml-1">
              <NotificationBell userId={user?.id ?? null} />
              <ProfileDropdown user={user} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
