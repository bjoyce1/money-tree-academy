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
            className={`glass-card rounded-2xl p-4 transition-all hover:scale-105 ${isUnlocked ? "!border-coral/30 !bg-coral/5" : ""}`}>
            <div className="text-3xl">{a.icon}</div>
            <div className="mt-2 font-extrabold text-foreground">{a.title}</div>
            <p className="text-sm text-muted-foreground">{a.description}</p>
            <div className="mt-2 text-xs text-golden font-bold">Reward: {a.coins} coins</div>
            <div className={`mt-2 inline-block text-xs px-3 py-1 rounded-full font-bold ${isUnlocked ? "bg-coral text-white" : "bg-white/10 text-muted-foreground"}`}>
              {isUnlocked ? "Unlocked ✓" : "Locked"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
