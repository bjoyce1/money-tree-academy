// Renee and Alex, the two friends the Money Tree chose, and the reader's
// choice of guide (who reads aloud, and whose voice the questions use).
import { useSyncExternalStore } from 'react';

export interface Character {
  id: string;
  name: string;
  image: string;
  personality: string;
  speciality: string;
  /** A short profile, in the book's terms. */
  bio: string;
  catchphrase: string;
  celebrationMessages: string[];
  encouragementMessages: string[];
}

/**
 * The two friends the Money Tree chose, from "The Money Tree of Life".
 * Catchphrases and messages are drawn from Renee's Saving Tips and Alex's
 * Wealth Builder Tips at the end of each chapter.
 */
export const CHARACTERS: Character[] = [
  {
    id: 'renee',
    name: 'Renee',
    image: '/characters/renee.webp',
    personality: 'Thoughtful & Patient',
    speciality: 'Saving & Smart Choices',
    bio: "Renee is the saver. When Alex calls a want a need, she is the one who says so. She saves first, keeps her drawing-tablet fund separate from everything else, compares prices, and waits for the right moment. Her tips teach you to pause before spending and to plan your money before it wanders.",
    catchphrase: "Before spending, ask: What else could this money do?",
    celebrationMessages: [
      "You saved first. That is a plan, not luck.",
      "Look at that. Every dollar has a job now.",
      "A little saved often is powerful, and you just proved it.",
      "You waited, you thought, you chose. That is how goals get reached."
    ],
    encouragementMessages: [
      "Needs come first. Wants are not bad, but they can wait.",
      "Choose your savings amount before you spend, not after.",
      "Pay later does not mean pay less. Always check the total.",
      "Compare fees and rules before you choose. Patience pays."
    ]
  },
  {
    id: 'alex',
    name: 'Alex',
    image: '/characters/alex.webp',
    personality: 'Curious & Ambitious',
    speciality: 'Earning & Building',
    bio: "Alex is the builder. He wanted the glowing shoes, then learned to earn, save, and wait for them, and bought them without debt. He spots problems worth solving, starts the Market Packs business with Renee, and thinks about what money can help build, not only what it can buy.",
    catchphrase: "Do not think only about what money can buy. Think about what it can help build.",
    celebrationMessages: [
      "You built that. Your time and skill made it happen.",
      "That is a real plan. Know the goal, know the risk.",
      "Value created! That is how a business starts.",
      "You thought past the price tag. That is a builder's move."
    ],
    encouragementMessages: [
      "Start with a real problem you can solve.",
      "Always calculate the total cost, not only the monthly payment.",
      "Spread the seeds and give them time.",
      "Ask what useful thing you can do, not only how to get money."
    ]
  }
];

export type GuideId = 'renee' | 'alex';

const KEY = 'character_companion';
const CHANGED = 'guide-changed';

export function getGuideId(): GuideId {
  try {
    const id = JSON.parse(localStorage.getItem(KEY) || '{}').selectedCharacterId;
    return id === 'alex' ? 'alex' : 'renee';
  } catch {
    return 'renee';
  }
}

export const getGuide = () => CHARACTERS.find((c) => c.id === getGuideId()) ?? CHARACTERS[0];

export function setGuide(id: GuideId) {
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}');
    localStorage.setItem(KEY, JSON.stringify({ ...prev, selectedCharacterId: id, lastInteraction: Date.now() }));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGED, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGED, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useGuideId() {
  return useSyncExternalStore(subscribe, getGuideId, () => 'renee' as GuideId);
}
