import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, Loader2, MapPin, Cake } from "lucide-react";
import { getTvShows } from "@/lib/tmdb.functions";
import { getPersonRatings, setPersonRating, OVERALL } from "@/lib/person-ratings";
import { PersonRatingStars } from "@/components/bingebox/PersonRatingStars";
import { toast } from "sonner";

const PROFILE_IMG = "https://image.tmdb.org/t/p/w300";
const POSTER_IMG = "https://image.tmdb.org/t/p/w200";

function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  return lang.length === 2 ? `${lang}-${lang.toUpperCase()}` : lang;
}

type Person = {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department: string;
  birthday: string | null;
  place_of_birth: string | null;
};

type Credit = {
  id: number;
  name: string;
  original_name?: string;
  poster_path: string | null;
  first_air_date?: string;
  vote_count?: number;
  character?: string;
  job?: string;
};

type Credits = { cast: Credit[]; crew: Credit[] };

const CREW_JOBS = new Set(["Creator", "Executive Producer", "Writer", "Director", "Producer"]);

export const Route = createFileRoute("/_authenticated/person/$id")({
  head: () => ({
    meta: [
      { title: "Person — BingeBox" },
      { name: "description", content: "Actor and creator profile, shows and biography." },
      { property: "og:title", content: "Person — BingeBox" },
      { property: "og:description", content: "Actor and creator profile, shows and biography." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PersonPage,
});

function PersonPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const language = getUserLanguage();
  const [bioOpen, setBioOpen] = useState(false);

  const personQ = useQuery({
    queryKey: ["tmdb", "person", id, language],
    queryFn: () =>
      getTvShows({ data: { endpoint: `/person/${id}`, language } }) as Promise<unknown>,
    staleTime: 1000 * 60 * 60,
  });

  const creditsQ = useQuery({
    queryKey: ["tmdb", "person", id, "tv_credits", language],
    queryFn: () =>
      getTvShows({ data: { endpoint: `/person/${id}/tv_credits`, language } }) as Promise<unknown>,
    staleTime: 1000 * 60 * 60,
  });

  const qc = useQueryClient();
  const ratingsKey = ["person-ratings", id];
  const ratingsQ = useQuery({
    queryKey: ratingsKey,
    queryFn: () => getPersonRatings(Number(id)),
  });
  const ratings = ratingsQ.data ?? {};
  const [rateTarget, setRateTarget] = useState<{ id: number; name: string } | null>(null);
  const rate = async (showId: number, v: number | null, title?: string) => {
    qc.setQueryData(ratingsKey, (old: Record<number, number> | undefined) => {
      const n = { ...(old ?? {}) };
      if (v == null) delete n[showId];
      else n[showId] = v;
      return n;
    });
    try {
      await setPersonRating(Number(id), showId, v, title);
    } catch {
      toast.error("Couldn't save rating");
      qc.invalidateQueries({ queryKey: ratingsKey });
    }
  };

  const person = personQ.data as Person | undefined;
  const credits = creditsQ.data as Credits | undefined;

  const knownFor = useMemo(() => {
    const seen = new Set<number>();
    return (credits?.cast ?? [])
      .filter((c) => {
        if (!c.poster_path || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      })
      .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
      .slice(0, 18);
  }, [credits]);

  const created = useMemo(() => {
    const seen = new Set<number>();
    return (credits?.crew ?? [])
      .filter((c) => {
        if (!c.poster_path || !c.job || !CREW_JOBS.has(c.job) || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      })
      .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
      .slice(0, 12);
  }, [credits]);

  const birthday = person?.birthday
    ? new Date(person.birthday).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.history.back()}
          className="p-1 -ml-1 rounded-md hover:bg-muted"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold tracking-tight truncate">{person?.name ?? "…"}</h1>
      </header>

      {personQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : personQ.isError || !person ? (
        <div className="p-8 text-center text-sm text-destructive">Something went wrong.</div>
      ) : (
        <>
          <div className="px-4 pt-5 flex gap-4">
            <div className="w-28 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-card ring-1 ring-border">
              {person.profile_path && (
                <img
                  src={`${PROFILE_IMG}${person.profile_path}`}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-bold leading-tight">{person.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{person.known_for_department}</p>
              {birthday && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Cake className="w-3.5 h-3.5" /> {birthday}
                </p>
              )}
              {person.place_of_birth && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {person.place_of_birth}
                </p>
              )}
            </div>
          </div>

          <section className="mx-4 mt-5 rounded-xl bg-card ring-1 ring-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Your overall rating</h3>
              <span className="text-lg font-bold text-primary">
                {ratings[OVERALL] != null ? `${ratings[OVERALL]}/10` : "—"}
              </span>
            </div>
            <div className="mt-2">
              <PersonRatingStars
                value={ratings[OVERALL] ?? null}
                onChange={(v) => rate(OVERALL, v)}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Optional. Rate their performance in each show below with “Rate”.
            </p>
          </section>

          {person.biography && (
            <section className="px-4 mt-5">
              <h3 className="text-sm font-bold mb-1.5">Biography</h3>
              <p
                className={
                  bioOpen
                    ? "text-sm text-muted-foreground leading-relaxed"
                    : "text-sm text-muted-foreground leading-relaxed line-clamp-5"
                }
              >
                {person.biography}
              </p>
              <button
                onClick={() => setBioOpen((v) => !v)}
                className="mt-1 text-xs font-semibold text-foreground"
              >
                {bioOpen ? "Show less" : "Read more"}
              </button>
            </section>
          )}

          {knownFor.length > 0 && (
            <section className="mt-6">
              <h3 className="px-4 text-sm font-bold mb-3">
                {person.known_for_department === "Acting" ? "Appears In" : "Shows"}
              </h3>
              <div className="px-4 grid grid-cols-3 gap-2.5">
                {knownFor.map((c) => (
                  <Link
                    key={c.id}
                    to="/series/tv/$id"
                    params={{ id: String(c.id) }}
                    className="space-y-1"
                  >
                    <img
                      src={`${POSTER_IMG}${c.poster_path}`}
                      alt={c.name}
                      loading="lazy"
                      className="w-full aspect-[2/3] rounded-lg object-cover bg-card ring-1 ring-border"
                    />
                    <p className="text-[11px] leading-tight truncate">{c.name}</p>
                    {c.character && (
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">
                        {c.character}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRateTarget({ id: c.id, name: c.name });
                      }}
                      className="mt-0.5 w-full rounded-md bg-muted px-1.5 py-1 text-[10px] font-semibold"
                    >
                      {ratings[c.id] != null ? `★ ${ratings[c.id]}/10` : "Rate"}
                    </button>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {created.length > 0 && (
            <section className="mt-6">
              <h3 className="px-4 text-sm font-bold mb-3">As Creator / Producer</h3>
              <div className="px-4 grid grid-cols-3 gap-2.5">
                {created.map((c) => (
                  <Link
                    key={c.id}
                    to="/series/tv/$id"
                    params={{ id: String(c.id) }}
                    className="space-y-1"
                  >
                    <img
                      src={`${POSTER_IMG}${c.poster_path}`}
                      alt={c.name}
                      loading="lazy"
                      className="w-full aspect-[2/3] rounded-lg object-cover bg-card ring-1 ring-border"
                    />
                    <p className="text-[11px] leading-tight truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">
                      {c.job}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {creditsQ.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {rateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/70"
          onClick={() => setRateTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-card ring-1 ring-border p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-muted-foreground">Rate {person?.name}'s performance in</p>
            <h3 className="text-base font-bold">{rateTarget.name}</h3>
            <div className="mt-3 flex items-center justify-between">
              <PersonRatingStars
                size="w-6 h-6"
                value={ratings[rateTarget.id] ?? null}
                onChange={(v) => rate(rateTarget.id, v, rateTarget.name)}
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-primary">
              {ratings[rateTarget.id] != null ? `${ratings[rateTarget.id]}/10` : "Not rated"}
            </p>
            <button
              onClick={() => setRateTarget(null)}
              className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
