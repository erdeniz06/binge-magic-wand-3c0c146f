import { supabase } from "@/integrations/supabase/client";
import { OVERALL } from "@/lib/person-ratings";

export type FavoriteActor = {
  personId: number;
  avg: number;
  ratedShows: number;
};

/**
 * Actors ranked by the user's own ratings: for each person, the average of
 * their per-show performance ratings (the direct overall slot is ignored).
 * Sorted best-first; ties broken by number of rated shows.
 */
export async function getFavoriteActors(limit = 12): Promise<FavoriteActor[]> {
  const { data, error } = await supabase
    .from("person_ratings")
    .select("person_id, show_id, rating");
  if (error) throw error;

  const byPerson = new Map<number, { sum: number; count: number }>();
  for (const r of data ?? []) {
    if (r.show_id === OVERALL) continue;
    const cur = byPerson.get(r.person_id) ?? { sum: 0, count: 0 };
    cur.sum += Number(r.rating);
    cur.count += 1;
    byPerson.set(r.person_id, cur);
  }

  return [...byPerson.entries()]
    .map(([personId, { sum, count }]) => ({
      personId,
      avg: sum / count,
      ratedShows: count,
    }))
    .sort((a, b) => b.avg - a.avg || b.ratedShows - a.ratedShows)
    .slice(0, limit);
}
