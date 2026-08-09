import { useState } from "react";
import { Heart } from "lucide-react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PosterRow } from "./PosterRow";
import { BingeWatchScreen } from "./BingeWatchScreen";
import { ListsScreen } from "./ListsScreen";
import { JournalScreen } from "./JournalScreen";
import { NewsScreen } from "./NewsScreen";
import type { Show } from "@/lib/bingebox-data";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { getCuratedList } from "@/lib/curated.functions";
import { getImdbRatings } from "@/lib/imdb.functions";
import { cn } from "@/lib/utils";

type TmdbShow = {
  id: number;
  name: string;
  original_name?: string;
  origin_country?: string[];
  poster_path: string | null;
  first_air_date: string;
  vote_average?: number;
  vote_count?: number;
};

function mapTmdb(results: TmdbShow[] | undefined): Show[] {
  if (!results) return [];
  return results
    .filter((r) => r.poster_path)
    .map((r) => ({
      id: String(r.id),
      // Turkish productions keep their original Turkish title
      title:
        r.origin_country?.includes("TR") && r.original_name ? r.original_name : r.name,
      year: r.first_air_date ? Number(r.first_air_date.slice(0, 4)) : 0,
      poster: `${TMDB_IMAGE_BASE}${r.poster_path}`,
      rating: r.vote_average,
      votes: r.vote_count,
    }));
}

function mapCurated(
  items:
    | {
        rank: number;
        tmdb_id: number;
        title: string;
        poster_path: string | null;
        vote_average: number | null;
        vote_count: number | null;
      }[]
    | undefined,
): Show[] {
  if (!items) return [];
  return items.map((i) => ({
    id: String(i.tmdb_id),
    title: i.title,
    year: 0,
    poster: i.poster_path ? `${TMDB_IMAGE_BASE}${i.poster_path}` : "",
    rating: i.vote_average ?? undefined,
    votes: i.vote_count ?? undefined,
  }));
}



type Top = "series" | "reviews" | "lists" | "journal" | "news";

function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  // TMDB expects xx-YY format
  if (lang.length === 2) return `${lang}-${lang.toUpperCase()}`;
  return lang;
}

export function HomeScreen() {
  const [top, setTop] = useState<Top>("series");
  const userLanguage = getUserLanguage();

  const turkishQ = useQuery({
    queryKey: ["curated", "turkish_classics"],
    queryFn: () => getCuratedList({ data: { listName: "turkish_classics" } }),
    staleTime: 1000 * 60 * 60,
  });

  const topRatedQ = useQuery({
    queryKey: ["curated", "top_rated_100k"],
    queryFn: () => getCuratedList({ data: { listName: "top_rated_100k" } }),
    staleTime: 1000 * 60 * 60,
  });

  const popularQ = useInfiniteQuery({
    queryKey: ["tmdb", "popular", "tv", userLanguage],
    queryFn: ({ pageParam }) =>
      getTvShows({
        data: {
          endpoint: "/tv/popular",
          language: userLanguage,
          params: { page: pageParam },
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (last: any, pages) =>
      last?.total_pages && pages.length < Math.min(last.total_pages, 10)
        ? pages.length + 1
        : undefined,
    staleTime: 1000 * 60 * 30,
  });

  const imdbQ = useQuery({
    queryKey: ["imdb", "ratings"],
    queryFn: () => getImdbRatings(),
    staleTime: 1000 * 60 * 60 * 12,
  });

  const imdbMap = new Map((imdbQ.data ?? []).map((r) => [r.tmdb_id, r]));
  const withImdb = (shows: Show[]): Show[] =>
    shows.map((s) => {
      const hit = imdbMap.get(Number(s.id));
      return hit ? { ...s, rating: hit.rating, votes: hit.votes } : s;
    });

  const turkishShows = mapCurated(turkishQ.data);
  const topRatedShows = mapCurated(topRatedQ.data);
  const popularShows = withImdb(
    mapTmdb(popularQ.data?.pages.flatMap((p: any) => p?.results ?? [])),
  );


  return (
    <div className="pb-32">
      <header className="px-4 pt-6">
        <div className="flex items-start justify-between">
          <Link to="/series/curated/$list" params={{ list: "turkish_classics" }} className="flex flex-col">
            <span className="text-2xl font-extrabold text-[var(--classic)] leading-none">20</span>
            <span className="text-[11px] text-muted-foreground leading-tight mt-1">
              Turkish<br />Classics
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight pt-1">BingeBox</h1>
          <Link to="/series/curated/$list" params={{ list: "top_rated_100k" }} className="relative w-16 h-12 block">
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="w-12 h-12 fill-[var(--heart)] text-[var(--heart)]" strokeWidth={0} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white pt-1">100</span>
            <span className="absolute -top-1 -left-1 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute -top-2 right-0 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute top-1 -right-2 text-[var(--gold)] text-xs">★</span>
            <span className="absolute -bottom-1 right-1 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute -bottom-1 -left-1 text-[var(--gold)] text-[10px]">★</span>
          </Link>
        </div>

        <nav className="mt-5 flex items-stretch justify-between gap-1 border-b border-border">
          {(["series", "reviews", "lists", "journal", "news"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTop(t)}
              className={cn(
                "relative flex-1 pb-2.5 text-sm capitalize transition text-center",
                top === t ? "text-foreground font-semibold" : "text-muted-foreground",
              )}
            >
              {t}
              {top === t && (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {top === "series" && (
        <div className="space-y-7 mt-5">
          <PosterRow
            title="Top Rated Shows (100K+ Votes)"
            shows={topRatedShows}
            showRating
            seeAllTo="/series/curated/top_rated_100k"
            accent={
              topRatedQ.isLoading ? (
                <span className="text-xs text-muted-foreground">Loading…</span>
              ) : topRatedQ.isError ? (
                <span className="text-xs text-destructive">Error</span>
              ) : null
            }
          />
          <PosterRow
            title="Top 20 Turkish Series (IMDb)"
            shows={turkishShows}
            showRating
            seeAllTo="/series/curated/turkish_classics"
            accent={
              <span className="text-xs text-[var(--classic)]">
                {turkishQ.isLoading ? "Loading…" : turkishQ.isError ? "Error" : "TR"}
              </span>
            }
          />

          <PosterRow
            title="Popular This Week"
            shows={popularShows}
            showRating
            seeAllTo="/series/popular-this-week"
            loadingMore={popularQ.isFetchingNextPage}
            onReachEnd={() => {
              if (popularQ.hasNextPage && !popularQ.isFetchingNextPage) popularQ.fetchNextPage();
            }}
            accent={
              <span className="text-xs text-muted-foreground">
                {popularQ.isLoading ? "Loading…" : popularQ.isError ? "Error" : ""}
              </span>
            }
          />
        </div>
      )}

      {top === "reviews" && <BingeWatchScreen />}
      {top === "lists" && <ListsScreen />}
      {top === "journal" && <JournalScreen />}
      {top === "news" && <NewsScreen />}
    </div>
  );
}
