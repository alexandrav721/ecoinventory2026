import { Leaf, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className }: LogoProps) => {
  const sizes = {
    sm: {
      icon: "w-8 h-8",
      leaf: "w-4 h-4",
      sparkle: "w-2 h-2",
      text: "text-lg",
    },
    md: {
      icon: "w-10 h-10",
      leaf: "w-5 h-5",
      sparkle: "w-2.5 h-2.5",
      text: "text-xl",
    },
    lg: {
      icon: "w-16 h-16",
      leaf: "w-8 h-8",
      sparkle: "w-3 h-3",
      text: "text-2xl",
    },
  };

  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      <div className="relative">
        {/* Main gradient circle with subtle animation */}
        <div 
          className={cn(
            "rounded-full bg-gradient-fun flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
            sizes[size].icon
          )}
        >
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-fun opacity-0 group-hover:opacity-50 animate-pulse-glow" />
          
          {/* Leaf icon */}
          <Leaf className={cn("text-white relative z-10 transition-transform duration-300 group-hover:rotate-12", sizes[size].leaf)} />
          
          {/* Sparkle accent - top right */}
          <Sparkles 
            className={cn(
              "absolute top-0 right-0 text-white/80 animate-pulse-glow",
              sizes[size].sparkle
            )} 
          />
        </div>
      </div>
      
      {showText && (
        <span className={cn("font-bold transition-colors duration-300 group-hover:gradient-text", sizes[size].text)}>
          Loop
        </span>
      )}
    </Link>
  );
};
