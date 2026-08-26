import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  saveReview,
  useInvalidateUserShows,
  useUserShowMap,
  type ShowMeta,
} from "@/lib/user-shows";

/** The user's own review: free text + 1–10 star rating. Independent of watch logs. */
export function ReviewEditor({ meta }: { meta: ShowMeta }) {
  const { map } = useUserShowMap();
  const invalidate = useInvalidateUserShows();
  const tracked = map.get(meta.tmdb_id);
  const [text, setText] = useState("");
  const [stars, setStars] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) return;
    setText(tracked?.review ?? "");
    setStars(tracked?.rating ?? null);
  }, [tracked?.review, tracked?.rating, touched]);

  const submit = async () => {
    setSaving(true);
    try {
      await saveReview(meta, text, stars);
      invalidate();
      setTouched(false);
      toast.success(text.trim() ? "Yorumun kaydedildi" : "Yorumun temizlendi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-card ring-1 ring-border p-3.5 space-y-3">
      <p className="text-xs font-semibold">Senin yorumun</p>
      <div className="flex flex-wrap gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => {
              setTouched(true);
              setStars(stars === n ? null : n);
            }}
            aria-label={`${n}/10`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "w-4 h-4",
                stars != null && n <= stars
                  ? "fill-[var(--gold)] text-[var(--gold)]"
                  : "text-muted-foreground",
              )}
            />
          </button>
        ))}
        {stars != null && (
          <span className="ml-1 self-center text-[11px] text-muted-foreground">{stars}/10</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setTouched(true);
          setText(e.target.value);
        }}
        rows={4}
        placeholder="Bu dizi hakkında ne düşünüyorsun? (spoiler vermeden)"
        className="w-full rounded-lg bg-background ring-1 ring-border px-3 py-2 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring resize-y"
      />
      <button
        onClick={submit}
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full rounded-full bg-foreground text-background py-2.5 text-xs font-semibold disabled:opacity-50"
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {tracked?.review ? "Yorumu güncelle" : "Yorumu kaydet"}
      </button>
    </div>
  );
}
