import { useEffect, useMemo, useState } from "react";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type UserShow = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  status: string;
  episodes_watched: number;
  episode_runtime: number | null;
  rating: number | null;
  completed_at: string | null;
  updated_at: string;
};

const DEFAULT_RUNTIME = 45;
const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

type StatusTab = "watched" | "watching" | "watchlist";

const tabs: { id: StatusTab; label: string }[] = [
  { id: "watched", label: "Watched" },
  { id: "watching", label: "Watching" },
  { id: "watchlist", label: "Watchlist" },
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("Your Name");
  const [handle, setHandle] = useState("username");
  const [shows, setShows] = useState<UserShow[] | null>(null);
  const [tab, setTab] = useState<StatusTab>("watched");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        const u = data.user.email.split("@")[0];
        setHandle(u);
        setName(data.user.user_metadata?.name || u);
      }
    });
  }, []);

  useEffect(() => {
    let alive = true;
    supabase
      .from("user_shows")
      .select(
        "tmdb_id, title, poster_path, status, episodes_watched, episode_runtime, rating, completed_at, updated_at",
      )
      .then(({ data }) => {
        if (alive) setShows((data ?? []) as UserShow[]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const rows = shows ?? [];
    const tracked = rows.filter((r) => r.status === "watched" || r.status === "watching");
    const episodes = rows.reduce((sum, r) => sum + (r.episodes_watched ?? 0), 0);
    const minutes = rows.reduce(
      (sum, r) => sum + (r.episodes_watched ?? 0) * (r.episode_runtime || DEFAULT_RUNTIME),
      0,
    );
    const year = new Date().getFullYear();
    const thisYear = tracked.filter((r) => {
      const d = r.completed_at ?? r.updated_at;
      return d ? new Date(d).getFullYear() === year : false;
    }).length;
    return {
      series: tracked.length,
      episodes,
      hours: Math.round(minutes / 60),
      thisYear,
    };
  }, [shows]);

  const byStatus = useMemo(() => {
    const rows = shows ?? [];
    return {
      watched: rows.filter((r) => r.status === "watched"),
      watching: rows.filter((r) => r.status === "watching"),
      watchlist: rows.filter((r) => r.status === "watchlist"),
    } as Record<StatusTab, UserShow[]>;
  }, [shows]);

  const favorites = useMemo(
    () =>
      (shows ?? [])
        .filter((r) => r.poster_path && (r.rating ?? 0) >= 8)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 10),
    [shows],
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const current = byStatus[tab];

  return (
    <div className="px-4 pt-6 pb-32 space-y-7">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <div className="flex items-center gap-2">
          <button onClick={signOut} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground"><Settings className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold uppercase">
          {name.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold leading-tight truncate">{name}</p>
          <p className="text-sm text-muted-foreground">@{handle}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.series === 0 ? "Henüz dizi eklenmedi" : `${stats.series} dizi takip ediliyor`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 grid grid-cols-3 text-center">
        <Stat
          value={stats.series.toLocaleString()}
          label="Series"
          sub={`${stats.thisYear} this year`}
        />
        <Stat value={stats.episodes.toLocaleString()} label="Episodes" />
        <Stat value={`${stats.hours.toLocaleString()}h`} label="Hours" />
      </div>

      <section className="space-y-3">
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.label}
              <span className="ml-1 text-muted-foreground">{byStatus[t.id].length}</span>
            </button>
          ))}
        </div>

        {shows === null ? (
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-secondary animate-pulse" />
            ))}
          </div>
        ) : current.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Bu listede henüz dizi yok.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {current.map((s) => (
              <div key={s.tmdb_id} className="space-y-1">
                {s.poster_path ? (
                  <img
                    src={`${TMDB_IMG}${s.poster_path}`}
                    alt={s.title}
                    loading="lazy"
                    className="w-full aspect-[2/3] rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] rounded-lg bg-secondary" />
                )}
                <p className="text-[11px] leading-tight truncate">{s.title}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Favorites</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            8+ puan verdiğin diziler burada görünecek.
          </p>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
            {favorites.map((f) => (
              <img
                key={f.tmdb_id}
                src={`${TMDB_IMG}${f.poster_path}`}
                className="w-20 h-28 rounded-lg object-cover shrink-0"
                alt={f.title}
                loading="lazy"
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Recent Activity</h2>
        {(shows ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz aktivite yok — bir bölüm kaydettiğinde burada görünecek.
          </p>
        ) : (
          <ul className="space-y-3">
            {(shows ?? [])
              .slice()
              .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
              .slice(0, 5)
              .map((s) => (
                <li key={s.tmdb_id} className="flex items-center gap-3">
                  {s.poster_path ? (
                    <img src={`${TMDB_IMG}${s.poster_path}`} alt="" className="w-10 h-14 rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-14 rounded-md bg-secondary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.episodes_watched > 0 ? `${s.episodes_watched} bölüm` : s.status}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.updated_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{sub}</p>}
    </div>
  );
}
