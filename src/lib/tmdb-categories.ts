export type TmdbCategory = {
  slug: string;
  title: string;
  endpoint: string;
  params?: Record<string, string | number>;
  accentClass?: string;
  /** When set, only the first N results are shown and pagination stops there. */
  limit?: number;
};

/** Shared ordering for every "top rated" style list so ratings/rank stay consistent. */
export const TOP_RATED_PARAMS = {
  sort_by: "vote_average.desc",
  "vote_count.gte": "1000",
} as const;

const topGenre = (genre: number, limit = 20) => ({
  endpoint: "/discover/tv",
  params: {
    with_genres: String(genre),
    ...TOP_RATED_PARAMS,
  },
  limit,
});

export const TMDB_CATEGORIES: Record<string, TmdbCategory> = {
  "100-greatest-shows": {
    slug: "100-greatest-shows",
    title: "100 Greatest Shows",
    endpoint: "/discover/tv",
    params: { ...TOP_RATED_PARAMS, "vote_count.gte": "2000" },
    limit: 100,
  },
  "turkish-classics": {
    slug: "turkish-classics",
    title: "Top 50 Turkish Series",
    endpoint: "/discover/tv",
    params: {
      with_origin_country: "TR",
      ...TOP_RATED_PARAMS,
      "vote_count.gte": "100",
    },
    limit: 50,
    accentClass: "text-[var(--classic)]",
  },
  "popular-this-week": {
    slug: "popular-this-week",
    title: "Popular This Week",
    endpoint: "/tv/popular",
  },
  "top-10-sitcoms": {
    slug: "top-10-sitcoms",
    title: "Top 20 Sitcoms",
    ...topGenre(35),
  },
  "top-10-crime": {
    slug: "top-10-crime",
    title: "Top 20 Crime / Mystery",
    ...topGenre(80),
  },
  "top-10-drama": {
    slug: "top-10-drama",
    title: "Top 20 Drama",
    ...topGenre(18),
  },
  "top-10-animation": {
    slug: "top-10-animation",
    title: "Top 20 Animation",
    ...topGenre(16),
  },
  "top-10-family": {
    slug: "top-10-family",
    title: "Top 20 Family",
    ...topGenre(10751),
  },
  "top-10-adventure": {
    slug: "top-10-adventure",
    title: "Top 20 Action & Adventure",
    ...topGenre(10759),
  },
  "top-10-kids": {
    slug: "top-10-kids",
    title: "Top 20 Kids",
    ...topGenre(10762),
  },
};

export const GENRE_LIST_SLUGS = [
  "top-10-sitcoms",
  "top-10-crime",
  "top-10-drama",
  "top-10-animation",
  "top-10-family",
  "top-10-adventure",
  "top-10-kids",
] as const;
