import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, Loader2, MapPin, Cake } from "lucide-react";
import { getTvShows } from "@/lib/tmdb.functions";

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
      { title: "Kişi — BingeBox" },
      { name: "description", content: "Oyuncu ve yapımcı profili, dizileri ve biyografisi." },
      { property: "og:title", content: "Kişi — BingeBox" },
      { property: "og:description", content: "Oyuncu ve yapımcı profili, dizileri ve biyografisi." },
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
    ? new Date(person.birthday).toLocaleDateString("tr-TR", {
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
          aria-label="Geri"
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
        <div className="p-8 text-center text-sm text-destructive">Bir şeyler ters gitti.</div>
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

          {person.biography && (
            <section className="px-4 mt-5">
              <h3 className="text-sm font-bold mb-1.5">Biyografi</h3>
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
                {bioOpen ? "Daha az" : "Devamını oku"}
              </button>
            </section>
          )}

          {knownFor.length > 0 && (
            <section className="mt-6">
              <h3 className="px-4 text-sm font-bold mb-3">
                {person.known_for_department === "Acting" ? "Oynadığı Diziler" : "Dizileri"}
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
                  </Link>
                ))}
              </div>
            </section>
          )}

          {created.length > 0 && (
            <section className="mt-6">
              <h3 className="px-4 text-sm font-bold mb-3">Yaratıcı / Yapımcı Olarak</h3>
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
    </div>
  );
}
