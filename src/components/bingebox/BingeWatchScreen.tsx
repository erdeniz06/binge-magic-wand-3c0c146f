import { useState } from "react";
import { MessageSquareOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function BingeWatchScreen() {
  const [tab, setTab] = useState<"following" | "discover">("following");
  return (
    <div className="pb-32">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-tight">BingeWatch</h1>
          <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Episode-gated</span>
        </div>
        <div className="inline-flex rounded-full bg-secondary p-1 text-sm">
          {(["following", "discover"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-full font-medium capitalize transition",
                tab === t ? "bg-foreground text-background" : "text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-20 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
          <MessageSquareOff className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold">Henüz gerçek kullanıcı yorumları yok</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
          Bölüm bazlı, spoiler'sız tartışmalar gerçek kullanıcılar katıldığında burada görünecek.
        </p>
      </div>
    </div>
  );
}
