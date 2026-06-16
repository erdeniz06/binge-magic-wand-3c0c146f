import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HomeScreen } from "@/components/bingebox/HomeScreen";
import { SearchScreen } from "@/components/bingebox/SearchScreen";
import { ActivityScreen } from "@/components/bingebox/ActivityScreen";
import { ProfileScreen } from "@/components/bingebox/ProfileScreen";
import { BottomNav, type Tab } from "@/components/bingebox/BottomNav";
import { AiFab } from "@/components/bingebox/AiFab";
import { AiChatSheet } from "@/components/bingebox/AiChatSheet";
import { LogActivityDialog } from "@/components/bingebox/LogActivityDialog";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "BingeBox — Track, discover and discuss TV series" },
      { name: "description", content: "BingeBox is a TV series tracking, discovery and social platform with AI-powered recommendations." },
      { property: "og:title", content: "BingeBox" },
      { property: "og:description", content: "Track, discover and discuss TV series with AI-powered recommendations." },
    ],
  }),
  component: BingeBoxApp,
});

function BingeBoxApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [ai, setAi] = useState(false);
  const [log, setLog] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-md relative">
      {tab === "home" && <HomeScreen />}
      {tab === "search" && <SearchScreen />}
      {tab === "activity" && <ActivityScreen />}
      {tab === "profile" && <ProfileScreen />}

      {tab === "home" && <AiFab onClick={() => setAi(true)} />}

      <BottomNav active={tab} onChange={setTab} onPlus={() => setLog(true)} />

      <AiChatSheet open={ai} onOpenChange={setAi} />
      <LogActivityDialog open={log} onOpenChange={setLog} />
    </div>
  );
}
