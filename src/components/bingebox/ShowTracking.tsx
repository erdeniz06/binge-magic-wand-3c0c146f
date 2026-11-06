import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff, Bookmark, Check, ChevronDown, ChevronRight, Heart, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  isEpisodeLogged,
  isSeasonLogged,
  rateShow,
  setDropped,
  setEpisodeCount,
  setFavorite,
  setNotify,
  setWatchlist,
  setWholeSeries,
  setSeasonsLogged,
  toggleEpisode,
    type ShowMeta,
  type WatchPeriod,
  setWatchPeriod,
  useInvalidateUserShows,
  useUserShowMap,
} from "@/lib/user-shows";
import { getTvShows } from "@/lib/tmdb.functions";
import { useWatchProviders, PROVIDER_LOGO_BASE } from "@/lib/use-watch-providers";
import { WatchProgress } from "./WatchProgress";
import { WatchYearPicker } from "./WatchYearPicker";

export type SeasonInfo = { season_number: number; episode_count: number; name?: string };

export function ShowTracking({
  meta,
  seasons,
}: {
  meta: ShowMeta;
  seasons: SeasonInfo[];
}) {
  const { map } = useUserShowMap();
  const invalidate = useInvalidateUserShows();
  const tracked = map.get(meta.tmdb_id);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  // Drag-to-select seasons: press a season's tick, drag down/up to cover a range.
  const [drag, setDrag] = useState<{ start: number; end: number; on: boolean } | null>(null);
  const currentYear = new Date().getFullYear();
  // Watch period is remembered per show: reopening shows what was saved.
  const storedPeriod: WatchPeriod | null = tracked?.watched_from
    ? { from: tracked.watched_from, to: tracked.watched_to ?? tracked.watched_from }
    : null;
  // `undefined` = nothing picked yet, `null` = the user cleared the pick.
  const [draftPeriod, setDraftPeriod] = useState<WatchPeriod | null | undefined>(undefined);
  const period: WatchPeriod | null =
    draftPeriod !== undefined
      ? draftPeriod
      : tracked
        ? storedPeriod // already tracked: show exactly what was saved
        : (storedPeriod ?? { from: currentYear, to: currentYear });
  // Save helpers take the period optionally; a cleared pick stores no year.
  const periodArg = period ?? undefined;
  const providersQ = useWatchProviders([meta.tmdb_id]);
  const provider = providersQ.data?.[String(meta.tmdb_id)];

  const realSeasons = useMemo(
    () => seasons.filter((s) => s.season_number > 0 && s.episode_count > 0),
    [seasons],
  );
  const episodeCountBySeason = useMemo(() => {
    const m: Record<number, number> = {};
    for (const s of realSeasons) m[s.season_number] = s.episode_count;
    return m;
  }, [realSeasons]);

  const run = async (fn: () => Promise<void>, message: string) => {
    setBusy(true);
    try {
      await fn();
      invalidate();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  };

  const isDropped = tracked?.status === "dropped";
  const inWatchlist = tracked?.status === "watchlist";
  const isWatched = tracked?.status === "watched";
  const isFavorite = !!tracked?.favorite;

  return (
    <section className="px-4 mt-5 space-y-3">
      <WatchYearPicker
        value={period}
        onChange={(p) => {
          setDraftPeriod(p);
          if (tracked) setWatchPeriod(meta.tmdb_id, p).then(invalidate).catch(() => {});
        }}
        minYear={meta.first_air_year ?? undefined}
      />

      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() =>
            run(
              () => setWatchlist(meta, tracked?.notify ?? false),
              inWatchlist ? "Watchlist updated" : "Added to watchlist",
            )
          }
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-50",
            inWatchlist ? "bg-foreground text-background" : "bg-card ring-1 ring-border",
          )}
        >
          <Bookmark className={cn("w-4 h-4", inWatchlist && "fill-current")} />
          Watchlist
        </button>
        <button
          disabled={busy}
          onClick={() =>
            run(
              async () => {
                await setWholeSeries(meta, !isWatched, episodeCountBySeason, periodArg);
              },
              isWatched ? "Whole-show mark removed" : "Marked the whole show as watched",
            )
          }
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-50",
            isWatched ? "bg-foreground text-background" : "bg-card ring-1 ring-border",
          )}
        >
          <Check className="w-4 h-4" />
          Watched the whole show
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Just a few episodes
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
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-50",
                !isWatched && tracked?.episodes_watched === n
                  ? "bg-foreground text-background ring-transparent"
                  : "bg-card ring-border text-muted-foreground",
              )}
            >
              {n} episodes
            </button>
          ))}
          <button
            disabled={busy}
            onClick={() =>
              run(
                async () => {
                  await setDropped(meta, !isDropped, periodArg);
                },
                isDropped ? "Dropped mark removed" : "Marked as dropped",
              )
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-50",
              isDropped
                ? "bg-destructive text-destructive-foreground ring-transparent"
                : "bg-card ring-border text-muted-foreground",
            )}
          >
            <XCircle className="w-3.5 h-3.5" />
            {isDropped ? "Dropped ✓" : "Dropped"}
          </button>
        </div>
      </div>



      <button
        disabled={busy}
        onClick={() =>
          run(
            async () => {
              await setFavorite(meta, !isFavorite);
            },
            isFavorite ? "Removed from favorites" : "Added to favorites",
          )
        }
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-50",
          isFavorite ? "bg-[var(--classic,#e11d48)] text-background" : "bg-card ring-1 ring-border",
        )}
      >
        <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        {isFavorite ? "Favorilerimde" : "Favorilere ekle"}
      </button>

      {tracked && (
        <button
          disabled={busy}
          onClick={() =>
            run(
              () => setNotify(meta.tmdb_id, !tracked.notify),
              tracked.notify ? "Notifications off" : "New episode notifications on",
            )
          }
          className="w-full flex items-center justify-between rounded-xl bg-card ring-1 ring-border px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm">
            {tracked.notify ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            🔔 Bu diziyi takip et
          </span>
          <span
            className={cn(
              "relative w-10 h-6 rounded-full transition",
              tracked.notify ? "bg-foreground" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-background transition-all",
                tracked.notify ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
        </button>
      )}

      {realSeasons.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Seasons
          </p>
          <p className="text-[11px] text-muted-foreground">
            Tip: press a season's box and drag down to mark several seasons at once.
          </p>
          <div
            className="space-y-1.5"
            onPointerMove={(e) => {
              if (!drag) return;
              const el = document
                .elementFromPoint(e.clientX, e.clientY)
                ?.closest("[data-season]") as HTMLElement | null;
              const n = el ? Number(el.dataset.season) : NaN;
              if (!Number.isNaN(n) && n !== drag.end) setDrag({ ...drag, end: n });
            }}
            onPointerUp={() => {
              if (!drag) return;
              const d = drag;
              setDrag(null);
              const lo = Math.min(d.start, d.end);
              const hi = Math.max(d.start, d.end);
              const list = realSeasons
                .map((x) => x.season_number)
                .filter((n) => n >= lo && n <= hi);
              run(
                () => setSeasonsLogged(meta, list, d.on, episodeCountBySeason, periodArg),
                list.length === 1
                  ? d.on
                    ? `S${lo} watched`
                    : `S${lo} mark removed`
                  : d.on
                    ? `S${lo}–S${hi} watched`
                    : `S${lo}–S${hi} marks removed`,
              );
            }}
            onPointerCancel={() => setDrag(null)}
          >
            {realSeasons.map((s) => {
              const done = isSeasonLogged(tracked, s.season_number, s.episode_count);
              const open = expanded === s.season_number;
              const inDrag =
                !!drag &&
                s.season_number >= Math.min(drag.start, drag.end) &&
                s.season_number <= Math.max(drag.start, drag.end);
              const shownDone = inDrag ? drag!.on : done;
              return (
                <div
                  key={s.season_number}
                  data-season={s.season_number}
                  className={cn(
                    "rounded-xl bg-card ring-1 ring-border transition",
                    inDrag && "ring-2 ring-foreground",
                  )}
                >
                  <div className="flex items-center">
                    <button
                      disabled={busy}
                      onPointerDown={(e) => {
                        if (busy) return;
                        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                        setDrag({ start: s.season_number, end: s.season_number, on: !done });
                      }}
                      style={{ touchAction: "none" }}
                      className="flex-1 flex items-center gap-2.5 px-3.5 py-3 text-left select-none disabled:opacity-50"
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-md grid place-items-center text-[11px] font-bold shrink-0",
                          shownDone ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {shownDone ? <Check className="w-3.5 h-3.5" /> : s.season_number}
                      </span>
                      <span className="text-sm font-semibold">S{s.season_number}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {s.episode_count} episodes
                      </span>
                    </button>
                    <button
                      onClick={() => setExpanded(open ? null : s.season_number)}
                      aria-label={`S${s.season_number} episodes ${open ? "collapse" : "expand"}`}
                      className="px-3 py-3 text-muted-foreground hover:text-foreground transition"
                    >
                      {open ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {open && (
                    <SeasonEpisodes
                      meta={meta}
                      season={s.season_number}
                      episodeCountBySeason={episodeCountBySeason}
                      busy={busy}
                      run={run}
                      logged={(ep) => isEpisodeLogged(tracked, s.season_number, ep)}
                      period={periodArg}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Your rating</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              disabled={busy}
              onClick={() =>
                run(
                  () => rateShow(meta, tracked?.rating === n ? null : n),
                  tracked?.rating === n ? "Rating removed" : `Rated ${n}/10`,
                )
              }
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-semibold transition flex items-center justify-center disabled:opacity-50",
                tracked?.rating === n
                  ? "bg-foreground text-background"
                  : "bg-card ring-1 ring-border hover:bg-accent",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {tracked && (
        <WatchProgress
          status={tracked.status}
          episodesWatched={tracked.episodes_watched}
          totalEpisodes={tracked.total_episodes ?? meta.total_episodes}
        />
      )}

      {provider?.logo_path && (
        <a
          href={provider.link ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl bg-card ring-1 ring-border px-3 py-2.5 text-sm"
        >
          <img
            src={`${PROVIDER_LOGO_BASE}${provider.logo_path}`}
            alt={provider.provider_name}
            className="w-6 h-6 rounded-md object-cover"
          />
          {provider.provider_name}'te izle
        </a>
      )}
    </section>
  );
}

type Episode = { id: number; episode_number: number; name: string; air_date: string | null };

function SeasonEpisodes({
  meta,
  season,
  episodeCountBySeason,
  busy,
  run,
  logged,
  period,
}: {
  meta: ShowMeta;
  season: number;
  episodeCountBySeason: Record<number, number>;
  period?: WatchPeriod;
  busy: boolean;
  run: (fn: () => Promise<void>, message: string) => Promise<void>;
  logged: (episode: number) => boolean;
}) {
  const q = useQuery({
    queryKey: ["tmdb", "tv", meta.tmdb_id, "season", season],
    queryFn: () =>
      getTvShows({
        data: { endpoint: `/tv/${meta.tmdb_id}/season/${season}` },
      }) as Promise<unknown> as Promise<{ episodes: Episode[] }>,
    staleTime: 1000 * 60 * 60,
  });

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const episodes = q.data?.episodes ?? [];
  if (episodes.length === 0) {
    return <p className="px-3.5 pb-3 text-[11px] text-muted-foreground">No episodes found.</p>;
  }

  return (
    <ul className="border-t border-border divide-y divide-border">
      {episodes.map((ep) => {
        const done = logged(ep.episode_number);
        return (
          <li key={ep.id}>
            <button
              disabled={busy}
              onClick={() =>
                run(
                  async () => {
                    await toggleEpisode(meta, season, ep.episode_number, episodeCountBySeason, period);
                  },
                  done
                    ? `S${season}E${ep.episode_number} mark removed`
                    : `S${season}E${ep.episode_number} izlendi`,
                )
              }
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left disabled:opacity-50"
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-md grid place-items-center shrink-0 text-[10px] font-bold",
                  done
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="w-3 h-3" /> : ep.episode_number}
              </span>
              <span className="flex-1 min-w-0 text-xs truncate">{ep.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {ep.air_date?.slice(0, 4) ?? ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
