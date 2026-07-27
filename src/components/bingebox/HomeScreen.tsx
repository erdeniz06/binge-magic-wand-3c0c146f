import { useState } from "react";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PosterRow } from "./PosterRow";
import { BingeWatchScreen } from "./BingeWatchScreen";
import { ListsScreen } from "./ListsScreen";
import { JournalScreen } from "./JournalScreen";
import { NewsScreen } from "./NewsScreen";
import {
  popularThisWeek,
  friendsWatching,
} from "@/lib/bingebox-data";
import type { Show } from "@/lib/bingebox-data";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { cn } from "@/lib/utils";

type TmdbShow = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
};

function mapTmdb(results: TmdbShow[] | undefined): Show[] {
  if (!results) return [];
  return results
    .filter((r) => r.poster_path)
    .map((r) => ({
      id: String(r.id),
      title: r.name,
      year: r.first_air_date ? Number(r.first_air_date.slice(0, 4)) : 0,
      poster: `${TMDB_IMAGE_BASE}${r.poster_path}`,
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

  const greatestQ = useQuery({
    queryKey: ["tmdb", "trending", "tv", "week", userLanguage],
    queryFn: () =>
      getTvShows({ data: { endpoint: "/trending/tv/week", language: userLanguage } }),
    staleTime: 1000 * 60 * 30,
  });

  const turkishQ = useQuery({
    queryKey: ["tmdb", "discover", "tv", "TR", userLanguage],
    queryFn: () =>
      getTvShows({
        data: {
          endpoint: "/discover/tv",
          language: userLanguage,
          params: {
            with_origin_country: "TR",
            sort_by: "vote_average.desc",
            "vote_count.gte": "50",
          },
        },
      }),
    staleTime: 1000 * 60 * 30,
  });

  const greatestShows = mapTmdb(greatestQ.data?.results);
  const turkishShows = mapTmdb(turkishQ.data?.results);

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
            title="25 Essential Turkish Classics"
            shows={turkishShows}
            seeAllTo="/series/turkish-classics"
            accent={
              <span className="text-xs text-[var(--classic)]">
                {turkishQ.isLoading ? "Loading…" : turkishQ.isError ? "Error" : "TR"}
              </span>
            }
          />
          <PosterRow title="Popular This Week" shows={popularThisWeek} seeAllTo="/series/popular-this-week" />
          <PosterRow title="News From Friends" shows={friendsWatching} />
        </div>
      )}

      {top === "reviews" && <BingeWatchScreen />}
      {top === "lists" && <ListsScreen />}
      {top === "journal" && <JournalScreen />}
      {top === "news" && <NewsScreen />}
    </div>
  );
}
