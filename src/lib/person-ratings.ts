import { supabase } from "@/integrations/supabase/client";

export const OVERALL = 0;

export async function getPersonRatings(personId: number): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from("person_ratings")
    .select("show_id, rating")
    .eq("person_id", personId);
  if (error) throw error;
  const out: Record<number, number> = {};
  for (const r of data ?? []) out[r.show_id] = Number(r.rating);
  return out;
}

export async function setPersonRating(
  personId: number,
  showId: number,
  rating: number | null,
  showTitle?: string,
) {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error("Not signed in");
  if (rating == null) {
    const { error } = await supabase
      .from("person_ratings")
      .delete()
      .eq("user_id", userId)
      .eq("person_id", personId)
      .eq("show_id", showId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("person_ratings").upsert(
    {
      user_id: userId,
      person_id: personId,
      show_id: showId,
      show_title: showTitle ?? null,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,person_id,show_id" },
  );
  if (error) throw error;
}
