import { Heart } from "lucide-react";
import { PosterRow } from "./PosterRow";
import {
  popularThisWeek,
  friendsWatching,
  greatest100,
  essentialClassicsTR,
} from "@/lib/bingebox-data";

export function HomeScreen() {
  return (
    <div className="space-y-7 pb-32">
      {/* Top brand strip mirroring the screenshot */}
      <header className="px-4 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-[var(--classic)] leading-none">25</span>
            <span className="text-[11px] text-muted-foreground leading-tight mt-1">
              Turkish<br />Classics
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight pt-1">BingeBox</h1>
          <div className="relative w-16 h-12">
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="w-12 h-12 fill-[var(--heart)] text-[var(--heart)]" strokeWidth={0} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white pt-1">100</span>
            <span className="absolute -top-1 -left-1 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute -top-2 right-0 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute top-1 -right-2 text-[var(--gold)] text-xs">★</span>
            <span className="absolute -bottom-1 right-1 text-[var(--gold)] text-[10px]">★</span>
            <span className="absolute -bottom-1 -left-1 text-[var(--gold)] text-[10px]">★</span>
          </div>
        </div>
      </header>

      <PosterRow
        title="100 Greatest Shows"
        shows={greatest100}
        accent={<span className="text-xs text-muted-foreground">Curated</span>}
      />

      <PosterRow
        title="25 Essential Turkish Classics"
        shows={essentialClassicsTR}
        accent={<span className="text-xs text-[var(--classic)]">TR</span>}
      />

      <PosterRow title="Popular This Week" shows={popularThisWeek} />

      <PosterRow title="Popular From Friends" shows={friendsWatching} />
    </div>
  );
}
