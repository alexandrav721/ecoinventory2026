import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
        {icon && (
          <div className="text-muted-foreground opacity-50 animate-bounce-subtle">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {action && (
          <Button onClick={action.onClick} size="lg" className="mt-4">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
};
