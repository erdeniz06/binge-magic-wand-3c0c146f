import { Star } from "lucide-react";

export function PersonRatingStars({
  value,
  onChange,
  size = "w-5 h-5",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const on = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n}/10`}
            onClick={() => onChange(value === n ? null : n)}
            className="p-0.5"
          >
            <Star className={`${size} ${on ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
        );
      })}
    </div>
  );
}
