export function formatVotes(n: number) {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

/**
 * Display title for a TV show. Turkish productions keep their original
 * Turkish name instead of TMDB's English translation.
 */
export function tvTitle(show: {
  name?: string | null;
  title?: string | null;
  original_name?: string | null;
  origin_country?: string[] | null;
}) {
  const localized = show.name ?? show.title ?? "";
  if (show.origin_country?.includes("TR") && show.original_name) return show.original_name;
  return localized;
}
