import { useState } from "react";
import { useAppStore } from "@/state/store";

const TARGET = { needs:50, wants:30, savings:20 };

export default function BudgetBuilder(){
  const [alloc,setAlloc] = useState({needs:0, wants:0, savings:0});
  const setMini = useAppStore(s=>s.setMiniGameScore);
  const addCoins = useAppStore(s=>s.addCoins);
  const unlock = useAppStore(s=>s.unlockDueAchievements);

  const total = alloc.needs+alloc.wants+alloc.savings;
  const remaining = 100-total;

  const score = ()=>{
    const d = Math.abs(alloc.needs-TARGET.needs)+Math.abs(alloc.wants-TARGET.wants)+Math.abs(alloc.savings-TARGET.savings);
    return Math.max(0, 100-d);
  };

  const submit = ()=>{
    const s = score();
    setMini("budget_builder", s);
    addCoins(Math.floor(s/20));
    unlock();
    alert(`Score: ${s}`);
  };

  const inc = (k:keyof typeof alloc, by=5)=>{ if(remaining<=0) return; setAlloc(p=>({...p,[k]:Math.min(100,p[k]+by)})); };
  const dec = (k:keyof typeof alloc, by=5)=> setAlloc(p=>({...p,[k]:Math.max(0,p[k]-by)}));

  return (
    <div className="space-y-4">
      {(["needs","wants","savings"] as const).map(cat=>(
        <div key={cat} className="flex items-center justify-between border rounded-xl p-3">
          <div className="capitalize">{cat}</div>
          <div className="flex items-center gap-2">
            <button aria-label={`decrease ${cat}`} className="px-3 py-1 bg-zinc-700 rounded" onClick={()=>dec(cat)}>-</button>
            <div className="w-24 text-center">{alloc[cat]}%</div>
            <button aria-label={`increase ${cat}`} className="px-3 py-1 bg-zinc-700 rounded" onClick={()=>inc(cat)}>+</button>
          </div>
        </div>
      ))}
      <div className="text-sm opacity-80">Remaining: {remaining}%</div>
      <button onClick={submit} disabled={remaining!==0} className="px-4 py-2 rounded bg-amber-500 text-black font-semibold disabled:opacity-50">
        Submit (Score: {score()})
      </button>
    </div>
  );
}