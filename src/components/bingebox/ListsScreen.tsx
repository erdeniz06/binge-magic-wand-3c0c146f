import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CURATED_LISTS } from "@/lib/curated-lists";
import { getCuratedList } from "@/lib/curated.functions";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";

const LIST_KEYS = Object.keys(CURATED_LISTS);

export function ListsScreen() {
  return (
    <div className="px-4 mt-5 pb-4 space-y-4">
      <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
        Curated Lists
      </h2>
      <ul className="space-y-2.5">
        {LIST_KEYS.map((key) => (
          <ListRow key={key} listKey={key} />
        ))}
      </ul>
      <p className="text-xs text-muted-foreground pt-2">
        Watchlist, Watched ve Favorites artık Profil sekmesinde.
      </p>
    </div>
  );
}

function ListRow({ listKey }: { listKey: string }) {
  const meta = CURATED_LISTS[listKey]!;
  const q = useQuery({
    queryKey: ["curated", listKey],
    queryFn: () => getCuratedList({ data: { listName: listKey } }),
    staleTime: 1000 * 60 * 60,
  });
  const items = q.data ?? [];
  const cover = items.find((i) => i.poster_path)?.poster_path;

  return (
    <li>
      <Link
        to="/series/curated/$list"
        params={{ list: listKey }}
        className="flex items-center gap-3 rounded-2xl bg-card border border-border p-2.5"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
          {cover ? (
            <img src={`${TMDB_IMAGE_BASE}${cover}`} alt="" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{meta.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {q.isLoading ? "Yükleniyor…" : `${items.length} dizi`}
            {meta.subtitle ? ` · ${meta.subtitle}` : ""}
          </p>
        </div>
        <span className="text-muted-foreground text-lg">›</span>
      </Link>
    </li>
  );
}
