import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ActivityScreen() {
  const [tab, setTab] = useState<"friends" | "you">("friends");
  return (
    <div className="pb-32">
      <header className="px-4 pt-6 pb-3">
        <div className="inline-flex rounded-full bg-secondary p-1 text-sm">
          {(["friends", "you"] as const).map((t) => (
            <Button
              key={t}
              variant="ghost"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-1.5 rounded-full font-medium capitalize transition",
                tab === t ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {t === "friends" ? "Arkadaşlar" : "Sen"}
            </Button>
          ))}
        </div>
      </header>

      <p role="status" className="px-4 py-10 text-center text-sm text-muted-foreground">
        Gösterilecek etkinlik yok.
      </p>
    </div>
  );
}
