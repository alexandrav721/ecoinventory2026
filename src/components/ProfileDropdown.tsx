import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, User as UserIcon, ChevronDown, Globe, Check } from "lucide-react";

interface ProfileDropdownProps {
  user: User | null;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDemoMode, exitDemoMode } = useDemo();
  const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null);
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    if (!user || isDemoMode) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user, isDemoMode]);

  const handleSignOut = async () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate("/");
      return;
    }
    setProfile(null);
    await supabase.auth.signOut();
    toast.success(t('nav.signOut'));
    // Hard reload to clear any cached auth-dependent state across the app
    window.location.href = "/";
  };

  const getInitials = () => {
    if (isDemoMode) return "D";
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (isDemoMode) return "Demo User";
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email;
    return "User";
  };

  // Logged-out, non-demo: show sign up / log in CTAs instead of an avatar menu
  if (!user && !isDemoMode) {
    return (
      <div className="flex items-center gap-1.5 pl-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-sm"
          onClick={() => navigate("/auth?mode=login")}
        >
          Log in
        </Button>
        <Button
          size="sm"
          className="h-9 px-3 text-sm font-medium"
          onClick={() => navigate("/auth?mode=signup")}
        >
          Sign up free
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2 hover:bg-muted/50">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile?.avatar_url || undefined} alt={getDisplayName()} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            {!isDemoMode && user?.email && (
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            )}
            {isDemoMode && (
              <p className="text-xs leading-none text-primary">Demo Mode</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile-settings")} className="cursor-pointer">
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile-settings")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('nav.profileSettings')}</span>
        </DropdownMenuItem>
        
        {/* Language Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Globe className="mr-2 h-4 w-4" />
            <span>Language</span>
            <span className="ml-auto text-xs text-muted-foreground">{currentLanguage.flag}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => i18n.changeLanguage(language.code)}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{language.flag}</span>
                  {language.name}
                  {i18n.language === language.code && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isDemoMode ? "Exit Demo" : t('nav.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
