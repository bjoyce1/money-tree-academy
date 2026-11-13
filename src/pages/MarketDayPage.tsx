import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { MarketDay } from '@/play/MarketDay';

/** A full-screen game: no site header, so the market has the whole night. */
export default function MarketDayPage() {
  useEffect(() => {
    document.title = 'Market Day · The Money Tree of Life';
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main id="main">
        <MarketDay />
      </main>
    </MotionConfig>
  );
}
