import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useDemo } from "@/contexts/DemoContext";

type Msg = { role: "user" | "assistant"; content: string };

const DEMO_GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! I'm your inventory assistant. Tell me what you bought (e.g. *\"5 Nike sneakers, size 8.5\"*) and I'll add them. You can also ask things like *\"how many Patagonia jackets do I have?\"*",
};

const NEW_USER_GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! Let's build your home inventory together. What room should we start with — kitchen, bedroom, living room, or somewhere else?",
};

const RETURNING_GREETING: Msg = {
  role: "assistant",
  content:
    "Welcome back! Tell me what you'd like to add, edit, or look up — e.g. *\"5 Nike sneakers, size 8.5\"* or *\"how many Patagonia jackets do I have?\"*",
};

export const InventoryAssistant = () => {
  const { isDemoMode } = useDemo();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Track current auth user
  useEffect(() => {
    if (isDemoMode) {
      setUserId(null);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setHydrated(false); // re-load on user change
    });
    return () => sub.subscription.unsubscribe();
  }, [isDemoMode]);

  // Load persisted history when chat is opened (or user changes)
  useEffect(() => {
    if (!open || hydrated) return;

    const load = async () => {
      if (isDemoMode || !userId) {
        setMessages([DEMO_GREETING]);
        setHydrated(true);
        return;
      }

      const { data, error } = await supabase
        .from("ai_chat_history")
        .select("role, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) {
        console.error("Failed to load chat history", error);
        setMessages([RETURNING_GREETING]);
        setHydrated(true);
        return;
      }

      if (data && data.length > 0) {
        setMessages(
          data.map((d) => ({ role: d.role as Msg["role"], content: d.content }))
        );
        setHydrated(true);
        return;
      }

      // No history → check inventory to pick the right greeting
      const { count } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const greeting = (count ?? 0) === 0 ? NEW_USER_GREETING : RETURNING_GREETING;
      setMessages([greeting]);
      // Persist greeting so it's the same next session
      await supabase
        .from("ai_chat_history")
        .insert({ user_id: userId, role: greeting.role, content: greeting.content });
      setHydrated(true);
    };

    load();
  }, [open, hydrated, isDemoMode, userId]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-inventory-assistant", handler);
    return () => window.removeEventListener("open-inventory-assistant", handler);
  }, []);

  const persistMessage = async (msg: Msg) => {
    if (isDemoMode || !userId) return;
    const { error } = await supabase
      .from("ai_chat_history")
      .insert({ user_id: userId, role: msg.role, content: msg.content });
    if (error) console.error("Failed to persist message", error);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    if (isDemoMode) {
      toast.info("The AI assistant is disabled in Demo Mode. Sign in to chat with it.");
      return;
    }

    const userMsg: Msg = { role: "user", content: text };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    persistMessage(userMsg);

    try {
      const { data, error } = await supabase.functions.invoke("inventory-assistant", {
        body: { messages: next },
      });

      let reply: Msg;
      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 429) toast.error("Rate limit reached. Please wait a moment.");
        else if (status === 402) toast.error("AI credits exhausted. Add credits in workspace settings.");
        else toast.error("The assistant hit a snag. Try again.");
        reply = { role: "assistant", content: "Sorry — I couldn't process that. Try again?" };
      } else if (data?.error) {
        toast.error(data.error);
        reply = { role: "assistant", content: data.error };
      } else {
        reply = { role: "assistant", content: data?.reply ?? "" };
      }
      setMessages((m) => [...m, reply]);
      persistMessage(reply);
    } catch (e) {
      console.error(e);
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = async () => {
    const fresh: Msg = {
      role: "assistant",
      content: "Fresh start! What would you like to do?",
    };
    setMessages([fresh]);
    if (!isDemoMode && userId) {
      await supabase.from("ai_chat_history").delete().eq("user_id", userId);
      await supabase
        .from("ai_chat_history")
        .insert({ user_id: userId, role: fresh.role, content: fresh.content });
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open inventory assistant"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          data-tour="ai-assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <Card className="fixed bottom-6 right-6 z-40 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-3rem))] flex flex-col shadow-2xl border-border/60">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Inventory Assistant</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Add, edit, or ask anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={reset}>
                Reset
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {!hydrated && (
              <div className="mr-auto bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading your conversation…
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap"
                    : "mr-auto max-w-[90%] bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
                }
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            ))}
            {sending && (
              <div className="mr-auto bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="p-3 border-t flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you bought…"
              disabled={sending || !hydrated}
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || sending || !hydrated} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
};

export default InventoryAssistant;
