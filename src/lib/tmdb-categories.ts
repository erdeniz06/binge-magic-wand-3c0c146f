export type TmdbCategory = {
  slug: string;
  title: string;
  endpoint: string;
  params?: Record<string, string | number>;
  accentClass?: string;
  /** When set, only the first N results are shown and pagination is disabled. */
  limit?: number;
};

const top10 = (genre: number) => ({
  endpoint: "/discover/tv",
  params: {
    with_genres: String(genre),
    sort_by: "vote_average.desc",
    "vote_count.gte": "100",
  },
  limit: 10,
});

export const TMDB_CATEGORIES: Record<string, TmdbCategory> = {
  "100-greatest-shows": {
    slug: "100-greatest-shows",
    title: "100 Greatest Shows",
    endpoint: "/trending/tv/week",
  },
  "turkish-classics": {
    slug: "turkish-classics",
    title: "Top 20 Turkish Series (IMDb)",
    endpoint: "/discover/tv",
    params: {
      with_origin_country: "TR",
      sort_by: "vote_average.desc",
      "vote_count.gte": "50",
    },
    accentClass: "text-[var(--classic)]",
  },
  "popular-this-week": {
    slug: "popular-this-week",
    title: "Popular This Week",
    endpoint: "/tv/popular",
  },
  "top-10-sitcoms": {
    slug: "top-10-sitcoms",
    title: "Top 10 Sitcoms",
    ...top10(35),
  },
  "top-10-crime": {
    slug: "top-10-crime",
    title: "Top 10 Crime / Mystery",
    ...top10(80),
  },
  "top-10-drama": {
    slug: "top-10-drama",
    title: "Top 10 Drama",
    ...top10(18),
  },
  "top-10-animation": {
    slug: "top-10-animation",
    title: "Top 10 Animation",
    ...top10(16),
  },
  "top-10-family": {
    slug: "top-10-family",
    title: "Top 10 Family",
    ...top10(10751),
  },
  "top-10-adventure": {
    slug: "top-10-adventure",
    title: "Top 10 Action & Adventure",
    ...top10(10759),
  },
  "top-10-kids": {
    slug: "top-10-kids",
    title: "Top 10 Kids",
    ...top10(10762),
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
