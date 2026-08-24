import { TMDB_CATEGORIES, type TmdbCategory } from "@/lib/tmdb-categories";

/**
 * Dynamic browse categories used by the Search "Browse by" chips.
 * Static curated categories live in tmdb-categories.ts; this resolver
 * handles genre-<key>, decade-<key>, lang-<key>, country-<key>, rating-<key>.
 */

type BrowseDef = { label: string; params: Record<string, string> };

// TMDB TV genre IDs. Romance (10749) and Horror (27) don't exist as TV genres,
// so they use keywords instead (verified: romance=9840, horror=315058).
const GENRES: Record<string, BrowseDef> = {
  drama: { label: "Drama", params: { with_genres: "18" } },
  comedy: { label: "Comedy", params: { with_genres: "35" } },
  thriller: { label: "Thriller", params: { with_genres: "9648|80" } },
  romance: { label: "Romance", params: { with_genres: "18", with_keywords: "9840" } },
  "sci-fi": { label: "Sci-Fi", params: { with_genres: "10765" } },
  crime: { label: "Crime", params: { with_genres: "80" } },
  horror: { label: "Horror", params: { with_keywords: "315058" } },
  documentary: { label: "Documentary", params: { with_genres: "99" } },
  animation: { label: "Animation", params: { with_genres: "16" } },
  "action-adventure": { label: "Action & Adventure", params: { with_genres: "10759" } },
  family: { label: "Family", params: { with_genres: "10751" } },
  kids: { label: "Kids", params: { with_genres: "10762" } },
  mystery: { label: "Mystery", params: { with_genres: "9648" } },
  soap: { label: "Soap", params: { with_genres: "10766" } },
  "war-politics": { label: "War & Politics", params: { with_genres: "10768" } },
  western: { label: "Western", params: { with_genres: "37" } },
};

const GENRE_KEYS_MAIN = [
  "drama",
  "comedy",
  "thriller",
  "romance",
  "sci-fi",
  "crime",
  "horror",
  "documentary",
  "animation",
];
const GENRE_KEYS_MORE = [
  "action-adventure",
  "family",
  "kids",
  "mystery",
  "soap",
  "war-politics",
  "western",
];

// air_date.* (not first_air_date.*) so any show that aired during the decade matches.
const DECADES: Record<string, { label: string; gte?: string; lte?: string }> = {
  "2020s": { label: "2020s", gte: "2020-01-01", lte: "2029-12-31" },
  "2010s": { label: "2010s", gte: "2010-01-01", lte: "2019-12-31" },
  "2000s": { label: "2000s", gte: "2000-01-01", lte: "2009-12-31" },
  "1990s": { label: "1990s", gte: "1990-01-01", lte: "1999-12-31" },
  "1980s": { label: "1980s", gte: "1980-01-01", lte: "1989-12-31" },
  earlier: { label: "Earlier", lte: "1979-12-31" },
};
const DECADE_KEYS = ["2020s", "2010s", "2000s", "1990s", "1980s", "earlier"];

const LANGUAGES: Record<string, { label: string; iso: string }> = {
  turkish: { label: "Turkish", iso: "tr" },
  english: { label: "English", iso: "en" },
  french: { label: "French", iso: "fr" },
  german: { label: "German", iso: "de" },
  spanish: { label: "Spanish", iso: "es" },
  japanese: { label: "Japanese", iso: "ja" },
  korean: { label: "Korean", iso: "ko" },
  italian: { label: "Italian", iso: "it" },
  portuguese: { label: "Portuguese", iso: "pt" },
  hindi: { label: "Hindi", iso: "hi" },
  arabic: { label: "Arabic", iso: "ar" },
  russian: { label: "Russian", iso: "ru" },
  chinese: { label: "Chinese", iso: "zh" },
};
const LANG_KEYS_MAIN = ["turkish", "english", "french", "german", "spanish", "japanese", "korean"];
const LANG_KEYS_MORE = ["italian", "portuguese", "hindi", "arabic", "russian", "chinese"];

const COUNTRIES: Record<string, { label: string; iso: string }> = {
  turkey: { label: "Turkey", iso: "TR" },
  usa: { label: "USA", iso: "US" },
  uk: { label: "UK", iso: "GB" },
  "south-korea": { label: "South Korea", iso: "KR" },
  japan: { label: "Japan", iso: "JP" },
  france: { label: "France", iso: "FR" },
  germany: { label: "Germany", iso: "DE" },
  spain: { label: "Spain", iso: "ES" },
  italy: { label: "Italy", iso: "IT" },
  india: { label: "India", iso: "IN" },
  canada: { label: "Canada", iso: "CA" },
  australia: { label: "Australia", iso: "AU" },
};
const COUNTRY_KEYS_MAIN = ["turkey", "usa", "uk", "south-korea", "japan", "france", "germany", "spain"];
const COUNTRY_KEYS_MORE = ["italy", "india", "canada", "australia"];

const RATINGS: Record<string, { label: string; gte: string; votes: string }> = {
  "9plus": { label: "9+", gte: "9", votes: "300" },
  "8plus": { label: "8+", gte: "8", votes: "200" },
  "7plus": { label: "7+", gte: "7", votes: "150" },
  "award-winners": { label: "Award Winners", gte: "8.5", votes: "1000" },
};
const RATING_KEYS = ["9plus", "8plus", "7plus", "award-winners"];

export type BrowseChip = { slug: string; label: string };

export const BROWSE_GENRES_MAIN: BrowseChip[] = GENRE_KEYS_MAIN.map((k) => ({
  slug: `genre-${k}`,
  label: GENRES[k].label,
}));
export const BROWSE_GENRES_MORE: BrowseChip[] = GENRE_KEYS_MORE.map((k) => ({
  slug: `genre-${k}`,
  label: GENRES[k].label,
}));
export const BROWSE_DECADES: BrowseChip[] = DECADE_KEYS.map((k) => ({
  slug: `decade-${k}`,
  label: DECADES[k].label,
}));
export const BROWSE_LANGS_MAIN: BrowseChip[] = LANG_KEYS_MAIN.map((k) => ({
  slug: `lang-${k}`,
  label: LANGUAGES[k].label,
}));
export const BROWSE_LANGS_MORE: BrowseChip[] = LANG_KEYS_MORE.map((k) => ({
  slug: `lang-${k}`,
  label: LANGUAGES[k].label,
}));
export const BROWSE_COUNTRIES_MAIN: BrowseChip[] = COUNTRY_KEYS_MAIN.map((k) => ({
  slug: `country-${k}`,
  label: COUNTRIES[k].label,
}));
export const BROWSE_COUNTRIES_MORE: BrowseChip[] = COUNTRY_KEYS_MORE.map((k) => ({
  slug: `country-${k}`,
  label: COUNTRIES[k].label,
}));
export const BROWSE_RATINGS: BrowseChip[] = RATING_KEYS.map((k) => ({
  slug: `rating-${k}`,
  label: RATINGS[k].label,
}));

/** Resolve any category slug (static curated or dynamic browse) to a TMDB query. */
export function resolveTmdbCategory(slug: string): TmdbCategory | null {
  if (TMDB_CATEGORIES[slug]) return TMDB_CATEGORIES[slug];

  if (slug.startsWith("genre-")) {
    const def = GENRES[slug.slice(6)];
    if (!def) return null;
    return {
      slug,
      title: `${def.label} Dizileri`,
      endpoint: "/discover/tv",
      params: { sort_by: "vote_average.desc", "vote_count.gte": "1000", ...def.params },
    };
  }

  if (slug.startsWith("decade-")) {
    const def = DECADES[slug.slice(7)];
    if (!def) return null;
    return {
      slug,
      title: def.label === "Earlier" ? "1980 Öncesi Diziler" : `${def.label} Dizileri`,
      endpoint: "/discover/tv",
      params: {
        sort_by: "vote_average.desc",
        "vote_count.gte": "1000",
        ...(def.gte ? { "air_date.gte": def.gte } : {}),
        ...(def.lte ? { "air_date.lte": def.lte } : {}),
      },
    };
  }

  if (slug.startsWith("lang-")) {
    const def = LANGUAGES[slug.slice(5)];
    if (!def) return null;
    return {
      slug,
      title: `${def.label} Dizileri`,
      endpoint: "/discover/tv",
      params: {
        sort_by: "vote_average.desc",
        "vote_count.gte": "1000",
        with_original_language: def.iso,
      },
    };
  }

  if (slug.startsWith("country-")) {
    const def = COUNTRIES[slug.slice(8)];
    if (!def) return null;
    return {
      slug,
      title: `${def.label} Dizileri`,
      endpoint: "/discover/tv",
      params: {
        sort_by: "vote_average.desc",
        "vote_count.gte": "1000",
        with_origin_country: def.iso,
      },
    };
  }

  if (slug.startsWith("rating-")) {
    const def = RATINGS[slug.slice(7)];
    if (!def) return null;
    return {
      slug,
      title: `${def.label} Puanlı Diziler`,
      endpoint: "/discover/tv",
      params: {
        sort_by: "vote_average.desc",
        "vote_average.gte": def.gte,
        "vote_count.gte": def.votes,
      },
    };
  }

  return null;
}
