import { beforeEach, describe, expect, mock, test } from "bun:test";

let previous: Record<string, unknown> | null = null;
let written: Record<string, unknown> = {};
let conflict = "";
let rankWrites: { tmdb_id: number; favorite_rank: unknown }[] = [];
mock.module("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: "test-user" } } }) },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: previous }) }) }),
    upsert: async (row: Record<string, unknown>, options: { onConflict: string }) => { written = row; conflict = options.onConflict; return { error: null }; },
    update: (patch: Record<string, unknown>) => ({
      eq: (_col: string, value: number) => {
        rankWrites.push({ tmdb_id: value, favorite_rank: patch.favorite_rank });
        return Promise.resolve({ error: null });
      },
    }),
  }),
} }));
const { assignShowCategory, setFavorite, setFavoriteOrder, sortFavorites } = await import("./user-shows");
import type { UserShow } from "./user-shows";
const meta = { tmdb_id: 1396, title: "Breaking Bad", poster_path: "/poster.jpg", total_episodes: 62 };
beforeEach(() => { previous = null; written = {}; rankWrites = []; });

describe("profile category assignment", () => {
  test("moves Watchlist to Watching using the same unique show entry", async () => {
    previous = { status: "watchlist", rating: 9, review: "My review", episodes_watched: 3, watched_from: 2022, watched_to: 2022, episodes_logged: ["1x1"], favorite: true };
    await assignShowCategory(meta, "watching");
    expect(written.status).toBe("watching");
    expect(written.tmdb_id).toBe(1396);
    expect(conflict).toBe("user_id,tmdb_id");
    expect(written.rating).toBe(9);
    expect(written.review).toBe("My review");
    expect(written.watched_to).toBe(2022);
    expect(written.episodes_watched).toBe(3);
  });
  test("adds to Watched with the selected watch year", async () => {
    await assignShowCategory(meta, "watched", { from: 2022, to: 2022 });
    expect(written.status).toBe("watched");
    expect(written.episodes_watched).toBe(62);
    expect(String(written.completed_at).slice(0, 4)).toBe("2022");
  });
  test("moves a watched show into Watchlist instead of leaving it Watched", async () => {
    previous = { status: "watched", episodes_watched: 62, completed_at: "2022-12-15T12:00:00Z" };
    await assignShowCategory(meta, "watchlist");
    expect(written.status).toBe("watchlist");
    expect(written.completed_at).toBeNull();
  });
  test("adds directly to Partly without inventing episode logs", async () => {
    await assignShowCategory(meta, "partly_watched");
    expect(written.status).toBe("partly_watched");
    expect(written.episodes_logged).toEqual([]);
  });
});

describe("favorites order", () => {
  test("saves the dragged order as 1, 2, 3… in the given sequence", async () => {
    await setFavoriteOrder([1396, 71912, 65494]);
    expect(rankWrites).toEqual([
      { tmdb_id: 1396, favorite_rank: 1 },
      { tmdb_id: 71912, favorite_rank: 2 },
      { tmdb_id: 65494, favorite_rank: 3 },
    ]);
  });

  test("shows ranked favorites first in that order, never-ranked ones last by recency", () => {
    const row = (tmdb_id: number, favorite: boolean, favorite_rank: number | null, updated_at: string) =>
      ({ tmdb_id, favorite, favorite_rank, updated_at }) as unknown as UserShow;
    const ordered = sortFavorites([
      row(1, true, null, "2026-01-05T00:00:00Z"),
      row(2, true, 2, "2026-01-01T00:00:00Z"),
      row(3, true, 1, "2026-01-02T00:00:00Z"),
      row(4, false, 3, "2026-01-03T00:00:00Z"),
      row(5, true, null, "2026-01-09T00:00:00Z"),
    ]);
    expect(ordered.map((r) => r.tmdb_id)).toEqual([3, 2, 5, 1]);
  });

  test("clears the saved slot when a show is un-favorited", async () => {
    previous = { favorite: true, favorite_rank: 2, status: "watched" };
    await setFavorite(meta, false);
    expect(written.favorite).toBe(false);
    expect(written.favorite_rank).toBeNull();
  });
});
