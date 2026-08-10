import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchTmdbCached } from "./tmdb.server";

export type ProviderInfo = {
  provider_name: string;
  logo_path: string | null;
  link: string | null;
};

type ProvidersResponse = {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: { provider_name: string; logo_path: string | null }[];
      free?: { provider_name: string; logo_path: string | null }[];
      ads?: { provider_name: string; logo_path: string | null }[];
      rent?: { provider_name: string; logo_path: string | null }[];
      buy?: { provider_name: string; logo_path: string | null }[];
    }
  >;
};

export const getWatchProviders = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ids: z.array(z.number().int().positive()).min(1).max(40),
      region: z.string().length(2).default("TR"),
    }),
  )
  .handler(async ({ data }) => {
    const out: Record<string, ProviderInfo> = {};
    await Promise.all(
      data.ids.map(async (id) => {
        try {
          const json = await fetchTmdbCached<ProvidersResponse>(
            `/tv/${id}/watch/providers`,
          );
          const region = json.results?.[data.region];
          const first =
            region?.flatrate?.[0] ??
            region?.free?.[0] ??
            region?.ads?.[0] ??
            region?.rent?.[0] ??
            region?.buy?.[0];
          if (first) {
            out[String(id)] = {
              provider_name: first.provider_name,
              logo_path: first.logo_path,
              link: region?.link ?? null,
            };
          }
        } catch {
          // skip failures for individual shows
        }
      }),
    );
    return out;
  });

export const PROVIDER_LOGO_BASE = "https://image.tmdb.org/t/p/w92";
