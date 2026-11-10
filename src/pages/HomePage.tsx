import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { HomeNav } from "@/home/Nav";
import { Hero } from "@/home/Hero";
import { Premise } from "@/home/Premise";
import { ChapterIndex } from "@/home/ChapterIndex";
import { Families } from "@/home/Families";
import { Closing, HomeFooter } from "@/home/Closing";
import "@/home/home.css";

export default function HomePage() {
  useEffect(() => {
    document.title = "The Money Tree of Life · Growing Financial Literacy for Kids";
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="home">
        <a
          href="#chapters"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--gold)] focus:px-4 focus:py-2 focus:font-bold focus:text-[var(--night)]"
        >
          Skip to the chapters
        </a>
        <HomeNav />
        <main>
          <Hero />
          <Premise />
          <ChapterIndex />
          <Families />
          <Closing />
        </main>
        <HomeFooter />
      </div>
    </MotionConfig>
  );
}
