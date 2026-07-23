import { useMemo, useState } from "react";
import { Check, ChevronLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LogMode = "episode" | "season" | "show";

const options: { mode: LogMode; title: string; desc: string }[] = [
  { mode: "episode", title: "Log Episode", desc: "Mark an episode as completed" },
  { mode: "season", title: "Log Season", desc: "Mark an entire season as completed" },
  { mode: "show", title: "Log Show", desc: "Mark an entire show as completed" },
];

const poster = (seed: string) => `https://picsum.photos/seed/${seed}/160/240`;

const shows = [
  { id: "dark", title: "Dark", year: 2017, poster: poster("log-dark"), seasons: [10, 8, 8] },
  { id: "severance", title: "Severance", year: 2022, poster: poster("log-severance"), seasons: [9, 10] },
  { id: "the-bear", title: "The Bear", year: 2022, poster: poster("log-bear"), seasons: [8, 10, 10] },
  { id: "breaking-bad", title: "Breaking Bad", year: 2008, poster: poster("log-bb"), seasons: [7, 13, 13, 13, 16] },
  { id: "kurtlar-vadisi", title: "Kurtlar Vadisi", year: 2003, poster: poster("log-kurtlar"), seasons: [20, 34, 29, 14] },
  { id: "behzat-c", title: "Behzat Ç.", year: 2010, poster: poster("log-behzat"), seasons: [38, 40, 17, 9] },
];

export function LogActivityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<LogMode | null>(null);
  const [query, setQuery] = useState("");
  const [showId, setShowId] = useState<string | null>(null);
  const [season, setSeason] = useState(1);

  const selectedShow = shows.find((s) => s.id === showId) ?? null;
  const filteredShows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shows;
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

        <div className="px-4 pb-4 overflow-y-auto max-h-[72vh]">
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
            <div className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search series..."
                  className="pl-10 h-11 rounded-full bg-card border-border"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
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
                      <p className="text-xs text-muted-foreground">{show.year} · {show.seasons.length} seasons</p>
                    </div>
                  </button>
                ))}
              </div>
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
