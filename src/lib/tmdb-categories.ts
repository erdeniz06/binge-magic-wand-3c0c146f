export type TmdbCategory = {
  slug: string;
  title: string;
  endpoint: string;
  params?: Record<string, string | number>;
  accentClass?: string;
};

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
};
