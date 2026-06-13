import { useEffect, useState } from "react";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

const favorites = [
  "fav-bb", "fav-union", "fav-winter", "fav-office", "fav-phone",
];

const poster = (s: string) => `https://picsum.photos/seed/${s}/300/450`;

export function ProfileScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("Your Name");
  const [handle, setHandle] = useState("username");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        const u = data.user.email.split("@")[0];
        setHandle(u);
        setName(data.user.user_metadata?.name || u);
      }
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

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
          {name.slice(0,2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold leading-tight truncate">{name}</p>
          <p className="text-sm text-muted-foreground">@{handle}</p>
          <div className="flex gap-5 mt-2 text-sm">
            <span><span className="font-semibold">124</span> <span className="text-muted-foreground">Following</span></span>
            <span><span className="font-semibold">98</span> <span className="text-muted-foreground">Followers</span></span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 grid grid-cols-3 text-center">
        <Stat value="127" label="Series" sub="42 this year" />
        <Stat value="1,842" label="Episodes" />
        <Stat value="920h" label="Hours" />
      </div>

      <section className="space-y-3">
        <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Favorites</h2>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
          {favorites.map((f) => (
            <img key={f} src={poster(f)} className="w-20 h-28 rounded-lg object-cover shrink-0" alt="" />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Recent Activity</h2>
        <ul className="space-y-3">
          <RecentRow img="recent-1" title="Succession" sub="S4 E10" time="2h ago" />
          <RecentRow img="recent-2" title="Dark" sub="S3 E8" time="Yesterday" />
          <RecentRow img="recent-3" title="The Bear" sub="S3 E2" time="2d ago" />
        </ul>
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

function RecentRow({ img, title, sub, time }: { img: string; title: string; sub: string; time: string }) {
  return (
    <li className="flex items-center gap-3">
      <img src={poster(img)} alt="" className="w-10 h-14 rounded-md object-cover" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </li>
  );
}
