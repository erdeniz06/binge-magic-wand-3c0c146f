import { myLists, curatedLists } from "@/lib/bingebox-data";
import { Plus } from "lucide-react";

export function ListsScreen() {
  return (
    <div className="px-4 pt-6 pb-32 space-y-7">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Lists</h1>
        <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-card border border-border px-3 py-1.5">
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      <Section title="Your Lists" items={myLists} />
      <Section title="Curated" items={curatedLists} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: typeof myLists }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{title}</h2>
      <ul className="space-y-2.5">
        {items.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-2.5">
            <img src={l.cover} alt="" className="w-14 h-14 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{l.title}</p>
              <p className="text-xs text-muted-foreground">
                {l.count} shows{l.author ? ` · by ${l.author}` : ""}
              </p>
            </div>
            <span className="text-muted-foreground text-lg">›</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
