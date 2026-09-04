import { useMemo, useState } from "react";
import { Bell, BellOff, Check, ChevronLeft, Loader2, Search, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import {
  logEpisode,
  logSeason,
  logWholeShow,
  rateShow,
  setWatchlist,
  useInvalidateUserShows,
  type ShowMeta,
  type WatchPeriod,
} from "@/lib/user-shows";
import { WatchYearPicker } from "./WatchYearPicker";
import { tvTitle } from "@/lib/format";

type LogMode = "episode" | "season" | "show" | "watchlist";

const options: { mode: LogMode; title: string; desc: string }[] = [
  { mode: "episode", title: "Log Episode", desc: "Mark an episode as completed" },
  { mode: "season", title: "Log Season", desc: "Mark an entire season as completed" },
  { mode: "show", title: "Log Show", desc: "Mark an entire show as completed" },
  { mode: "watchlist", title: "Add to Watchlist", desc: "Save a show for later" },
];

type SearchResult = {
  id: number;
  name: string;
  original_name?: string;
  origin_country?: string[];
  poster_path: string | null;
  first_air_date?: string;
};

type TvDetail = {
  id: number;
  name: string;
  original_name?: string;
  origin_country?: string[];
  poster_path: string | null;
  number_of_episodes: number;
  episode_run_time?: number[];
  seasons: { season_number: number; episode_count: number; name: string }[];
};

function getUserLanguage() {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language || "en-US";
  return lang.length === 2 ? `${lang}-${lang.toUpperCase()}` : lang;
}

export function LogActivityDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const language = getUserLanguage();
  const [mode, setMode] = useState<LogMode | null>(null);
  const [query, setQuery] = useState("");
  const [showId, setShowId] = useState<number | null>(null);
  const [seasonSel, setSeasonSel] = useState<number[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [notify, setNotify] = useState(false);
  const [watchedPeriod, setWatchedPeriod] = useState<WatchPeriod | null>(null);
  const [saving, setSaving] = useState(false);
  const invalidate = useInvalidateUserShows();


  const searchQ = useQuery({
    queryKey: ["tmdb", "search", query, language],
    queryFn: () =>
      getTvShows({
        data: { endpoint: "/search/tv", language, params: { query } },
      }) as Promise<{ results: SearchResult[] }>,
    enabled: open && query.trim().length > 1,
    staleTime: 1000 * 60 * 10,
  });

  const detailQ = useQuery({
    queryKey: ["tmdb", "tv", showId, language],
    queryFn: () =>
      getTvShows({
        data: { endpoint: `/tv/${showId}`, language },
      }) as Promise<unknown> as Promise<TvDetail>,
    enabled: open && showId != null,
    staleTime: 1000 * 60 * 30,
  });

  const detail = detailQ.data;
  const seasons = useMemo(
    () => (detail?.seasons ?? []).filter((s) => s.season_number > 0 && s.episode_count > 0),
    [detail],
  );
  const episodeCountBySeason = useMemo(() => {
    const m: Record<number, number> = {};
    for (const s of seasons) m[s.season_number] = s.episode_count;
    return m;
  }, [seasons]);

  const reset = () => {
    setMode(null);
    setQuery("");
    setShowId(null);
    setSeasonSel([]);
    setRating(null);
    setNotify(false);
    setWatchedPeriod(null);
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const meta: ShowMeta | null = detail
    ? {
        tmdb_id: detail.id,
        title: tvTitle(detail),
        poster_path: detail.poster_path,
        total_episodes: detail.number_of_episodes ?? null,
        episode_runtime: detail.episode_run_time?.[0] ?? null,
      }
    : null;

  const submit = async () => {
    if (!meta || !mode) return;
    if (mode !== "watchlist" && watchedPeriod == null) {
      toast.error("Hangi yıl izlediğini seç");
      return;
    }
    setSaving(true);
    const period = mode === "watchlist" ? undefined : watchedPeriod!;
    try {
      if (mode === "watchlist") {
        await setWatchlist(meta, notify);
        toast.success(
          notify ? `${meta.title} watchlist'e eklendi, takip açık` : `${meta.title} watchlist'e eklendi`,
        );
      } else if (mode === "show") {
        if (rating != null) await rateShow(meta, rating, period);
        else await logWholeShow(meta, seasons.length, period);
        toast.success(`${meta.title} izlendi olarak işaretlendi`);
      } else if (mode === "season") {
        if (seasonSel.length === 0) {
          toast.error("En az bir sezon seç");
          return;
        }
        const ordered = [...seasonSel].sort((a, b) => a - b);
        for (const s of ordered) {
          await logSeason(meta, s, episodeCountBySeason, period);
        }
        toast.success(
          ordered.length === 1
            ? `${meta.title} S${ordered[0]} izlendi`
            : `${meta.title} · ${ordered.length} sezon izlendi (S${ordered.join(", S")})`,
        );
      } else {
        await logEpisode(meta, 1, period);
        toast.success(`${meta.title} · 1 bölüm eklendi`);
      }
      invalidate();
      close(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const results = searchQ.data?.results?.filter((r) => r.poster_path) ?? [];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-background border-border max-w-md max-h-[86vh] overflow-hidden p-0">
        <DialogHeader>
          <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
            {mode && (
              <button
                onClick={() => {
                  if (showId) {
                    setShowId(null);
                    setSeasonSel([]);
                    setRating(null);
                    setWatchedPeriod(null);
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
            <DialogTitle>
              {mode ? options.find((o) => o.mode === mode)?.title : "Log Activity"}
            </DialogTitle>
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

          {mode && showId == null && (
            <div className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Dizi ara…"
                  className="pl-10 h-11 rounded-full bg-card border-border"
                  autoFocus
                />
              </div>

              {query.trim().length < 2 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aramak için en az 2 harf yaz.
                </p>
              ) : searchQ.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  "{query}" için sonuç yok
                </p>
              ) : (
                <div className="space-y-2">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setShowId(r.id);
                        setSeasonSel([]);
                      }}
                      className="w-full flex items-center gap-3 text-left rounded-xl bg-card border border-border hover:bg-accent transition p-2.5"
                    >
                      <img
                        src={`${TMDB_IMAGE_BASE}${r.poster_path}`}
                        alt={r.name}
                        loading="lazy"
                        className="w-12 h-16 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {tvTitle(r)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.first_air_date?.slice(0, 4) || "—"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode && showId != null && (
            <div className="space-y-5 pt-4">
              {detailQ.isLoading || !detail ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {detail.poster_path && (
                      <img
                        src={`${TMDB_IMAGE_BASE}${detail.poster_path}`}
                        alt={detail.name}
                        className="w-14 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold leading-tight">{tvTitle(detail)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {seasons.length} sezon · {detail.number_of_episodes} bölüm
                      </p>
                    </div>
                  </div>

                  {(mode === "season" || mode === "episode") && (
                    <div className="space-y-2">
                      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                        {mode === "season" ? "Sezonlar (birden fazla seçebilirsin)" : "Sezon"}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {seasons.map((s) => {
                          const selected = seasonSel.includes(s.season_number);
                          return (
                            <button
                              key={s.season_number}
                              onClick={() =>
                                setSeasonSel((prev) =>
                                  mode === "episode"
                                    ? [s.season_number]
                                    : prev.includes(s.season_number)
                                      ? prev.filter((n) => n !== s.season_number)
                                      : [...prev, s.season_number],
                                )
                              }
                              className={cn(
                                "relative h-10 rounded-lg border text-sm transition",
                                selected
                                  ? "bg-foreground text-background border-foreground"
                                  : "bg-card border-border hover:bg-accent",
                              )}
                            >
                              S{s.season_number}
                              {selected && mode === "season" && (
                                <Check className="absolute top-0.5 right-0.5 w-3 h-3" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {seasonSel.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {mode === "season"
                            ? `${seasonSel.length} sezon seçildi · ${seasonSel.reduce((sum, n) => sum + (episodeCountBySeason[n] ?? 0), 0)} bölüm`
                            : `S${seasonSel[0]} · ${episodeCountBySeason[seasonSel[0]]} bölüm`}
                        </p>
                      )}
                    </div>
                  )}

                  {mode === "show" && (
                    <div className="space-y-2">
                      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                        Puanın (opsiyonel)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            onClick={() => setRating(rating === n ? null : n)}
                            className={cn(
                              "w-9 h-9 rounded-lg border text-xs font-semibold transition flex items-center justify-center",
                              rating === n
                                ? "bg-foreground text-background border-foreground"
                                : "bg-card border-border hover:bg-accent",
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Puan verirsen dizi %100 izlendi sayılır.
                      </p>
                    </div>
                  )}

                  {mode === "watchlist" && (
                    <button
                      onClick={() => setNotify(!notify)}
                      className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        {notify ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        🔔 Bu diziyi takip et
                      </span>
                      <span
                        className={cn(
                          "relative w-10 h-6 rounded-full transition",
                          notify ? "bg-foreground" : "bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-5 h-5 rounded-full bg-background transition-all",
                            notify ? "left-[18px]" : "left-0.5",
                          )}
                        />
                      </span>
                    </button>
                  )}

                  {mode !== "watchlist" && (
                    <div className="space-y-1.5">
                      <WatchYearPicker
                        value={watchedPeriod}
                        onChange={setWatchedPeriod}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Geçmiş bir yıl seçersen bu yılki istatistiklerine sayılmaz.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={submit}
                    disabled={
                      saving ||
                      (mode === "season" && seasonSel.length === 0) ||
                      (mode !== "watchlist" && watchedPeriod == null)
                    }
                    className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
