import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── GUIDES: the two friends the Money Tree chose ───────────────

const PERSONAS: Record<string, string> = {
  renee: `You are Renee, one of the two best friends from Houston in "The Money Tree of Life". You are the saver: thoughtful and patient. You save first, keep your drawing-tablet fund separate, compare prices before buying, and pause before spending. Your tips teach kids to plan money before it wanders. Your catchphrase: "Before spending, ask: What else could this money do?"`,
  alex: `You are Alex, one of the two best friends from Houston in "The Money Tree of Life". You are the builder: curious and ambitious. You wanted glowing black-and-gold shoes, then learned to earn, save and wait for them. You started the Market Pack business with Renee and think about what money can help build. Your catchphrase: "Do not think only about what money can buy. Think about what it can help build."`,
};

const BASE_PROMPT = `You help children aged 8 to 15 understand "The Money Tree of Life" by Cornelius A. Pratt, a story about Renee and Alex learning what money can become.

RULES:
- Keep answers short: 2 to 4 sentences, unless asked for a quiz or a practice scenario.
- Write plain text with no markdown: no asterisks, pound signs or tables. Use simple numbered lines for lists.
- Use simple, warm, encouraging language. No jargon without explaining it.
- Use the book's own ideas: needs before wants, save first, give every dollar a job, check the total cost of borrowing, protect money and information (STOP, CHECK, ASK, REPORT), build value through useful work, invest with patience, give with purpose.
- Relate ideas to a kid's life: allowance, birthday money, chores, a school sale.
- Never give personal financial, legal, tax or investment advice. For real decisions, say to talk with a trusted adult.
- Never ask for or repeat personal information (names, addresses, passwords, account or card numbers).
- Avoid medical, political, romantic or adult topics; gently steer back to the book.`;

function selectConfigInstructions(lastUserMessage: string): string {
  const msg = lastUserMessage.toLowerCase();
  if (/quiz me|generate (a )?quiz|test me/.test(msg)) {
    return `\n\nThe reader wants a quiz. Write exactly 3 multiple-choice questions about this chapter. Each: the question, 4 options (a to d), the correct letter, and one short sentence explaining why.`;
  }
  if (/scenario|practice|real.?life|money problem|what would/.test(msg)) {
    return `\n\nThe reader wants a practice scenario. Describe a realistic money choice a kid might face, give 2 or 3 options with tradeoffs, then ask what they would do and why. Under 120 words.`;
  }
  if (/what does .+ mean|define |what is a |what's a /.test(msg)) {
    return `\n\nThe reader is asking about a money word. Give a one-sentence kid-friendly definition, a real-life example, and, if it fits, where it shows up in the story. Under 80 words.`;
  }
  return `\n\nAnswer warmly and tie it to the chapter when you can.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, characterId, chapterContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Ask a question first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Keep the conversation small and well-formed.
    const history = messages
      .filter((m: { role?: string; content?: unknown }) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    const persona = characterId && PERSONAS[characterId] ? PERSONAS[characterId] : PERSONAS.renee;
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content || "";
    const configInstructions = selectConfigInstructions(lastUser);

    let chapterBlock = "";
    if (chapterContext) {
      const where = chapterContext.order === 13 ? "the Epilogue" : `Chapter ${chapterContext.order}`;
      chapterBlock = `\n\nCURRENT CHAPTER:\nThe reader is on ${where}: "${String(chapterContext.title).slice(0, 120)}".\nThe chapter's lesson: ${String(chapterContext.summary || "Not available").slice(0, 300)}`;
    }

    const systemPrompt = `${persona}\n\n${BASE_PROMPT}${chapterBlock}${configInstructions}`;

    const configUsed = configInstructions.includes("quiz") ? "quiz_generation"
      : configInstructions.includes("scenario") ? "practice_scenario"
      : configInstructions.includes("money word") ? "glossary_explain"
      : "chapter_discussion";

    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("harness_runs").insert({
        config_used: configUsed,
        guide_id: characterId || null,
        chapter_id: chapterContext?.id || null,
        user_message: lastUser.substring(0, 500),
        prompt_length: systemPrompt.length,
      });
    } catch (logErr) {
      console.error("Harness log error (non-fatal):", logErr);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt }, ...history], stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Lots of questions right now! Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Asking questions is resting for now. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status, await response.text());
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
