import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ChevronLeft, Loader2, Star } from "lucide-react";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { getImdbRatings } from "@/lib/imdb.functions";
import { formatVotes } from "@/lib/format";
import { TMDB_CATEGORIES } from "@/lib/tmdb-categories";

function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  if (lang.length === 2) return `${lang}-${lang.toUpperCase()}`;
  return lang;
}

export const Route = createFileRoute("/_authenticated/series/$category")({
  beforeLoad: ({ params }) => {
    if (!TMDB_CATEGORIES[params.category]) throw notFound();
  },
  head: ({ params }) => {
    const cat = TMDB_CATEGORIES[params.category];
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

type TmdbItem = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
};

function CategoryPage() {
  const { category } = Route.useParams();
  const cat = TMDB_CATEGORIES[category];
  const language = getUserLanguage();
  const sentinelRef = useRef<HTMLDivElement>(null);

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
    getNextPageParam: (last) => {
      const page = last.page ?? 1;
      const total = last.total_pages ?? 1;
      return page < total ? page + 1 : undefined;
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

  const imdbQ = useQuery({
    queryKey: ["imdb", "ratings"],
    queryFn: () => getImdbRatings(),
    staleTime: 1000 * 60 * 60 * 12,
  });
  const imdbMap = new Map((imdbQ.data ?? []).map((r) => [r.tmdb_id, r]));

  const items: TmdbItem[] = (
    query.data?.pages.flatMap((p) => (p.results ?? []) as TmdbItem[]) ?? []
  ).map((it) => {
    const hit = imdbMap.get(it.id);
    return hit ? { ...it, vote_average: hit.rating, vote_count: hit.votes } : it;
  });


  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="p-1 -ml-1 rounded-md hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </Link>
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
                <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                  {item.overview || "Açıklama yok."}
                </p>
              </div>
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
    </div>
  );
}
