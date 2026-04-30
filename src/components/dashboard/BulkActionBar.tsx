import { Button } from "@/components/ui/button";
import { Trash2, X, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BulkActionBarProps {
  selectedCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({ selectedCount, onEdit, onDelete, onClearSelection }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-lg border-2">
      <div className="flex items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Selected
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
