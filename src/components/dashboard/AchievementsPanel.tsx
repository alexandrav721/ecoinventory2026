import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Achievement } from "@/types/achievements";
import { Trophy, Lock } from "lucide-react";

interface AchievementsPanelProps {
  achievements: Achievement[];
}

const categoryColors = {
  environmental: 'bg-green-500/10 text-green-700 border-green-500/20',
  declutter: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  community: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  financial: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
};

const categoryLabels = {
  environmental: 'Environmental Impact',
  declutter: 'Decluttering Journey',
  community: 'Community Support',
  financial: 'Financial Success',
};

export const AchievementsPanel = ({ achievements }: AchievementsPanelProps) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const categories = ['environmental', 'declutter', 'community', 'financial'] as const;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Your Impact & Achievements
            </CardTitle>
            <CardDescription>
              Making a difference, one item at a time
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length;
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[category]}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {categoryUnlocked}/{categoryAchievements.length}
                </span>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2">
                {categoryAchievements.map(achievement => (
                  <Card 
                    key={achievement.id}
                    className={`transition-all ${
                      achievement.unlocked 
                        ? categoryColors[category]
                        : 'opacity-60 bg-muted/30'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale opacity-40'}`}>
                          {achievement.unlocked ? achievement.icon : <Lock className="h-8 w-8" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">
                            {achievement.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          {!achievement.unlocked && (
                            <div className="space-y-1">
                              <Progress 
                                value={(achievement.progress / achievement.threshold) * 100}
                                className="h-1.5"
                              />
                              <p className="text-xs text-muted-foreground">
                                {achievement.progress}/{achievement.threshold}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
