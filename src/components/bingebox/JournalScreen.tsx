import { Calendar } from "lucide-react";

const entries = [
  { day: "Today", items: [
    { show: "Severance", ep: "S2 E7", note: "Innie/outie tension peaked. 9/10", poster: "https://picsum.photos/seed/j-sev/80/120" },
  ]},
  { day: "Yesterday", items: [
    { show: "The Bear", ep: "S3 E5", note: "Mutfak koreografisi muhteşem.", poster: "https://picsum.photos/seed/j-bear/80/120" },
    { show: "Shōgun", ep: "S1 E9", note: "Görsel şölen.", poster: "https://picsum.photos/seed/j-shogun/80/120" },
  ]},
  { day: "This Week", items: [
    { show: "Dark", ep: "S3 E8", note: "Final beklediğimden iyiydi.", poster: "https://picsum.photos/seed/j-dark/80/120" },
    { show: "Breaking Bad", ep: "Rewatch S2 E4", note: "Hâlâ klasik.", poster: "https://picsum.photos/seed/j-bb/80/120" },
  ]},
];

export function JournalScreen() {
  return (
    <div className="px-4 mt-5 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your Journal</p>
        <button className="inline-flex items-center gap-1.5 text-xs rounded-full bg-card border border-border px-3 py-1.5">
          <Calendar className="w-3.5 h-3.5" /> June 2026
        </button>
      </div>

      {entries.map((g) => (
        <section key={g.day} className="space-y-2.5">
          <h3 className="text-sm font-semibold">{g.day}</h3>
          <ul className="space-y-2">
            {g.items.map((it, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-card border border-border p-2.5">
                <img src={it.poster} alt="" className="w-12 h-16 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{it.show}</p>
                  <p className="text-[11px] text-muted-foreground">{it.ep}</p>
                  <p className="text-xs mt-1 text-foreground/90 line-clamp-2">{it.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
