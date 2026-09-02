import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, Star } from "lucide-react";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { QuickShowSheet, UserShowChip } from "@/components/bingebox/QuickShowSheet";
import type { ShowMeta } from "@/lib/user-shows";

import { formatVotes } from "@/lib/format";
import { resolveTmdbCategory } from "@/lib/browse-categories";

function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  if (lang.length === 2) return `${lang}-${lang.toUpperCase()}`;
  return lang;
}

export const Route = createFileRoute("/_authenticated/series/$category")({
  beforeLoad: ({ params }) => {
    if (!resolveTmdbCategory(params.category)) throw notFound();
  },
  head: ({ params }) => {
    const cat = resolveTmdbCategory(params.category);
    const title = cat ? `${cat.title} — BingeBox` : "BingeBox";
    return {
      meta: [
        { title },
        { name: "description", content: cat?.title ?? "Browse TV series on BingeBox" },
        { property: "og:title", content: title },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Category not found.</div>
  ),
  component: CategoryPage,
});

// Reality / Talk genres — excluded from popular feeds (scripted series only)
const EXCLUDED_GENRES = new Set([10764, 10767]);

type TmdbItem = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids?: number[];
};

function CategoryPage() {
  const { category } = Route.useParams();
  const cat = resolveTmdbCategory(category)!;
  const language = getUserLanguage();
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [quick, setQuick] = useState<ShowMeta | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["tmdb", "category", category, language],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getTvShows({
        data: {
          endpoint: cat.endpoint,
          language,
          params: { ...(cat.params ?? {}), page: pageParam },
        },
      }),
    getNextPageParam: (last, pages) => {
      const page = last.page ?? pages.length;
      const total = last.total_pages ?? 1;
      if (page >= total) return undefined;
      // Capped lists keep paging only until the cap is reached.
      if (cat.limit) {
        const loaded = pages.reduce((n, p) => n + (p.results?.length ?? 0), 0);
        return loaded < cat.limit ? page + 1 : undefined;
      }
      return page + 1;
    },
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [query]);

  // Ratings always come straight from TMDB so the same show shows the same
  // number on every screen.
  const items: TmdbItem[] = (
    query.data?.pages.flatMap((p) => (p.results ?? []) as TmdbItem[]) ?? []
  )
    .filter(
      (it) =>
        category !== "popular-this-week" ||
        !it.genre_ids?.some((g) => EXCLUDED_GENRES.has(g)),
    )
    .slice(0, cat.limit ?? Number.POSITIVE_INFINITY);



  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.history.back()}
          className="p-1 -ml-1 rounded-md hover:bg-muted"
          aria-label="Geri"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold tracking-tight">{cat.title}</h1>
      </header>

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : query.isError ? (
        <div className="p-8 text-center text-sm text-destructive">
          Bir şeyler ters gitti. Lütfen tekrar dene.
        </div>
      ) : (
        <ol className="divide-y divide-border">
          {items.map((item, idx) => (
            <li key={`${item.id}-${idx}`} className="flex gap-3 px-4 py-3">
              <span className="w-6 pt-6 text-right text-xs font-bold text-muted-foreground">
                {idx + 1}
              </span>
              <Link
                to="/series/tv/$id"
                params={{ id: String(item.id) }}
                className="flex flex-1 min-w-0 gap-3"
              >
                <div className="w-16 shrink-0 aspect-[2/3] rounded-md overflow-hidden bg-card ring-1 ring-border">
                  {item.poster_path && (
                    <img
                      src={`${TMDB_IMAGE_BASE}${item.poster_path}`}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{item.first_air_date?.slice(0, 4) || "—"}</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
                      {item.vote_average?.toFixed(1) ?? "—"}
                    </span>
                    <span>· {formatVotes(item.vote_count)} oy</span>
                  </div>
                  <UserShowChip tmdbId={item.id} />
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                    {item.overview || "Açıklama yok."}
                  </p>
                </div>
              </Link>
              <button
                onClick={() =>
                  setQuick({
                    tmdb_id: item.id,
                    title: item.name,
                    poster_path: item.poster_path,
                    total_episodes: null,
                  })
                }
                className="self-start shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-border text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Puanla
              </button>
            </li>
          ))}
        </ol>
      )}

      <div ref={sentinelRef} />

      {query.isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!query.isLoading && !query.hasNextPage && items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-6">Hepsi bu kadar 🎬</p>
      )}

      <QuickShowSheet meta={quick} open={!!quick} onOpenChange={(o) => !o && setQuick(null)} />
    </div>
  );
}
