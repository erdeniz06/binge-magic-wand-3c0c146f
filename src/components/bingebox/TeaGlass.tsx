import teaGlass from "@/assets/turkish-tea-glass-red.png";
import { cn } from "@/lib/utils";

/** Red Turkish tea glass — the app-wide symbol for Turkish productions. */
export function TeaGlass({ className }: { className?: string }) {
  return (
    <img
      src={teaGlass}
      alt="Türk yapımı"
      title="Türk yapımı"
      className={cn(
        "inline-block h-5 w-5 shrink-0 object-contain drop-shadow-[0_0_6px_var(--flag)]",
        className,
      )}
    />
  );
}
