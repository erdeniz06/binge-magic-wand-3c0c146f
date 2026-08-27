import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Loader2, Play, Star, X } from "lucide-react";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { ShowTracking } from "@/components/bingebox/ShowTracking";


function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  if (lang.length === 2) return `${lang}-${lang.toUpperCase()}`;
  return lang;
}

export const Route = createFileRoute("/_authenticated/series/tv/$id")({
  head: () => ({
    meta: [
      { title: "Series — BingeBox" },
      { name: "description", content: "TV series details on BingeBox" },
    ],
  }),
  component: SeriesDetailPage,
});

type TvDetail = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  seasons?: { season_number: number; episode_count: number; name?: string }[];

};

type Credits = {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }[];
};

type Videos = {
  results: {
    key: string;
    site: string;
    type: string;
    name: string;
  }[];
};

type Reviews = {
  results: {
    id: string;
    author: string;
    content: string;
    created_at: string;
    author_details?: { rating: number | null; avatar_path: string | null };
  }[];
};

function SeriesDetailPage() {
  const { id } = Route.useParams();
  const language = getUserLanguage();
  const router = useRouter();
  const [trailerOpen, setTrailerOpen] = useState(false);

  const detailQ = useQuery({
    queryKey: ["tmdb", "tv", id, language],
    queryFn: () =>
      getTvShows({ data: { endpoint: `/tv/${id}`, language } }) as Promise<
        unknown
      >,
    staleTime: 1000 * 60 * 30,
  });

  const creditsQ = useQuery({
    queryKey: ["tmdb", "tv", id, "credits", language],
    queryFn: () =>
      getTvShows({
        data: { endpoint: `/tv/${id}/credits`, language },
      }) as Promise<unknown>,
    staleTime: 1000 * 60 * 30,
  });

  // Videos: always request en-US and allow every video language, otherwise
  // localised requests (e.g. tr-TR) come back with an empty results array.
  const videosQ = useQuery({
    queryKey: ["tmdb", "tv", id, "videos"],
    queryFn: () =>
      getTvShows({
        data: {
          endpoint: `/tv/${id}/videos`,
          language: "en-US",
          params: { include_video_language: "en,null" },
        },
      }) as Promise<unknown>,
    staleTime: 1000 * 60 * 30,
  });


  const reviewsQ = useQuery({
    queryKey: ["tmdb", "tv", id, "reviews", language],
    queryFn: () =>
      getTvShows({
        data: { endpoint: `/tv/${id}/reviews`, language },
      }) as Promise<unknown>,
    staleTime: 1000 * 60 * 30,
  });

  const detail = detailQ.data as TvDetail | undefined;
  const credits = creditsQ.data as Credits | undefined;
  const videos = videosQ.data as Videos | undefined;
  const reviews = (reviewsQ.data as Reviews | undefined)?.results ?? [];

  const youtube = (videos?.results ?? []).filter((v) => v.site === "YouTube" && v.key);
  const trailer =
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser") ??
    youtube[0];


  const cast = credits?.cast?.slice(0, 8) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.history.back()}
          className="p-1 -ml-1 rounded-md hover:bg-muted"
          aria-label="Geri"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold tracking-tight truncate">
          {detail?.name ?? "…"}
        </h1>
      </header>

      {detailQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : detailQ.isError || !detail ? (
        <div className="p-8 text-center text-sm text-destructive">
          Bir şeyler ters gitti.
        </div>
      ) : (
        <>
          <div className="relative aspect-video w-full bg-card">
            {detail.backdrop_path && (
              <img
                src={`https://image.tmdb.org/t/p/w780${detail.backdrop_path}`}
                alt={detail.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            {trailer && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                Trailer
              </button>
            )}
          </div>

          <div className="px-4 -mt-10 relative flex gap-3">
            <div className="w-24 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-card ring-1 ring-border">
              {detail.poster_path && (
                <img
                  src={`${TMDB_IMAGE_BASE}${detail.poster_path}`}
                  alt={detail.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-10">
              <h2 className="text-lg font-bold leading-tight">{detail.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{detail.first_air_date?.slice(0, 4) || "—"}</span>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
                  {detail.vote_average?.toFixed(1) ?? "—"}
                </span>
                <span>· {detail.vote_count?.toLocaleString()} oy</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {detail.number_of_seasons} sezon · {detail.number_of_episodes} bölüm
              </p>
            </div>
          </div>

          <div className="px-4 mt-4 flex flex-wrap gap-1.5">
            {detail.genres?.map((g) => (
              <span
                key={g.id}
                className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {g.name}
              </span>
            ))}
          </div>


          <ShowTracking
            meta={{
              tmdb_id: detail.id,
              title: detail.name,
              poster_path: detail.poster_path,
              total_episodes: detail.number_of_episodes ?? null,
              episode_runtime: (detail as { episode_run_time?: number[] }).episode_run_time?.[0] ?? null,
            }}
            seasons={detail.seasons ?? []}
          />



          {detail.overview && (
            <section className="px-4 mt-4">
              <h3 className="text-sm font-bold mb-1.5">Özet</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {detail.overview}
              </p>
            </section>
          )}

          {cast.length > 0 && (
            <section className="mt-6">
              <h3 className="px-4 text-sm font-bold mb-3">Oyuncular</h3>
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x">
                {cast.map((c) => (
                  <Link
                    key={c.id}
                    to="/person/$id"
                    params={{ id: String(c.id) }}
                    className="shrink-0 w-20 snap-start"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card ring-1 ring-border">
                      {c.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                          alt={c.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          {c.name?.[0]}
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {c.character}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="px-4 mt-6 space-y-3">
            <h3 className="text-sm font-bold">Yorumlar</h3>
            <ReviewEditor
              meta={{
                tmdb_id: detail.id,
                title: detail.name,
                poster_path: detail.poster_path,
                total_episodes: detail.number_of_episodes ?? null,
              }}
            />

            {reviewsQ.isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-xl bg-card ring-1 ring-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold truncate">{r.author}</p>
                      {r.author_details?.rating != null && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0">
                          <Star className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
                          {r.author_details.rating}/10
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-6 whitespace-pre-line">
                      {r.content}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-card ring-1 ring-border p-5 text-center">
                <p className="text-xs text-muted-foreground">
                  TMDB'de henüz yorum yok — yukarıdan kendi yorumunu yazabilirsin.
                </p>
              </div>
            )}

          </section>
        </>
      )}

      {trailerOpen && trailer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setTrailerOpen(false)}
        >
          <button
            onClick={() => setTrailerOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="w-full max-w-3xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title={trailer.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
