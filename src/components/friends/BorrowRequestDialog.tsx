import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface BorrowRequestDialogProps {
  item: {
    id: string;
    name: string;
    user_id: string;
    sharing_price?: number | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestSent?: () => void;
}

export function BorrowRequestDialog({
  item,
  open,
  onOpenChange,
  onRequestSent,
}: BorrowRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to request items");
        return;
      }

      const { error } = await supabase
        .from("borrowing_requests")
        .insert({
          item_id: item.id,
          requester_id: user.id,
          owner_id: item.user_id,
          message: message.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          status: "pending",
        });

      if (error) throw error;

      // Create notification for the owner
      await supabase.from("notifications").insert({
        recipient_id: item.user_id,
        sender_id: user.id,
        item_id: item.id,
        message: `wants to borrow your ${item.name}`,
      });

      toast.success("Request sent successfully!");
      setMessage("");
      setStartDate("");
      setEndDate("");
      onOpenChange(false);
      onRequestSent?.();
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error("Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request to Borrow</DialogTitle>
            <DialogDescription>
              Send a request to borrow "{item?.name}"
              {item?.sharing_price && item.sharing_price > 0 && (
                <span className="block mt-1 font-medium text-foreground">
                  Price: ${item.sharing_price.toFixed(2)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date (Optional)
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">
                <Calendar className="w-4 h-4 inline mr-2" />
                End Date (Optional)
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a message to your request..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
