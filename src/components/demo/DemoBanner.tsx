import { Button } from "@/components/ui/button";
import { useDemo } from "@/contexts/DemoContext";
import { useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export const DemoBanner = () => {
  const { isDemoMode, exitDemoMode } = useDemo();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isDemoMode) return null;

  const handleSignUp = () => {
    exitDemoMode();
    navigate("/auth");
  };

  const handleExit = () => {
    exitDemoMode();
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground py-2 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t('demo.banner.exploring', 'You\'re exploring demo mode with sample data')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSignUp}
            className="gap-1"
          >
            {t('demo.banner.signUp', 'Sign up to save your own inventory')}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleExit}
            className="h-8 w-8 hover:bg-primary-foreground/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
