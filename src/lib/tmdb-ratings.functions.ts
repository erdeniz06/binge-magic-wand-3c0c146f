import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TmdbRating = { vote_average: number; vote_count: number };

/**
 * Canonical TMDB ratings for a set of shows, so curated lists display the
 * exact same number as every other screen. Results are served from the shared
 * 12h TMDB cache.
 */
export const getTmdbRatings = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ids: z.array(z.number().int().positive()).max(60) }))
  .handler(async ({ data }): Promise<Record<string, TmdbRating>> => {
    const { fetchTmdbCached } = await import("./tmdb.server");
    const ids = Array.from(new Set(data.ids));
    const out: Record<string, TmdbRating> = {};
    const CONCURRENCY = 10;
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      await Promise.all(
        ids.slice(i, i + CONCURRENCY).map(async (id) => {
          try {
            const detail = await fetchTmdbCached<TmdbRating>(`/tv/${id}`, {
              language: "en-US",
            });
            out[String(id)] = {
              vote_average: detail.vote_average,
              vote_count: detail.vote_count,
            };
          } catch {
            // skip shows TMDB can't resolve
          }
        }),
      );
    }
    return out;
  });
