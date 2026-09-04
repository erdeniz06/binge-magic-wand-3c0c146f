import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WatchPeriod } from "@/lib/user-shows";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Year / period picker for "when did you watch this?".
 * First tap picks a single year, a second tap on another year turns the
 * selection into a range (e.g. 2020–2023) for shows watched over seasons.
 */
export function WatchYearPicker({
  value,
  onChange,
  years = 12,
  className,
}: {
  value: WatchPeriod | null;
  onChange: (p: WatchPeriod) => void;
  years?: number;
  className?: string;
}) {
  const [anchor, setAnchor] = useState<number | null>(null);
  const list = Array.from({ length: years }, (_, i) => CURRENT_YEAR - i);

  const pick = (y: number) => {
    if (anchor == null) {
      setAnchor(y);
      onChange({ from: y, to: y });
      return;
    }
    setAnchor(null);
    onChange({ from: Math.min(anchor, y), to: Math.max(anchor, y) });
  };

  const inRange = (y: number) =>
    !!value && y >= Math.min(value.from, value.to) && y <= Math.max(value.from, value.to);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Hangi yıl(lar)da izledin?
        </p>
        {value ? (
          <span className="text-[11px] font-bold text-foreground">
            {value.from === value.to ? value.from : `${value.from}–${value.to}`}
          </span>
        ) : null}
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {list.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => pick(y)}
            className={cn(
              "shrink-0 rounded-lg h-9 px-3 text-xs font-semibold ring-1 transition",
              inRange(y)
                ? "bg-foreground text-background ring-transparent"
                : "bg-card ring-border text-muted-foreground hover:text-foreground",
              anchor === y && "ring-2 ring-primary",
            )}
          >
            {y === CURRENT_YEAR ? `${y} (bu yıl)` : y}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {anchor != null
          ? `Aralık için bitiş yılına dokun (başlangıç: ${anchor})`
          : "Birkaç yıl boyunca izlediysen ikinci yıla da dokun (örn. 2020–2023)."}
      </p>
    </div>
  );
}
