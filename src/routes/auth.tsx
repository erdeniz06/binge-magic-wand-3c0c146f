import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { COUNTRIES, guessCountry } from "@/lib/countries";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · BingeBox" },
      { name: "description", content: "Sign in to BingeBox — track, discover and discuss TV series." },
      { property: "og:title", content: "Sign in · BingeBox" },
      { property: "og:description", content: "Sign in to BingeBox — track, discover and discuss TV series." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [remember, setRemember] = useState(true);
  const [country, setCountry] = useState(guessCountry);
  // Existing signed-in user whose profile has no country yet — ask once.
  const [needsCountry, setNeedsCountry] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bingebox-remember-email");
    if (saved) setEmail(saved);
    else if (localStorage.getItem("bingebox-remember-off")) setRemember(false);
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("country")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profile?.country) navigate({ to: "/" });
      else setNeedsCountry(true);
    });
  }, [navigate]);

  const saveCountry = async (code: string) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("profiles").update({ country: code }).eq("id", data.user.id);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        await saveCountry(country);
        toast.success("Account created. Welcome to BingeBox.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("country")
            .eq("id", userData.user.id)
            .maybeSingle();
          if (!profile?.country) {
            setNeedsCountry(true);
            setLoading(false);
            return;
          }
        }
      }
      if (remember) {
        localStorage.setItem("bingebox-remember-email", email);
        localStorage.removeItem("bingebox-remember-off");
      } else {
        localStorage.removeItem("bingebox-remember-email");
        localStorage.setItem("bingebox-remember-off", "1");
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed");
    else if (!result.redirected) navigate({ to: "/" });
  };

  const countrySelect = (
    <div className="space-y-1.5">
      <Label htmlFor="country">Country</Label>
      <select
        id="country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Used for streaming availability and local show picks.
      </p>
    </div>
  );

  if (needsCountry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Where are you watching from?</h1>
            <p className="text-sm text-muted-foreground">
              Pick your country once — we use it for streaming availability and local show picks.
            </p>
          </div>
          {countrySelect}
          <Button
            className="w-full h-11"
            onClick={async () => {
              await saveCountry(country);
              navigate({ to: "/" });
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ai-gradient shadow-ai">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">BingeBox</h1>
          <p className="text-sm text-muted-foreground">Track, discover and discuss TV series.</p>
        </div>

        <Button onClick={handleGoogle} variant="secondary" className="w-full h-11">
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3" autoComplete="on">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "signup" && countrySelect}
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            Remember me
          </label>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to BingeBox?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-foreground underline underline-offset-4">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/">Back</Link>
        </p>
      </div>
    </div>
  );
}
