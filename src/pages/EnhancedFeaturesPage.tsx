import { useEffect } from "react";
import AchievementsPanel from "@/components/AchievementsPanel";
import Shop from "@/components/Shop";
import Glossary from "@/components/Glossary";
import GuideSelect from "@/components/GuideSelect";
import AIChat from "@/components/AIChat";
import SpendOrSave from "@/games/SpendOrSave";
import BudgetBuilder from "@/games/BudgetBuilder";
import MoneyMatch from "@/games/MoneyMatch";
import { useAppStore } from "@/state/store";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function EnhancedFeaturesPage() {
  const ensureFirstLogin = useAppStore(s=>s.ensureFirstLogin);
  const unlock = useAppStore(s=>s.unlockDueAchievements);
  const progress = useAppStore(s=>s.progress);
  
  useEffect(()=>{ 
    ensureFirstLogin(); 
    unlock(); 
  },[]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
      <div className="p-6 max-w-7xl mx-auto space-y-10">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <button className="flex items-center gap-2 text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200">
              <ArrowLeft size={20} />
              Back to Home
            </button>
          </Link>
          <div className="text-2xl font-bold text-amber-500">
            🪙 {progress.coins} Coins
          </div>
        </div>

        {/* Guide Selection */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
          <GuideSelect />
        </section>

        {/* Achievements and Shop */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-green-800 dark:text-green-200">🏆 Progress & Rewards</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Achievements</h3>
              <AchievementsPanel />
            </div>
            <div className="border-t pt-8">
              <Shop />
            </div>
          </div>
        </section>

        {/* Mini-Games */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-green-800 dark:text-green-200">🎮 Mini-Games</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-lg">Spend or Save?</h3>
              <p className="text-sm mb-4 opacity-70">Decide whether to spend or save for each item!</p>
              <SpendOrSave />
            </div>
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-lg">Budget Builder</h3>
              <p className="text-sm mb-4 opacity-70">Balance your needs, wants, and savings!</p>
              <BudgetBuilder />
            </div>
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-lg">Money Match</h3>
              <p className="text-sm mb-4 opacity-70">Match financial terms with their meanings!</p>
              <MoneyMatch />
            </div>
          </div>
        </section>

        {/* Glossary */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-green-800 dark:text-green-200">📚 Financial Terms Glossary</h2>
          <Glossary />
        </section>

        {/* AI Chat */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-green-800 dark:text-green-200">🤖 AI Learning Companion</h2>
          <p className="mb-4 text-sm opacity-70">Ask questions about money and get personalized help from your selected guide!</p>
          <AIChat />
        </section>
      </div>
    </div>
  );
}