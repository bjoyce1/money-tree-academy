import { useAppStore } from "@/state/store";

export default function AchievementsPanel(){
  const { achievements, progress } = useAppStore();
  const unlocked = progress.achievementsUnlocked;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map(a=>{
        const isUnlocked = !!unlocked[a.id];
        return (
          <div key={a.id}
            className={`rounded-2xl p-4 border ${isUnlocked?"border-emerald-400 bg-emerald-500/10":"border-zinc-700 bg-zinc-800/40"} shadow`}>
            <div className="text-3xl">{a.icon}</div>
            <div className="mt-2 font-semibold">{a.title}</div>
            <p className="text-sm opacity-80">{a.description}</p>
            <div className="mt-2 text-xs">Reward: {a.coins} coins</div>
            <div className={`mt-2 inline-block text-xs px-2 py-1 rounded ${isUnlocked?"bg-emerald-600 text-white":"bg-zinc-700"}`}>
              {isUnlocked ? "Unlocked ✓" : "Locked"}
            </div>
          </div>
        );
      })}
    </div>
  );
}