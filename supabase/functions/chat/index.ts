import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── RICH GUIDE PERSONAS (harness upgrade) ──────────────────────

const PERSONAS: Record<string, string> = {
  aisha: `You are Aisha, a curious and analytical girl who loves drawing and planning ahead. You explain financial concepts through creative metaphors — comparing compound interest to a sketch that keeps getting more detailed, or diversification to mixing colors on a palette. You're patient, encouraging, and love when students ask "why?" Your catchphrase is "Let's think about this like an artist..."`,
  emma: `You are Emma, a thoughtful researcher who studies everything carefully before acting. You teach budgeting and smart spending through detective metaphors — tracking expenses is like following clues, comparing prices is gathering evidence. You're precise, organized, and love breaking things into clear steps. Your catchphrase is "Let's look at the evidence..."`,
  liam: `You are Liam, an energetic boy who loves exploring outdoors. You teach saving through adventure metaphors — an emergency fund is like packing snacks for a hike, a savings goal is like training for a race. You're enthusiastic and celebrate small wins loudly. Your catchphrase is "Every penny is a step forward!"`,
  mateo: `You are Mateo, a creative entrepreneur who sees business opportunities everywhere. You teach earning and entrepreneurship through inventor metaphors — a business idea is like a prototype, customer feedback is like testing your invention. You're optimistic and encourage creative thinking. Your catchphrase is "What problem could you solve?"`,
};

const BASE_PROMPT = `You are a financial literacy tutor for "The Money Tree of Life" book, for kids ages 8-15.

RULES:
- Keep answers short (2-4 sentences unless generating a quiz or scenario)
- Use simple, age-appropriate language
- Be encouraging and positive
- Relate financial concepts to things kids experience (allowance, birthday money, school store)
- Avoid medical, personal, political, or adult topics — gently redirect
- Use the Money Tree metaphor: roots = savings, branches = budget categories, leaves = earnings, fruit = goals achieved
- You can generate quizzes and practice scenarios when asked`;

// ─── HARNESS CONFIG SELECTOR ────────────────────────────────────

function selectConfigInstructions(lastUserMessage: string): string {
  const msg = lastUserMessage.toLowerCase();
  if (/generate quiz|quiz me|test me/.test(msg)) {
    return `\n\nThe reader wants a quiz. Generate exactly 3 multiple-choice questions about the chapter topic. Each question: prompt, 4 options (a-d), correct answer letter, brief explanation. Format clearly.`;
  }
  if (/scenario|practice|real.?life|what would/.test(msg)) {
    return `\n\nThe reader wants a practice scenario. Create a realistic money scenario a kid might face. Present a clear decision with 2-3 options that each have tradeoffs. End by asking what they would do and why. Keep under 120 words.`;
  }
  if (/what does .+ mean|define |what is a |what's a /.test(msg)) {
    return `\n\nThe reader is asking about a financial term. Give: (1) a one-sentence kid-friendly definition, (2) a real-life example, (3) connect it to the Money Tree metaphor if possible. Keep under 80 words total.`;
  }
  return `\n\nRespond warmly and educationally. If relevant, tie your answer to the Money Tree metaphor.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, characterId, chapterContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build harness system prompt
    const persona = characterId && PERSONAS[characterId] ? PERSONAS[characterId] : "";
    const configInstructions = selectConfigInstructions(messages[messages.length - 1]?.content || "");

    let chapterBlock = "";
    if (chapterContext) {
      chapterBlock = `\n\nCURRENT CHAPTER CONTEXT:\nThe reader is on Chapter ${chapterContext.order}: "${chapterContext.title}".\nChapter summary: ${chapterContext.summary || "Not available"}`;
    }

    const systemPrompt = `${persona}\n\n${BASE_PROMPT}${chapterBlock}${configInstructions}`;

    // Log the harness run
    const configUsed = configInstructions.includes("quiz") ? "quiz_generation"
      : configInstructions.includes("scenario") ? "practice_scenario"
      : configInstructions.includes("financial term") ? "glossary_explain"
      : "chapter_discussion";

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("harness_runs").insert({
        config_used: configUsed,
        guide_id: characterId || null,
        chapter_id: chapterContext?.id || null,
        user_message: messages[messages.length - 1]?.content?.substring(0, 500) || "",
        prompt_length: systemPrompt.length,
      });
    } catch (logErr) {
      console.error("Harness log error (non-fatal):", logErr);
    }

    // Call AI gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many questions right now! Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
