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

  const myEstateItems: NavItem[] = [
    { path: "/me", label: "My Profile", icon: User },
    { path: "/dashboard", label: t('dashboard.analytics'), icon: BarChart3, tab: "analytics" },
    { path: "/dashboard", label: t('dashboard.myInventory'), icon: Package, tab: "inventory" },
    { path: "/dashboard/before-you-buy", label: "Before you buy", icon: Search },
  ];

  const friendsItems: NavItem[] = [
    { path: "/people", label: "People", icon: Compass },
    { path: "/friends", label: t('nav.friends'), icon: Users },
    { path: "/messages", label: t('nav.messages'), icon: MessageSquare },
  ];

  const otherItems: NavItem[] = [
    { path: "/events", label: "Events", icon: Calendar },
    { path: "/articles", label: t('nav.articles'), icon: FileText },
    { path: "/how-it-works", label: t('nav.about'), icon: Info },
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
            className={`h-8 px-1 gap-1.5 text-[13px] font-normal tracking-wide shrink-0 hover:bg-transparent ${
              isActive 
                ? "text-foreground font-medium border-b border-foreground/80 rounded-none" 
                : "text-muted-foreground hover:text-foreground border-b border-transparent rounded-none"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
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
            className={`h-8 px-1 gap-1.5 text-[13px] font-normal tracking-wide shrink-0 hover:bg-transparent ${
              location.pathname === "/how-it-works"
                ? "text-foreground font-medium border-b border-foreground/80 rounded-none"
                : "text-muted-foreground hover:text-foreground border-b border-transparent rounded-none"
            }`}
          >
            <Link to="/how-it-works">
              <Info className="w-3.5 h-3.5" />
              <span>How it works</span>
            </Link>
          </Button>
        </nav>
      </div>
    );
  }

  return (
    <div className="relative">
      <nav className="flex items-center gap-5 py-2 px-1">
        {/* Three dropdown menus */}
        <NavDropdown label="Unlock Your Stuff" icon={LayoutDashboard} items={myEstateItems} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-1 gap-1.5 text-[13px] font-normal tracking-wide shrink-0 hover:bg-transparent ${
                isActiveInGroup(friendsItems)
                  ? "text-foreground font-medium border-b border-foreground/80 rounded-none"
                  : "text-muted-foreground hover:text-foreground border-b border-transparent rounded-none"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.friends')}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {friendsItems.map((item) => {
              const ItemIcon = item.icon;
              const active = isItemActive(item);
              return (
                <DropdownMenuItem key={item.path} asChild>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setInviteOpen(true);
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Invite neighbors
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={`h-8 px-1 gap-1.5 text-[13px] font-normal tracking-wide shrink-0 hover:bg-transparent ${
            location.pathname === "/marketplace"
              ? "text-foreground font-medium border-b border-foreground/80 rounded-none"
              : "text-muted-foreground hover:text-foreground border-b border-transparent rounded-none"
          }`}
        >
          <Link to="/marketplace">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Borrow & Buy</span>
          </Link>
        </Button>
        <NavDropdown label="Other" icon={Compass} items={otherItems} />

        {/* Admin link if applicable */}
        {isAdmin && !loading && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`h-8 px-1 gap-1.5 text-[13px] font-normal tracking-wide shrink-0 hover:bg-transparent ${
              location.pathname === "/admin" 
                ? "text-foreground font-medium border-b border-foreground/80 rounded-none" 
                : "text-muted-foreground hover:text-foreground border-b border-transparent rounded-none"
            }`}
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
