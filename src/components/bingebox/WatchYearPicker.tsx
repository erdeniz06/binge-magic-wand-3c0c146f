import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WatchPeriod } from "@/lib/user-shows";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Year / period picker for "when did you watch this?".
 * Tap a year to pick it, tap that same year again to drop the pick.
 * Tapping a second, different year turns the pick into a range (2020–2023).
 */
export function WatchYearPicker({
  value,
  onChange,
  minYear,
  className,
}: {
  value: WatchPeriod | null;
  /** `null` means "no year picked" — the selection was cleared. */
  onChange: (p: WatchPeriod | null) => void;
  /** Earliest selectable year — normally the show's first air year. */
  minYear?: number;
  className?: string;
}) {
  const [anchor, setAnchor] = useState<number | null>(null);
  // Never offer years before the show existed; fall back to 12 years back.
  const start = Math.min(
    CURRENT_YEAR,
    Math.max(1940, minYear ?? CURRENT_YEAR - 11),
  );
  const list = Array.from({ length: CURRENT_YEAR - start + 1 }, (_, i) => CURRENT_YEAR - i);

  const lo = value ? Math.min(value.from, value.to) : null;
  const hi = value ? Math.max(value.from, value.to) : null;
  const inRange = (y: number) => lo != null && hi != null && y >= lo && y <= hi;

  const pick = (y: number) => {
    // Already picked? Tapping it again removes the selection.
    if (inRange(y)) {
      setAnchor(null);
      onChange(null);
      return;
    }
    if (anchor == null) {
      setAnchor(y);
      onChange({ from: y, to: y });
      return;
    }
    setAnchor(null);
    onChange({ from: Math.min(anchor, y), to: Math.max(anchor, y) });
  };

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
        ) : (
          <span className="text-[11px] font-semibold text-muted-foreground">seçili değil</span>
        )}
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
          ? `Aralık için bitiş yılına dokun (başlangıç: ${anchor}) · ${anchor}'a tekrar dokunursan seçim silinir`
          : "Bir yıla dokun, aynı yıla tekrar dokunursan seçim silinir. Aralık için ikinci bir yıla dokun (örn. 2020–2023)."}
      </p>
    </div>
  );
}
