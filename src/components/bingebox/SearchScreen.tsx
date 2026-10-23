import { useEffect, useState } from "react";
import { Search, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import {
  BROWSE_COUNTRIES_MAIN,
  BROWSE_COUNTRIES_MORE,
  BROWSE_DECADES,
  BROWSE_GENRES_MAIN,
  BROWSE_GENRES_MORE,
  BROWSE_LANGS_MAIN,
  BROWSE_LANGS_MORE,
  BROWSE_RATINGS,
  type BrowseChip,
} from "@/lib/browse-categories";
import { tvTitle } from "@/lib/format";

const PROFILE_IMG = "https://image.tmdb.org/t/p/w185";

function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  return lang.length === 2 ? `${lang}-${lang.toUpperCase()}` : lang;
}

type MultiResult = {
  id: number;
  media_type: string;
  name?: string;
  original_name?: string;
  origin_country?: string[];
  poster_path?: string | null;
  profile_path?: string | null;
  first_air_date?: string;
  known_for_department?: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-accent transition px-3.5 py-1.5 text-xs font-medium";

type TvMeta = {
  first_air_date?: string;
  last_air_date?: string | null;
  status?: string;
  genres?: { id: number; name: string }[];
  credits?: { cast?: { id: number; name: string }[] };
};

/** Genre, aired-year range and lead cast for a single search hit. */
function SeriesMetaLines({ id, language }: { id: number; language: string }) {
  const q = useQuery({
    queryKey: ["tmdb", "tv-meta", id, language],
    queryFn: () =>
      getTvShows({
        data: {
          endpoint: `/tv/${id}`,
          language,
          params: { append_to_response: "credits" },
        },
      }) as Promise<unknown> as Promise<TvMeta>,
    staleTime: 1000 * 60 * 60,
  });

  const d = q.data;
  const start = d?.first_air_date?.slice(0, 4);
  const end = d?.last_air_date?.slice(0, 4);
  const ongoing = d?.status === "Returning Series" || d?.status === "In Production";
  const years = start ? (ongoing ? `${start}–` : end && end !== start ? `${start}–${end}` : start) : "—";
  const genres = (d?.genres ?? []).slice(0, 3).map((g) => g.name).join(", ");
  const cast = (d?.credits?.cast ?? []).slice(0, 3).map((c) => c.name).join(", ");

  if (q.isLoading) {
    return <p className="text-xs text-muted-foreground">Yükleniyor…</p>;
  }

  return (
    <>
      <p className="text-xs text-muted-foreground truncate">
        Dizi · {years}
        {genres ? ` · ${genres}` : ""}
      </p>
      {cast && <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{cast}</p>}
    </>
  );
}

export function SearchScreen() {
  const navigate = useNavigate();
  const language = getUserLanguage();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [moreGenres, setMoreGenres] = useState(false);
  const [moreLangs, setMoreLangs] = useState(false);
  const [moreCountries, setMoreCountries] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const searchQ = useQuery({
    queryKey: ["tmdb", "search-multi", debounced, language],
    queryFn: () =>
      getTvShows({
        data: { endpoint: "/search/multi", language, params: { query: debounced } },
      }) as Promise<unknown> as Promise<{ results: MultiResult[] }>,
    enabled: debounced.length > 1,
    staleTime: 1000 * 60 * 10,
  });

  const results = (searchQ.data?.results ?? []).filter(
    (r) =>
      (r.media_type === "tv" && r.poster_path) ||
      (r.media_type === "person" && r.profile_path),
  );

  const searching = debounced.length > 1;

  const openCategory = (slug: string) =>
    navigate({ to: "/series/$category", params: { category: slug } });

  const Chip = ({ chip }: { chip: BrowseChip }) => (
    <button onClick={() => openCategory(chip.slug)} className={chipClass}>
      {(chip.slug === "lang-turkish" || chip.slug === "country-turkey") && (
        <TeaGlass className="h-4 w-4" />
      )}
      {chip.label}
    </button>
  );

  const MoreButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={chipClass}>
      {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      {open ? "Less" : "More"}
    </button>
  );

  return (
    <div className="px-4 pt-6 pb-32 space-y-7">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search series, actors, directors..."
          className="pl-10 h-11 rounded-full bg-card border-border"
        />
      </div>

      {searching ? (
        <section className="space-y-2">
          {searchQ.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              "{debounced}" için sonuç bulunamadı.
            </p>
          ) : (
            results.map((r) => {
              const isPerson = r.media_type === "person";
              const title = isPerson ? r.name : tvTitle(r);
              return (
                <button
                  key={`${r.media_type}-${r.id}`}
                  onClick={() =>
                    isPerson
                      ? navigate({ to: "/person/$id", params: { id: String(r.id) } })
                      : navigate({ to: "/series/tv/$id", params: { id: String(r.id) } })
                  }
                  className="w-full flex items-center gap-3 text-left rounded-xl bg-card border border-border hover:bg-accent transition p-2.5"
                >
                  {isPerson ? (
                    <img
                      src={`${PROFILE_IMG}${r.profile_path}`}
                      alt={r.name}
                      loading="lazy"
                      className="w-12 h-12 rounded-full object-cover bg-secondary"
                    />
                  ) : (
                    <img
                      src={`${TMDB_IMAGE_BASE}${r.poster_path}`}
                      alt={r.name}
                      loading="lazy"
                      className="w-12 h-16 rounded-md object-cover bg-secondary"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{title}</p>
                    {isPerson ? (
                      <p className="text-xs text-muted-foreground">
                        {r.known_for_department ?? "Oyuncu"}
                      </p>
                    ) : (
                      <SeriesMetaLines id={r.id} language={language} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </section>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {["Squid Game", "Severance", "The Bear", "Shōgun"].map((s) => (
              <button key={s} onClick={() => setQuery(s)} className={chipClass}>
                <Clock className="w-3 h-3" />
                {s}
              </button>
            ))}
          </div>

          <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Browse by
          </p>

          <Section title="Genre">
            {BROWSE_GENRES_MAIN.map((c) => (
              <Chip key={c.slug} chip={c} />
            ))}
            <MoreButton open={moreGenres} onClick={() => setMoreGenres((v) => !v)} />
            {moreGenres && BROWSE_GENRES_MORE.map((c) => <Chip key={c.slug} chip={c} />)}
          </Section>

          <Section title="Decade">
            {BROWSE_DECADES.map((c) => (
              <Chip key={c.slug} chip={c} />
            ))}
          </Section>

          <Section title="Language">
            {BROWSE_LANGS_MAIN.map((c) => (
              <Chip key={c.slug} chip={c} />
            ))}
            <MoreButton open={moreLangs} onClick={() => setMoreLangs((v) => !v)} />
            {moreLangs && BROWSE_LANGS_MORE.map((c) => <Chip key={c.slug} chip={c} />)}
          </Section>

          <Section title="Country">
            {BROWSE_COUNTRIES_MAIN.map((c) => (
              <Chip key={c.slug} chip={c} />
            ))}
            <MoreButton open={moreCountries} onClick={() => setMoreCountries((v) => !v)} />
            {moreCountries && BROWSE_COUNTRIES_MORE.map((c) => <Chip key={c.slug} chip={c} />)}
          </Section>

          <Section title="Rating">
            {BROWSE_RATINGS.map((c) => (
              <Chip key={c.slug} chip={c} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
