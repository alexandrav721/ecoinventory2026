import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2, ArrowLeft, Mic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Mode = "picker" | "email-scanning" | "email-swipe" | "photo-loading" | "photo-form" | "tell";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MockItem {
  name: string;
  brand: string;
  price: number;
  date: string;
}

const MOCK_EMAIL_ITEMS: MockItem[] = [
  { name: "Sony WH-1000XM5 Headphones", brand: "Sony", price: 349, date: "Mar 2024" },
  { name: "Patagonia Down Jacket", brand: "Patagonia", price: 229, date: "Jan 2024" },
  { name: "Le Creuset Dutch Oven", brand: "Le Creuset", price: 380, date: "Nov 2023" },
  { name: "Dyson V15 Vacuum", brand: "Dyson", price: 650, date: "Feb 2024" },
  { name: "Vitamix Blender", brand: "Vitamix", price: 450, date: "Dec 2023" },
  { name: "Allbirds Runners", brand: "Allbirds", price: 135, date: "Apr 2024" },
  { name: "Kindle Paperwhite", brand: "Amazon", price: 140, date: "Oct 2023" },
  { name: "AirPods Pro", brand: "Apple", price: 249, date: "Sep 2023" },
];

const TELL_MOCK_DRAFTS = [
  { name: "Peloton Bike", price: 2245, category: "Exercise Equipment" },
  { name: "KitchenAid Mixer", price: 449, category: "Kitchen" },
  { name: "DJI Mini Drone", price: 299, category: "Electronics" },
];

export const AddItemModal = ({ open, onOpenChange }: AddItemModalProps) => {
  const [mode, setMode] = useState<Mode>("picker");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Email swipe state
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);

  // Tell-me state
  const [tellInput, setTellInput] = useState("");
  const [tellShowDrafts, setTellShowDrafts] = useState(false);
  const [tellAdded, setTellAdded] = useState<Set<number>>(new Set());

  // Photo state
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Milestone tracking
  const [addedCount, setAddedCount] = useState(0);
  const [showConfettiBurst, setShowConfettiBurst] = useState(false);

  // Listen for global open events
  useEffect(() => {
    const handler = () => onOpenChange(true);
    window.addEventListener("open-add-item-modal", handler);
    return () => window.removeEventListener("open-add-item-modal", handler);
  }, [onOpenChange]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setMode("picker");
        setSwipeIndex(0);
        setSwipeDir(null);
        setTellInput("");
        setTellShowDrafts(false);
        setTellAdded(new Set());
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const triggerMilestone = (newCount: number) => {
    if (newCount === 1) {
      setShowConfettiBurst(true);
      setTimeout(() => setShowConfettiBurst(false), 1200);
      toast.success("First item added! 🎉");
    } else if (newCount === 5) {
      toast.success("You're on a roll! Your inventory is taking shape 🔥");
    } else if (newCount === 10) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
      toast.success("10 items logged! You officially know what you own. 🏆");
    }
  };

  const handleAddItem = () => {
    setAddedCount((c) => {
      const next = c + 1;
      triggerMilestone(next);
      return next;
    });
  };

  // ---- Email scan handlers ----
  const startEmailScan = () => {
    setMode("email-scanning");
    setTimeout(() => setMode("email-swipe"), 2000);
  };

  const swipeCard = (dir: "left" | "right") => {
    setSwipeDir(dir);
    if (dir === "left") {
      handleAddItem();
    }
    setTimeout(() => {
      setSwipeIndex((i) => i + 1);
      setSwipeDir(null);
    }, 320);
  };

  // ---- Photo handlers ----
  const openPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setMode("photo-loading");
    setTimeout(() => setMode("photo-form"), 2000);
    e.target.value = "";
  };

  const handlePhotoConfirm = () => {
    handleAddItem();
    toast.success("Dyson V11 Vacuum added");
    setMode("picker");
  };

  // ---- Tell me handlers ----
  const handleParseList = () => {
    if (!tellInput.trim()) {
      toast.error("Type something first");
      return;
    }
    setTellShowDrafts(true);
  };

  const handleAddDraft = (idx: number) => {
    if (tellAdded.has(idx)) return;
    setTellAdded((prev) => new Set(prev).add(idx));
    handleAddItem();
    toast.success(`${TELL_MOCK_DRAFTS[idx].name} added`);
  };

  if (!open) return null;

  const currentItem = MOCK_EMAIL_ITEMS[swipeIndex];
  const swipeDone = swipeIndex >= MOCK_EMAIL_ITEMS.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Confetti burst overlay */}
      {showConfettiBurst && <ConfettiBurst />}

      {/* Panel */}
      <div className="relative z-10 w-full max-w-5xl h-[92vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Top amber banner */}
        {!bannerDismissed && (
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200/70 text-amber-900 text-sm">
            <span className="flex-1">
              Start with items over <strong>$50</strong> — that's where the real insights are 💡
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 rounded hover:bg-amber-100 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-10 pt-6">
          {mode !== "picker" ? (
            <button
              onClick={() => setMode("picker")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
          {mode === "picker" && (
            <PickerView
              onEmail={startEmailScan}
              onPhoto={openPhotoPicker}
              onTell={() => setMode("tell")}
            />
          )}

          {mode === "email-scanning" && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-display text-2xl tracking-tight">
                Scanning your receipts...
              </p>
              <p className="text-sm text-muted-foreground">
                Looking through your inbox for purchases
              </p>
            </div>
          )}

          {mode === "email-swipe" && (
            <div className="max-w-md mx-auto pt-6 pb-8">
              <h2 className="font-display text-3xl tracking-tight text-center mb-1">
                Found {MOCK_EMAIL_ITEMS.length} purchases
              </h2>
              <p className="text-center text-sm text-muted-foreground mb-6">
                {Math.min(swipeIndex, MOCK_EMAIL_ITEMS.length)} of {MOCK_EMAIL_ITEMS.length} reviewed
              </p>

              {/* Progress bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden mb-8">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(Math.min(swipeIndex, MOCK_EMAIL_ITEMS.length) / MOCK_EMAIL_ITEMS.length) * 100}%`,
                  }}
                />
              </div>

              {swipeDone ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">✨</div>
                  <h3 className="font-display text-2xl tracking-tight mb-2">
                    All done!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Nice work cataloging your stuff.
                  </p>
                  <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
              ) : (
                <>
                  {/* Card stack */}
                  <div className="relative h-[420px] mb-6">
                    {/* Background card peek */}
                    {swipeIndex + 1 < MOCK_EMAIL_ITEMS.length && (
                      <div className="absolute inset-0 bg-card border border-border rounded-2xl shadow-md scale-[0.96] translate-y-2 opacity-60" />
                    )}
                    {/* Active card */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-card border border-border rounded-2xl shadow-xl overflow-hidden transition-all duration-300",
                        swipeDir === "left" &&
                          "-translate-x-[120%] -rotate-12 opacity-0",
                        swipeDir === "right" &&
                          "translate-x-[120%] rotate-12 opacity-0"
                      )}
                    >
                      {/* Photo placeholder */}
                      <div className="h-56 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                        <div className="text-stone-400 text-xs uppercase tracking-widest">
                          Photo
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-2xl tracking-tight mb-1">
                          {currentItem.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {currentItem.brand}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-foreground">
                            ${currentItem.price}
                          </span>
                          <span className="text-muted-foreground">
                            {currentItem.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-center gap-6">
                    <button
                      onClick={() => swipeCard("right")}
                      className="w-16 h-16 rounded-full bg-background border-2 border-red-500 text-red-500 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                      aria-label="Skip"
                    >
                      <X className="h-7 w-7" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => swipeCard("left")}
                      className="w-16 h-16 rounded-full bg-background border-2 border-green-500 text-green-500 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                      aria-label="Add"
                    >
                      <Check className="h-7 w-7" strokeWidth={2.5} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === "photo-loading" && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-display text-2xl tracking-tight">
                AI is identifying your item...
              </p>
            </div>
          )}

          {mode === "photo-form" && <PhotoForm onConfirm={handlePhotoConfirm} onEdit={handlePhotoConfirm} />}

          {mode === "tell" && (
            <div className="max-w-2xl mx-auto pt-4 pb-8">
              <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">
                Tell us what you own
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                List items separated by commas — we'll figure out the rest.
              </p>

              <div className="relative mb-3">
                <Textarea
                  value={tellInput}
                  onChange={(e) => setTellInput(e.target.value)}
                  placeholder="e.g. Peloton bike, DJI Mini drone, two KitchenAid mixers..."
                  className="min-h-[140px] pr-14 text-base resize-none"
                />
                <button
                  onClick={() => toast.info("Voice input coming soon")}
                  className="absolute top-3 right-3 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Voice input"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              <Button onClick={handleParseList} className="w-full md:w-auto">
                Parse my list
              </Button>

              {tellShowDrafts && (
                <div className="mt-8 space-y-3 animate-fade-in">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Found {TELL_MOCK_DRAFTS.length} items
                  </p>
                  {TELL_MOCK_DRAFTS.map((draft, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl"
                    >
                      <div className="min-w-0">
                        <div className="font-display text-lg tracking-tight">
                          {draft.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ${draft.price} · {draft.category}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={tellAdded.has(idx) ? "secondary" : "default"}
                        onClick={() => handleAddDraft(idx)}
                        disabled={tellAdded.has(idx)}
                        className="gap-1 shrink-0"
                      >
                        {tellAdded.has(idx) ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoFile}
          className="hidden"
        />
      </div>
    </div>
  );
};

// ============= Picker view =============
const PickerView = ({
  onEmail,
  onPhoto,
  onTell,
}: {
  onEmail: () => void;
  onPhoto: () => void;
  onTell: () => void;
}) => {
  const cards = [
    {
      emoji: "📧",
      title: "Scan my email",
      subtitle: "We'll find your purchase receipts automatically",
      onClick: onEmail,
    },
    {
      emoji: "📷",
      title: "Take a photo",
      subtitle: "AI identifies the item instantly",
      onClick: onPhoto,
    },
    {
      emoji: "💬",
      title: "Just tell me",
      subtitle: "Type or speak what you own",
      onClick: onTell,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pt-4 md:pt-8">
      <div className="text-center mb-10 md:mb-14">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
          Add to inventory
        </p>
        <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-[1.05]">
          How do you want to <em className="font-display-wonk">add items?</em>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={c.onClick}
            className="group bg-card border border-border rounded-2xl p-7 md:p-8 text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:border-foreground/30 hover:-translate-y-1"
          >
            <div className="text-5xl md:text-6xl mb-5">{c.emoji}</div>
            <h3 className="font-display text-2xl md:text-3xl tracking-tight leading-tight mb-2">
              {c.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {c.subtitle}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============= Photo form =============
const PhotoForm = ({
  onConfirm,
  onEdit,
}: {
  onConfirm: () => void;
  onEdit: () => void;
}) => {
  const [name, setName] = useState("Dyson V11 Vacuum");
  const [brand, setBrand] = useState("Dyson");
  const [condition, setCondition] = useState("Excellent");
  const [value, setValue] = useState("$280");

  return (
    <div className="max-w-xl mx-auto pt-4 pb-8">
      <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">
        We found your item
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Confirm or tweak the details below.
      </p>

      <div className="space-y-5 bg-card border border-border rounded-2xl p-6">
        <div>
          <Label htmlFor="pf-name" className="text-xs uppercase tracking-widest text-muted-foreground">
            Item name
          </Label>
          <Input
            id="pf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="pf-brand" className="text-xs uppercase tracking-widest text-muted-foreground">
            Brand
          </Label>
          <Input
            id="pf-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Category
          </Label>
          <div className="mt-1.5">
            <Badge variant="secondary" className="text-sm">
              Home Appliances
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Condition
            </Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pf-val" className="text-xs uppercase tracking-widest text-muted-foreground">
              Estimated resale
            </Label>
            <Input
              id="pf-val"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mt-6">
        <Button
          onClick={onConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Check className="h-4 w-4 mr-1.5" />
          Looks right — Add it
        </Button>
        <Button onClick={onEdit} variant="outline" size="lg" className="flex-1">
          Edit details
        </Button>
      </div>
    </div>
  );
};

// ============= Confetti burst (CSS) =============
const ConfettiBurst = () => {
  const pieces = Array.from({ length: 24 });
  const colors = ["bg-amber-400", "bg-pink-400", "bg-sky-400", "bg-emerald-400", "bg-violet-400"];
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 160 + Math.random() * 80;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className={cn(
              "absolute w-2 h-3 rounded-sm opacity-0",
              color
            )}
            style={{
              animation: `confetti-burst 1s ease-out forwards`,
              ["--dx" as any]: `${dx}px`,
              ["--dy" as any]: `${dy}px`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-burst {
          0% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.6) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
