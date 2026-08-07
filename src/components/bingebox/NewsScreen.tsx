import { useQuery } from "@tanstack/react-query";
import { Newspaper, CalendarClock, Tv } from "lucide-react";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";

type TmdbItem = {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  origin_country?: string[];
};

function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  if (lang.length === 2) return `${lang}-${lang.toUpperCase()}`;
  return lang;
}

export function NewsScreen() {
  const language = getUserLanguage();

  const airingQ = useQuery({
    queryKey: ["tmdb", "airing_today", language],
    queryFn: () => getTvShows({ data: { endpoint: "/tv/airing_today", language } }),
    staleTime: 1000 * 60 * 30,
  });

  const onTheAirQ = useQuery({
    queryKey: ["tmdb", "on_the_air", language],
    queryFn: () => getTvShows({ data: { endpoint: "/tv/on_the_air", language } }),
    staleTime: 1000 * 60 * 30,
  });

  const isLoading = airingQ.isLoading || onTheAirQ.isLoading;
  const isError = airingQ.isError && onTheAirQ.isError;

  const airing = ((airingQ.data?.results ?? []) as TmdbItem[]).slice(0, 4);
  const onAir = ((onTheAirQ.data?.results ?? []) as TmdbItem[])
    .filter((s) => !airing.some((a) => a.id === s.id))
    .slice(0, 8);

  const items: { item: TmdbItem; label: string; Icon: typeof Newspaper }[] = [
    ...airing.map((item) => ({ item, label: "Airing today", Icon: CalendarClock })),
    ...onAir.map((item) => ({ item, label: "Now on air", Icon: Tv })),
  ];

  return (
    <div className="px-4 mt-5 space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">The Daily Binge</p>
        <span className="text-[10px] text-muted-foreground">Live from TMDB</span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-muted-foreground">
          Haberler şu an yüklenemedi. Daha sonra tekrar dene.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Şu an gösterilecek bir gelişme yok.</p>
      )}

      {items.map(({ item, label, Icon }, i) => {
        const title = item.origin_country?.includes("TR") && item.original_name
          ? item.original_name
          : item.name;
        const hero = i === 0 && (item.backdrop_path || item.poster_path);
        return (
          <article key={item.id} className="rounded-2xl bg-card border border-border overflow-hidden">
            {hero && (
              <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
                <img
                  src={`${TMDB_IMAGE_BASE}${item.backdrop_path ?? item.poster_path}`}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
              <h3 className="text-base font-bold leading-snug">{title}</h3>
              {item.overview ? (
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{item.overview}</p>
              ) : null}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">
                  {item.first_air_date ? item.first_air_date.slice(0, 4) : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : ""}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
