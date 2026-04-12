import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHAPTERS = [
  { id: "ch-01", title: "The Seed", order: 1 },
  { id: "ch-02", title: "Roots of Saving", order: 2 },
  { id: "ch-03", title: "Branches of Budgeting", order: 3 },
  { id: "ch-04", title: "Leaves of Earning", order: 4 },
  { id: "ch-05", title: "Flowers of Needs vs Wants", order: 5 },
  { id: "ch-06", title: "Fruit of Sharing", order: 6 },
  { id: "ch-07", title: "Seasons of Money", order: 7 },
  { id: "ch-08", title: "The Storm", order: 8 },
  { id: "ch-09", title: "New Growth", order: 9 },
  { id: "ch-10", title: "The Forest", order: 10 },
];

function getChapterTitle(id: string): string {
  return CHAPTERS.find(c => c.id === id)?.title || "Unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    const body = req.method === "POST" ? await req.json() : {};

    // ─── RECOMMENDATIONS ──────────────────────────────────────
    if (path === "recommendations" || url.pathname.endsWith("/harness/recommendations")) {
      const { completedChapters = [], quizResults = [], streakDays = 0, coins = 0 } = body;
      const completed = completedChapters.length;
      const total = CHAPTERS.length;
      const weakQuizzes = quizResults.filter((q: any) => q.scorePct < 70);
      const completedSet = new Set(completedChapters);
      const nextChapter = CHAPTERS.find(ch => !completedSet.has(ch.id));

      let recommendations: string[] = [];
      let focusArea = "Getting started";
      let encouragement = "Every journey starts with a single step!";

      if (completed === 0) {
        focusArea = "Begin your journey";
        recommendations = ["Start with Chapter 1: \"The Seed\" — meet the Money Tree!", "Pick a character companion that matches your style."];
        encouragement = "Your Money Tree is ready to grow. Let's plant that first seed!";
      } else if (weakQuizzes.length > 0) {
        const weak = weakQuizzes[weakQuizzes.length - 1];
        focusArea = "Review and strengthen";
        recommendations = [
          `Re-read "${getChapterTitle(weak.chapterId)}" — your quiz score was ${weak.scorePct}%.`,
          "Ask your AI guide to explain the tricky concepts.",
          "Use the Quiz button for extra practice.",
        ];
        encouragement = "Even the strongest trees deepen their roots sometimes!";
      } else if (nextChapter) {
        focusArea = `Next: ${nextChapter.title}`;
        recommendations = [`Read Chapter ${nextChapter.order}: "${nextChapter.title}".`];
        if (streakDays >= 3) recommendations.push(`Amazing ${streakDays}-day streak! Keep it going.`);
        else recommendations.push("Try reading a little every day to build your streak.");
        encouragement = completed >= total / 2
          ? "You're past the halfway point — your Money Tree is flourishing!"
          : "Great progress! Every chapter makes your tree stronger.";
      } else {
        focusArea = "Mastery mode";
        recommendations = ["You've read every chapter! Try re-reading favorites.", "Challenge yourself with Practice Scenarios."];
        encouragement = "Your Money Tree is fully grown. Time to share the seeds!";
      }

      return json({ recommendations, focusArea, encouragement });
    }

    // ─── RECAP ────────────────────────────────────────────────
    if (path === "recap" || url.pathname.endsWith("/harness/recap")) {
      const { currentChapterId, completedChapters = [] } = body;
      const current = CHAPTERS.find(c => c.id === currentChapterId);
      if (!current || current.order <= 1) return json({ recap: "", previousChapter: null });

      const prev = CHAPTERS.find(c => c.order === current.order - 1);
      if (!prev) return json({ recap: "", previousChapter: null });

      const prevCompleted = completedChapters.includes(prev.id);
      const recap = prevCompleted
        ? `Previously in "${prev.title}": You learned key money concepts that build the foundation for this chapter.`
        : `You haven't read "${prev.title}" yet — you might want to go back for the full story!`;

      return json({ recap, previousChapterId: prev.id, previousChapterSlug: prev.title.toLowerCase().replace(/\s+/g, '-') });
    }

    // ─── REPORT ───────────────────────────────────────────────
    if (path === "report" || url.pathname.endsWith("/harness/report")) {
      const { completedChapters = [], quizResults = [], streakDays = 0, longestStreak = 0,
              coins = 0, notesCount = 0, achievementsUnlocked = 0 } = body;

      const total = CHAPTERS.length;
      const completed = completedChapters.length;
      const pct = Math.round((completed / total) * 100);
      const avgQuiz = quizResults.length > 0
        ? Math.round(quizResults.reduce((s: number, q: any) => s + q.scorePct, 0) / quizResults.length)
        : 0;

      let treeHealth = 0;
      treeHealth += Math.min(30, pct * 0.3);
      treeHealth += Math.min(25, avgQuiz * 0.25);
      treeHealth += Math.min(20, streakDays * 3);
      treeHealth += Math.min(15, notesCount * 3);
      treeHealth += Math.min(10, achievementsUnlocked * 2);
      treeHealth = Math.round(Math.min(100, treeHealth));

      const overallGrade = treeHealth >= 80 ? "Flourishing" : treeHealth >= 60 ? "Growing Strong"
        : treeHealth >= 40 ? "Sprouting" : treeHealth >= 20 ? "Taking Root" : "Just Planted";

      const summary = `${completed}/${total} chapters (${pct}%). Quiz avg: ${avgQuiz}%. Streak: ${streakDays} days. ${coins} coins. Tree: ${treeHealth}/100 — ${overallGrade}.`;

      const strengths: string[] = [];
      if (avgQuiz >= 80) strengths.push("Excellent quiz performance.");
      if (streakDays >= 7) strengths.push(`Impressive ${streakDays}-day reading streak.`);
      if (completed >= total / 2) strengths.push("Past the halfway mark!");
      if (strengths.length === 0) strengths.push("Getting started on the financial literacy journey!");

      const areasToImprove: string[] = [];
      const weakChapters = quizResults.filter((q: any) => q.scorePct < 60).map((q: any) => getChapterTitle(q.chapterId));
      if (weakChapters.length > 0) areasToImprove.push(`Review needed: ${weakChapters.join(", ")}.`);
      if (streakDays === 0) areasToImprove.push("No active streak — encourage daily reading.");
      if (areasToImprove.length === 0) areasToImprove.push("Keep up the great work!");

      const parentTips = [
        "Ask your child to explain what they learned in their own words.",
        "Connect book lessons to real life: practice budgeting with a small allowance.",
      ];

      return json({ summary, strengths, areasToImprove, parentTips, overallGrade, treeHealth });
    }

    // ─── SCORE ────────────────────────────────────────────────
    if (path === "score" || url.pathname.endsWith("/harness/score")) {
      const { positive, configUsed } = body;
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("harness_scores").insert({
          config_used: configUsed || "unknown",
          positive: !!positive,
          score: positive ? 1.0 : 0.0,
        });
      } catch (e) {
        console.error("Score log error:", e);
      }
      return json({ success: true });
    }

    // ─── STATS ────────────────────────────────────────────────
    if (path === "stats" || url.pathname.endsWith("/harness/stats")) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { count: totalRuns } = await supabase.from("harness_runs").select("*", { count: "exact", head: true });
        const { data: runs } = await supabase.from("harness_runs").select("config_used").limit(500);

        const configBreakdown: Record<string, number> = {};
        (runs || []).forEach((r: any) => {
          configBreakdown[r.config_used] = (configBreakdown[r.config_used] || 0) + 1;
        });

        return json({ totalRuns: totalRuns || 0, configBreakdown });
      } catch {
        return json({ totalRuns: 0, configBreakdown: {} });
      }
    }

    return json({ error: `Unknown harness action: ${path}` }, 400);
  } catch (e) {
    console.error("harness error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
