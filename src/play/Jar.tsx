import { useId } from 'react';

/**
 * A glass jar with a paper label, as chapter 5 draws them: SPEND, SAVE, GROW.
 * `coins` is how many coins lie in it (it holds 32); `markAt` draws a goal
 * line at the height that many coins reach.
 */
const ROW = 9.6;
const PER_ROW = 4;
const HOLDS = 32;

export function Jar({ label, coins: count, markAt, className }: { label: string; coins: number; markAt?: number; className?: string }) {
  const id = useId();
  const coins = Math.max(0, Math.min(HOLDS, Math.round(count)));
  const markY = markAt ? 110 - Math.min(HOLDS, markAt) / PER_ROW * ROW - 3 : 0;
  const pile = [];
  for (let i = 0; i < coins; i++) {
    const row = Math.floor(i / PER_ROW);
    const col = i % PER_ROW;
    // Each row sits a little off the one below, like coins that were dropped in.
    const x = 26 + col * 16 + (row % 2 ? 5 : -1) + ((i * 7) % 5) - 2;
    const y = 106.5 - row * ROW - ((i * 3) % 3);
    pile.push(
      <g key={i}>
        <ellipse cx={x} cy={y + 1.9} rx={8.6} ry={3.5} fill="#8a6220" />
        <ellipse cx={x} cy={y} rx={8.6} ry={3.5} fill="#e6b955" stroke="#f6d98a" strokeWidth={0.6} />
      </g>,
    );
  }
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden focusable="false">
      <defs>
        <clipPath id={`${id}-glass`}>
          <path d="M22 30 Q14 32 14 44 V100 Q14 112 26 112 H74 Q86 112 86 100 V44 Q86 32 78 30 Z" />
        </clipPath>
        <linearGradient id={`${id}-shine`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="rgba(246,239,223,0.16)" />
          <stop offset="0.22" stopColor="rgba(246,239,223,0.03)" />
          <stop offset="0.8" stopColor="rgba(246,239,223,0.02)" />
          <stop offset="1" stopColor="rgba(246,239,223,0.1)" />
        </linearGradient>
      </defs>

      {/* glass */}
      <path d="M22 30 Q14 32 14 44 V100 Q14 112 26 112 H74 Q86 112 86 100 V44 Q86 32 78 30 Z" fill={`url(#${id}-shine)`} />
      <g clipPath={`url(#${id}-glass)`}>{pile}</g>
      {markAt ? <path d={`M14 ${markY} H86`} stroke="#e6b955" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.9} /> : null}
      <path
        d="M22 30 Q14 32 14 44 V100 Q14 112 26 112 H74 Q86 112 86 100 V44 Q86 32 78 30 Z"
        fill="none"
        stroke="rgba(246,239,223,0.5)"
        strokeWidth={1.4}
      />
      <path d="M21 46 Q19.5 70 21.5 98" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={2} strokeLinecap="round" />
      {/* neck and rim */}
      <path d="M24 30 V22 H76 V30" fill="rgba(246,239,223,0.04)" stroke="rgba(246,239,223,0.5)" strokeWidth={1.4} strokeLinejoin="round" />
      <rect x={20} y={15} width={60} height={8} rx={3} fill="rgba(246,239,223,0.1)" stroke="rgba(246,239,223,0.6)" strokeWidth={1.4} />

      {/* paper label */}
      <rect x={24} y={58} width={52} height={24} rx={2} fill="#f3e6c4" />
      <rect x={26.5} y={60.5} width={47} height={19} rx={1} fill="none" stroke="#7f5310" strokeWidth={0.6} opacity={0.55} />
      <text
        x={50}
        y={74.8}
        textAnchor="middle"
        fontFamily="Cinzel, 'Times New Roman', serif"
        fontWeight={700}
        fontSize={12.5}
        letterSpacing={0.6}
        fill="#2a1d0a"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
}
