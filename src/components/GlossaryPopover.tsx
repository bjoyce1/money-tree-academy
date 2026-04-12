import { useState } from 'react';
import terms from '../data/glossary.json';

type GlossaryProps = { term: string };

export default function GlossaryPopover({ term }: GlossaryProps) {
  const entry = terms.find(t => t.term.toLowerCase() === term.toLowerCase());
  const [open, setOpen] = useState(false);

  if (!entry) return <span>{term}</span>;

  return (
    <span className="relative inline-block">
      <button 
        onClick={() => setOpen(o => !o)} 
        className="glossary-term"
        data-testid={`glossary-term-${term.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {term}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-64 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-lg">
          <div className="font-semibold text-slate-100">{entry.term}</div>
          <div className="text-sm text-slate-300 mt-1">{entry.shortDefinition}</div>
        </div>
      )}
    </span>
  );
}
