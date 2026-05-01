import { useEffect, useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const InviteNeighborsDialog = ({ open, onOpenChange }: InviteNeighborsDialogProps) => {
  const { isDemoMode } = useDemo();
  const [displayName, setDisplayName] = useState<string>("your neighbor");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadProfile = async () => {
      if (isDemoMode) {
        setDisplayName("Alexandra");
        setInviteCode("demo");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setInviteCode(user.id.slice(0, 8));

      const { data: profile } = await supabase
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
    };

    loadProfile();
  }, [open, isDemoMode]);

  const inviteUrl = `${window.location.origin}/auth?invite=${inviteCode}`;
  const message = `Your neighbor ${displayName} invited you to Loop — see what's available to borrow on your street.`;

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
          <DialogDescription>
            Share your invite link. The more neighbors join, the more there is to borrow nearby.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
          {message}
        </div>

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
