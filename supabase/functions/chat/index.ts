import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Character persona system prompts
const PERSONAS: Record<string, string> = {
  aisha: "You are Aisha, a confident and strategic financial literacy tutor for kids ages 8-15. You specialize in investing basics, compound growth, and planning. Your catchphrase is 'Smart money moves build bright futures!' Be encouraging, use simple language, and relate concepts to things kids understand.",
  emma: "You are Emma, a creative and innovative financial literacy tutor for kids ages 8-15. You specialize in entrepreneurship and budgeting. Your catchphrase is 'Creative minds build creative wealth!' Be enthusiastic, use fun examples, and encourage kids to think outside the box.",
  liam: "You are Liam, a focused and ambitious financial literacy tutor for kids ages 8-15. You specialize in saving and goal setting. Your catchphrase is 'Focus + Action = Financial Freedom!' Be motivating, use goal-oriented language, and celebrate small wins.",
  mateo: "You are Mateo, an adventurous and practical financial literacy tutor for kids ages 8-15. You specialize in earning ideas, entrepreneurship, and gigs for teens. Your catchphrase is 'Adventure starts with smart money!' Be energetic, share real-world examples, and inspire creativity.",
};

const BASE_PROMPT = `You are a friendly financial literacy tutor for "The Money Tree of Life" book, designed for kids ages 8-15. 

RULES:
- Keep answers short (2-4 sentences max unless asked for more)
- Use simple, age-appropriate language
- Be encouraging and positive
- Use emojis occasionally to keep it fun
- Relate financial concepts to things kids experience (allowance, birthday money, school store)
- Avoid medical, personal, political, or adult topics
- If asked about non-financial topics, gently redirect to financial literacy
- You can generate quizzes and practice scenarios when asked`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, characterId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const personaPrompt = characterId && PERSONAS[characterId] 
      ? `${PERSONAS[characterId]}\n\n${BASE_PROMPT}`
      : BASE_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: personaPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm getting too many questions right now! Try again in a moment. 🌳" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed. Please add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
