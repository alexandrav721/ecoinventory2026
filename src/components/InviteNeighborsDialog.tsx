import { useEffect, useState } from "react";
import { Copy, Check, Share2, Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { toast } from "sonner";

interface InviteNeighborsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const slugify = (raw: string) =>
  raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "neighbor";

const InviteNeighborsDialog = ({ open, onOpenChange }: InviteNeighborsDialogProps) => {
  const { isDemoMode } = useDemo();
  const [displayName, setDisplayName] = useState<string>("your neighbor");
  const [usernameSlug, setUsernameSlug] = useState<string>("neighbor");
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      if (isDemoMode) {
        setDisplayName("Alexandra");
        setUsernameSlug("alexandra");
        setNearbyCount(14);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("display_name, full_name, username")
        .eq("user_id", user.id)
        .maybeSingle();

      const name =
        (profile as any)?.display_name ||
        (profile as any)?.full_name ||
        (profile as any)?.username ||
        user.email?.split("@")[0] ||
        "your neighbor";
      setDisplayName(name);
      setUsernameSlug(
        slugify((profile as any)?.username || (profile as any)?.display_name || name),
      );

      const { count } = await (supabase as any)
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("is_for_borrow", true);
      setNearbyCount(typeof count === "number" ? count : 0);
    };

    load();
  }, [open, isDemoMode]);

  const inviteUrl = `https://ecoinventory2026.lovable.app/invite/${usernameSlug}`;
  const message = `Your neighbor ${displayName} invited you to Loop — see what's available to borrow on your street. Join and add your first item to get $20 in Loop credit to spend in the marketplace.`;
  const displayCount = nearbyCount ?? 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${message}\n\n${inviteUrl}`);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — try selecting the link manually");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Loop",
          text: message,
          url: inviteUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite neighbors to Loop</DialogTitle>
        </DialogHeader>

        {/* Reward banner */}
        <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-4 flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">
              You both get $20 Loop credit
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              When your neighbor joins and adds their first item, you each get $20 to spend in the marketplace.
            </p>
          </div>
        </div>

        {/* Headline stat */}
        <div className="rounded-lg border bg-primary/5 p-4">
          <div className="text-base font-medium text-foreground">
            🏘 {displayCount} {displayCount === 1 ? "item" : "items"} available to borrow near you
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Every neighbor you invite means more things available on your street.
            Most people unlock <span className="font-medium text-foreground">5+ new borrowable items</span> per neighbor they add.
          </p>
        </div>

        {/* Preview message */}
        <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
          {message}
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your invite link
          </label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy invite link"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share…
            </Button>
          )}
          <Button onClick={handleCopy} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteNeighborsDialog;
