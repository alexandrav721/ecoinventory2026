import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Lightbulb } from "lucide-react";

export const useFunFacts = () => {
  const { t } = useTranslation();

  const showRandomFunFact = () => {
    const facts = t('funFacts', { returnObjects: true }) as string[];
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    
    toast(randomFact, {
      icon: <Lightbulb className="w-5 h-5 text-yellow-500" />,
      duration: 5000,
    });
  };

  return { showRandomFunFact };
};

// Component that shows a fun fact on mount (use sparingly!)
export const FunFactOnMount = () => {
  const { showRandomFunFact } = useFunFacts();

  useEffect(() => {
    // Show fun fact after a delay
    const timer = setTimeout(() => {
      // Only show 20% of the time to not be annoying
      if (Math.random() < 0.2) {
        showRandomFunFact();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showRandomFunFact]);

  return null;
};
