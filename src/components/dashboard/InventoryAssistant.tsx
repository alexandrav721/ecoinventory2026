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

const STORAGE_KEY = "inventory-assistant-history";

export const InventoryAssistant = () => {
  const { isDemoMode } = useDemo();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_e) { /* ignore */ }
    return [
      {
        role: "assistant",
        content:
          "Hi! I'm your inventory assistant. Tell me what you bought (e.g. *\"5 Nike sneakers, size 8.5\"*) and I'll add them. You can also ask things like *\"how many Patagonia jackets do I have?\"*",
      },
    ];
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch (_e) { /* ignore */ }
  }, [messages]);

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

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    if (isDemoMode) {
      toast.info("The AI assistant is disabled in Demo Mode. Sign in to chat with it.");
      return;
    }

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("inventory-assistant", {
        body: { messages: next },
      });

      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 429) toast.error("Rate limit reached. Please wait a moment.");
        else if (status === 402) toast.error("AI credits exhausted. Add credits in workspace settings.");
        else toast.error("The assistant hit a snag. Try again.");
        setMessages((m) => [...m, { role: "assistant", content: "Sorry — I couldn't process that. Try again?" }]);
      } else if (data?.error) {
        toast.error(data.error);
        setMessages((m) => [...m, { role: "assistant", content: data.error }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data?.reply ?? "" }]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Fresh start! What would you like to do?",
      },
    ]);
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
              disabled={sending}
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || sending} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
};

export default InventoryAssistant;
