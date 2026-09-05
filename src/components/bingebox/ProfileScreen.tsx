import { useEffect, useMemo, useState } from "react";
import { Settings, LogOut, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { progressLabel, useUserShows, type UserShow } from "@/lib/user-shows";


const DEFAULT_RUNTIME = 45;
const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

type StatusTab = "watched" | "watching" | "partly_watched" | "dropped" | "watchlist";

const tabs: { id: StatusTab; label: string }[] = [
  { id: "watched", label: "Watched" },
  { id: "watching", label: "Watching" },
  { id: "partly_watched", label: "Partly" },
  { id: "dropped", label: "Bıraktım" },
  { id: "watchlist", label: "Watchlist" },
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("Your Name");
  const [handle, setHandle] = useState("username");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const { data: shows } = useUserShows();
  const [tab, setTab] = useState<StatusTab>("watched");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        const u = data.user.email.split("@")[0];
        setHandle(u);
        setName(data.user.user_metadata?.name || u);
      }
      if (data.user?.created_at) {
        setMemberSince(
          new Date(data.user.created_at).toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric",
          }),
        );
      }
    });
  }, []);




  const stats = useMemo(() => {
    const rows = shows ?? [];
    const tracked = rows.filter(
      (r) => r.status === "watched" || r.status === "watching" || r.status === "partly_watched",
    );
    const episodes = rows.reduce((sum, r) => sum + (r.episodes_watched ?? 0), 0);
    const minutes = rows.reduce(
      (sum, r) => sum + (r.episodes_watched ?? 0) * (r.episode_runtime || DEFAULT_RUNTIME),
      0,
    );
    const year = new Date().getFullYear();
    // Watched shows count for the year they were actually finished (completed_at),
    // not when they were last edited. Watching shows count by recent activity.
    const thisYear = tracked.filter((r) => {
      const d = r.status === "watched" ? (r.completed_at ?? r.updated_at) : r.updated_at;
      return d ? new Date(d).getFullYear() === year : false;
    }).length;
    const rated = rows.filter((r) => r.rating != null && r.rating > 0);
    const avg = rated.length
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : null;
    return {
      series: tracked.length,
      episodes,
      hours: Math.round(minutes / 60),
      thisYear,
      avg,
      ratedCount: rated.length,
    };
  }, [shows]);

  const dist = useMemo(() => {
    const rows = (shows ?? []).filter((r) => r.rating != null && r.rating > 0);
    const counts = Array.from({ length: 10 }, (_, i) => ({ score: 10 - i, count: 0 }));
    for (const r of rows) {
      const s = Math.round(r.rating ?? 0);
      if (s >= 1 && s <= 10) counts[10 - s].count++;
    }
    const max = Math.max(1, ...counts.map((c) => c.count));
    return { counts, max, total: rows.length };
  }, [shows]);

  const thisYearShows = useMemo(() => {
    const year = new Date().getFullYear();
    return (shows ?? [])
      .filter(
        (r) =>
          r.status === "watched" &&
          r.completed_at &&
          new Date(r.completed_at).getFullYear() === year &&
          r.poster_path,
      )
      .sort((a, b) => +new Date(b.completed_at!) - +new Date(a.completed_at!))
      .slice(0, 12);
  }, [shows]);

  const byStatus = useMemo(() => {
    const rows = shows ?? [];
    return {
      watched: rows.filter((r) => r.status === "watched"),
      watching: rows.filter((r) => r.status === "watching"),
      partly_watched: rows.filter((r) => r.status === "partly_watched"),
      dropped: rows.filter((r) => r.status === "dropped"),
      watchlist: rows.filter((r) => r.status === "watchlist"),
    } as Record<StatusTab, UserShow[]>;
  }, [shows]);

  const favorites = useMemo(
    () =>
      (shows ?? [])
        .filter((r) => r.favorite)
        .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
        .slice(0, 20),
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
            {memberSince ? ` · ${memberSince}'den beri üye` : ""}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 grid grid-cols-4 text-center">
        <Stat
          value={stats.series.toLocaleString()}
          label="Series"
          sub={`${stats.thisYear} this year`}
        />
        <Stat value={stats.episodes.toLocaleString()} label="Episodes" />
        <Stat value={`${stats.hours.toLocaleString()}h`} label="Hours" />
        <Stat
          value={stats.avg != null ? stats.avg.toFixed(1) : "—"}
          label="Avg Rating"
          sub={stats.ratedCount > 0 ? `${stats.ratedCount} rated` : undefined}
        />
      </div>

      {dist.total > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Rating Distribution
          </h2>
          <div className="rounded-2xl bg-card border border-border p-4 space-y-1.5">
            {dist.counts.map(({ score, count }) => (
              <div key={score} className="flex items-center gap-2">
                <span className="w-4 text-right text-[11px] font-semibold text-muted-foreground flex items-center justify-end gap-0.5">
                  {score}
                </span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--gold)] transition-all"
                    style={{ width: `${(count / dist.max) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-[11px] text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {thisYearShows.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Watched in {new Date().getFullYear()}
          </h2>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
            {thisYearShows.map((s) => (
              <Link
                key={s.tmdb_id}
                to="/series/tv/$id"
                params={{ id: String(s.tmdb_id) }}
                className="shrink-0"
              >
                <img
                  src={`${TMDB_IMG}${s.poster_path}`}
                  className="w-20 h-28 rounded-lg object-cover"
                  alt={s.title}
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

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
              <Link
                key={s.tmdb_id}
                to="/series/tv/$id"
                params={{ id: String(s.tmdb_id) }}
                className="space-y-1"
              >
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
                {s.rating != null && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-[var(--gold)] text-[var(--gold)]" />
                    {s.rating}/10
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Favorites</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Dizi sayfasından “Favorilere ekle”ye bastığın diziler burada görünecek.
          </p>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
            {favorites.map((f) => (
              <Link
                key={f.tmdb_id}
                to="/series/tv/$id"
                params={{ id: String(f.tmdb_id) }}
                className="shrink-0"
              >
                <img
                  src={`${TMDB_IMG}${f.poster_path}`}
                  className="w-20 h-28 rounded-lg object-cover"
                  alt={f.title}
                  loading="lazy"
                />
              </Link>
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
                <li key={s.tmdb_id}>
                  <Link
                    to="/series/tv/$id"
                    params={{ id: String(s.tmdb_id) }}
                    className="flex items-center gap-3"
                  >
                    {s.poster_path ? (
                      <img src={`${TMDB_IMG}${s.poster_path}`} alt="" className="w-10 h-14 rounded-md object-cover" />
                    ) : (
                      <div className="w-10 h-14 rounded-md bg-secondary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {progressLabel(s) ?? s.status}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
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
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{sub}</p>}
    </div>
  );
}
