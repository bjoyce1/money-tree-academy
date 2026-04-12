import { useState } from "react";
import { useAppStore } from "@/state/store";
import { guideSystemPrompt } from "@/ai/persona";

type Msg = { role:"user"|"assistant"; text:string };

export default function AIChat(){
  const guide = useAppStore(s=>s.progress.selectedGuide);
  const [msgs,setMsgs] = useState<Msg[]>([{role:"assistant",text:"Hi! Ask me about money and I'll help."}]);
  const [input,setInput] = useState("");

  const send = async ()=>{
    if(!input.trim()) return;
    const user = input.trim();
    setInput("");
    setMsgs(m=>[...m,{role:"user",text:user}]);

    // STUB: replace with real provider later
    const sys = guideSystemPrompt(guide);
    const response = await fakeAI(sys, user);
    setMsgs(m=>[...m,{role:"assistant",text:response}]);
  };

  const quick = (kind:"Generate Quiz"|"Practice Scenario")=>{
    setMsgs(m=>[...m,{role:"user",text:kind}]);
    fakeAI(guideSystemPrompt(guide), kind).then(r=>setMsgs(m=>[...m,{role:"assistant",text:r}]));
  };

  return (
    <div className="flex flex-col h-[60vh] rounded-2xl border border-zinc-700 bg-zinc-900">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {msgs.map((m,i)=>(
          <div key={i} className={`max-w-[80%] p-2 rounded-xl ${m.role==="assistant"?"bg-emerald-600/20 self-start":"bg-indigo-600/20 self-end"}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-700 p-2 flex gap-2">
        <input aria-label="AI chat message" className="flex-1 bg-zinc-800 rounded px-3 py-2"
               value={input} onChange={(e)=>setInput(e.target.value)}
               onKeyDown={(e)=>e.key==="Enter"&&send()} placeholder="Ask a question…" />
        <button onClick={send} className="px-3 py-2 rounded bg-emerald-600">Send</button>
        <button onClick={()=>quick("Generate Quiz")} className="px-3 py-2 rounded bg-amber-500 text-black">Generate Quiz</button>
        <button onClick={()=>quick("Practice Scenario")} className="px-3 py-2 rounded bg-amber-500 text-black">Practice Scenario</button>
      </div>
    </div>
  );
}

async function fakeAI(system:string, user:string){
  if(/Generate Quiz/i.test(user)) return "Okay! 3 quick questions: (1) What is income? (2) Needs vs wants—give one of each. (3) If you save $10/month, how much after 6 months?";
  if(/Practice Scenario/i.test(user)) return "Scenario: You got $20. You want a $12 game and $8 snack. Show a budget that also saves at least $5. What do you do?";
  if(/invest|stock|compound/i.test(user)) return "Investing means putting money to work so it can grow over time. Start with index funds and compound growth.";
  return "Great question! Think about your goal first. Saving helps you reach goals, spending buys now, budgeting balances both.";
}