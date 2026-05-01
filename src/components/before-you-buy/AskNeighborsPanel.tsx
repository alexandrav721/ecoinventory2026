import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Megaphone, EyeOff, Users, MapPin, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

type Audience = "friends" | "neighbors" | "both";
type Status = "open" | "fulfilled" | "closed";

type ItemRequest = {
  id: string;
  item_name: string;
  description: string | null;
  audience: Audience;
  is_anonymous: boolean;
  city: string | null;
  status: Status;
  created_at: string;
};

interface Props {
  defaultItemName?: string;
}

export const AskNeighborsPanel = ({ defaultItemName = "" }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [itemName, setItemName] = useState(defaultItemName);
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<Audience>("both");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<ItemRequest[]>([]);

  useEffect(() => {
    setItemName(defaultItemName);
  }, [defaultItemName]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("city")
          .eq("id", u.id)
          .maybeSingle();
        setCity(prof?.city ?? null);
        loadRequests(u.id);
      }
    });
  }, []);

  const loadRequests = async (uid: string) => {
    const { data } = await supabase
      .from("item_requests")
      .select("*")
      .eq("requester_id", uid)
      .order("created_at", { ascending: false })
      .limit(10);
    setMyRequests((data as ItemRequest[]) ?? []);
  };

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in to post a request");
      return;
    }
    if (!itemName.trim()) {
      toast.error("What are you looking for?");
      return;
    }
    if ((audience === "neighbors" || audience === "both") && !city) {
      toast.error("Add your city in profile settings to ask neighbors");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("item_requests").insert({
      requester_id: user.id,
      item_name: itemName.trim(),
      description: description.trim() || null,
      audience,
      is_anonymous: isAnonymous,
      city,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request posted");
    setDescription("");
    loadRequests(user.id);
  };

  const close = async (id: string) => {
    const { error } = await supabase
      .from("item_requests")
      .update({ status: "closed" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) loadRequests(user.id);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold">Ask people you follow & neighbors</h3>
          <p className="text-sm text-muted-foreground">
            Before you buy, see if someone nearby has one to lend.
          </p>
        </div>
      </div>

      {!user ? (
        <p className="text-sm text-muted-foreground">
          <Link to="/auth" className="underline">Sign in</Link> to post a request.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ask-item">What do you need?</Label>
              <Input
                id="ask-item"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. cordless drill, camping tent"
              />
            </div>
            <div>
              <Label htmlFor="ask-note">Add a note (optional)</Label>
              <Textarea
                id="ask-note"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When you need it, what for, etc."
                rows={2}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Send to</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Network & neighbors</SelectItem>
                    <SelectItem value="friends">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> People I follow only
                      </span>
                    </SelectItem>
                    <SelectItem value="neighbors">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Neighbors only
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {(audience === "neighbors" || audience === "both") && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {city ? `Visible to people in ${city}` : "No city set on your profile"}
                  </p>
                )}
              </div>

              <div>
                <Label>Anonymous</Label>
                <div className="flex items-center justify-between rounded-md border h-10 px-3">
                  <span className="flex items-center gap-2 text-sm">
                    <EyeOff className="w-4 h-4" />
                    Hide my name
                  </span>
                  <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your name reveals when someone messages you.
                </p>
              </div>
            </div>

            <Button onClick={submit} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post request"}
            </Button>
          </div>

          {myRequests.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <h4 className="text-sm font-semibold">Your recent requests</h4>
              <div className="space-y-2">
                {myRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{r.item_name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {r.audience === "both" ? "following + neighbors" : r.audience === "friends" ? "following" : r.audience}
                        </Badge>
                        {r.is_anonymous && (
                          <Badge variant="outline" className="text-[10px]">
                            <EyeOff className="w-3 h-3 mr-1" /> anon
                          </Badge>
                        )}
                        {r.status !== "open" && (
                          <Badge variant="secondary" className="text-[10px]">
                            {r.status}
                          </Badge>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </div>
                    {r.status === "open" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => close(r.id)}
                        title="Close request"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
