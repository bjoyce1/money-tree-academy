import { useState } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { CHAPTER_TWO_END as END, KIT, flipbookHref, type KitPart } from "./content";
import { GoldLeaf } from "./Art";
import { prefetchFlipbook } from "./Nav";

const follow = { type: "spring" as const, visualDuration: 0.45, bounce: 0.12 };

/** One part of the chapter's ending. The gold marker slides to whichever part is chosen in the list. */
function Part({ id, active, label, children }: { id: KitPart["id"]; active: KitPart["id"]; label: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className="kit-part">
      {id === active && (
        <motion.span
          layoutId="kit-marker"
          className="kit-marker"
          aria-hidden
          transition={reduce ? { duration: 0 } : follow}
        />
      )}
      <h3 className="kit-label">{label}</h3>
      {children}
    </div>
  );
}

/** The end of Chapter 2, set in the site's own type, word for word from the book. */
function ChapterEnd({ active }: { active: KitPart["id"] }) {
  const reduce = useReducedMotion();
  // The card leans toward the pointer a little, like paper held in a hand.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-1, 1], [-5, 5]), { stiffness: 140, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-1, 1], [4, -4]), { stiffness: 140, damping: 18 });

  return (
    <div
      className="[perspective:1400px]"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set(((e.clientX - r.left) / r.width) * 2 - 1);
        py.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.article className="kit" style={{ rotateX, rotateY }} aria-labelledby="kit-title">
        <p className="kit-tab">
          <GoldLeaf size={18} />
          <span id="kit-title">The end of Chapter 2</span>
        </p>

        <Part id="lesson" active={active} label="Money Tree Lessons">
          <p className="kit-lesson">{END.lesson}</p>
        </Part>

        <Part id="words" active={active} label="New Money Words">
          <ul className="kit-words">
            {END.words.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Part>

        <Part id="tips" active={active} label="Renee’s and Alex’s tips">
          <div className="kit-tips">
            <p>
              <span className="kit-who kit-who-renee">Renee’s Saving Tip</span>
              {END.renee}
            </p>
            <p>
              <span className="kit-who kit-who-alex">Alex’s Wealth Builder Tip</span>
              {END.alex}
            </p>
          </div>
        </Part>

        <Part id="challenge" active={active} label="Money Tree Challenge">
          <p>{END.challenge}</p>
        </Part>

        <Part id="conversation" active={active} label="Family Conversation">
          <p className="kit-question">{END.conversation}</p>
        </Part>

        <Link
          href={flipbookHref(END.page)}
          className="kit-open"
          onPointerEnter={prefetchFlipbook}
          onFocus={prefetchFlipbook}
        >
          Read it in the book <span aria-hidden>→</span>
        </Link>
      </motion.article>
    </div>
  );
}

export function Families() {
  const [active, setActive] = useState<KitPart["id"]>("lesson");

  return (
    <section
      id="families"
      aria-labelledby="families-title"
      className="fam scroll-mt-20 px-5 py-[clamp(5rem,10vw,8rem)] sm:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          <div>
            <p className="fam-kicker">
              <GoldLeaf size={20} />
              For families and teachers
            </p>
            <h2
              id="families-title"
              className="home-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] text-[var(--gold)]"
            >
              Every chapter ends with something to do together
            </h2>
            <p className="home-measure mt-4 text-[clamp(1.05rem,1.4vw,1.2rem)] text-[var(--cream-2)]">
              The story stops, and the book hands the lesson to your family. Here is how Chapter 2 ends.
            </p>

            {/* Wide screens: pick a part and the marker on the card follows. */}
            <ul className="mt-8 hidden space-y-1 lg:block" aria-label="What each chapter ends with">
              {KIT.map((part) => {
                const on = part.id === active;
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onPointerEnter={() => setActive(part.id)}
                      onFocus={() => setActive(part.id)}
                      onClick={() => setActive(part.id)}
                      className={`relative w-full rounded-xl px-4 py-3 text-left ${
                        on ? "bg-[rgba(230,185,85,0.09)]" : "hover:bg-[rgba(255,255,255,0.03)]"
                      }`}
                    >
                      <span
                        className={`block font-display text-[1.12rem] font-semibold ${
                          on ? "text-[var(--gold)]" : "text-[var(--cream)]"
                        }`}
                      >
                        {part.name}
                      </span>
                      <span className="mt-0.5 block text-[var(--cream-2)]">{part.detail}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:order-first">
            <ChapterEnd active={active} />
          </div>
        </div>

        <figure className="mx-auto mt-[clamp(4rem,8vw,6.5rem)] max-w-[880px] text-center">
          <blockquote className="text-[clamp(1.5rem,2.8vw,2.3rem)] italic leading-[1.4] tracking-[-0.005em] text-[var(--cream)] [text-wrap:balance]">
            “You do not need to be a banker, investor, accountant, or financial expert. You only need to be
            willing to begin.”
          </blockquote>
          <figcaption className="mt-5 text-[var(--cream-3)]">From the book’s letter to parents and caregivers</figcaption>
        </figure>
        <p className="home-measure mx-auto mt-6 text-center text-[var(--cream-2)]">
          Shame-free by design: families can use pretend numbers, and no child is ever asked to share real income,
          debt, or hardship.
        </p>

        <p className="fam-teach">
          <span>Teaching with the book?</span>{" "}
          <Link href={flipbookHref(53)} className="home-link" onPointerEnter={prefetchFlipbook} onFocus={prefetchFlipbook}>
            The answer key and educator notes start on page 53
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
