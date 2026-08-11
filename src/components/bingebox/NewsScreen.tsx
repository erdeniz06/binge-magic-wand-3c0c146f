import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import { getTvNews } from "@/lib/news.functions";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.round(diff / 3600000);
  if (h < 1) return "az önce";
  if (h < 24) return `${h} saat önce`;
  const d = Math.round(h / 24);
  return `${d} gün önce`;
}

export function NewsScreen() {
  const newsQ = useQuery({
    queryKey: ["news", "tvline"],
    queryFn: () => getTvNews(),
    staleTime: 1000 * 60 * 15,
  });

  const items = newsQ.data ?? [];

  return (
    <div className="px-4 mt-5 space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">The Daily Binge</p>
        <span className="text-[10px] text-muted-foreground">TVLine</span>
      </div>

      {newsQ.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      )}

      {newsQ.isError && (
        <p className="text-sm text-muted-foreground">
          Haberler şu an yüklenemedi. Daha sonra tekrar dene.
        </p>
      )}

      {!newsQ.isLoading && !newsQ.isError && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Şu an gösterilecek bir gelişme yok.</p>
      )}

      {items.map((item, i) => (
        <a
          key={item.link}
          href={item.link}
          target="_blank"
          rel="noreferrer noopener"
          className="block rounded-2xl bg-card border border-border overflow-hidden"
        >
          {i === 0 && item.image ? (
            <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ) : null}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Newspaper className="w-3.5 h-3.5" />
              <span>{item.source}</span>
            </div>
            <h3 className="text-base font-bold leading-snug">{item.title}</h3>
            {item.description ? (
              <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
                {item.description}
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground pt-1">{timeAgo(item.pubDate)}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
