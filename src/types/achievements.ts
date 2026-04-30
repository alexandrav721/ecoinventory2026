export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'environmental' | 'declutter' | 'community' | 'financial';
  threshold: number;
  unlocked: boolean;
  progress: number;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  // Environmental Impact (Primary Focus)
  {
    id: 'eco_starter',
    title: 'Eco Starter',
    description: 'Donated your first item to help others',
    icon: '🌱',
    category: 'environmental',
    threshold: 1,
  },
  {
    id: 'eco_warrior',
    title: 'Eco Warrior',
    description: 'Donated 10+ items, making a real difference',
    icon: '♻️',
    category: 'environmental',
    threshold: 10,
  },
  {
    id: 'planet_hero',
    title: 'Planet Hero',
    description: 'Donated 50+ items! You\'re changing the world',
    icon: '🌍',
    category: 'environmental',
    threshold: 50,
  },
  {
    id: 'responsible_disposal',
    title: 'Responsible Citizen',
    description: 'Properly disposed of 5+ items',
    icon: '♻️',
    category: 'environmental',
    threshold: 5,
  },
  
  // Decluttering & Organization
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Started your decluttering journey',
    icon: '🎯',
    category: 'declutter',
    threshold: 1,
  },
  {
    id: 'minimalist_beginner',
    title: 'Minimalist Beginner',
    description: 'Removed 20+ items from your life',
    icon: '✨',
    category: 'declutter',
    threshold: 20,
  },
  {
    id: 'minimalist_master',
    title: 'Minimalist Master',
    description: 'Removed 100+ items! Living light and free',
    icon: '🏆',
    category: 'declutter',
    threshold: 100,
  },
  
  // Community & Sharing
  {
    id: 'generous_soul',
    title: 'Generous Soul',
    description: 'Gave away 5+ items for free',
    icon: '💝',
    category: 'community',
    threshold: 5,
  },
  {
    id: 'community_champion',
    title: 'Community Champion',
    description: 'Gave away 20+ items to help others',
    icon: '🤝',
    category: 'community',
    threshold: 20,
  },
  {
    id: 'sharing_legend',
    title: 'Sharing Legend',
    description: 'Gave away 50+ items! You\'re inspiring',
    icon: '⭐',
    category: 'community',
    threshold: 50,
  },
  
  // Financial Success (Secondary Bonus)
  {
    id: 'first_sale',
    title: 'First Sale',
    description: 'Made your first sale!',
    icon: '💰',
    category: 'financial',
    threshold: 1,
  },
  {
    id: 'profitable_seller',
    title: 'Profitable Seller',
    description: 'Made a profit from your sales',
    icon: '📈',
    category: 'financial',
    threshold: 1,
  },
  {
    id: 'value_creator',
    title: 'Value Creator',
    description: 'Your inventory has $500+ market value',
    icon: '💎',
    category: 'financial',
    threshold: 500,
  },
  {
    id: 'market_expert',
    title: 'Market Expert',
    description: 'Your inventory has $1000+ market value',
    icon: '🎖️',
    category: 'financial',
    threshold: 1000,
  },
];
