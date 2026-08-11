import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Show } from "@/lib/bingebox-data";
import { formatVotes } from "@/lib/format";
import { useUserShowMap } from "@/lib/user-shows";
import { useWatchProviders, PROVIDER_LOGO_BASE } from "@/lib/use-watch-providers";
import type { ProviderInfo } from "@/lib/watch-providers.functions";
import { WatchProgress } from "./WatchProgress";


export function PosterRow({
  title,
  shows,
  accent,
  seeAllTo,
  showRating,
  onReachEnd,
  loadingMore,
}: {
  title: string;
  shows: Show[];
  accent?: React.ReactNode;
  seeAllTo?: string;
  showRating?: boolean;
  onReachEnd?: () => void;
  loadingMore?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const providersQ = useWatchProviders(shows.map((s) => Number(s.id)).filter(Boolean));

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onReachEnd) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onReachEnd();
      },
      { root: el.parentElement, threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onReachEnd, shows.length]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <div className="flex items-center gap-3">
          {accent}
          {seeAllTo && (
            <Link
              to={seeAllTo}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              See All
            </Link>
          )}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
        {shows.map((s, i) => (
          <PosterCard
            key={`${s.id}-${i}`}
            show={s}
            rank={showRating ? i + 1 : undefined}
            showRating={showRating}
            provider={providersQ.data?.[s.id]}
          />
        ))}
        {(onReachEnd || seeAllTo) && (
          <div ref={sentinelRef} className="shrink-0 w-32 flex items-center justify-center">
            {loadingMore ? (
              <span className="text-[11px] text-muted-foreground">Yükleniyor…</span>
            ) : seeAllTo ? (
              <Link
                to={seeAllTo}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground text-center px-2"
              >
                Tüm listeyi gör →
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

export function ProviderBadge({
  provider,
  size = 24,
}: {
  provider: ProviderInfo;
  size?: number;
}) {
  if (!provider.logo_path) return null;
  return (
    <span
      title={`${provider.provider_name}'te izle`}
      className="shrink-0 inline-block rounded-md overflow-hidden ring-1 ring-border bg-background"
      style={{ width: size, height: size }}
    >
      <img
        src={`${PROVIDER_LOGO_BASE}${provider.logo_path}`}
        alt={provider.provider_name}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </span>
  );
}


export function PosterCard({
  show,
  rank,
  showRating,
  provider,
}: {
  show: Show;
  rank?: number;
  showRating?: boolean;
  provider?: ProviderInfo;
}) {
  const isNumeric = /^\d+$/.test(show.id);
  const { map } = useUserShowMap();
  const tracked = isNumeric ? map.get(Number(show.id)) : undefined;

  const content = (
    <>
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-card ring-1 ring-border">
        <img src={show.poster} alt={show.title} loading="lazy" className="w-full h-full object-cover" />
        {rank ? (
          <span className="absolute top-1 left-1 rounded-md bg-background/85 backdrop-blur px-1.5 py-0.5 text-[10px] font-extrabold">
            #{rank}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{show.title}</p>
          {showRating && show.rating ? (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
              <span className="font-semibold text-foreground">{show.rating.toFixed(1)}</span>
              {show.votes ? <span>({formatVotes(show.votes)})</span> : null}
            </p>
          ) : show.year ? (
            <p className="text-[11px] text-muted-foreground">{show.year}</p>
          ) : null}
          {show.network ? (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
              {show.network}
            </p>
          ) : null}
        </div>

        {provider ? <ProviderBadge provider={provider} size={24} /> : null}
      </div>
      {tracked ? (
        <WatchProgress
          status={tracked.status}
          episodesWatched={tracked.episodes_watched}
          totalEpisodes={tracked.total_episodes}
          compact
        />
      ) : null}

    </>
  );
  if (isNumeric) {
    return (
      <Link to="/series/tv/$id" params={{ id: show.id }} className="shrink-0 w-32 snap-start">
        {content}
      </Link>
    );
  }
  return <div className="shrink-0 w-32 snap-start">{content}</div>;
}
