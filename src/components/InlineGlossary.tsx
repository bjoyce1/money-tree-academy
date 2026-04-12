import { GLOSSARY } from "@/data/glossary";
import { useState } from "react";
const termMap = new Map(GLOSSARY.map(g=>[g.term.toLowerCase(), g]));

export default function InlineGlossary({text}:{text:string}){
  const [hovered,setHovered] = useState<{x:number;y:number;def?:string}>({x:0,y:0});
  const parts = text.split(/\b/);

  const enter = (e:React.MouseEvent, def:string)=>{
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHovered({x:rect.left+rect.width/2, y:rect.top, def});
  };

  return (
    <>
      <p className="leading-relaxed">
        {parts.map((p,i)=>{
          const g = termMap.get(p.toLowerCase());
          return g ? (
            <span key={i} tabIndex={0}
              onMouseEnter={(e)=>enter(e,g.definition)}
              onMouseLeave={()=>setHovered({x:0,y:0,def:undefined})}
              className="underline decoration-dotted decoration-emerald-400 cursor-help"
              aria-label={`${g.term}: ${g.definition}`}>
              {p}
            </span>
          ) : <span key={i}>{p}</span>;
        })}
      </p>
      {hovered.def && (
        <div style={{left:hovered.x, top:hovered.y-8}}
             className="fixed z-50 -translate-x-1/2 -translate-y-full bg-zinc-900 text-sm border border-zinc-700 rounded-lg px-3 py-2 shadow">
          {hovered.def}
        </div>
      )}
    </>
  );
}