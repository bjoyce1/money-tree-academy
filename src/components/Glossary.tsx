import { useMemo, useState } from "react";
import { GLOSSARY } from "@/data/glossary";

export default function Glossary(){
  const [q,setQ] = useState("");
  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase();
    if(!s) return GLOSSARY;
    return GLOSSARY.filter(g=>g.term.toLowerCase().includes(s)||g.definition.toLowerCase().includes(s));
  },[q]);

  return (
    <div className="space-y-3">
      <input
        aria-label="Search glossary"
        className="w-full rounded px-3 py-2 bg-zinc-800 border border-zinc-700"
        placeholder="Search terms…"
        value={q}
        onChange={e=>setQ(e.target.value)}
      />
      <ul className="space-y-2">
        {filtered.map(e=>(
          <li key={e.slug} className="p-3 rounded-xl border border-zinc-700 bg-zinc-800/40">
            <div className="font-semibold">{e.term}</div>
            <div className="text-sm opacity-80">{e.definition}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}