import { useAppStore } from "@/state/store";
import type { GuideId } from "@/types/game";

const GUIDES: { id: GuideId; name: string; focus: string; emoji: string }[] = [
  { id:"aisha", name:"Aisha", focus:"Investing & Planning", emoji:"📈" },
  { id:"liam",  name:"Liam",  focus:"Saving & Goals",      emoji:"💾" },
  { id:"emma",  name:"Emma",  focus:"Smart Spending",      emoji:"🛍️" },
  { id:"mateo", name:"Mateo", focus:"Earning & Hustle",    emoji:"💼" },
];

export default function GuideSelect(){
  const selected = useAppStore(s=>s.progress.selectedGuide);
  const select   = useAppStore(s=>s.selectGuide);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Choose your learning guide</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GUIDES.map(g=>(
          <button key={g.id} onClick={()=>select(g.id)} aria-pressed={selected===g.id}
            className={`rounded-2xl p-4 border ${selected===g.id?"border-emerald-400 bg-emerald-500/10":"border-zinc-700 bg-zinc-800/40"}`}>
            <div className="text-3xl">{g.emoji}</div>
            <div className="mt-2 font-semibold">{g.name}</div>
            <div className="text-sm opacity-80">{g.focus}</div>
          </button>
        ))}
      </div>
    </div>
  );
}