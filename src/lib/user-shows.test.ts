/// <reference types="bun" />
import { beforeEach, describe, expect, mock, test } from "bun:test";

let previous: Record<string, unknown> | null = null;
let written: Record<string, unknown> = {};
let conflict = "";
mock.module("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: "test-user" } } }) },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: previous }) }) }),
    upsert: async (row: Record<string, unknown>, options: { onConflict: string }) => { written = row; conflict = options.onConflict; return { error: null }; },
  }),
} }));
const { assignShowCategory } = await import("./user-shows");
const meta = { tmdb_id: 1396, title: "Breaking Bad", poster_path: "/poster.jpg", total_episodes: 62 };
beforeEach(() => { previous = null; written = {}; });

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