import { Link, useParams } from 'wouter';
import { ArrowLeft, Check } from 'lucide-react';
import { PageShell } from '@/components/site/PageShell';
import { CHARACTERS, setGuide, useGuideId, type GuideId } from '@/data/characters';
import { CHAPTERS } from '@/data/content';
import NotFound from './not-found';

export default function CharacterProfilePage() {
  const { characterId } = useParams<{ characterId: string }>();
  const character = CHARACTERS.find((c) => c.id === characterId);
  const guide = useGuideId();
  if (!character) return <NotFound />;

  const isRenee = character.id === 'renee';
  const tipTitle = isRenee ? "Renee's saving tips" : "Alex's wealth builder tips";
  const tips = CHAPTERS.filter((c) => c.kit).map((c) => ({ chapter: c, tip: isRenee ? c.kit!.reneeTip : c.kit!.alexTip }));
  const selected = guide === character.id;
  const other = CHARACTERS.find((c) => c.id !== character.id)!;

  return (
    <PageShell title={character.name}>
      <div className="mx-auto max-w-container px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <Link href="/characters" className="inline-flex min-h-[2.75rem] items-center gap-2 text-cream-2 hover:text-gold">
          <ArrowLeft size={18} aria-hidden /> Renee and Alex
        </Link>

        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:sticky lg:top-[100px]">
            <img
              src={character.image}
              alt={`${character.name}, from the cover of the book`}
              width={640}
              height={640}
              className="aspect-square w-full max-w-[24rem] rounded-plate bg-night-3 object-cover object-top shadow-plate"
              data-testid="character-profile-image"
            />
            <h1 className="mt-8 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] text-gold">{character.name}</h1>
            <p className="mt-2 text-[1.0625rem] text-cream-2">
              {character.personality.replace(' & ', ' and ')} · {character.speciality.replace(' & ', ' and ')}
            </p>
            <p className="mt-5 max-w-measure leading-[1.65] text-cream-2">{character.bio}</p>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => setGuide(character.id as GuideId)}
              className={
                selected
                  ? 'mt-7 inline-flex min-h-[3.25rem] items-center gap-2 rounded-pill border border-gold/50 px-6 text-[1.0625rem] font-bold text-gold'
                  : 'mt-7 inline-flex min-h-[3.25rem] items-center rounded-pill bg-gold px-6 text-[1.0625rem] font-bold text-night shadow-gold hover:bg-gold-hover'
              }
              data-testid="select-character-button"
            >
              {selected && <Check size={18} aria-hidden />}
              {selected ? `${character.name} is your guide` : `Read with ${character.name}`}
            </button>
          </div>

          <div>
            <blockquote className="border-l-2 border-gold pl-5 text-[clamp(1.3rem,2.2vw,1.7rem)] font-bold leading-[1.4] text-gold">
              “{character.catchphrase}”
            </blockquote>

            <section aria-labelledby="tips-title" className="mt-14">
              <h2 id="tips-title" className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-gold">
                {tipTitle}
              </h2>
              <p className="mt-3 max-w-measure text-cream-2">One from the end of every chapter in the book.</p>
              <ol className="mt-6 border-b border-hairline">
                {tips.map(({ chapter, tip }) => (
                  <li key={chapter.id} className="grid grid-cols-[2.25rem_1fr] gap-3 border-t border-hairline py-5 sm:grid-cols-[3rem_1fr]">
                    <span className="font-display text-[1.4rem] font-bold text-gold/55">{chapter.order}</span>
                    <div>
                      <p className="text-[1.0625rem] leading-[1.55] text-cream">{tip}</p>
                      <Link
                        href={`/read/${chapter.slug}`}
                        className="mt-1.5 inline-block text-[0.875rem] text-cream-3 underline decoration-gold/30 underline-offset-4 hover:text-gold"
                      >
                        {chapter.title}
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="cheer-title" className="mt-14">
              <h2 id="cheer-title" className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-gold">
                How {character.name} cheers you on
              </h2>
              <ul className="mt-5 grid gap-3">
                {[...character.celebrationMessages.slice(0, 2), ...character.encouragementMessages.slice(0, 2)].map((m) => (
                  <li key={m} className="max-w-measure text-[1.0625rem] leading-[1.55] text-cream-2">
                    “{m}”
                  </li>
                ))}
              </ul>
            </section>

            <Link
              href={`/characters/${other.id}`}
              className="mt-14 inline-flex min-h-[3.25rem] items-center gap-3 rounded-pill pr-3 font-bold text-cream hover:text-gold"
            >
              <img src={other.image} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover object-top" />
              Meet {other.name}
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
