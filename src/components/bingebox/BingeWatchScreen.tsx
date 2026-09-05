import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquareOff, Star } from "lucide-react";
import { getReviewFeed } from "@/lib/reviews.functions";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "popular", label: "Popüler" },
  { key: "top_rated", label: "En iyi" },
] as const;

type Source = (typeof TABS)[number]["key"];

function avatarUrl(path: string | null) {
  if (!path) return null;
  const clean = path.startsWith("/http") ? path.slice(1) : path;
  return clean.startsWith("http") ? clean : `https://image.tmdb.org/t/p/w92${clean}`;
}

export function BingeWatchScreen() {
  const [source, setSource] = useState<Source>("popular");
  const [open, setOpen] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["review-feed", source],
    queryFn: () => getReviewFeed({ data: { source } }),
    staleTime: 1000 * 60 * 60,
  });

  const reviews = q.data ?? [];

  return (
    <div className="pb-32">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-secondary p-1 text-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSource(t.key)}
              className={cn(
                "px-4 py-1.5 rounded-full font-medium transition",
                source === t.key ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">TMDB</span>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : q.isError ? (
        <p className="px-6 py-16 text-center text-sm text-destructive">Yorumlar yüklenemedi.</p>
      ) : reviews.length === 0 ? (
        <div className="px-6 py-20 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <MessageSquareOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">Şu an gösterilecek yorum yok</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
            Bu listedeki dizilere henüz yorum yazılmamış.
          </p>
        </div>
      ) : (
        <ul className="px-4 space-y-3">
          {reviews.map((r) => {
            const expanded = open === r.id;
            const img = avatarUrl(r.avatar_path);
            return (
              <li key={r.id} className="rounded-2xl bg-card border border-border p-3">
                <div className="flex gap-3">
                  <Link
                    to="/series/tv/$id"
                    params={{ id: String(r.show_id) }}
                    className="w-12 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-secondary"
                  >
                    {r.show_poster && (
                      <img
                        src={`${TMDB_IMAGE_BASE}${r.show_poster}`}
                        alt={r.show_title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/series/tv/$id"
                      params={{ id: String(r.show_id) }}
                      className="text-sm font-semibold leading-tight line-clamp-1"
                    >
                      {r.show_title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {img && (
                        <img src={img} alt="" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span className="truncate">{r.author}</span>
                      {r.rating != null && (
                        <span className="flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
                          {r.rating}/10
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line",
                        expanded ? "" : "line-clamp-4",
                      )}
                    >
                      {r.content}
                    </p>
                    {r.content.length > 240 && (
                      <button
                        onClick={() => setOpen(expanded ? null : r.id)}
                        className="mt-1 text-[11px] font-semibold text-foreground"
                      >
                        {expanded ? "Daha az" : "Devamını oku"}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
