import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function buildCacheKey(endpoint: string, params?: Record<string, string | number>) {
  const norm = endpoint.replace(/^\/+/, "").replace(/\//g, "-");
  if (!params || Object.keys(params).length === 0) return norm;
  const suffix = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${norm}?${suffix}`;
}

export const getTvShows = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      endpoint: z.string().regex(/^\/[a-zA-Z0-9/_-]+$/, "invalid endpoint"),
      params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
      language: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const language = data.language ?? "en-US";
    const cacheKey = buildCacheKey(data.endpoint, {
      ...(data.params ?? {}),
      language,
    });

    // Try cache first
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: cached } = await supabaseAdmin
        .from("tmdb_cache")
        .select("data, created_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      if (cached && cached.created_at) {
        const age = Date.now() - new Date(cached.created_at as string).getTime();
        if (age < CACHE_TTL_MS) {
          return cached.data as TmdbResponse;
        }
      }
    } catch {
      // fall through to live fetch
    }

    const token = process.env.TMDB_API_KEY;
    if (!token) throw new Error("TMDB_API_KEY not configured");

    const url = new URL(`https://api.themoviedb.org/3${data.endpoint}`);
    url.searchParams.set("language", language);
    if (data.params) {
      for (const [k, v] of Object.entries(data.params)) {
        url.searchParams.set(k, String(v));
      }
    }

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
    const json = (await res.json()) as TmdbResponse;

    // Upsert into cache (best-effort)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("tmdb_cache")
        .upsert(
          { cache_key: cacheKey, data: json as never, created_at: new Date().toISOString() },
          { onConflict: "cache_key" },
        );
    } catch {
      // ignore cache write failures
    }

    return json;
  });

type TmdbResponse = {
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

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
