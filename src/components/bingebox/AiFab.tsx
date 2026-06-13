import { Wand2 } from "lucide-react";

export function AiFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="BingeBox AI"
      className="fixed right-4 bottom-24 z-30 group"
    >
      <span className="absolute inset-0 rounded-full bg-ai-gradient blur-xl opacity-70 group-hover:opacity-90 transition" />
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-ai-gradient shadow-ai ring-1 ring-white/20 active:scale-95 transition">
        <Wand2 className="w-6 h-6 text-white drop-shadow" />
      </span>
    </button>
  );
}
