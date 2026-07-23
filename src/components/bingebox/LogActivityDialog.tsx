import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  popularThisWeek,
  friendsWatching,
  greatest100,
  essentialClassicsTR,
  genres,
  decades,
  languages,
  countries,
} from "@/lib/bingebox-data";

type LogMode = "episode" | "season" | "show";

const options: { mode: LogMode; title: string; desc: string }[] = [
  { mode: "episode", title: "Log Episode", desc: "Mark an episode as completed" },
  { mode: "season", title: "Log Season", desc: "Mark an entire season as completed" },
  { mode: "show", title: "Log Show", desc: "Mark an entire show as completed" },
];

// Aggregate all shows and enrich with seasons metadata for the log flow.
const seasonsMap: Record<string, number[]> = {
  "breaking-bad": [7, 13, 13, 13, 16],
  severance: [9, 10],
  bear: [8, 10, 10],
  shogun: [10],
  from: [10, 10],
  "off-campus": [8],
  "law-svu": [22, 22, 22],
  recruit: [8, 6],
  daredevil: [9],
  from2: [10],
  sopranos: [13, 13, 13, 13, 13, 21],
  wire: [13, 12, 12, 13, 10],
  got: [10, 10, 10, 10, 10, 10, 7, 6],
  chernobyl: [5],
  succession: [10, 10, 9, 10],
  kurtlar: [20, 34, 29, 14],
  behzat: [38, 40, 17, 9],
  leyla: [23, 45, 17],
  asmali: [37, 33],
  ezel: [26, 45, 20],
};

const allShows = [
  ...greatest100,
  ...essentialClassicsTR,
  ...popularThisWeek,
  ...friendsWatching,
].map((s) => ({ ...s, seasons: seasonsMap[s.id] ?? [10] }));

// Deduplicate by id
const shows = Array.from(new Map(allShows.map((s) => [s.id, s])).values());

const recentSearches = ["Squid Game", "Severance", "The Bear", "Shōgun"];

function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-accent transition px-3.5 py-1.5 text-xs font-medium">
      {icon}
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function LogActivityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<LogMode | null>(null);
  const [query, setQuery] = useState("");
  const [showId, setShowId] = useState<string | null>(null);
  const [season, setSeason] = useState(1);

  const selectedShow = shows.find((s) => s.id === showId) ?? null;
  const filteredShows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return shows.filter((s) => s.title.toLowerCase().includes(q));
  }, [query]);

  const reset = () => {
    setMode(null);
    setQuery("");
    setShowId(null);
    setSeason(1);
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const complete = (label: string) => {
    toast.success(`${label} logged`);
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-background border-border max-w-md max-h-[86vh] overflow-hidden p-0">
        <DialogHeader>
          <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
            {mode && (
              <button
                onClick={() => {
                  if (selectedShow) {
                    setShowId(null);
                    setSeason(1);
                  } else {
                    setMode(null);
                    setQuery("");
                  }
                }}
                className="p-1.5 -ml-1 rounded-full hover:bg-accent transition"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <DialogTitle>{mode ? options.find((o) => o.mode === mode)?.title : "Log Activity"}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-4 pb-6 overflow-y-auto max-h-[72vh]">
          {!mode && (
            <div className="space-y-2.5 pt-4">
              {options.map((o) => (
                <button
                  key={o.title}
                  onClick={() => setMode(o.mode)}
                  className="w-full text-left rounded-xl bg-card border border-border hover:bg-accent transition px-4 py-3.5"
                >
                  <p className="text-sm font-semibold">{o.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          )}

          {mode && !selectedShow && (
            <div className="space-y-7 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search series, actors, directors..."
                  className="pl-10 h-11 rounded-full bg-card border-border"
                  autoFocus
                />
              </div>

              {query.trim() === "" ? (
                <>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-accent transition px-3.5 py-1.5 text-xs font-medium whitespace-nowrap"
                      >
                        <Clock className="w-3 h-3" />
                        {s}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Browse by</p>

                  <Section title="Genre">
                    {genres.slice(0, 9).map((g) => <Chip key={g}>{g}</Chip>)}
                    <Chip icon={<span className="text-base leading-none">+</span>}>More</Chip>
                  </Section>

                  <Section title="Decade">
                    {decades.map((d) => <Chip key={d}>{d}</Chip>)}
                  </Section>

                  <Section title="Language">
                    {languages.map((l) => <Chip key={l}>{l}</Chip>)}
                    <Chip icon={<ChevronDown className="w-3 h-3" />}>Other</Chip>
                  </Section>

                  <Section title="Country">
                    {countries.map((c) => <Chip key={c}>{c}</Chip>)}
                  </Section>

                  <Section title="Rating">
                    {["9+", "8+", "7+", "Award Winners"].map((r) => <Chip key={r}>{r}</Chip>)}
                  </Section>
                </>
              ) : (
                <div className="space-y-2">
                  {filteredShows.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No results for "{query}"
                    </p>
                  )}
                  {filteredShows.map((show) => (
                    <button
                      key={show.id}
                      onClick={() => {
                        setShowId(show.id);
                        setSeason(1);
                      }}
                      className="w-full flex items-center gap-3 text-left rounded-xl bg-card border border-border hover:bg-accent transition p-2.5"
                    >
                      <img src={show.poster} alt={`${show.title} poster`} className="w-12 h-16 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{show.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {show.year} · {show.seasons.length} seasons
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode && selectedShow && (
            <div className="space-y-5 pt-4">
              <div className="flex items-center gap-3">
                <img src={selectedShow.poster} alt={`${selectedShow.title} poster`} className="w-14 h-20 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold leading-tight">{selectedShow.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedShow.year} · choose what you completed</p>
                </div>
              </div>

              {mode !== "show" && (
                <div className="space-y-2">
                  <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Season</p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedShow.seasons.map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={value}
                          onClick={() => setSeason(value)}
                          className={cn(
                            "h-10 rounded-lg border text-sm transition",
                            season === value ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent",
                          )}
                        >
                          S{value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "episode" && (
                <div className="space-y-2">
                  <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Episode</p>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: selectedShow.seasons[season - 1] }, (_, index) => {
                      const episode = index + 1;
                      return (
                        <button
                          key={episode}
                          onClick={() => complete(`${selectedShow.title} S${season} E${episode}`)}
                          className="h-10 rounded-lg bg-card border border-border hover:bg-accent transition text-sm"
                        >
                          E{episode}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "season" && (
                <button
                  onClick={() => complete(`${selectedShow.title} Season ${season}`)}
                  className="w-full h-12 rounded-xl bg-foreground text-background font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
                >
                  <Check className="w-4 h-4" />
                  Mark Season {season} Completed
                </button>
              )}

              {mode === "show" && (
                <button
                  onClick={() => complete(selectedShow.title)}
                  className="w-full h-12 rounded-xl bg-foreground text-background font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
                >
                  <Check className="w-4 h-4" />
                  Mark Entire Show Completed
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
