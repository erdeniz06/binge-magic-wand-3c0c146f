import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { getCuratedList } from "@/lib/curated.functions";
import { CURATED_LISTS } from "@/lib/curated-lists";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";

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
                <p className="flex-1 min-w-0 text-sm font-semibold truncate">{item.title}</p>
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
