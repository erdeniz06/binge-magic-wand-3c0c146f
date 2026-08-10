import { useState } from "react";
import { Bell, BellOff, Bookmark, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  logWholeShow,
  rateShow,
  setNotify,
  setWatchlist,
  useInvalidateUserShows,
  useUserShowMap,
  type ShowMeta,
} from "@/lib/user-shows";
import { useWatchProviders, PROVIDER_LOGO_BASE } from "@/lib/use-watch-providers";
import { WatchProgress } from "./WatchProgress";

export function ShowTracking({
  meta,
  seasonCount,
}: {
  meta: ShowMeta;
  seasonCount: number;
}) {
  const { map } = useUserShowMap();
  const invalidate = useInvalidateUserShows();
  const tracked = map.get(meta.tmdb_id);
  const [busy, setBusy] = useState(false);
  const providersQ = useWatchProviders([meta.tmdb_id]);
  const provider = providersQ.data?.[String(meta.tmdb_id)];

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

  const inWatchlist = tracked?.status === "watchlist";
  const isWatched = tracked?.status === "watched";

  return (
    <section className="px-4 mt-5 space-y-3">
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() =>
            run(
              () => setWatchlist(meta, tracked?.notify ?? false),
              inWatchlist ? "Watchlist güncellendi" : "Watchlist'e eklendi",
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
          onClick={() => run(() => logWholeShow(meta, seasonCount), "İzlendi olarak işaretlendi")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-50",
            isWatched ? "bg-foreground text-background" : "bg-card ring-1 ring-border",
          )}
        >
          <Check className="w-4 h-4" />
          İzledim
        </button>
      </div>

      {tracked && (
        <button
          disabled={busy}
          onClick={() =>
            run(
              () => setNotify(meta.tmdb_id, !tracked.notify),
              tracked.notify ? "Takip kapatıldı" : "Yeni bölüm bildirimleri açık",
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

      <div className="space-y-1.5">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Puanın</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              disabled={busy}
              onClick={() => run(() => rateShow(meta, n), `${n}/10 verildi`)}
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
