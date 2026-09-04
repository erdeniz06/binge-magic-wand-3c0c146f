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
import { TMDB_CATEGORIES } from "@/lib/tmdb-categories";
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

/** Ratings always come from TMDB `vote_average` so every screen agrees. */
function mapTmdb(results: TmdbShow[] | undefined, excludeGenres = false): Show[] {
  if (!results) return [];
  return results
    .filter((r) => r.poster_path)
    .filter((r) => !excludeGenres || !r.genre_ids?.some((g) => EXCLUDED_GENRES.has(g)))
    .map((r) => ({
      id: String(r.id),
      // Turkish productions keep their original Turkish title
      title: tvTitle(r),
      year: r.first_air_date ? Number(r.first_air_date.slice(0, 4)) : 0,
      poster: `${TMDB_IMAGE_BASE}${r.poster_path}`,
      rating: r.vote_average,
      votes: r.vote_count,
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

function useCategory(slug: string, language: string) {
  const cat = TMDB_CATEGORIES[slug]!;
  return useQuery({
    queryKey: ["tmdb", "category", slug, language, "row"],
    queryFn: () =>
      getTvShows({
        data: { endpoint: cat.endpoint, language, params: { ...(cat.params ?? {}) } },
      }),
    staleTime: 1000 * 60 * 60 * 12,
  });
}

function statusAccent(q: { isLoading: boolean; isError: boolean }) {
  if (q.isLoading) return <span className="text-xs text-muted-foreground">Loading…</span>;
  if (q.isError) return <span className="text-xs text-destructive">Error</span>;
  return null;
}

export function HomeScreen() {
  const [top, setTop] = useState<Top>("series");
  const userLanguage = getUserLanguage();

  const greatestQ = useCategory("100-greatest-shows", userLanguage);
  const turkishQ = useCategory("turkish-classics", userLanguage);
  const sitcomsQ = useCategory("top-10-sitcoms", userLanguage);
  const crimeQ = useCategory("top-10-crime", userLanguage);

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

  const greatestShows = mapTmdb(greatestQ.data?.results as TmdbShow[] | undefined);
  const turkishShows = mapTmdb(turkishQ.data?.results as TmdbShow[] | undefined);
  const sitcomShows = mapTmdb(sitcomsQ.data?.results as TmdbShow[] | undefined).slice(0, 20);
  const crimeShows = mapTmdb(crimeQ.data?.results as TmdbShow[] | undefined).slice(0, 20);
  const popularShows = mapTmdb(
    popularQ.data?.pages.flatMap((p: any) => p?.results ?? []),
    true,
  );

  return (
    <div className="pb-32">
      <header className="px-4 pt-6">
        <div className="flex items-start justify-between">
          <Link
            to="/series/$category"
            params={{ category: "turkish-classics" }}
            className="flex items-center gap-2"
          >
            <span className="text-3xl leading-none" role="img" aria-label="Türkiye">
              🇹🇷
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Top 50
              <br />
              Turkish
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight pt-1">BingeBox</h1>
          <Link
            to="/series/$category"
            params={{ category: "100-greatest-shows" }}
            className="flex items-center gap-2"
          >
            <span className="text-[11px] text-muted-foreground leading-tight text-right">
              100
              <br />
              Greatest
            </span>
            <span className="text-3xl leading-none" role="img" aria-label="Trophy">
              🏆
            </span>
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
            title="100 Greatest Shows"
            shows={greatestShows}
            showRating
            seeAllTo="/series/100-greatest-shows"
            accent={statusAccent(greatestQ)}
          />
          <PosterRow
            title="Top 50 Turkish Series"
            shows={turkishShows}
            showRating
            seeAllTo="/series/turkish-classics"
            accent={
              statusAccent(turkishQ) ?? <span className="text-xs text-[var(--classic)]">TR</span>
            }
          />
          <PosterRow
            title="Top 20 Sitcoms"
            shows={sitcomShows}
            showRating
            seeAllTo="/series/top-10-sitcoms"
            accent={statusAccent(sitcomsQ)}
          />
          <PosterRow
            title="Top 20 Crime / Mystery"
            shows={crimeShows}
            showRating
            seeAllTo="/series/top-10-crime"
            accent={statusAccent(crimeQ)}
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
            accent={statusAccent(popularQ)}
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
