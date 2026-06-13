import type { Show } from "@/lib/bingebox-data";

export function PosterRow({ title, shows, accent }: { title: string; shows: Show[]; accent?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {accent}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
        {shows.map((s) => (
          <PosterCard key={s.id} show={s} />
        ))}
      </div>
    </section>
  );
}

export function PosterCard({ show }: { show: Show }) {
  return (
    <div className="shrink-0 w-32 snap-start">
      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-card ring-1 ring-border">
        <img src={show.poster} alt={show.title} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <p className="mt-2 text-xs font-medium truncate">{show.title}</p>
      <p className="text-[11px] text-muted-foreground">{show.year}</p>
    </div>
  );
}
