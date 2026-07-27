import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Proxies requests to TMDB. Key stays server-side (TMDB_API_KEY secret).
// endpoint: e.g. "/trending/tv/week" or "/discover/tv"
// params: query string params (excluding api_key/authorization)
export const getTvShows = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      endpoint: z.string().regex(/^\/[a-zA-Z0-9/_-]+$/, "invalid endpoint"),
      params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const token = process.env.TMDB_API_KEY;
    if (!token) throw new Error("TMDB_API_KEY not configured");

    const url = new URL(`https://api.themoviedb.org/3${data.endpoint}`);
    url.searchParams.set("language", "en-US");
    if (data.params) {
      for (const [k, v] of Object.entries(data.params)) {
        url.searchParams.set(k, String(v));
      }
    }

    // TMDB v4 read-access tokens (JWT-shaped) use Bearer auth.
    // v3 keys (32-char hex) use ?api_key=. Detect and route accordingly.
    const isV4 = token.startsWith("ey");
    const headers: Record<string, string> = { accept: "application/json" };
    if (isV4) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      url.searchParams.set("api_key", token);
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`TMDB ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as {
      results: Array<{
        id: number;
        name: string;
        original_name: string;
        overview: string;
        poster_path: string | null;
        backdrop_path: string | null;
        first_air_date: string;
        vote_average: number;
        vote_count: number;
        origin_country?: string[];
      }>;
      page?: number;
      total_pages?: number;
      total_results?: number;
    };
  });

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
