import { Home, Search, List, User, Plus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "home" | "search" | "binge" | "lists" | "profile";

const items: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Films", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "binge", label: "BingeWatch", icon: Activity },
  { id: "lists", label: "Lists", icon: List },
  { id: "profile", label: "Profile", icon: User },
];

export function BottomNav({
  active,
  onChange,
  onPlus,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  onPlus: () => void;
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border">
      <div className="mx-auto max-w-md flex items-center justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] relative">
        {items.slice(0, 2).map((it) => (
          <NavBtn key={it.id} it={it} active={active === it.id} onClick={() => onChange(it.id)} />
        ))}
        <button
          onClick={onPlus}
          className="-mt-7 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition"
          aria-label="Log activity"
        >
          <Plus className="w-6 h-6" />
        </button>
        {items.slice(2).map((it) => (
          <NavBtn key={it.id} it={it} active={active === it.id} onClick={() => onChange(it.id)} />
        ))}
      </div>
    </nav>
  );
}

function NavBtn({
  it,
  active,
  onClick,
}: {
  it: { id: Tab; label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = it.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-14 py-1.5 text-[10px] gap-0.5 transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 1.8} />
      <span className="font-medium">{it.label}</span>
    </button>
  );
}
