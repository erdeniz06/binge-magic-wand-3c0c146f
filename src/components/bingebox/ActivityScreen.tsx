import { useState } from "react";
import { Heart, ListPlus } from "lucide-react";
import { activityFriends } from "@/lib/bingebox-data";
import { cn } from "@/lib/utils";

export function ActivityScreen() {
  const [tab, setTab] = useState<"friends" | "you">("friends");
  return (
    <div className="pb-32">
      <header className="px-4 pt-6 pb-3">
        <div className="inline-flex rounded-full bg-secondary p-1 text-sm">
          {(["friends", "you"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-1.5 rounded-full font-medium capitalize transition",
                tab === t ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <ul className="divide-y divide-border">
        {activityFriends.map((a) => (
          <li key={a.id} className="px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
              {a.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-semibold">{a.name}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                {a.liked && <Heart className="w-3 h-3 fill-[var(--heart)] text-[var(--heart)]" />}
                {!a.liked && !a.poster && <ListPlus className="w-3 h-3" />}
                {a.time}
              </p>
            </div>
            {a.poster && (
              <img src={a.poster} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
