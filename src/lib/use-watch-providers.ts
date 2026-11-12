import { useQuery } from "@tanstack/react-query";
import { getWatchProviders, PROVIDER_LOGO_BASE } from "@/lib/watch-providers.functions";
import { useUserCountry } from "@/lib/use-user-country";

export { PROVIDER_LOGO_BASE };

/** Batched TMDB watch providers for a row of shows, in the user's country. */
export function useWatchProviders(ids: number[], region?: string) {
  const { country } = useUserCountry();
  const effectiveRegion = region ?? country;
  const limited = Array.from(new Set(ids.filter((n) => Number.isFinite(n)))).slice(0, 40);
  const key = limited.join(",");
  return useQuery({
    queryKey: ["watch-providers", effectiveRegion, key],
    queryFn: () => getWatchProviders({ data: { ids: limited, region: effectiveRegion } }),
    enabled: limited.length > 0,
    staleTime: 1000 * 60 * 60 * 12,
  });
}
