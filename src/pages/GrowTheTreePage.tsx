import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { GrowTheTree } from '@/play/GrowTheTree';

/** A full-screen game: no site header, so the tree has the whole sky. */
export default function GrowTheTreePage() {
  useEffect(() => {
    document.title = 'Grow the Tree · The Money Tree of Life';
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main id="main">
        <GrowTheTree />
      </main>
    </MotionConfig>
  );
}
