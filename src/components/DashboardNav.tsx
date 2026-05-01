import { Link, useLocation, useSearchParams } from "react-router-dom";
import { 
  Home, Package, MapPin, FileText, Info, Shield, Users, MessageSquare, 
  BarChart3, FolderTree, ChevronDown, Compass, Bell, Inbox, Activity, LayoutDashboard, Search, Calendar, User
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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";


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
        {/* Three dropdown menus */}
        <NavDropdown label="My Estate" icon={LayoutDashboard} items={myEstateItems} />
        <NavDropdown label={t('nav.friends')} icon={Users} items={friendsItems} />
        <NavDropdown label="Other" icon={Compass} items={otherItems} />

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
