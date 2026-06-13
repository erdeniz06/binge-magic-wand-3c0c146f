import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, Lock } from "lucide-react";
import { bingePosts } from "@/lib/bingebox-data";
import { cn } from "@/lib/utils";

export function BingeWatchScreen() {
  const [tab, setTab] = useState<"following" | "discover">("following");
  return (
    <div className="pb-32">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-tight">BingeWatch</h1>
          <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Episode-gated</span>
        </div>
        <div className="inline-flex rounded-full bg-secondary p-1 text-sm">
          {(["following","discover"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-full font-medium capitalize transition",
                tab === t ? "bg-foreground text-background" : "text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="divide-y divide-border">
        {bingePosts.map((p) => <PostCard key={p.id} post={typeof p === "object" ? p : p} />)}
        <LockedPreview />
      </div>
    </div>
  );
}

function PostCard({ post }: { post: typeof bingePosts[number] }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  return (
    <article className="px-4 py-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
          {post.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">@{post.user}</p>
          <p className="text-[11px] text-muted-foreground">
            {post.show} · <span className="text-foreground/80">{post.episode}</span> · {post.time}
          </p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden aspect-[4/5] bg-card">
        <img src={post.poster} alt={post.show} className="w-full h-full object-cover" />
      </div>

      <div className="flex items-center gap-4 text-foreground">
        <button onClick={() => { setLiked(!liked); setLikes(likes + (liked ? -1 : 1)); }}>
          <Heart className={cn("w-6 h-6 transition", liked && "fill-[var(--heart)] text-[var(--heart)]")} />
        </button>
        <button><MessageCircle className="w-6 h-6" /></button>
        <button><Send className="w-6 h-6" /></button>
        <button className="ml-auto"><Bookmark className="w-6 h-6" /></button>
      </div>

      <div className="text-sm leading-snug">
        <span className="font-semibold mr-1.5">@{post.user}</span>
        {post.text}
      </div>
      <p className="text-xs text-muted-foreground">{likes} likes · {post.comments} comments</p>
    </article>
  );
}

function LockedPreview() {
  return (
    <article className="px-4 py-6 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">K</div>
      <div className="flex-1">
        <p className="text-sm font-semibold">@kerem on The Last of Us · S2 E5</p>
        <div className="mt-2 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Bu bölümü izlemediğin için yorum ve tartışmalar gizli. Spoilersız ortam.
          </p>
        </div>
      </div>
    </article>
  );
}
