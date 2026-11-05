import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getTvShows, TMDB_IMAGE_BASE } from "@/lib/tmdb.functions";
import { tvTitle } from "@/lib/format";
import { assignShowCategory, useInvalidateUserShows, useUserShowMap, type ProfileShowStatus, type WatchPeriod } from "@/lib/user-shows";
import { WatchYearPicker } from "./WatchYearPicker";

const labels: Record<ProfileShowStatus, string> = {
  watched: "Watched", watching: "Watching", partly_watched: "Partly", watchlist: "Watchlist",
};
type SearchResult = { id: number; name: string; original_name?: string; origin_country?: string[]; poster_path: string | null; first_air_date?: string };
type Detail = SearchResult & { number_of_episodes: number; episode_run_time?: number[] };

export function AddToCategoryDialog({ status, onClose }: { status: ProfileShowStatus; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [period, setPeriod] = useState<WatchPeriod | null>(null);
  const [saving, setSaving] = useState(false);
  const { map } = useUserShowMap();
  const invalidate = useInvalidateUserShows();
  const search = useQuery({
    queryKey: ["tmdb", "profile-add-search", query.trim()],
    queryFn: async () => await getTvShows({ data: { endpoint: "/search/tv", language: "en-US", params: { query: query.trim() } } }) as unknown as { results: SearchResult[] },
    enabled: query.trim().length >= 2,
  });
  const detail = useQuery({
    queryKey: ["tmdb", "profile-add-detail", selected?.id],
    queryFn: async () => await getTvShows({ data: { endpoint: `/tv/${selected?.id}`, language: "en-US" } }) as unknown as Detail,
    enabled: selected != null,
  });
  const previous = selected ? map.get(selected.id) : undefined;
  const needsYear = status === "watched" && !period && !previous?.completed_at;

  async function submit() {
    const show = detail.data;
    if (!show || saving || needsYear) return;
    setSaving(true);
    try {
      await assignShowCategory({
        tmdb_id: show.id, title: tvTitle(show), poster_path: show.poster_path,
        total_episodes: show.number_of_episodes ?? null,
        episode_runtime: show.episode_run_time?.[0] ?? null,
      }, status, period ?? undefined);
      await invalidate();
      toast.success(`${tvTitle(show)} ${previous && previous.status !== status ? "moved" : "added"} to ${labels[status]}`);
      onClose();
    } catch {
      toast.error("Could not save the show. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add to {labels[status]}</DialogTitle>
        <DialogDescription className="sr-only">Choose a show for {labels[status]}.</DialogDescription>
      </DialogHeader>
      {!selected ? <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input autoFocus aria-label="Search shows" placeholder="Search shows…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {search.isFetching ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          : search.isError ? <p className="text-sm text-destructive">Could not search shows. <Button variant="link" onClick={() => search.refetch()}>Retry</Button></p>
          : query.trim().length >= 2 && search.data?.results.length === 0 ? <p className="text-sm text-muted-foreground">No shows found.</p> : null}
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {(search.data?.results ?? []).map((show) => <Button key={show.id} variant="ghost" className="w-full h-auto justify-start whitespace-normal p-2" onClick={() => {
            setSelected(show);
            const saved = map.get(show.id);
            setPeriod(saved?.watched_from != null ? { from: saved.watched_from, to: saved.watched_to ?? saved.watched_from } : null);
          }}>
            {show.poster_path ? <img src={`${TMDB_IMAGE_BASE}${show.poster_path}`} alt="" className="w-10 h-14 rounded object-cover shrink-0" /> : <div className="w-10 h-14 rounded bg-secondary shrink-0" />}
            <span className="min-w-0 text-left"><span className="block font-semibold">{tvTitle(show)}</span><span className="block text-xs text-muted-foreground">{show.first_air_date?.slice(0, 4)}{map.get(show.id) ? ` · ${labels[map.get(show.id)?.status as ProfileShowStatus] ?? "Tracked"}` : ""}</span></span>
          </Button>)}
        </div>
      </div> : <div className="space-y-4">
        <div className="flex gap-3 items-center">
          {selected.poster_path && <img src={`${TMDB_IMAGE_BASE}${selected.poster_path}`} alt="" className="w-14 h-20 object-cover rounded" />}
          <p className="font-semibold min-w-0">{tvTitle(selected)}</p>
        </div>
        {previous && previous.status !== status && <p className="flex items-center gap-2 text-sm text-muted-foreground">{labels[previous.status as ProfileShowStatus] ?? "Tracked"}<ArrowRight className="w-4 h-4" />{labels[status]}</p>}
        {status !== "watchlist" && <WatchYearPicker value={period} onChange={setPeriod} minYear={selected.first_air_date ? Number(selected.first_air_date.slice(0, 4)) : undefined} />}
        {detail.isError && <p className="text-sm text-destructive">Could not load this show. <Button variant="link" onClick={() => detail.refetch()}>Retry</Button></p>}
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={() => setSelected(null)}>Back</Button>
          <Button className="flex-1" disabled={!detail.data || saving || needsYear} onClick={submit}>{saving ? <Loader2 className="animate-spin" /> : <ArrowRight />} {previous && previous.status !== status ? "Move" : "Add"} to {labels[status]}</Button>
        </div>
      </div>}
    </DialogContent>
  </Dialog>;
}