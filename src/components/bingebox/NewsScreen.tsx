import { Newspaper, Megaphone, Star, CalendarClock } from "lucide-react";

type NewsItem = {
  id: string;
  kind: "announcement" | "quote" | "anniversary" | "renewal";
  show: string;
  headline: string;
  body: string;
  source: string;
  time: string;
  image: string;
};

const news: NewsItem[] = [
  {
    id: "n1",
    kind: "renewal",
    show: "Severance",
    headline: "Severance Season 3 officially begins filming",
    body: "Apple TV+ confirmed cameras are rolling on the third season, with Ben Stiller returning to direct the premiere.",
    source: "Variety",
    time: "2h ago",
    image: "https://picsum.photos/seed/news-severance/600/360",
  },
  {
    id: "n2",
    kind: "quote",
    show: "Breaking Bad",
    headline: "Bryan Cranston hints at a one-off Walter White return",
    body: "In a recent podcast, Cranston said he'd revisit Heisenberg 'only if Vince Gilligan writes it'.",
    source: "The Hollywood Reporter",
    time: "6h ago",
    image: "https://picsum.photos/seed/news-bb/600/360",
  },
  {
    id: "n3",
    kind: "announcement",
    show: "Shōgun",
    headline: "Shōgun renewed for two more seasons at FX",
    body: "After sweeping the Emmys, FX has greenlit seasons 2 and 3 with the original creative team attached.",
    source: "Deadline",
    time: "1d ago",
    image: "https://picsum.photos/seed/news-shogun/600/360",
  },
  {
    id: "n4",
    kind: "anniversary",
    show: "Breaking Bad",
    headline: "Breaking Bad turns 18 today",
    body: "The pilot aired on January 20, 2008. Looking back at how a chemistry teacher rewrote prestige TV.",
    source: "BingeBox Editorial",
    time: "1d ago",
    image: "https://picsum.photos/seed/news-anniversary/600/360",
  },
  {
    id: "n5",
    kind: "announcement",
    show: "The Last of Us",
    headline: "The Last of Us S3 casts a new lead",
    body: "HBO revealed the actor stepping into a major role adapted from Part II's later chapters.",
    source: "IGN",
    time: "2d ago",
    image: "https://picsum.photos/seed/news-tlou/600/360",
  },
];

const kindMeta: Record<NewsItem["kind"], { label: string; Icon: typeof Newspaper }> = {
  announcement: { label: "Announcement", Icon: Megaphone },
  quote: { label: "Quote", Icon: Star },
  anniversary: { label: "Anniversary", Icon: CalendarClock },
  renewal: { label: "Renewal", Icon: Newspaper },
};

export function NewsScreen() {
  return (
    <div className="px-4 mt-5 space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">The Daily Binge</p>
        <span className="text-[10px] text-muted-foreground">Curated · updated hourly</span>
      </div>

      {news.map((n, i) => {
        const { label, Icon } = kindMeta[n.kind];
        return (
          <article key={n.id} className="rounded-2xl bg-card border border-border overflow-hidden">
            {i === 0 && (
              <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
                <img src={n.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                <span className="opacity-50">·</span>
                <span className="text-foreground/80 normal-case tracking-normal font-medium">{n.show}</span>
              </div>
              <h3 className="text-base font-bold leading-snug">{n.headline}</h3>
              <p className="text-xs text-foreground/80 leading-relaxed">{n.body}</p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">{n.source}</p>
                <p className="text-[11px] text-muted-foreground">{n.time}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
