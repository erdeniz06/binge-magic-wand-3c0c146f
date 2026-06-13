import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Trash2, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { clearAiHistory, loadAiHistory } from "@/lib/ai-history.functions";
import { toast } from "sonner";

const STARTERS = [
  "Bu hafta sonu için 3 dizi öner",
  "Severance'ı sevdiysem ne izlemeliyim?",
  "Kısa (8 bölümlük) bir Türk dizisi öner",
  "Recommend a feel-good comedy",
];

export function AiChatSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [initial, setInitial] = useState<UIMessage[]>([]);
  const [ready, setReady] = useState(false);
  const loadFn = useServerFn(loadAiHistory);
  const clearFn = useServerFn(clearAiHistory);

  useEffect(() => {
    if (!open || ready) return;
    loadFn()
      .then((r) => setInitial((r.messages as UIMessage[]) ?? []))
      .catch(() => setInitial([]))
      .finally(() => setReady(true));
  }, [open, ready, loadFn]);

  if (!open) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] p-0 flex flex-col bg-background border-border">
        <SheetHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-xl bg-ai-gradient shadow-ai flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            BingeBox AI
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={async () => {
              await clearFn();
              setReady(false);
              setInitial([]);
              toast.success("Sohbet temizlendi");
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </SheetHeader>
        {ready && <ChatBody initialMessages={initial} />}
      </SheetContent>
    </Sheet>
  );
}

function ChatBody({ initialMessages }: { initialMessages: UIMessage[] }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: "bingebox-ai",
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, init) => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const headers = new Headers(init?.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(url, { ...init, headers });
      },
    }),
    onError: (err) => toast.error(err.message || "AI hatası"),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = async (text: string) => {
    if (!text.trim() || busy) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-5 py-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-ai-gradient shadow-ai flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Sana özel dizi tavsiyesi</h3>
              <p className="text-sm text-muted-foreground px-6">
                İzleme geçmişin, watchlist'in ve favori türlerine göre konuşalım.
              </p>
            </div>
            <div className="grid gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left text-sm rounded-xl border border-border bg-card hover:bg-accent transition px-4 py-3"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                  {text}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className="flex gap-3">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-ai-gradient shadow-ai flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-foreground [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 flex-1">
                <ReactMarkdown>{text || "…"}</ReactMarkdown>
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex gap-3 items-center text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-xl bg-ai-gradient shadow-ai flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            Düşünüyor…
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder="BingeBox AI'ya sor…"
            rows={1}
            className="resize-none min-h-[44px] max-h-32 bg-card border-border"
            autoFocus
          />
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 bg-ai-gradient hover:opacity-90 shadow-ai"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
      </div>
    </>
  );
}
