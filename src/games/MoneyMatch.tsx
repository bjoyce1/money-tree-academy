import { useEffect, useState } from "react";
import { useAppStore } from "@/state/store";

const PAIRS = [
  ["Income", "Money you earn"],
  ["Expense", "Money you spend"],
  ["Interest", "Extra money earned for saving"],
  ["Budget", "Plan for your money"],
];

type Card = { id:string; label:string; isMatch?:boolean; open?:boolean };

export default function MoneyMatch(){
  const [cards,setCards] = useState<Card[]>([]);
  const [openIds,setOpenIds] = useState<string[]>([]);
  const setMini = useAppStore(s=>s.setMiniGameScore);
  const addCoins = useAppStore(s=>s.addCoins);
  const unlock = useAppStore(s=>s.unlockDueAchievements);

  useEffect(()=>{
    const base:Card[]=[];
    PAIRS.forEach((p,idx)=>{ base.push({id:`t${idx}`,label:p[0]}); base.push({id:`d${idx}`,label:p[1]}); });
    setCards(shuffle(base));
  },[]);

  function shuffle<T>(a:T[]):T[] { return [...a].sort(()=>Math.random()-0.5); }

  const click=(id:string)=>{
    if(openIds.length===2) return;
    setCards(prev=>prev.map(c=>c.id===id?{...c,open:true}:c));
    setOpenIds(prev=>[...prev,id]);
  };

  useEffect(()=>{
    if(openIds.length===2){
      const [a,b] = openIds;
      const ai = cards.findIndex(c=>c.id===a);
      const bi = cards.findIndex(c=>c.id===b);
      const isPair = match(cards[ai].label, cards[bi].label);
      setTimeout(()=>{
        setCards(prev=>prev.map(c=>{
          if(c.id===a||c.id===b) return isPair?{...c,open:true,isMatch:true}:{...c,open:false};
          return c;
        }));
        setOpenIds([]);
      },600);
    }
  },[openIds]); // eslint-disable-line

  const allMatched = cards.length>0 && cards.every(c=>c.isMatch);
  useEffect(()=>{
    if(allMatched){
      const score = 100;
      setMini("money_match", score);
      addCoins(5);
      unlock();
      alert("You matched all pairs! +5 coins");
    }
  },[allMatched]); // eslint-disable-line

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(c=>(
        <button key={c.id} aria-label={`card ${c.id}`} onClick={()=>!c.open&&click(c.id)}
          className={`h-24 rounded-xl border ${c.open?"bg-emerald-600/20":"bg-zinc-800/40"} ${c.isMatch?"border-emerald-400":"border-zinc-700"}`}>
          <span className="p-2 text-sm">{c.open||c.isMatch?c.label:"?"}</span>
        </button>
      ))}
    </div>
  );
}

function match(a:string,b:string){
  return PAIRS.some(([t,d])=>(t===a&&d===b)||(t===b&&d===a));
}