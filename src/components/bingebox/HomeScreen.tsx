import { useState } from "react";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PosterRow } from "./PosterRow";
import { BingeWatchScreen } from "./BingeWatchScreen";
import { ListsScreen } from "./ListsScreen";
import { JournalScreen } from "./JournalScreen";
import { NewsScreen } from "./NewsScreen";
import type { Show } from "@/lib/bingebox-data";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { getCuratedList } from "@/lib/curated.functions";
import { cn } from "@/lib/utils";

type TmdbShow = {
  id: number;
  name: string;
  original_name?: string;
  origin_country?: string[];
  poster_path: string | null;
  first_air_date: string;
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
    }));
}

function mapCurated(
  items: { rank: number; tmdb_id: number; title: string; poster_path: string | null }[] | undefined,
): Show[] {
  if (!items) return [];
  return items.map((i) => ({
    id: String(i.tmdb_id),
    title: i.title,
    year: 0,
    poster: i.poster_path ? `${TMDB_IMAGE_BASE}${i.poster_path}` : "",
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

  const popularQ = useQuery({
    queryKey: ["tmdb", "popular", "tv", userLanguage],
    queryFn: () =>
      getTvShows({ data: { endpoint: "/tv/popular", language: userLanguage } }),
    staleTime: 1000 * 60 * 30,
  });

  const greatestShows = mapTmdb(greatestQ.data?.results);
  const turkishShows = mapCurated(turkishQ.data);
  const topRatedShows = mapCurated(topRatedQ.data);
  const popularShows = mapTmdb(popularQ.data?.results);


  return (
    <div className="pb-32">
      <header className="px-4 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-[var(--classic)] leading-none">25</span>
            <span className="text-[11px] text-muted-foreground leading-tight mt-1">
              Turkish<br />Classics
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight pt-1">BingeBox</h1>
          <div className="relative w-16 h-12">
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="w-12 h-12 fill-[var(--heart)] text-[var(--heart)]" strokeWidth={0} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white pt-1">100</span>
            <span className="absolute -top-1 -left-1 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute -top-2 right-0 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute top-1 -right-2 text-[var(--gold)] text-xs">★</span>
            <span className="absolute -bottom-1 right-1 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute -bottom-1 -left-1 text-[var(--gold)] text-[10px]">★</span>
          </div>
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
            seeAllTo="/series/100-greatest-shows"
            accent={
              <span className="text-xs text-muted-foreground">
                {greatestQ.isLoading ? "Loading…" : greatestQ.isError ? "Error" : "Curated"}
              </span>
            }
          />
          <PosterRow
            title="Top Rated Shows (100K+ Votes)"
            shows={topRatedShows}
            seeAllTo="/series/curated/top_rated_100k"
            accent={
              <span className="text-xs text-muted-foreground">
                {topRatedQ.isLoading ? "Loading…" : topRatedQ.isError ? "Error" : "Curated"}
              </span>
            }
          />
          <PosterRow
            title="25 Essential Turkish Classics"
            shows={turkishShows}
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
            seeAllTo="/series/popular-this-week"
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
