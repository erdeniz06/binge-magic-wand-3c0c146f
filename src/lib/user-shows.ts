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
  episodes_logged: string[];
  review: string | null;
  completed_at: string | null;
  updated_at: string;
};

const SELECT =
  "tmdb_id, title, poster_path, status, episodes_watched, total_episodes, episode_runtime, rating, notify, seasons_logged, episodes_logged, review, completed_at, updated_at";

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

/** Stable key for a single episode inside `episodes_logged`. */
export const epKey = (season: number, episode: number) => `${season}x${episode}`;

export function isEpisodeLogged(show: UserShow | undefined, season: number, episode: number) {
  return !!show?.episodes_logged?.includes(epKey(season, episode));
}

export function isSeasonLogged(
  show: UserShow | undefined,
  season: number,
  episodeCount: number,
) {
  if (!show || episodeCount <= 0) return false;
  for (let e = 1; e <= episodeCount; e++) {
    if (!show.episodes_logged?.includes(epKey(season, e))) return false;
  }
  return true;
}

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

function base(meta: ShowMeta, prev: UserShow | null) {
  return {
    tmdb_id: meta.tmdb_id,
    title: meta.title,
    poster_path: meta.poster_path,
    total_episodes: meta.total_episodes ?? prev?.total_episodes ?? null,
    episode_runtime: meta.episode_runtime ?? prev?.episode_runtime ?? null,
    rating: prev?.rating ?? null,
    review: prev?.review ?? null,
    notify: prev?.notify ?? false,
  };
}

/** Seasons whose every episode is present in `episodes_logged`. */
function derivedSeasons(keys: string[], episodeCountBySeason: Record<number, number>) {
  const out: number[] = [];
  for (const [s, count] of Object.entries(episodeCountBySeason)) {
    const season = Number(s);
    if (count <= 0) continue;
    let all = true;
    for (let e = 1; e <= count; e++) {
      if (!keys.includes(epKey(season, e))) {
        all = false;
        break;
      }
    }
    if (all) out.push(season);
  }
  return out.sort((a, b) => a - b);
}

/**
 * Persist an exact set of logged episodes. Status reflects real progress:
 * only a complete run (or the explicit "whole series" mark) counts as watched.
 */
async function persistEpisodes(
  meta: ShowMeta,
  keys: string[],
  episodeCountBySeason: Record<number, number>,
  watchedAt?: Date,
) {
  const prev = await existing(meta.tmdb_id);
  const unique = Array.from(new Set(keys)).sort();
  const total = meta.total_episodes ?? prev?.total_episodes ?? null;
  const complete = total != null && total > 0 && unique.length >= total;
  const status = unique.length === 0
    ? prev?.status === "watchlist"
      ? "watchlist"
      : "watchlist"
    : complete
      ? "watched"
      : "partly_watched";

  await save({
    ...base(meta, prev),
    episodes_logged: unique,
    seasons_logged: derivedSeasons(unique, episodeCountBySeason),
    episodes_watched: unique.length,
    status,
    completed_at: complete
      ? (watchedAt?.toISOString() ?? prev?.completed_at ?? new Date().toISOString())
      : null,
  });
}

/** Toggle a single episode on/off (tap again to un-mark). */
export async function toggleEpisode(
  meta: ShowMeta,
  season: number,
  episode: number,
  episodeCountBySeason: Record<number, number>,
  watchedAt?: Date,
) {
  const prev = await existing(meta.tmdb_id);
  const key = epKey(season, episode);
  const current = prev?.episodes_logged ?? [];
  const next = current.includes(key)
    ? current.filter((k) => k !== key)
    : [...current, key];
  await persistEpisodes(meta, next, episodeCountBySeason, watchedAt);
  return !current.includes(key);
}

/** Toggle an entire season on/off. */
export async function toggleSeason(
  meta: ShowMeta,
  season: number,
  episodeCountBySeason: Record<number, number>,
  watchedAt?: Date,
) {
  const prev = await existing(meta.tmdb_id);
  const count = episodeCountBySeason[season] ?? 0;
  const current = prev?.episodes_logged ?? [];
  const seasonKeys = Array.from({ length: count }, (_, i) => epKey(season, i + 1));
  const all = count > 0 && seasonKeys.every((k) => current.includes(k));
  const next = all
    ? current.filter((k) => !seasonKeys.includes(k))
    : [...current, ...seasonKeys];
  await persistEpisodes(meta, next, episodeCountBySeason, watchedAt);
  return !all;
}

/**
 * Explicit "watched the entire series" mark, independent from episode logs.
 * Turning it off falls back to whatever episodes are still logged.
 */
export async function setWholeSeries(
  meta: ShowMeta,
  on: boolean,
  episodeCountBySeason: Record<number, number>,
  watchedAt?: Date,
) {
  const prev = await existing(meta.tmdb_id);
  if (on) {
    const total = meta.total_episodes ?? prev?.total_episodes ?? 0;
    await save({
      ...base(meta, prev),
      episodes_logged: prev?.episodes_logged ?? [],
      seasons_logged: prev?.seasons_logged ?? [],
      episodes_watched: total,
      status: "watched",
      completed_at:
        watchedAt?.toISOString() ?? prev?.completed_at ?? new Date().toISOString(),
    });
    return true;
  }
  await persistEpisodes(meta, prev?.episodes_logged ?? [], episodeCountBySeason, watchedAt);
  return false;
}

/** Save the user's own rating. Rating alone never implies a full watch. */
export async function rateShow(meta: ShowMeta, rating: number | null, watchedAt?: Date) {
  const prev = await existing(meta.tmdb_id);
  await save({
    ...base(meta, prev),
    rating,
    episodes_logged: prev?.episodes_logged ?? [],
    seasons_logged: prev?.seasons_logged ?? [],
    episodes_watched: prev?.episodes_watched ?? 0,
    status: prev?.status ?? "watchlist",
    completed_at:
      prev?.completed_at ?? (watchedAt ? watchedAt.toISOString() : null),
  });
}

/** Save (or clear) the user's written review, optionally with a rating. */
export async function saveReview(
  meta: ShowMeta,
  review: string | null,
  rating?: number | null,
) {
  const prev = await existing(meta.tmdb_id);
  await save({
    ...base(meta, prev),
    review: review && review.trim().length > 0 ? review.trim() : null,
    rating: rating === undefined ? (prev?.rating ?? null) : rating,
    episodes_logged: prev?.episodes_logged ?? [],
    seasons_logged: prev?.seasons_logged ?? [],
    episodes_watched: prev?.episodes_watched ?? 0,
    status: prev?.status ?? "watchlist",
    completed_at: prev?.completed_at ?? null,
  });
}

/** Mark the entire show as completed (used by the quick log dialog). */
export async function logWholeShow(meta: ShowMeta, _seasonCount: number, watchedAt?: Date) {
  await setWholeSeries(meta, true, {}, watchedAt);
}

/** Log every episode of a season (additive; used by the quick log dialog). */
export async function logSeason(
  meta: ShowMeta,
  season: number,
  episodeCountBySeason: Record<number, number>,
  watchedAt?: Date,
) {
  const prev = await existing(meta.tmdb_id);
  const count = episodeCountBySeason[season] ?? 0;
  const keys = [
    ...(prev?.episodes_logged ?? []),
    ...Array.from({ length: count }, (_, i) => epKey(season, i + 1)),
  ];
  await persistEpisodes(meta, keys, episodeCountBySeason, watchedAt);
}

/** Log a single episode by count: bumps partial progress only. */
export async function logEpisode(meta: ShowMeta, count = 1, watchedAt?: Date) {
  const prev = await existing(meta.tmdb_id);
  const total = meta.total_episodes ?? prev?.total_episodes ?? null;
  const episodes = Math.min((prev?.episodes_watched ?? 0) + count, total ?? Infinity);
  const complete = total != null && episodes >= total;
  await save({
    ...base(meta, prev),
    episodes_logged: prev?.episodes_logged ?? [],
    seasons_logged: prev?.seasons_logged ?? [],
    episodes_watched: episodes,
    status: complete ? "watched" : "partly_watched",
    completed_at: complete
      ? (watchedAt?.toISOString() ?? prev?.completed_at ?? new Date().toISOString())
      : null,
  });
}

/** Add to / remove from watchlist. `notify` opts into new season/episode alerts. */
export async function setWatchlist(meta: ShowMeta, notify: boolean) {
  const prev = await existing(meta.tmdb_id);
  await save({
    ...base(meta, prev),
    notify,
    episodes_logged: prev?.episodes_logged ?? [],
    seasons_logged: prev?.seasons_logged ?? [],
    episodes_watched: prev?.episodes_watched ?? 0,
    status:
      prev?.status === "watched" || prev?.status === "watching" || prev?.status === "partly_watched"
        ? prev.status
        : "watchlist",
    completed_at: prev?.completed_at ?? null,
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
