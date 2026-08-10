import { useQuery } from "@tanstack/react-query";
import { getWatchProviders, PROVIDER_LOGO_BASE } from "@/lib/watch-providers.functions";

export { PROVIDER_LOGO_BASE };

/** Batched TMDB watch providers (region TR) for a row of shows. */
export function useWatchProviders(ids: number[], region = "TR") {
  const limited = Array.from(new Set(ids.filter((n) => Number.isFinite(n)))).slice(0, 40);
  const key = limited.join(",");
  return useQuery({
    queryKey: ["watch-providers", region, key],
    queryFn: () => getWatchProviders({ data: { ids: limited, region } }),
    enabled: limited.length > 0,
    staleTime: 1000 * 60 * 60 * 12,
  });
}
