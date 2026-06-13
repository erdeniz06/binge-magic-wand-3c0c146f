import { Search, Clock, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { genres, decades, languages, countries } from "@/lib/bingebox-data";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-accent transition px-3.5 py-1.5 text-xs font-medium">
      {icon}
      {children}
    </button>
  );
}

export function SearchScreen() {
  return (
    <div className="px-4 pt-6 pb-32 space-y-7">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search series, actors, directors..."
          className="pl-10 h-11 rounded-full bg-card border-border"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["Squid Game", "Severance", "The Bear", "Shōgun"].map((s) => (
          <Chip key={s} icon={<Clock className="w-3 h-3" />}>{s}</Chip>
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
        {["9+","8+","7+","Award Winners"].map((r) => <Chip key={r}>{r}</Chip>)}
      </Section>
    </div>
  );
}
