import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { getFavoriteActors } from "@/lib/favorite-actors";
import { getTvShows } from "@/lib/tmdb.functions";

const PROFILE_IMG = "https://image.tmdb.org/t/p/w185";

type PersonInfo = { name: string; profile_path: string | null };

/**
 * "Favorite Actors" — built automatically from the user's actor ratings.
 * No manual picking: rate an actor's performance on their page and they
 * appear here, ranked by average score.
 */
export function FavoriteActorsRow() {
  const actorsQ = useQuery({
    queryKey: ["favorite-actors"],
    queryFn: () => getFavoriteActors(12),
    staleTime: 1000 * 60 * 5,
  });

  const actors = actorsQ.data ?? [];

  const peopleQ = useQuery({
    queryKey: ["favorite-actors", "people", actors.map((a) => a.personId).join(",")],
    enabled: actors.length > 0,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const out: Record<number, PersonInfo> = {};
      await Promise.all(
        actors.map(async (a) => {
          try {
            const p = (await getTvShows({
              data: { endpoint: `/person/${a.personId}`, language: "en-US" },
            })) as unknown as PersonInfo;
            out[a.personId] = { name: p.name, profile_path: p.profile_path };
          } catch {
            // A person that fails to load just keeps the fallback initial.
          }
        }),
      );
      return out;
    },
  });

  if (actorsQ.isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-16 shrink-0 space-y-1.5">
            <div className="w-16 h-16 rounded-full bg-secondary animate-pulse" />
            <div className="h-2.5 rounded bg-secondary animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (actors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Rate an actor's performance on their page and they'll show up here, ranked by your average
        score.
      </p>
    );
  }

  const people = peopleQ.data ?? {};

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar">
      {actors.map((a, i) => {
        const p = people[a.personId];
        return (
          <Link
            key={a.personId}
            to="/person/$id"
            params={{ id: String(a.personId) }}
            className="w-16 shrink-0 space-y-1.5 text-center"
          >
            <div className="relative">
              {p?.profile_path ? (
                <img
                  src={`${PROFILE_IMG}${p.profile_path}`}
                  alt={p.name}
                  loading="lazy"
                  className="w-16 h-16 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-secondary ring-1 ring-border flex items-center justify-center text-sm font-semibold uppercase">
                  {(p?.name ?? "?").slice(0, 2)}
                </div>
              )}
              <span
                className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold border border-border"
                title={`#${i + 1}`}
              >
                {i + 1}
              </span>
            </div>
            <p className="text-[10px] leading-tight truncate">{p?.name ?? "…"}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-[var(--gold)] text-[var(--gold)]" />
              {a.avg.toFixed(1)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
