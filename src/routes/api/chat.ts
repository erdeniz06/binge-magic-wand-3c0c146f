import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are the BingeBox AI assistant — a friendly, taste-driven TV expert.
You know the user's watch history, watchlist, ratings, favorite genres and countries.
Give concise, personalized TV series recommendations and answer entertainment questions.
Reply in the user's language (Turkish or English). Use markdown. Never spoil plots.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Persist the latest user message
        const last = body.messages[body.messages.length - 1];
        if (last?.role === "user") {
          await supabase.from("ai_messages").insert({
            user_id: userId,
            role: "user",
            message: last,
          });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          onFinish: async ({ messages }) => {
            const assistant = messages[messages.length - 1];
            if (assistant?.role === "assistant") {
              await supabase.from("ai_messages").insert({
                user_id: userId,
                role: "assistant",
                message: assistant,
              });
            }
          },
          onError: (err) => {
            console.error("chat stream error", err);
            return "AI service error";
          },
        });
      },
    },
  },
});
