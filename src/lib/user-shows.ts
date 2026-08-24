import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserShowStatus =
  | "plan_to_watch"
  | "watchlist"
  | "watching"
  | "partly_watched"
  | "watched"
  | "dropped";

export type UserShow = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  status: string;
  episodes_watched: number;
  total_episodes: number | null;
  episode_runtime: number | null;
  rating: number | null;
  notify: boolean;
  seasons_logged: number[];
  completed_at: string | null;
  updated_at: string;
};

const SELECT =
  "tmdb_id, title, poster_path, status, episodes_watched, total_episodes, episode_runtime, rating, notify, seasons_logged, completed_at, updated_at";

export const USER_SHOWS_KEY = ["user_shows"] as const;

export function useUserShows() {
  return useQuery({
    queryKey: USER_SHOWS_KEY,
    queryFn: async (): Promise<UserShow[]> => {
      const { data, error } = await supabase.from("user_shows").select(SELECT);
      if (error) throw error;
      return (data ?? []) as UserShow[];
    },
    staleTime: 1000 * 30,
  });
}

export function useUserShowMap() {
  const q = useUserShows();
  const map = new Map<number, UserShow>((q.data ?? []).map((s) => [s.tmdb_id, s]));
  return { map, ...q };
}

export function useInvalidateUserShows() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: USER_SHOWS_KEY });
}

export type ShowMeta = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  total_episodes: number | null;
  episode_runtime?: number | null;
};

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

async function existing(tmdbId: number) {
  const { data } = await supabase
    .from("user_shows")
    .select(SELECT)
    .eq("tmdb_id", tmdbId)
    .maybeSingle();
  return (data ?? null) as UserShow | null;
}

async function save(row: Record<string, unknown>) {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("user_shows")
    .upsert({ ...row, user_id, updated_at: new Date().toISOString() } as never, {
      onConflict: "user_id,tmdb_id",
    });
  if (error) throw error;
}

/** Rating the whole show is the strongest signal: watched + 100% progress. */
export async function rateShow(meta: ShowMeta, rating: number | null, watchedAt?: Date) {
  await save({
    tmdb_id: meta.tmdb_id,
    title: meta.title,
    poster_path: meta.poster_path,
    total_episodes: meta.total_episodes,
    episode_runtime: meta.episode_runtime ?? null,
    rating,
    status: "watched",
    episodes_watched: meta.total_episodes ?? 0,
    completed_at: (watchedAt ?? new Date()).toISOString(),
  });
}

/** Mark the entire show as completed without a rating. */
export async function logWholeShow(meta: ShowMeta, seasonCount: number, watchedAt?: Date) {
  const prev = await existing(meta.tmdb_id);
  await save({
    tmdb_id: meta.tmdb_id,
    title: meta.title,
    poster_path: meta.poster_path,
    total_episodes: meta.total_episodes,
    episode_runtime: meta.episode_runtime ?? null,
    rating: prev?.rating ?? null,
    status: "watched",
    episodes_watched: meta.total_episodes ?? 0,
    seasons_logged: Array.from({ length: seasonCount }, (_, i) => i + 1),
    completed_at: watchedAt?.toISOString() ?? prev?.completed_at ?? new Date().toISOString(),
  });
}

/**
 * Logging a season marks every episode of that season as watched.
 * Progress = sum of episodes across all logged seasons.
 * An overall rating already implies "watched" and is never downgraded.
 */
export async function logSeason(
  meta: ShowMeta,
  season: number,
  episodeCountBySeason: Record<number, number>,
  watchedAt?: Date,
) {
  const prev = await existing(meta.tmdb_id);
  const seasons = Array.from(new Set([...(prev?.seasons_logged ?? []), season])).sort(
    (a, b) => a - b,
  );
  const episodes = seasons.reduce((sum, s) => sum + (episodeCountBySeason[s] ?? 0), 0);
  const rated = prev?.rating != null;
  const total = meta.total_episodes ?? prev?.total_episodes ?? null;
  const done = total != null && episodes >= total;
  await save({
    tmdb_id: meta.tmdb_id,
    title: meta.title,
    poster_path: meta.poster_path,
    total_episodes: total,
    episode_runtime: meta.episode_runtime ?? prev?.episode_runtime ?? null,
    rating: prev?.rating ?? null,
    seasons_logged: seasons,
    episodes_watched: rated ? (total ?? episodes) : episodes,
    status: rated || done ? "watched" : "partly_watched",
    completed_at: rated || done
      ? (watchedAt?.toISOString() ?? prev?.completed_at ?? new Date().toISOString())
      : null,
  });
}

/** Log a single episode: bumps progress by one, keeps status at watching. */
export async function logEpisode(meta: ShowMeta, count = 1, watchedAt?: Date) {
  const prev = await existing(meta.tmdb_id);
  const total = meta.total_episodes ?? prev?.total_episodes ?? null;
  const episodes = Math.min((prev?.episodes_watched ?? 0) + count, total ?? Infinity);
  const rated = prev?.rating != null;
  const done = total != null && episodes >= total;
  await save({
    tmdb_id: meta.tmdb_id,
    title: meta.title,
    poster_path: meta.poster_path,
    total_episodes: total,
    episode_runtime: meta.episode_runtime ?? prev?.episode_runtime ?? null,
    rating: prev?.rating ?? null,
    seasons_logged: prev?.seasons_logged ?? [],
    episodes_watched: rated ? (total ?? episodes) : episodes,
    status: rated || done ? "watched" : "watching",
    completed_at: rated || done
      ? (watchedAt?.toISOString() ?? prev?.completed_at ?? new Date().toISOString())
      : null,
  });
}

/** Add to / remove from watchlist. `notify` opts into new season/episode alerts. */
export async function setWatchlist(meta: ShowMeta, notify: boolean) {
  const prev = await existing(meta.tmdb_id);
  await save({
    tmdb_id: meta.tmdb_id,
    title: meta.title,
    poster_path: meta.poster_path,
    total_episodes: meta.total_episodes,
    episode_runtime: meta.episode_runtime ?? prev?.episode_runtime ?? null,
    rating: prev?.rating ?? null,
    seasons_logged: prev?.seasons_logged ?? [],
    episodes_watched: prev?.episodes_watched ?? 0,
    status:
      prev?.status === "watched" || prev?.status === "watching" || prev?.status === "partly_watched"
        ? prev.status
        : "watchlist",
    notify,
  });
}

export async function removeShow(tmdbId: number) {
  const { error } = await supabase.from("user_shows").delete().eq("tmdb_id", tmdbId);
  if (error) throw error;
}

export async function setNotify(tmdbId: number, notify: boolean) {
  const { error } = await supabase
    .from("user_shows")
    .update({ notify, updated_at: new Date().toISOString() })
    .eq("tmdb_id", tmdbId);
  if (error) throw error;
}
