/**
 * Decorative endpapers glued inside each hardcover board. Pure CSS/SVG so
 * they stay crisp at any size. Sized in `em` off the container font-size.
 */
import { useId } from "react";

const LEAF_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23d4a843' stroke-opacity='.32' stroke-width='1'%3E%3Cpath d='M14 6c-5 4-7 9-5 14 4-1 7-5 7-10 0-1.5-.6-3-2-4z'/%3E%3Cpath d='M9 20 15 9'/%3E%3Cpath d='M42 34c-5 4-7 9-5 14 4-1 7-5 7-10 0-1.5-.6-3-2-4z'/%3E%3Cpath d='M37 48l6-11'/%3E%3C/g%3E%3Cg fill='%23d4a843' fill-opacity='.22'%3E%3Ccircle cx='42' cy='12' r='1.4'/%3E%3Ccircle cx='14' cy='40' r='1.4'/%3E%3C/g%3E%3C/svg%3E\")";

function TreeEmblem() {
  const gid = `fb-gold-${useId().replace(/:/g, "")}`;
  const g = `url(#${gid})`;
  return (
    <svg viewBox="0 0 120 120" className="fb-emblem" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1b8" />
          <stop offset=".45" stopColor="#e2b44d" />
          <stop offset="1" stopColor="#9c6f1c" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke={g} strokeWidth="2.5" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={g} strokeWidth=".8" strokeDasharray="2 3" />
      {/* roots */}
      <path
        d="M60 92c-6 4-14 6-22 6M60 92c6 4 14 6 22 6M60 92c-2 5-6 9-11 11M60 92c2 5 6 9 11 11"
        stroke={g}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* trunk */}
      <path d="M56 93c1-10 0-20-6-28M64 93c-1-10 0-20 6-28M60 93V58" stroke={g} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* canopy */}
      <g fill={g}>
        {[
          [60, 30, 9], [44, 36, 8], [76, 36, 8], [34, 50, 7], [86, 50, 7], [50, 48, 8],
          [70, 48, 8], [60, 44, 7], [42, 62, 6], [78, 62, 6],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} opacity={0.55 + (i % 3) * 0.15} />
        ))}
      </g>
      <g fill="#0f1a3f" fontFamily="Cinzel, Times New Roman, serif" fontSize="7" fontWeight="700" textAnchor="middle">
        <text x="60" y="47">$</text>
        <text x="44" y="39">$</text>
        <text x="76" y="39">$</text>
      </g>
    </svg>
  );
}

/** `width` sizes the type in px; omit it to scale with the container (cqw). */
export default function Endpaper({ variant, width }: { variant: "front" | "back"; width?: number }) {
  return (
    <div className="fb-endpaper" style={width ? { fontSize: width / 24 } : undefined}>
      <div className="fb-endpaper-pattern" style={{ backgroundImage: LEAF_PATTERN }} />
      <div className="fb-endpaper-frame" />
      <div className="fb-endpaper-plate">
        <TreeEmblem />
        {variant === "front" ? (
          <>
            <p className="fb-ep-kicker">Ex Libris</p>
            <p className="fb-ep-title">This book belongs to</p>
            <div className="fb-ep-line" />
            <p className="fb-ep-small">Plant knowledge today. Harvest freedom tomorrow.</p>
          </>
        ) : (
          <>
            <p className="fb-ep-kicker">The Money Tree of Life</p>
            <p className="fb-ep-title fb-ep-quote">
              Money does not grow on trees.
              <br />
              Knowledge does.
            </p>
            <p className="fb-ep-small">And knowledge grows into wealth.</p>
          </>
        )}
      </div>
    </div>
  );
}
