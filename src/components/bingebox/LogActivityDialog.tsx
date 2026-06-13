import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const options = [
  { title: "Log Episode", desc: "Mark an episode as watched" },
  { title: "Finish Season", desc: "Complete an entire season" },
  { title: "Finish Show", desc: "Mark entire show as completed" },
];

export function LogActivityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5 pt-2">
          {options.map((o) => (
            <button
              key={o.title}
              onClick={() => onOpenChange(false)}
              className="w-full text-left rounded-xl bg-card border border-border hover:bg-accent transition px-4 py-3.5"
            >
              <p className="text-sm font-semibold">{o.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
