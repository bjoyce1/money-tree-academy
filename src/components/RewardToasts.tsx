import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import type { AchievementDef } from '@/lib/rewards';

/** Announces newly unlocked achievements, wherever they were earned. */
export function RewardToasts() {
  useEffect(() => {
    const onUnlock = (e: Event) => {
      const a = (e as CustomEvent<AchievementDef>).detail;
      toast({ title: `Achievement: ${a.name}`, description: a.description, duration: 5000 });
    };
    window.addEventListener('achievement-unlocked', onUnlock);
    return () => window.removeEventListener('achievement-unlocked', onUnlock);
  }, []);
  return null;
}
