import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type CuratedItem = {
  rank: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  vote_count: number | null;
  network: string | null;
};


export const getCuratedList = createServerFn({ method: "GET" })
  .inputValidator(z.object({ listName: z.string().min(1).max(64) }))
  .handler(async ({ data }): Promise<CuratedItem[]> => {
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

    const { data: rows, error } = await supabasePublic
      .from("curated_lists")
      .select("rank, tmdb_id, title, poster_path, vote_average, vote_count, network")
      .eq("list_name", data.listName)
      .order("rank", { ascending: true });

    if (error) throw new Error(error.message);
    return (rows ?? []) as CuratedItem[];
  });
