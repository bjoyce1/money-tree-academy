import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { PageShell, PageIntro } from '@/components/site/PageShell';
import { CHARACTERS, setGuide, useGuideId, type Character, type GuideId } from '@/data/characters';
import { cn } from '@/lib/utils';

export default function CharacterSelectionPage() {
  const guide = useGuideId();
  return (
    <PageShell title="Meet Renee and Alex">
      <PageIntro
        title="Meet Renee and Alex"
        lead="Two best friends from Houston, chosen by the Money Tree. Renee saves; Alex builds. Pick one to read with you, and their tip comes first at the end of every chapter."
      />
      <div className="mx-auto grid max-w-container gap-16 px-5 pb-24 sm:px-8 lg:grid-cols-2 lg:gap-12">
        {CHARACTERS.map((c) => (
          <GuideProfile key={c.id} character={c} selected={guide === c.id} />
        ))}
      </div>
    </PageShell>
  );
}

function GuideProfile({ character: c, selected }: { character: Character; selected: boolean }) {
  return (
    <article aria-labelledby={`guide-${c.id}-name`} data-testid={`card-character-${c.id}`}>
      <img
        src={c.image}
        alt={`${c.name}, from the cover of the book`}
        width={640}
        height={640}
        className="aspect-square w-full max-w-[22rem] rounded-plate bg-night-3 object-cover object-top shadow-plate"
      />
      <h2 id={`guide-${c.id}-name`} className="mt-8 font-display text-[clamp(1.75rem,3vw,2.4rem)] font-bold leading-tight text-gold">
        {c.name}
      </h2>
      <p className="mt-1 text-[1.0625rem] text-cream-2">
        {c.personality.replace(' & ', ' and ')} · {c.speciality.replace(' & ', ' and ')}
      </p>
      <p className="mt-5 max-w-measure leading-[1.65] text-cream-2">{c.bio}</p>
      <blockquote className="mt-6 max-w-measure border-l-2 border-gold pl-4 text-[1.15rem] font-bold leading-[1.45] text-gold">
        “{c.catchphrase}”
      </blockquote>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => setGuide(c.id as GuideId)}
          className={cn(
            'inline-flex min-h-[3.25rem] items-center gap-2 rounded-pill px-6 text-[1.0625rem] font-bold',
            selected ? 'border border-gold/50 text-gold' : 'bg-gold text-night shadow-gold hover:bg-gold-hover',
          )}
          data-testid={`button-select-${c.id}`}
        >
          {selected && <Check size={18} aria-hidden />}
          {selected ? `${c.name} is your guide` : `Read with ${c.name}`}
        </button>
        <Link
          href={`/characters/${c.id}`}
          className="inline-flex min-h-[3.25rem] items-center gap-2 rounded-pill px-3 font-bold text-cream hover:text-gold"
        >
          {c.name}'s tips from every chapter <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
