import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WatchProgress({
  status,
  episodesWatched,
  totalEpisodes,
  compact,
}: {
  status: string;
  episodesWatched: number;
  totalEpisodes: number | null;
  compact?: boolean;
}) {
  const done = status === "watched";
  const total = totalEpisodes ?? 0;
  const pct = done ? 100 : total > 0 ? Math.min(100, Math.round((episodesWatched / total) * 100)) : 0;
  if (!done && episodesWatched <= 0) return null;

  return (
    <div className={cn("space-y-1", compact ? "mt-1" : "mt-2")}>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--progress,theme(colors.green.500))] transition-all"
          style={{ width: `${pct}%`, backgroundColor: "hsl(142 71% 45%)" }}
        />
      </div>
      {!compact && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {done && <Check className="w-3 h-3" style={{ color: "hsl(142 71% 45%)" }} />}
          %{pct} izlendi
          {total > 0 && (
            <span>
              ({done ? total : episodesWatched}/{total} bölüm)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
