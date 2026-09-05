import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type FeedReview = {
  id: string;
  author: string;
  avatar_path: string | null;
  rating: number | null;
  content: string;
  created_at: string;
  show_id: number;
  show_title: string;
  show_poster: string | null;
};

type TmdbTv = {
  id: number;
  name: string;
  original_name?: string;
  origin_country?: string[];
  poster_path: string | null;
};

type TmdbReviews = {
  results: Array<{
    id: string;
    author: string;
    content: string;
    created_at: string;
    author_details?: { rating: number | null; avatar_path: string | null };
  }>;
};

function pickTitle(s: TmdbTv) {
  return s.origin_country?.includes("TR") && s.original_name ? s.original_name : s.name;
}

/**
 * TMDB has no global review feed, so we aggregate real reviews from the
 * shows on a popular/top-rated page. No mock data — empty means empty.
 */
export const getReviewFeed = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      source: z.enum(["popular", "top_rated"]).default("popular"),
      language: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<FeedReview[]> => {
    const { fetchTmdbCached } = await import("./tmdb.server");
    const language = data.language ?? "en-US";

    const list = await fetchTmdbCached<{ results: TmdbTv[] }>(`/tv/${data.source}`, {
      language,
      page: 1,
    });
    const shows = (list.results ?? []).slice(0, 14);

    const batches = await Promise.all(
      shows.map(async (s) => {
        try {
          const r = await fetchTmdbCached<TmdbReviews>(`/tv/${s.id}/reviews`, {
            language: "en-US",
            page: 1,
          });
          return (r.results ?? []).map((rv) => ({
            id: rv.id,
            author: rv.author,
            avatar_path: rv.author_details?.avatar_path ?? null,
            rating: rv.author_details?.rating ?? null,
            content: rv.content,
            created_at: rv.created_at,
            show_id: s.id,
            show_title: pickTitle(s),
            show_poster: s.poster_path,
          }));
        } catch {
          return [];
        }
      }),
    );

    return batches
      .flat()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 60);
  });
