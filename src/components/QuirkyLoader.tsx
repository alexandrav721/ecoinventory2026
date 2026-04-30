import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuirkyLoaderProps {
  size?: "sm" | "md" | "lg";
  showMessage?: boolean;
}

export const QuirkyLoader = ({ size = "md", showMessage = true }: QuirkyLoaderProps) => {
  const { t } = useTranslation();
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = t('loading.messages', { returnObjects: true }) as string[];

  useEffect(() => {
    if (!showMessage) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length, showMessage]);

  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className={`${sizes[size]} animate-spin text-primary`} />
      {showMessage && (
        <p className={`${textSizes[size]} text-muted-foreground animate-fade-in`}>
          {messages[messageIndex]}
        </p>
      )}
    </div>
  );
};
