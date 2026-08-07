import { createServerFn } from "@tanstack/react-start";
import { backfillRatings } from "./curated-backfill.server";

export const backfillCuratedRatings = createServerFn({ method: "POST" }).handler(
  async () => backfillRatings(),
);
