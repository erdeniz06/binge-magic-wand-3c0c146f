import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Film, Star } from "lucide-react";
import { getFavoriteActors } from "@/lib/favorite-actors";
import { getTvShows } from "@/lib/tmdb.functions";
import { useUserShows } from "@/lib/user-shows";

const PROFILE_IMG = "https://image.tmdb.org/t/p/w185";

type PersonInfo = { name: string; profile_path: string | null };
type Credits = { cast?: { id: number }[] };

/**
 * "Favorite Actors" — built automatically from the user's actor ratings.
 * No manual picking: rate an actor's performance on their page and they
 * appear here, ranked by average score. Each tile also shows how many times
 * they act in shows the user has on their list.
 */
export function FavoriteActorsRow() {
  const actorsQ = useQuery({
    queryKey: ["favorite-actors"],
    queryFn: () => getFavoriteActors(12),
    staleTime: 1000 * 60 * 5,
  });

  const actors = actorsQ.data ?? [];

  const showsQ = useUserShows();
  const tracked = new Map<number, string>((showsQ.data ?? []).map((s) => [s.tmdb_id, s.title]));

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

  // Which of the user's shows each actor actually appears in.
  const creditsQ = useQuery({
    queryKey: ["favorite-actors", "credits", actors.map((a) => a.personId).join(",")],
    enabled: actors.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      const out: Record<number, number[]> = {};
      await Promise.all(
        actors.map(async (a) => {
          try {
            const c = (await getTvShows({
              data: { endpoint: `/person/${a.personId}/tv_credits`, language: "en-US" },
            })) as unknown as Credits;
            out[a.personId] = (c.cast ?? []).map((x) => x.id);
          } catch {
            // No credits loaded: the tile falls back to the number of ratings.
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
  const credits = creditsQ.data ?? {};

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar">
      {actors.map((a, i) => {
        const p = people[a.personId];
        const castIn = credits[a.personId];
        const seen = castIn
          ? [...new Set(castIn)].filter((id) => tracked.has(id)).map((id) => tracked.get(id)!)
          : null;
        const count = seen ? seen.length : a.ratedShows;
        const hint = seen
          ? seen.length > 0
            ? `In ${seen.length} of your shows: ${seen.join(", ")}`
            : `Rated in ${a.ratedShows} ${a.ratedShows === 1 ? "performance" : "performances"}, none of their shows are on your list`
          : `Rated in ${a.ratedShows} ${a.ratedShows === 1 ? "performance" : "performances"}`;
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
            <p
              className="text-[9px] text-muted-foreground flex items-center justify-center gap-0.5"
              title={hint}
            >
              <Film className="w-2.5 h-2.5" />
              {count} {count === 1 ? "show" : "shows"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
