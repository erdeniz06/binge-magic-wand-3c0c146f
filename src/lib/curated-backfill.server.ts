export async function backfillRatings() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = process.env["TMDB_API_KEY"];
  if (!token) throw new Error("TMDB_API_KEY not configured");

  const { data: rows, error } = await supabaseAdmin
    .from("curated_lists")
    .select("id, tmdb_id")
    .is("vote_average", null);
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of rows ?? []) {
    const url = new URL(`https://api.themoviedb.org/3/tv/${row.tmdb_id}`);
    url.searchParams.set("language", "en-US");
    const res = await fetch(url.toString(), {
      headers: token.startsWith("ey")
        ? { Authorization: `Bearer ${token}` }
        : {},
    }).then((r) => (r.ok ? r.json() : null));

    let payload = res;
    if (!payload) {
      url.searchParams.set("api_key", token);
      payload = await fetch(url.toString()).then((r) => (r.ok ? r.json() : null));
    }
    if (!payload) continue;

    await supabaseAdmin
      .from("curated_lists")
      .update({
        vote_average: payload.vote_average ?? null,
        vote_count: payload.vote_count ?? null,
      })
      .eq("id", row.id);
    updated++;
  }
  return { updated, total: rows?.length ?? 0 };
}
