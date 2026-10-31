import { Link, useLocation, useSearchParams } from "react-router-dom";
import { 
  Home, Package, MapPin, FileText, Info, Shield, Users, MessageSquare, 
  BarChart3, FolderTree, ChevronDown, Compass, Bell, Inbox, Activity, LayoutDashboard, Search, Calendar, User, ShoppingBag, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import InviteNeighborsDialog from "./InviteNeighborsDialog";


interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  tab?: string;
}

const DashboardNav = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "analytics";
  const { isAdmin, loading } = useUserRole();
  const { t } = useTranslation();
  const { isDemoMode } = useDemo();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loggedIn = isDemoMode || isAuthed === true;

  /* THE ACTIVE SIGNAL IS CLARET, AND IT IS DEFINED ONCE.
     It was `text-foreground font-medium border-b border-foreground/80`,
     copy-pasted at five sites — so the only cue in the whole nav was a
     slightly darker grey with a grey underline, indistinguishable at a
     glance. Claret is 8.1:1 on white and appeared nowhere in the signed-in
     chrome, which is the mechanical reason it read "white and boring"
     while the landing page does not. */
  const NAV_BASE =
    "h-8 px-1 gap-1.5 text-[13px] font-normal tracking-wide shrink-0 hover:bg-transparent border-b rounded-none";
  const NAV_ON = "text-claret font-medium border-claret";
  const NAV_OFF =
    "text-muted-foreground hover:text-foreground border-transparent";

  /* TWO GROUPS, IN LOOP'S OWN NOUNS.
     This was three: "Unlock Your Stuff" (marketing copy in a wayfinding
     slot), "My Network" (LinkedIn-speak), and "Other" — a menu named
     after the absence of a name, holding everything nobody could
     categorise. The nouns below are the phone's: home, discover, people,
     insights, things.

     Two /dashboard entries also went, "Impact & Achievements" and "My
     Stuff". Both resolved to /dashboard?tab=..., and Dashboard's Tabs is
     uncontrolled (defaultValue="gallery", no value prop), so the param
     did nothing and both links landed on the identical screen. One
     entry now, labelled for what it is. */
  const thingsItems: NavItem[] = [
    { path: "/dashboard", label: "Everything", icon: Package },
    { path: "/dashboard/before-you-buy", label: "Before you buy", icon: Search },
    { path: "/me", label: "Public profile", icon: User },
  ];

  const peopleItems: NavItem[] = [
    { path: "/people", label: "Nearby", icon: Compass },
    { path: "/friends", label: "Friends", icon: Users },
    { path: "/messages", label: "Messages", icon: MessageSquare },
    { path: "/events", label: "Events", icon: Calendar },
  ];

  const isActiveInGroup = (items: NavItem[]) => {
    return items.some(item => {
      if (item.tab) {
        return location.pathname === "/dashboard" && currentTab === item.tab;
      }
      return location.pathname === item.path;
    });
  };

  const isItemActive = (item: NavItem) => {
    if (item.tab) {
      return location.pathname === "/dashboard" && currentTab === item.tab;
    }
    return location.pathname === item.path;
  };

  const getItemPath = (item: NavItem) => {
    if (item.tab) {
      return `${item.path}?tab=${item.tab}`;
    }
    return item.path;
  };

  const NavDropdown = ({ 
    label, 
    icon: Icon, 
    items 
  }: { 
    label: string; 
    icon: React.ElementType; 
    items: NavItem[];
  }) => {
    const isActive = isActiveInGroup(items);
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${NAV_BASE} ${isActive ? NAV_ON : NAV_OFF}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {items.map((item, index) => {
            const ItemIcon = item.icon;
            const active = isItemActive(item);
            
            return (
              <DropdownMenuItem key={`${item.path}-${item.tab || index}`} asChild>
                <Link 
                  to={getItemPath(item)}
                  className={`flex items-center gap-2 ${active ? "bg-primary/5 text-primary" : ""}`}
                >
                  <ItemIcon className="w-4 h-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Logged-out: only show "How it Works" link in the nav.
  // Sign up / Log in CTAs are rendered by ProfileDropdown on the right.
  if (!loggedIn) {
    return (
      <div className="relative">
        <nav className="flex items-center gap-5 py-2 px-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`${NAV_BASE} ${location.pathname === "/support" ? NAV_ON : NAV_OFF}`}
          >
            {/* Was /how-it-works, which is now a redirect to the landing
                page — and the landing page sends a signed-in member on to
                /home, so this nav item would have bounced them in a small
                circle. /support is the real, maintained explanation. */}
            <Link to="/support">
              <Info className="w-3.5 h-3.5" />
              <span>Help</span>
            </Link>
          </Button>
        </nav>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* FIVE ITEMS, LEFT TO RIGHT, ALL LABELLED.
          Was four dropdowns whose labels were slogans, every one carrying
          an icon AND a chevron — four labels, eight glyphs. And every
          label was wrapped in `hidden sm:inline`, so below 640px the nav
          became four unlabelled grey icons: nobody can guess that a
          compass means "Events, Articles and How it works".
          "Home · Discover · People · Insights · My things" is 38
          characters and fits a 375px screen at 13px, so the labels stay. */}
      <nav className="flex items-center gap-4 py-2 px-1 -mx-1 overflow-x-auto">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={`${NAV_BASE} ${location.pathname === "/home" ? NAV_ON : NAV_OFF}`}
        >
          <Link to="/home">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className={`${NAV_BASE} ${location.pathname === "/marketplace" ? NAV_ON : NAV_OFF}`}
        >
          {/* "Discover" is the phone's word for this screen. It was
              "Borrow & Buy" — the only title-cased compound in the bar. */}
          <Link to="/marketplace">
            <Compass className="w-3.5 h-3.5" />
            <span>Discover</span>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`${NAV_BASE} ${isActiveInGroup(peopleItems) ? NAV_ON : NAV_OFF}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>People</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {peopleItems.map((item) => {
              const ItemIcon = item.icon;
              const active = isItemActive(item);
              return (
                <DropdownMenuItem key={item.path} asChild>
                  <Link
                    to={getItemPath(item)}
                    className={`flex items-center gap-2 ${active ? "bg-champagne text-claret" : ""}`}
                  >
                    <ItemIcon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setInviteOpen(true);
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Invite neighbours
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className={`${NAV_BASE} ${location.pathname === "/insights" ? NAV_ON : NAV_OFF}`}
        >
          <Link to="/insights">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Insights</span>
          </Link>
        </Button>

        <NavDropdown label="My things" icon={Package} items={thingsItems} />

        {/* Admin link if applicable */}
        {isAdmin && !loading && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`${NAV_BASE} ${location.pathname === "/admin" ? NAV_ON : NAV_OFF}`}
          >
            <Link to="/admin">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.admin')}</span>
            </Link>
          </Button>
        )}
      </nav>
      <InviteNeighborsDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
};

export default DashboardNav;
