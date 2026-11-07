import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserShow } from "@/lib/user-shows";

const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

/**
 * Press a poster, drag it to a new slot, let go — the new order is saved.
 * Arrow keys move a focused poster too (up/down = one row, left/right = one slot).
 */
export function FavoriteOrderEditor({
  shows,
  onOrdered,
}: {
  shows: UserShow[];
  onOrdered: (ids: number[]) => Promise<void>;
}) {
  const [items, setItems] = useState<UserShow[]>(shows);

  // Keep the order the user is dragging, but pick up favorites that were
  // added or removed on a show page while this editor was open.
  useEffect(() => {
    setItems((prev) => {
      const a = prev.map((s) => s.tmdb_id).sort((x, y) => x - y);
      const b = shows.map((s) => s.tmdb_id).sort((x, y) => x - y);
      if (a.length === b.length && a.every((v, i) => v === b[i])) return prev;
      return shows;
    });
  }, [shows]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((s) => s.tmdb_id === active.id);
    const to = items.findIndex((s) => s.tmdb_id === over.id);
    if (from < 0 || to < 0) return;

    const before = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    try {
      await onOrdered(next.map((s) => s.tmdb_id));
    } catch {
      setItems(before);
      toast.error("Could not save the order — try again.");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        Press a poster, drag it to a new slot, let go. Number 1 is your top pick.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((s) => s.tmdb_id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-2.5 rounded-2xl border border-dashed border-border bg-secondary/40 p-3">
            {items.map((s, i) => (
              <SortablePoster key={s.tmdb_id} show={s} rank={i + 1} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortablePoster({ show, rank }: { show: UserShow; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: show.tmdb_id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        touchAction: "none",
      }}
      aria-label={`${rank}. ${show.title}`}
      className={cn(
        "relative select-none space-y-1 outline-none",
        isDragging ? "z-30 cursor-grabbing opacity-90" : "cursor-grab",
      )}
    >
      <div className="relative">
        {show.poster_path ? (
          <img
            src={`${TMDB_IMG}${show.poster_path}`}
            alt=""
            loading="lazy"
            draggable={false}
            className="w-full aspect-[2/3] rounded-lg object-cover"
          />
        ) : (
          <div className="w-full aspect-[2/3] rounded-lg bg-secondary" />
        )}
        <span
          className={cn(
            "absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
            rank === 1
              ? "bg-[var(--gold)] text-black"
              : "bg-background text-foreground border border-border",
          )}
        >
          {rank}
        </span>
      </div>
      <p className="text-[10px] leading-tight truncate">{show.title}</p>
    </div>
  );
}
