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
  progressLabel,
  setWholeSeries,
  useInvalidateUserShows,
  useUserShowMap,
  type ShowMeta,
  type WatchPeriod,
  setWatchPeriod,
} from "@/lib/user-shows";
import { WatchYearPicker } from "./WatchYearPicker";

const CURRENT_YEAR = new Date().getFullYear();

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
  const [draftPeriod, setDraftPeriod] = useState<WatchPeriod | null | undefined>(undefined);

  // Reopening a show shows the period that was actually saved for it.
  useEffect(() => {
    setDraftPeriod(undefined);
  }, [open, meta?.tmdb_id]);

  if (!meta) return null;

  const stored: WatchPeriod | null = tracked?.watched_from
    ? { from: tracked.watched_from, to: tracked.watched_to ?? tracked.watched_from }
    : null;
  // `undefined` = nothing picked yet, `null` = the user cleared the pick.
  const period: WatchPeriod | null =
    draftPeriod !== undefined
      ? draftPeriod
      : tracked
        ? stored // already tracked: show exactly what was saved
        : (stored ?? { from: CURRENT_YEAR, to: CURRENT_YEAR });
  const periodArg = period ?? undefined;

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
          <WatchYearPicker
            value={period}
            onChange={(p) => {
          setDraftPeriod(p);
          if (tracked) setWatchPeriod(meta.tmdb_id, p).then(invalidate).catch(() => {});
        }}
            minYear={meta.first_air_year ?? undefined}
          />

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Your rating {tracked?.rating ? `· ${tracked.rating}/10` : ""}
            </p>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => rateShow(meta, tracked?.rating === n ? null : n, periodArg),
                      tracked?.rating === n ? "Rating removed" : `You rated ${n}/10`,
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
              Watched just a few episodes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => setEpisodeCount(meta, n, periodArg),
                      `Logged ${n} episodes as watched`,
                    )
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                    tracked?.status !== "watched" && tracked?.episodes_watched === n
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "ring-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n} episodes
                </button>
              ))}
              <button
                disabled={busy}
                onClick={() =>
                  run(
                    () => setDropped(meta, !isDropped, periodArg),
                    isDropped ? "Dropped mark removed" : "Marked as dropped",
                  )
                }
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  isDropped
                    ? "bg-destructive text-destructive-foreground ring-destructive"
                    : "ring-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                {isDropped ? "Dropped ✓" : "Dropped"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">

            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => setWholeSeries(meta, !isWatched, {}, periodArg),
                  isWatched ? "Watched mark removed" : "Marked it all as watched",
                )
              }
              className={`rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition ${
                isWatched
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "ring-border hover:bg-muted"
              }`}
            >
              {isWatched ? "Watched ✓" : "Watched it all"}
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
              {inWatchlist ? "In my list ✓" : "Add to watchlist"}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => setFavorite(meta, !tracked?.favorite),
                  tracked?.favorite ? "Removed from favorites" : "Added to favorites",
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
              Mark seasons/episodes →
            </Link>
          </div>

          {tracked ? (
            <button
              disabled={busy}
              onClick={async () => {
                await run(() => removeShow(meta.tmdb_id), "Entry deleted");
                onOpenChange(false);
              }}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete entry (undo)
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
  const label = progressLabel(s);
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
