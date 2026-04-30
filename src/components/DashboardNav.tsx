import { Link, useLocation, useSearchParams } from "react-router-dom";
import { 
  Home, Package, MapPin, FileText, Info, Shield, Users, MessageSquare, 
  BarChart3, FolderTree, ChevronDown, Compass, Bell, Inbox, Activity, LayoutDashboard, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslation } from "react-i18next";


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
  
  const mySpaceItems: NavItem[] = [
    { path: "/dashboard", label: t('dashboard.analytics'), icon: BarChart3, tab: "analytics" },
    { path: "/dashboard", label: t('dashboard.myInventory'), icon: Package, tab: "inventory" },
    { path: "/dashboard/before-you-buy", label: "Before you buy", icon: Search },
  ];

  const notificationItems: NavItem[] = [
    { path: "/notifications", label: t('notifications.all'), icon: Inbox, tab: "all" },
    { path: "/notifications", label: t('notifications.requests'), icon: Bell, tab: "requests" },
    { path: "/notifications", label: t('notifications.activity'), icon: Activity, tab: "activity" },
  ];

  const socialItems: NavItem[] = [
    { path: "/friends", label: t('nav.friends'), icon: Users },
    { path: "/messages", label: t('nav.messages'), icon: MessageSquare },
    { path: "/community", label: t('nav.community'), icon: MapPin },
  ];

  const exploreItems: NavItem[] = [
    { path: "/articles", label: t('nav.articles'), icon: FileText },
    { path: "/about", label: t('nav.about'), icon: Info },
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
            className={`h-8 px-2.5 gap-1.5 text-sm shrink-0 ${
              isActive 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground"
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

  return (
    <div className="relative">
      <nav className="flex items-center gap-1 py-2 px-1">
        {/* Home link */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={`h-8 px-2.5 gap-1.5 text-sm shrink-0 ${
            location.pathname === "/" 
              ? "bg-primary/10 text-primary font-medium" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link to="/">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('nav.home')}</span>
          </Link>
        </Button>

        {/* Dropdown menus */}
        <NavDropdown label={t('nav.mySpace')} icon={LayoutDashboard} items={mySpaceItems} />
        <NavDropdown label={t('nav.notifications')} icon={Bell} items={notificationItems} />
        <NavDropdown label={t('nav.social')} icon={Users} items={socialItems} />
        <NavDropdown label={t('nav.explore')} icon={Compass} items={exploreItems} />
        
        {/* Admin link if applicable */}
        {isAdmin && !loading && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`h-8 px-2.5 gap-1.5 text-sm shrink-0 ${
              location.pathname === "/admin" 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link to="/admin">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.admin')}</span>
            </Link>
          </Button>
        )}
      </nav>
    </div>
  );
};

export default DashboardNav;
