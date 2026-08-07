import { createFileRoute } from "@tanstack/react-router";
import { backfillRatings } from "@/lib/curated-backfill.server";

export const Route = createFileRoute("/api/public/backfill-ratings")({
  server: {
    handlers: {
      POST: async () => {
        const result = await backfillRatings();
        return new Response(JSON.stringify(result), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
