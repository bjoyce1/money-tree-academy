import { useState } from "react";
import { useAppStore } from "@/state/store";

const ITEMS = [
  { id:"1", text:"Birthday money", correct:"save" },
  { id:"2", text:"Ice cream", correct:"spend" },
  { id:"3", text:"Emergency fund", correct:"save" },
  { id:"4", text:"Movie ticket", correct:"spend" },
];

export default function SpendOrSave(){
  const [answers,setAnswers] = useState<Record<string,"save"|"spend"|undefined>>({});
  const setMini = useAppStore(s=>s.setMiniGameScore);
  const addCoins = useAppStore(s=>s.addCoins);
  const unlock = useAppStore(s=>s.unlockDueAchievements);

  const submit = ()=>{
    const total = ITEMS.length;
    const correct = ITEMS.filter(i=>answers[i.id]===i.correct).length;
    const score = Math.round((correct/total)*100);
    setMini("spend_or_save", score);
    addCoins(Math.floor(score/20));
    unlock();
    alert(`Score: ${score}`);
  };

  return (
    <div className="space-y-3">
      {ITEMS.map(i=>(
        <div key={i.id} className="flex items-center justify-between border rounded-xl p-3">
          <div>{i.text}</div>
          <div className="space-x-2">
            <button aria-label="choose save" className={`px-3 py-1 rounded ${answers[i.id]==="save"?"bg-emerald-600 text-white":"bg-zinc-700"}`} onClick={()=>setAnswers({...answers,[i.id]:"save"})}>Save</button>
            <button aria-label="choose spend" className={`px-3 py-1 rounded ${answers[i.id]==="spend"?"bg-indigo-600 text-white":"bg-zinc-700"}`} onClick={()=>setAnswers({...answers,[i.id]:"spend"})}>Spend</button>
          </div>
        </div>
      ))}
      <button onClick={submit} className="px-4 py-2 rounded bg-amber-500 text-black font-semibold">Submit</button>
    </div>
  );
}