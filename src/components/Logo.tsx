import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

/**
 * Minimal Loop wordmark — Fraunces italic, mono black.
 * No icon. Editorial and timeless.
 */
export const Logo = ({ size = "md", className }: LogoProps) => {
  const textSize = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }[size];

  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-baseline font-display italic font-medium tracking-tight text-foreground leading-none transition-opacity hover:opacity-70",
        textSize,
        className
      )}
    >
      Loop
    </Link>
  );
};

export default Logo;
