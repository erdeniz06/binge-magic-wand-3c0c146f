import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Loader2, Star, Trash2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  rateShow,
  removeShow,
  setDropped,
  setEpisodeCount,
  setFavorite,
  setWatchlist,
  setWholeSeries,
  useInvalidateUserShows,
  useUserShowMap,
  type ShowMeta,
} from "@/lib/user-shows";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i);

/**
 * Lightweight rate / mark sheet used from list rows so the user can act
 * without leaving the list. Deeper (per-episode) logging lives on the
 * show detail page.
 */
export function QuickShowSheet({
  meta,
  open,
  onOpenChange,
}: {
  meta: ShowMeta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { map } = useUserShowMap();
  const invalidate = useInvalidateUserShows();
  const tracked = meta ? map.get(meta.tmdb_id) : undefined;
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState<number>(CURRENT_YEAR);

  useEffect(() => {
    if (open) setYear(CURRENT_YEAR);
  }, [open, meta?.tmdb_id]);

  if (!meta) return null;

  const watchedAt = new Date(year, 5, 15);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      await invalidate();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  };

  const isWatched = tracked?.status === "watched";
  const inWatchlist = tracked?.status === "watchlist";
  const isDropped = tracked?.status === "dropped";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{meta.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Hangi yıl izledin?
            </p>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                    year === y
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "ring-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Puanın {tracked?.rating ? `· ${tracked.rating}/10` : ""}
            </p>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => rateShow(meta, tracked?.rating === n ? null : n, watchedAt),
                      tracked?.rating === n ? "Puan kaldırıldı" : `${n}/10 verdin`,
                    )
                  }
                  className={`aspect-square rounded-md text-[11px] font-bold ring-1 transition ${
                    (tracked?.rating ?? 0) >= n
                      ? "bg-[var(--gold)] text-background ring-[var(--gold)]"
                      : "ring-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Sadece birkaç bölüm izledim
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => setEpisodeCount(meta, n, watchedAt),
                      `${n} bölüm izledin olarak kaydedildi`,
                    )
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                    tracked?.status !== "watched" && tracked?.episodes_watched === n
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "ring-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n} bölüm
                </button>
              ))}
              <button
                disabled={busy}
                onClick={() =>
                  run(
                    () => setDropped(meta, !isDropped, watchedAt),
                    isDropped ? "Bıraktım işareti kaldırıldı" : "Bıraktın olarak kaydedildi",
                  )
                }
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  isDropped
                    ? "bg-destructive text-destructive-foreground ring-destructive"
                    : "ring-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                {isDropped ? "Bıraktım ✓" : "Bıraktım"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">

            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => setWholeSeries(meta, !isWatched, {}, watchedAt),
                  isWatched ? "İzledim işareti kaldırıldı" : "Tümünü izledin olarak kaydedildi",
                )
              }
              className={`rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition ${
                isWatched
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "ring-border hover:bg-muted"
              }`}
            >
              {isWatched ? "İzledim ✓" : "Tümünü izledim"}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => setWatchlist(meta, tracked?.notify ?? false),
                  inWatchlist ? "Listende" : "Listene eklendi",
                )
              }
              className={`rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition ${
                inWatchlist
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "ring-border hover:bg-muted"
              }`}
            >
              {inWatchlist ? "Listemde ✓" : "İzleyeceklerime ekle"}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => setFavorite(meta, !tracked?.favorite),
                  tracked?.favorite ? "Favorilerden çıkarıldı" : "Favorilere eklendi",
                )
              }
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition ${
                tracked?.favorite
                  ? "bg-[var(--rose,#e11d48)] text-white ring-transparent"
                  : "ring-border hover:bg-muted"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${tracked?.favorite ? "fill-current" : ""}`} />
              Favori
            </button>
            <Link
              to="/series/tv/$id"
              params={{ id: String(meta.tmdb_id) }}
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold ring-1 ring-border hover:bg-muted"
            >
              Sezon/bölüm işaretle →
            </Link>
          </div>

          {tracked ? (
            <button
              disabled={busy}
              onClick={async () => {
                await run(() => removeShow(meta.tmdb_id), "Kayıt silindi");
                onOpenChange(false);
              }}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" /> Kaydı sil (geri al)
            </button>
          ) : null}

          {busy ? (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Kaydediliyor…
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Compact status + rating chip shown on list rows. */
export function UserShowChip({ tmdbId }: { tmdbId: number }) {
  const { map } = useUserShowMap();
  const s = map.get(tmdbId);
  if (!s) return null;
  const label =
    s.status === "watched"
      ? "İzledim"
      : s.status === "dropped"
        ? `Bıraktım · ${s.episodes_watched} bölüm`
        : s.status === "partly_watched" || s.status === "watching"
        ? `${s.episodes_watched} bölüm`
        : s.status === "watchlist"
          ? "Listemde"
          : null;
  return (
    <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold">
      {label ? (
        <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5">{label}</span>
      ) : null}
      {s.rating ? (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] px-2 py-0.5">
          <Star className="w-2.5 h-2.5 fill-current" />
          {s.rating}/10
        </span>
      ) : null}
    </span>
  );
}
