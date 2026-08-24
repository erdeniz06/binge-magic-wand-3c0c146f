import { useState } from "react";
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

// Reality / Talk genres — excluded so "Popular This Week" stays scripted series only
const EXCLUDED_GENRES = new Set([10764, 10767]);

type TmdbShow = {
  id: number;
  name: string;
  original_name?: string;
  origin_country?: string[];
  genre_ids?: number[];
  poster_path: string | null;
  first_air_date: string;
  vote_average?: number;
  vote_count?: number;
};

function mapTmdb(results: TmdbShow[] | undefined, excludeGenres = false): Show[] {
  if (!results) return [];
  return results
    .filter((r) => r.poster_path)
    .filter(
      (r) => !excludeGenres || !r.genre_ids?.some((g) => EXCLUDED_GENRES.has(g)),
    )
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
        network?: string | null;
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
    network: i.network ?? undefined,
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


  const sitcomsQ = useQuery({
    queryKey: ["tmdb", "discover", "sitcoms", userLanguage],
    queryFn: () =>
      getTvShows({
        data: {
          endpoint: "/discover/tv",
          language: userLanguage,
          params: {
            with_genres: "35",
            sort_by: "vote_average.desc",
            "vote_count.gte": "1000",
          },
        },
      }),
    staleTime: 1000 * 60 * 60 * 12,
  });

  const crimeQ = useQuery({
    queryKey: ["tmdb", "discover", "crime", userLanguage],
    queryFn: () =>
      getTvShows({
        data: {
          endpoint: "/discover/tv",
          language: userLanguage,
          params: {
            with_genres: "80",
            sort_by: "vote_average.desc",
            "vote_count.gte": "1000",
          },
        },
      }),
    staleTime: 1000 * 60 * 60 * 12,
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
  // Same ordering as the TMDB top-rated sections: highest rating first
  const topRatedShows = mapCurated(topRatedQ.data).sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  );

  const popularShows = withImdb(
    mapTmdb(
      popularQ.data?.pages.flatMap((p: any) => p?.results ?? []),
      true,
    ),
  );
  const sitcomShows = mapTmdb(sitcomsQ.data?.results as TmdbShow[] | undefined).slice(0, 10);
  const crimeShows = mapTmdb(crimeQ.data?.results as TmdbShow[] | undefined).slice(0, 10);


  return (
    <div className="pb-32">
      <header className="px-4 pt-6">
        <div className="flex items-start justify-between">
          <Link to="/series/curated/$list" params={{ list: "turkish_classics" }} className="flex items-center gap-2">
            <span
              className="relative w-12 h-12 rounded-2xl grid place-items-center shrink-0"
              style={{
                background:
                  "linear-gradient(150deg, color-mix(in oklab, var(--flag) 85%, white), var(--flag) 55%, color-mix(in oklab, var(--flag) 75%, black))",
                boxShadow:
                  "0 8px 18px -8px var(--flag), inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 5px rgba(0,0,0,0.3)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 -mt-1" aria-hidden="true">
                <circle cx="9.2" cy="12" r="5.4" fill="#fff" />
                <circle cx="10.5" cy="12" r="4.4" fill="var(--flag)" />
                <polygon
                  points="14.2,12 15.93,11.36 16,9.53 17.13,10.97 18.9,10.47 17.88,12 18.9,13.53 17.13,13.03 16,14.47 15.93,12.64"
                  fill="#fff"
                />
              </svg>
              <span className="absolute bottom-0.5 inset-x-0 text-center text-[10px] font-extrabold text-white leading-none" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                20
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Turkish<br />Classics
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight pt-1">BingeBox</h1>
          <Link to="/series/curated/$list" params={{ list: "top_rated_100k" }} className="relative w-16 h-14 block">
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{
                filter:
                  "drop-shadow(0 8px 14px color-mix(in oklab, var(--heart) 55%, transparent)) drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-14 h-14" aria-hidden="true">
                <defs>
                  <linearGradient id="bbHeartGrad" x1="0" y1="0" x2="0.35" y2="1">
                    <stop offset="0%" style={{ stopColor: "var(--heart-hi)" }} />
                    <stop offset="55%" style={{ stopColor: "var(--heart)" }} />
                    <stop offset="100%" style={{ stopColor: "var(--heart-lo)" }} />
                  </linearGradient>
                </defs>
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="url(#bbHeartGrad)"
                />
                <path
                  d="M5.7 6.4C4.5 7.1 3.8 8.3 3.9 9.6"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-white pt-0.5"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}
            >
              100
            </span>
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
            title="Top 10 Sitcoms"
            shows={sitcomShows}
            showRating
            seeAllTo="/series/top-10-sitcoms"
            accent={
              sitcomsQ.isLoading ? (
                <span className="text-xs text-muted-foreground">Loading…</span>
              ) : sitcomsQ.isError ? (
                <span className="text-xs text-destructive">Error</span>
              ) : null
            }
          />
          <PosterRow
            title="Top 10 Crime / Mystery"
            shows={crimeShows}
            showRating
            seeAllTo="/series/top-10-crime"
            accent={
              crimeQ.isLoading ? (
                <span className="text-xs text-muted-foreground">Loading…</span>
              ) : crimeQ.isError ? (
                <span className="text-xs text-destructive">Error</span>
              ) : null
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
