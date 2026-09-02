import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getTmdbRatings } from "@/lib/tmdb-ratings.functions";

import { ChevronLeft, Loader2, Star } from "lucide-react";
import { getCuratedList } from "@/lib/curated.functions";
import { CURATED_LISTS } from "@/lib/curated-lists";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { formatVotes } from "@/lib/format";
import { useWatchProviders } from "@/lib/use-watch-providers";
import { ProviderBadge } from "@/components/bingebox/PosterRow";


export const Route = createFileRoute("/_authenticated/series/curated/$list")({
  beforeLoad: ({ params }) => {
    if (!CURATED_LISTS[params.list]) throw notFound();
  },
  head: ({ params }) => {
    const meta = CURATED_LISTS[params.list];
    const title = meta ? `${meta.title} — BingeBox` : "BingeBox";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: meta ? `${meta.title} curated collection on BingeBox.` : "BingeBox curated list",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: meta ? `${meta.title} curated collection on BingeBox.` : "BingeBox curated list",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">List not found.</div>
  ),
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
  component: CuratedListPage,
});

function CuratedListPage() {
  const { list } = Route.useParams();
  const meta = CURATED_LISTS[list];

  const q = useQuery({
    queryKey: ["curated", list],
    queryFn: () => getCuratedList({ data: { listName: list } }),
    staleTime: 1000 * 60 * 60,
  });

  const ids = (q.data ?? []).map((i) => i.tmdb_id);
  const providersQ = useWatchProviders(ids);
  const [quick, setQuick] = useState<ShowMeta | null>(null);

  // Ratings always come from TMDB so the same show shows the same number
  // everywhere in the app.
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 60) chunks.push(ids.slice(i, i + 60));
  const ratingQs = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: ["tmdb", "ratings", chunk[0], chunk.length],
      queryFn: () => getTmdbRatings({ data: { ids: chunk } }),
      staleTime: 1000 * 60 * 60 * 12,
    })),
  });
  const ratings: Record<string, { vote_average: number; vote_count: number }> = Object.assign(
    {},
    ...ratingQs.map((r) => r.data ?? {}),
  );



  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="p-1 -ml-1 rounded-md hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-bold tracking-tight">{meta?.title}</h1>
      </header>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : q.isError ? (
        <div className="p-8 text-center text-sm text-destructive">
          Bir şeyler ters gitti. Lütfen tekrar dene.
        </div>
      ) : (
        <ol className="divide-y divide-border">
          {(q.data ?? []).map((item) => (
            <li key={item.rank}>
              <Link
                to="/series/tv/$id"
                params={{ id: String(item.tmdb_id) }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-6 text-right text-xs font-bold text-muted-foreground">
                  {item.rank}
                </span>
                <div className="w-14 shrink-0 aspect-[2/3] rounded-md overflow-hidden bg-card ring-1 ring-border">
                  {item.poster_path && (
                    <img
                      src={`${TMDB_IMAGE_BASE}${item.poster_path}`}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  {ratings[String(item.tmdb_id)] ? (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Star className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
                      <span className="font-semibold text-foreground">
                        {ratings[String(item.tmdb_id)]!.vote_average.toFixed(1)}
                      </span>
                      <span>({formatVotes(ratings[String(item.tmdb_id)]!.vote_count)} oy)</span>
                    </p>
                  ) : null}

                  {item.network ? (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                      {item.network}
                    </p>
                  ) : null}
                </div>

                {providersQ.data?.[String(item.tmdb_id)] ? (
                  <ProviderBadge provider={providersQ.data[String(item.tmdb_id)]!} size={26} />
                ) : null}
                <span className="text-muted-foreground text-lg">›</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {!q.isLoading && (q.data?.length ?? 0) > 0 && (
        <p className="text-center text-xs text-muted-foreground py-6">Hepsi bu kadar 🎬</p>
      )}
    </div>
  );
}
