const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function buildCacheKey(endpoint: string, params: Record<string, string | number>) {
  const norm = endpoint.replace(/^\/+/, "").replace(/\//g, "-");
  const keys = Object.keys(params).sort();
  if (keys.length === 0) return norm;
  return `${norm}?${keys.map((k) => `${k}=${params[k]}`).join("&")}`;
}

/** Fetch any TMDB endpoint through the shared 12h database cache. */
export async function fetchTmdbCached<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const cacheKey = buildCacheKey(endpoint, params);

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cached } = await supabaseAdmin
      .from("tmdb_cache")
      .select("data, created_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (cached?.created_at) {
      const age = Date.now() - new Date(cached.created_at as string).getTime();
      if (age < CACHE_TTL_MS) return cached.data as T;
    }
  } catch {
    // fall through to live fetch
  }

  const token = process.env.TMDB_API_KEY;
  if (!token) throw new Error("TMDB_API_KEY not configured");

  const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const headers: Record<string, string> = { accept: "application/json" };
  if (token.startsWith("ey")) headers.Authorization = `Bearer ${token}`;
  else url.searchParams.set("api_key", token);

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as T;

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
}
