import { useMemo } from 'react';
import { ACHIEVEMENTS, Achievement } from '@/types/achievements';

interface Stats {
  donatedCount: number;
  eliminatedCount: number;
  freeItemsCount: number;
  soldCount: number;
  profitLoss: number;
  marketValue: number;
}

export const useAchievements = (stats: Stats): Achievement[] => {
  return useMemo(() => {
    const totalRemoved = stats.donatedCount + stats.soldCount + stats.eliminatedCount;
    
    return ACHIEVEMENTS.map(achievement => {
      let progress = 0;
      let unlocked = false;

      switch (achievement.id) {
        // Environmental
        case 'eco_starter':
        case 'eco_warrior':
        case 'planet_hero':
          progress = stats.donatedCount;
          unlocked = stats.donatedCount >= achievement.threshold;
          break;
        
        case 'responsible_disposal':
          progress = stats.eliminatedCount;
          unlocked = stats.eliminatedCount >= achievement.threshold;
          break;

        // Decluttering
        case 'first_step':
        case 'minimalist_beginner':
        case 'minimalist_master':
          progress = totalRemoved;
          unlocked = totalRemoved >= achievement.threshold;
          break;

        // Community
        case 'generous_soul':
        case 'community_champion':
        case 'sharing_legend':
          progress = stats.freeItemsCount;
          unlocked = stats.freeItemsCount >= achievement.threshold;
          break;

        // Financial
        case 'first_sale':
          progress = stats.soldCount;
          unlocked = stats.soldCount >= achievement.threshold;
          break;
        
        case 'profitable_seller':
          progress = stats.profitLoss > 0 ? 1 : 0;
          unlocked = stats.profitLoss > 0;
          break;
        
        case 'value_creator':
        case 'market_expert':
          progress = stats.marketValue;
          unlocked = stats.marketValue >= achievement.threshold;
          break;
      }

      return {
        ...achievement,
        progress,
        unlocked,
      };
    });
  }, [stats]);
};
