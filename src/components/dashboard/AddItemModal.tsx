import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Mail,
  Camera,
  MessageSquare,
  Check,
  X,
  Sparkles,
  Loader2,
  ArrowLeft,
  Mic,
  Lightbulb,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Mode = "picker" | "email" | "photo" | "tell";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MockEmailItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  date: string;
  emoji: string;
  category: string;
}

const MOCK_EMAIL_ITEMS: MockEmailItem[] = [
  { id: "e1", name: "WH-1000XM5 Headphones", brand: "Sony", price: 349, date: "Mar 12, 2024", emoji: "🎧", category: "Electronics" },
  { id: "e2", name: "Down Sweater Jacket", brand: "Patagonia", price: 229, date: "Nov 4, 2024", emoji: "🧥", category: "Apparel" },
  { id: "e3", name: "Signature Dutch Oven 7.25qt", brand: "Le Creuset", price: 380, date: "Dec 18, 2023", emoji: "🍲", category: "Kitchen" },
  { id: "e4", name: "V15 Detect Vacuum", brand: "Dyson", price: 650, date: "Jan 22, 2024", emoji: "🧹", category: "Home" },
  { id: "e5", name: "iPad Air M2", brand: "Apple", price: 599, date: "May 30, 2024", emoji: "📱", category: "Electronics" },
  { id: "e6", name: "Stand Mixer Pro 5qt", brand: "KitchenAid", price: 449, date: "Feb 14, 2024", emoji: "🍰", category: "Kitchen" },
  { id: "e7", name: "Roller 1 Carry-On", brand: "Away", price: 295, date: "Jul 7, 2024", emoji: "🧳", category: "Travel" },
  { id: "e8", name: "Ultralight Tent 2P", brand: "Big Agnes", price: 450, date: "Apr 2, 2024", emoji: "⛺", category: "Outdoors" },
];

const MILESTONES: Record<number, { title: string; subtitle: string; big: boolean }> = {
  1: { title: "First item added! 🎉", subtitle: "You're officially on the map.", big: false },
  5: { title: "You're on a roll! 🔥", subtitle: "Your inventory is taking shape.", big: false },
  10: { title: "10 items logged! 🏆", subtitle: "You officially know what you own.", big: true },
};

function fireConfetti(big = false) {
  const count = big ? 200 : 60;
  confetti({
    particleCount: count,
    spread: big ? 100 : 70,
    origin: { y: 0.6 },
    colors: ["#3B82F6", "#06B6D4", "#F59E0B", "#10B981", "#EC4899"],
  });
  if (big) {
    setTimeout(() => confetti({ particleCount: 120, angle: 60, spread: 80, origin: { x: 0, y: 0.7 } }), 200);
    setTimeout(() => confetti({ particleCount: 120, angle: 120, spread: 80, origin: { x: 1, y: 0.7 } }), 400);
  }
}

export const AddItemModal = ({ open, onOpenChange }: AddItemModalProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("picker");
  const [addedCount, setAddedCount] = useState(0);

  // reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setMode("picker");
        setAddedCount(0);
      }, 300);
    }
  }, [open]);

  const registerAdd = () => {
    setAddedCount((c) => {
      const next = c + 1;
      const m = MILESTONES[next];
      if (m) {
        fireConfetti(m.big);
        toast.success(m.title, { description: m.subtitle });
      } else {
        toast.success("Added to your inventory");
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Top amber banner */}
        <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-2.5 text-center text-sm text-amber-900 flex items-center justify-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span>
            Start with items over <strong>$50</strong> — that's where the real insights are
          </span>
        </div>

        {/* Header bar */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode !== "picker" && (
              <Button variant="ghost" size="sm" onClick={() => setMode("picker")} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <h2 className="font-display text-xl md:text-2xl">
              {mode === "picker" && "How do you want to add stuff?"}
              {mode === "email" && "Scanning your receipts"}
              {mode === "photo" && "Snap a photo"}
              {mode === "tell" && "Just tell us"}
            </h2>
          </div>
          {addedCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" /> {addedCount} added
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {mode === "picker" && <PickerView onPick={setMode} />}
          {mode === "email" && <EmailScanView onAdd={registerAdd} />}
          {mode === "photo" && <PhotoView onAdd={registerAdd} />}
          {mode === "tell" && <TellView onAdd={registerAdd} />}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Need to fine-tune?{" "}
            <button
              className="underline hover:text-foreground"
              onClick={() => {
                onOpenChange(false);
                navigate("/dashboard/add-item");
              }}
            >
              Open the full editor
            </button>
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Picker ---------------- */
function PickerView({ onPick }: { onPick: (m: Mode) => void }) {
  const cards: {
    mode: Mode;
    icon: string;
    title: string;
    subtitle: string;
    badge: string;
    bg: string;
  }[] = [
    {
      mode: "email",
      icon: "📧",
      title: "Scan my email",
      subtitle: "We'll pull purchases from your receipts and you swipe to keep them.",
      badge: "Fastest",
      bg: "from-blue-50 to-cyan-50 border-blue-200",
    },
    {
      mode: "photo",
      icon: "📷",
      title: "Take a photo",
      subtitle: "Snap an item — AI guesses the brand, condition, and resale value.",
      badge: "Most fun",
      bg: "from-amber-50 to-orange-50 border-amber-200",
    },
    {
      mode: "tell",
      icon: "💬",
      title: "Just tell me",
      subtitle: "Type or speak a list. We'll turn it into draft cards you confirm.",
      badge: "Most flexible",
      bg: "from-emerald-50 to-teal-50 border-emerald-200",
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <p className="text-muted-foreground mb-6 text-center">
        Pick the path of least resistance — you can always switch.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button
            key={c.mode}
            onClick={() => onPick(c.mode)}
            className={cn(
              "group text-left rounded-2xl border-2 p-6 bg-gradient-to-br transition-all",
              "hover:scale-[1.02] hover:shadow-xl active:scale-[0.99]",
              c.bg,
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">{c.icon}</div>
              <Badge variant="outline" className="bg-white/70">
                {c.badge}
              </Badge>
            </div>
            <h3 className="font-display text-2xl mb-2">{c.title}</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">{c.subtitle}</p>
            <div className="mt-5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Start →
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        💡 Tip: most people start with email scan — it surfaces the high-value stuff first.
      </div>
    </div>
  );
}

/* ---------------- Email scan (Tinder swipe) ---------------- */
function EmailScanView({ onAdd }: { onAdd: () => void }) {
  const [scanning, setScanning] = useState(true);
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [accepted, setAccepted] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setScanning(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const total = MOCK_EMAIL_ITEMS.length;
  const current = MOCK_EMAIL_ITEMS[index];
  const next = MOCK_EMAIL_ITEMS[index + 1];

  const handle = (action: "accept" | "skip") => {
    setExiting(action === "accept" ? "right" : "left");
    if (action === "accept") {
      onAdd();
      setAccepted((a) => a + 1);
    }
    setTimeout(() => {
      setIndex((i) => i + 1);
      setExiting(null);
    }, 280);
  };

  if (scanning) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center min-h-[420px]">
        <div className="relative mb-6">
          <Mail className="w-20 h-20 text-primary" />
          <Loader2 className="w-8 h-8 absolute -bottom-2 -right-2 text-primary animate-spin" />
        </div>
        <h3 className="font-display text-2xl mb-2">Scanning your receipts…</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Looking through Amazon, Apple, REI, and 12 other senders for things you bought.
        </p>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="animate-fade-in">📨 Found 47 receipts</div>
          <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
            🔎 Extracting items…
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "900ms" }}>
            ✨ Filtering for items over $50
          </div>
        </div>
      </div>
    );
  }

  if (index >= total) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center min-h-[420px]">
        <div className="text-6xl mb-4">🎊</div>
        <h3 className="font-display text-2xl mb-2">All caught up!</h3>
        <p className="text-muted-foreground mb-6">
          You added <strong>{accepted}</strong> of {total} items from your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col items-center min-h-[480px]">
      <div className="text-sm text-muted-foreground mb-4">
        {index + 1} of {total} reviewed · {accepted} kept
      </div>

      <div className="relative w-full max-w-sm h-[420px]">
        {next && (
          <SwipeCard item={next} className="absolute inset-0 scale-95 opacity-60" />
        )}
        {current && (
          <SwipeCard
            item={current}
            className={cn(
              "absolute inset-0 transition-all duration-300",
              exiting === "right" && "translate-x-[120%] rotate-12 opacity-0",
              exiting === "left" && "-translate-x-[120%] -rotate-12 opacity-0",
            )}
          />
        )}
      </div>

      <div className="flex gap-6 mt-6">
        <button
          onClick={() => handle("skip")}
          className="w-16 h-16 rounded-full border-2 border-rose-300 bg-white text-rose-500 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center"
          aria-label="Skip"
        >
          <X className="w-7 h-7" />
        </button>
        <button
          onClick={() => handle("accept")}
          className="w-16 h-16 rounded-full border-2 border-emerald-400 bg-white text-emerald-600 hover:bg-emerald-50 hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center"
          aria-label="Add"
        >
          <Check className="w-7 h-7" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        ✗ skip · ✓ add to your inventory
      </p>
    </div>
  );
}

function SwipeCard({ item, className }: { item: MockEmailItem; className?: string }) {
  return (
    <Card className={cn("h-full overflow-hidden flex flex-col", className)}>
      <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-7xl">
        {item.emoji}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <Badge variant="secondary" className="self-start mb-2">{item.category}</Badge>
        <h4 className="font-display text-xl leading-tight mb-1">{item.name}</h4>
        <p className="text-sm text-muted-foreground mb-4">{item.brand}</p>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground">You paid</div>
            <div className="text-2xl font-semibold">${item.price}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Purchased</div>
            <div className="text-sm">{item.date}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Photo ---------------- */
function PhotoView({ onAdd }: { onAdd: () => void }) {
  const [stage, setStage] = useState<"upload" | "analyzing" | "review">("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => {
      setPreview(r.result as string);
      setStage("analyzing");
      setTimeout(() => setStage("review"), 1800);
    };
    r.readAsDataURL(f);
  };

  if (stage === "upload") {
    return (
      <div className="p-12 flex flex-col items-center text-center min-h-[420px] justify-center">
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
        <button
          onClick={() => inputRef.current?.click()}
          className="w-64 h-64 rounded-3xl border-4 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-3"
        >
          <Camera className="w-16 h-16 text-amber-600" />
          <span className="font-display text-xl">Snap or upload</span>
          <span className="text-xs text-muted-foreground px-6">JPG, PNG up to 20MB</span>
        </button>
        <p className="mt-6 text-sm text-muted-foreground max-w-md">
          Works best on individual items with the brand visible.
        </p>
      </div>
    );
  }

  if (stage === "analyzing") {
    return (
      <div className="p-12 flex flex-col items-center text-center min-h-[420px] justify-center">
        {preview && (
          <div className="relative w-48 h-48 rounded-2xl overflow-hidden mb-6 shadow-xl">
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-primary/20 animate-pulse" />
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-display text-xl">AI is identifying your item…</span>
        </div>
        <p className="text-sm text-muted-foreground">Brand, model, condition, resale value</p>
      </div>
    );
  }

  // review (mock pre-fill)
  const mock = {
    name: "WH-1000XM5 Headphones",
    brand: "Sony",
    category: "Electronics",
    condition: "Like New",
    value: 220,
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {preview ? (
          <img src={preview} alt="" className="w-full h-48 md:h-full object-cover rounded-xl border" />
        ) : (
          <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Item</label>
            <Input defaultValue={mock.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Brand</label>
              <Input defaultValue={mock.brand} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Condition</label>
              <select defaultValue={mock.condition} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option>Like New</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{mock.category}</Badge>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
              Est. resale ${mock.value}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-6 justify-end">
        <Button variant="outline" className="gap-1.5">
          <Edit3 className="w-4 h-4" /> Edit details
        </Button>
        <Button
          disabled={confirmed}
          onClick={() => {
            setConfirmed(true);
            onAdd();
            setTimeout(() => {
              setStage("upload");
              setPreview(null);
              setConfirmed(false);
            }, 700);
          }}
          className="gap-1.5"
        >
          <Check className="w-4 h-4" /> Looks right
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Tell ---------------- */
interface DraftItem {
  id: string;
  name: string;
  emoji: string;
  est: number;
  added: boolean;
}

function parseList(text: string): DraftItem[] {
  if (!text.trim()) return [];
  // split on commas, " and ", or newlines
  const parts = text
    .split(/,| and |\n/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const lookup: { match: RegExp; emoji: string; est: number }[] = [
    { match: /peloton/i, emoji: "🚴", est: 1200 },
    { match: /drone|dji/i, emoji: "🛸", est: 380 },
    { match: /kitchenaid|mixer/i, emoji: "🍰", est: 280 },
    { match: /macbook|laptop/i, emoji: "💻", est: 1500 },
    { match: /headphone|airpod|sony/i, emoji: "🎧", est: 220 },
    { match: /bike|trek/i, emoji: "🚲", est: 850 },
    { match: /vacuum|dyson/i, emoji: "🧹", est: 400 },
    { match: /camera|sony|canon|nikon/i, emoji: "📷", est: 700 },
    { match: /jacket|patagonia|coat/i, emoji: "🧥", est: 180 },
  ];
  return parts.map((p, i) => {
    const hit = lookup.find((l) => l.match.test(p));
    return {
      id: `d-${i}-${Date.now()}`,
      name: p.replace(/^(a|an|two|three|the)\s+/i, "").replace(/^./, (c) => c.toUpperCase()),
      emoji: hit?.emoji ?? "📦",
      est: hit?.est ?? 75,
      added: false,
    };
  });
}

function TellView({ onAdd }: { onAdd: () => void }) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  const generate = () => {
    const parsed = parseList(text);
    if (parsed.length === 0) {
      toast.error("Tell us at least one item");
      return;
    }
    setDrafts(parsed);
  };

  const addOne = (id: string) => {
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, added: true } : x)));
    onAdd();
  };

  const addAll = () => {
    drafts.forEach((d) => {
      if (!d.added) onAdd();
    });
    setDrafts((d) => d.map((x) => ({ ...x, added: true })));
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Peloton bike, DJI Mini drone, two KitchenAid mixers, my Sony A7 camera…"
          className="min-h-[140px] text-base resize-none pr-14"
        />
        <button
          onClick={() => toast("🎤 Voice input coming soon")}
          className="absolute right-3 bottom-3 w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center"
          aria-label="Voice"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-muted-foreground">
          Comma-separated works best. We'll guess brand and value.
        </p>
        <Button onClick={generate} className="gap-1.5">
          <Sparkles className="w-4 h-4" /> Parse list
        </Button>
      </div>

      {drafts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-lg">Found {drafts.length} item{drafts.length === 1 ? "" : "s"}</h4>
            <Button variant="outline" size="sm" onClick={addAll}>
              Add all
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {drafts.map((d) => (
              <div
                key={d.id}
                className={cn(
                  "border rounded-xl p-4 flex items-center gap-3 transition-all",
                  d.added ? "bg-emerald-50 border-emerald-200" : "bg-card hover:shadow-md",
                )}
              >
                <div className="text-3xl">{d.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">Est. value ${d.est}</div>
                </div>
                {d.added ? (
                  <Badge className="bg-emerald-600">Added</Badge>
                ) : (
                  <Button size="sm" onClick={() => addOne(d.id)} className="gap-1">
                    <Check className="w-3.5 h-3.5" /> Add
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
