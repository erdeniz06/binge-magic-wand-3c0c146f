import { NotebookPen } from "lucide-react";

export function JournalScreen() {
  // No journal entries are stored yet, so nothing is invented here.
  const entries: { id: string; show: string; ep: string; note: string; poster: string | null }[] = [];

  if (entries.length === 0) {
    return (
      <div className="px-4 mt-10 pb-6 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
          <NotebookPen className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold">Günlüğün henüz boş</p>
        <p className="text-xs text-muted-foreground max-w-[260px]">
          Bir bölüm ya da sezon kaydettiğinde notların burada tarihe göre listelenir.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 mt-5 space-y-2">
      {entries.map((it) => (
        <div key={it.id} className="flex gap-3 rounded-2xl bg-card border border-border p-2.5">
          {it.poster && <img src={it.poster} alt="" className="w-12 h-16 rounded-md object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{it.show}</p>
            <p className="text-[11px] text-muted-foreground">{it.ep}</p>
            <p className="text-xs mt-1 text-foreground/90 line-clamp-2">{it.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
