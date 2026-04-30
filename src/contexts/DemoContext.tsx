import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { DEMO_ITEMS, DEMO_CATEGORIES, DEMO_STATS, DEMO_FRIENDS, DEMO_FRIENDS_ITEMS, DEMO_FRIEND_REQUESTS, DEMO_EXCESS_INSIGHTS, DEMO_COMMUNITY_ACTIVITY } from "@/data/demoData";

interface DemoContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  demoItems: typeof DEMO_ITEMS;
  demoCategories: typeof DEMO_CATEGORIES;
  demoStats: typeof DEMO_STATS;
  demoFriends: typeof DEMO_FRIENDS;
  demoFriendsItems: typeof DEMO_FRIENDS_ITEMS;
  demoFriendRequests: typeof DEMO_FRIEND_REQUESTS;
  demoExcessInsights: typeof DEMO_EXCESS_INSIGHTS;
  demoCommunityActivity: typeof DEMO_COMMUNITY_ACTIVITY;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return sessionStorage.getItem("demoMode") === "true";
  });

  const enterDemoMode = useCallback(() => {
    sessionStorage.setItem("demoMode", "true");
    setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    sessionStorage.removeItem("demoMode");
    setIsDemoMode(false);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        demoItems: DEMO_ITEMS,
        demoCategories: DEMO_CATEGORIES,
        demoStats: DEMO_STATS,
        demoFriends: DEMO_FRIENDS,
        demoFriendsItems: DEMO_FRIENDS_ITEMS,
        demoFriendRequests: DEMO_FRIEND_REQUESTS,
        demoExcessInsights: DEMO_EXCESS_INSIGHTS,
        demoCommunityActivity: DEMO_COMMUNITY_ACTIVITY,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
