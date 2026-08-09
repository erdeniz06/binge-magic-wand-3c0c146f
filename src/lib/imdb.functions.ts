import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type ImdbRating = {
  tmdb_id: number;
  rating: number;
  votes: number;
};

export const getImdbRatings = createServerFn({ method: "GET" }).handler(
  async (): Promise<ImdbRating[]> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
    const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data, error } = await supabasePublic
      .from("imdb_ratings")
      .select("tmdb_id, rating, votes");

    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      tmdb_id: r.tmdb_id,
      rating: Number(r.rating),
      votes: r.votes,
    }));
  },
);
