import { useRef } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { flipbookHref } from "@/flipbook/chapters";
import { GoldLeaf } from "./Art";

/** The leaf's questions, as the book prints them on page 7. */
const QUESTIONS = ["To spend?", "To save?", "To grow?", "To give?"];

/**
 * Chapter 1 as a scene on the book's paper. The opening has just shown the
 * whole painting, so this window moves in close on the golden leaf in Renee's
 * hand, and drifts against its frame as you scroll; the leaf's questions arrive one at
 * a time. Every line here is the book's own.
 */
export function ChapterOne() {
  const ref = useRef<HTMLElement>(null);
  const still = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["-3%", "3%"]);

  const arrive = (i: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -12% 0px" },
          transition: { type: "spring" as const, visualDuration: 0.5, bounce: 0, delay: 0.12 * i },
        };

  return (
    <section ref={ref} className="ch" aria-labelledby="ch1-title">
      <div className="ch-inner">
        <figure className="ch-plate">
          <motion.img
            src="/home/chapters/chapter-1-640.webp"
            srcSet="/home/chapters/chapter-1-640.webp 640w, /home/chapters/chapter-1-1100.webp 1100w"
            sizes="(min-width: 900px) 68vw, 160vw"
            width={1100}
            height={1422}
            loading="lazy"
            alt="Close up: the golden leaf glowing in Renee's hand at Discovery Green in Houston."
            style={{ y: imgY }}
          />
        </figure>

        <div className="ch-text">
          <p className="ch-label">
            <GoldLeaf size={22} />
            Chapter 1 <span aria-hidden>·</span> Houston, Texas
          </p>
          <h2 id="ch1-title" className="ch-title">
            The Day the Tree Chose Them
          </h2>
          <p className="ch-story">
            A warm breeze moved through the park. A golden leaf floated between them and landed in Alex’s hand. Words appeared on it:
          </p>
          <motion.p className="ch-sign" {...arrive(0)}>
            What is money for?
          </motion.p>
          <ul className="ch-questions" aria-label="Then the words changed">
            {QUESTIONS.map((q, i) => (
              <motion.li key={q} {...arrive(i + 2)}>
                {q}
              </motion.li>
            ))}
          </ul>
          <p className="ch-lesson">
            <span>The Money Tree lesson</span>
            Money is a tool. People can use it to buy, save, grow, give, and build opportunities.
          </p>
          <div className="ch-actions">
            <Link href="/read/the-day-the-tree-chose-them" className="ch-btn">
              Read Chapter 1
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={flipbookHref(6)} className="ch-link">
              Open it in the book, page 6
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
