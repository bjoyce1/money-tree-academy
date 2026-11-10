import { VERBS } from "./content";

/**
 * The premise, in the book's own words. Deliberately still: the page's motion
 * belongs to the hero and the chapter index.
 */
export function Premise() {
  return (
    <section aria-labelledby="premise-title" className="relative px-5 py-[clamp(5rem,12vw,9rem)] sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h2
          id="premise-title"
          className="home-display max-w-[16ch] text-[clamp(2rem,4.6vw,3.9rem)] leading-[1.08] text-[var(--cream)]"
        >
          Money does not grow on trees. <span className="text-[var(--gold)]">Knowledge does.</span>
        </h2>
        <p className="home-measure mt-6 text-[clamp(1.1rem,1.5vw,1.3rem)] leading-[1.65] text-[var(--cream-2)]">
          Renee and Alex think money is something you either have or do not have, until a golden leaf leads
          them to the Money Tree in Houston. The tree never gives them free cash.
        </p>

        <div className="mt-12">
          <p className="text-[clamp(1.05rem,1.4vw,1.2rem)] text-[var(--cream-3)]">Instead, it challenges them to</p>
          <p className="mt-3 max-w-[30ch] text-[clamp(1.7rem,3.6vw,3rem)] font-bold leading-[1.22] tracking-[-0.01em] text-[var(--cream)]">
            {VERBS.map((v, i) => (
              <span key={v}>
                <span className="text-[var(--gold)]">{v}</span>
                {i === VERBS.length - 1 ? "." : ", "}
                {i === VERBS.length - 2 ? "and " : null}
              </span>
            ))}
          </p>
          <p className="home-measure mt-10 text-[clamp(1.05rem,1.4vw,1.2rem)] leading-[1.65] text-[var(--cream-2)]">
            Written for ages 8 to 15, in clear language a child and an adult can read side by side.
          </p>
        </div>
      </div>
    </section>
  );
}
