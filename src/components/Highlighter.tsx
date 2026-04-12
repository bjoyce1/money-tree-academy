import { useAppStore } from "@/state/store";
import { useState } from "react";

export default function Highlighter({ text }:{ text:string }){
  const incHighlights = useAppStore(s=>s.incHighlights);
  const unlock = useAppStore(s=>s.unlockDueAchievements);
  const [notes,setNotes] = useState<{quote:string; note?:string}[]>([]);

  const add = ()=>{
    const sel = window.getSelection()?.toString().trim();
    if(!sel) return;
    const note = prompt("Add a note (optional):") || undefined;
    setNotes(prev=>[{quote:sel, note}, ...prev]);
    incHighlights();
    unlock();
  };
  const remove = (i:number)=>setNotes(prev=>prev.filter((_,idx)=>idx!==i));

  return (
    <div className="space-y-3">
      <button onClick={add} className="mb-2 px-3 py-1 rounded bg-emerald-600">Save Selection</button>
      <p className="leading-relaxed select-text">{text}</p>
      <div className="mt-3">
        <h3 className="font-semibold">Your Highlights</h3>
        {notes.length===0 && <p className="text-sm opacity-70">Select text above and click "Save Selection".</p>}
        <ul className="space-y-2">
          {notes.map((n,i)=>(
            <li key={i} className="p-3 border border-zinc-700 rounded-xl">
              <blockquote className="text-sm italic">"{n.quote}"</blockquote>
              {n.note && <div className="text-sm mt-1">Note: {n.note}</div>}
              <button onClick={()=>remove(i)} className="mt-2 text-xs bg-zinc-700 rounded px-2 py-1">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}