import { memo, type CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { LEAVES, faceBackground, isRigid, leafBack, leafFront, type Face, type Tier } from "./book";
import {
  backGloss,
  backShade,
  edgeProjection,
  frontGloss,
  frontShade,
  liftShadow,
  stripRelative,
  vertexAngle,
  type Dir,
} from "./geometry";
import type { BookSize } from "./useBookSize";
import Endpaper from "./Endpaper";

export interface Bend {
  dir: Dir;
  /** Vertical strips used to curve the paper. 1 = rigid board. */
  strips: number;
}

interface LeafProps {
  index: number;
  p: MotionValue<number>;
  bend: Bend | null;
  size: BookSize;
  /** Image quality to load, or null to show only the sprite placeholder. */
  tier: Tier | null;
}

/** Spine-side shadow ("gutter"), stops given as % of the full page width. */
function gutter(side: "front" | "back", slices: number): string {
  const s = (pct: number) => `${Math.min(100, pct * slices)}%`;
  const dir = side === "front" ? "to right" : "to left";
  return `linear-gradient(${dir}, rgba(20,14,4,.34) 0, rgba(20,14,4,.12) ${s(2.2)}, rgba(20,14,4,.04) ${s(5.5)}, rgba(20,14,4,0) ${s(9)})`;
}

function FaceFill({
  face,
  w,
  h,
  tier,
  slices = 1,
  slice = 0,
  m,
}: {
  face: Face;
  w: number;
  h: number;
  tier: Tier | null;
  slices?: number;
  slice?: number;
  m: number;
}) {
  if (face.kind === "endpaper") {
    return (
      <div className="fb-board" style={{ padding: Math.round(m * 0.75) }}>
        <Endpaper variant={face.variant} width={w} />
      </div>
    );
  }
  return <div className="fb-fill" style={faceBackground(face.n, w, h, { tier, slices, slice })} />;
}

/* ------------------------------------------------------------ flat leaf */

function FlatLeaf({ index, p, size, tier }: Omit<LeafProps, "bend">) {
  const rigid = isRigid(index);
  const w = rigid ? size.boardW : size.innerW;
  const h = rigid ? size.boardH : size.innerH;
  const rotateY = useTransform(p, [0, 1], [0, -180]);
  const front = leafFront(index);
  const back = leafBack(index);
  const isFrontCover = index === 0;

  return (
    <motion.div className="fb-sheet" style={{ ...sheetBox(index, size), rotateY }}>
      <div className="fb-face">
        <FaceFill face={front} w={w} h={h} tier={tier} m={size.m} />
        {isFrontCover ? (
          <>
            <div className="fb-hinge" />
            <div className="fb-cover-sheen" />
          </>
        ) : (
          <div className="fb-overlay" style={{ background: gutter("front", 1) }} />
        )}
        {!rigid && <div className="fb-fore-edge fb-fore-edge-r" />}
      </div>
      <div className="fb-face fb-face-back">
        <FaceFill face={back} w={w} h={h} tier={tier} m={size.m} />
        {index === LEAVES - 1 ? (
          <div className="fb-hinge fb-hinge-back" />
        ) : (
          <div className="fb-overlay" style={{ background: gutter("back", 1) }} />
        )}
        {!rigid && <div className="fb-fore-edge fb-fore-edge-l" />}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ bent leaf */

interface StripProps {
  k: number;
  index: number;
  p: MotionValue<number>;
  bend: Bend;
  size: BookSize;
  tier: Tier | null;
}

/**
 * One vertical slice of a turning page. Strips nest, each rotating relative
 * to its parent, so small per-strip angles add up to a smooth curl.
 */
function Strip({ k, index, p, bend, size, tier }: StripProps) {
  const rigid = isRigid(index);
  const n = bend.strips;
  const w = rigid ? size.boardW : size.innerW;
  const h = rigid ? size.boardH : size.innerH;
  const sw = w / n;
  const { dir } = bend;

  const rotateY = useTransform(() => stripRelative(p.get(), dir, rigid, k, n));
  // Angles at this strip's spine-side (a) and fore-edge-side (b) boundaries.
  const a = useTransform(() => vertexAngle(p.get(), dir, rigid, k, n));
  const b = useTransform(() => vertexAngle(p.get(), dir, rigid, k + 1, n));
  const fShadeA = useTransform(() => frontShade(a.get()));
  const fShadeB = useTransform(() => frontShade(b.get()));
  const fGlossA = useTransform(() => frontGloss(a.get()));
  const fGlossB = useTransform(() => frontGloss(b.get()));
  const bShadeA = useTransform(() => backShade(a.get()));
  const bShadeB = useTransform(() => backShade(b.get()));
  const bGlossA = useTransform(() => backGloss(a.get()));
  const bGlossB = useTransform(() => backGloss(b.get()));

  const front = leafFront(index);
  const back = leafBack(index);
  // Seams between strips can show a hairline; a sub-pixel overlap hides them.
  const faceStyle: CSSProperties = { width: sw + 0.75 };

  return (
    <motion.div
      className="fb-strip"
      style={{ width: sw, height: h, left: k === 0 ? 0 : sw, rotateY }}
    >
      <div className="fb-face" style={faceStyle}>
        <FaceFill face={front} w={w} h={h} tier={tier} slices={n} slice={k} m={size.m} />
        {k === 0 && index !== 0 && <div className="fb-overlay" style={{ background: gutter("front", n) }} />}
        {k === 0 && index === 0 && <div className="fb-hinge" style={{ left: `${3.2 * n}%` }} />}
        {/* front face: local left = spine side (a), local right = fore-edge side (b) */}
        <motion.div className="fb-overlay fb-shade-l" style={{ opacity: fShadeA }} />
        <motion.div className="fb-overlay fb-shade-r" style={{ opacity: fShadeB }} />
        <motion.div className="fb-overlay fb-gloss-l" style={{ opacity: fGlossA }} />
        <motion.div className="fb-overlay fb-gloss-r" style={{ opacity: fGlossB }} />
      </div>
      <div className="fb-face fb-face-back" style={faceStyle}>
        <FaceFill face={back} w={w} h={h} tier={tier} slices={n} slice={n - 1 - k} m={size.m} />
        {k === 0 && index !== LEAVES - 1 && (
          <div className="fb-overlay" style={{ background: gutter("back", n) }} />
        )}
        {/* back face is mirrored: local left = fore-edge side (b), local right = spine side (a) */}
        <motion.div className="fb-overlay fb-shade-l" style={{ opacity: bShadeB }} />
        <motion.div className="fb-overlay fb-shade-r" style={{ opacity: bShadeA }} />
        <motion.div className="fb-overlay fb-gloss-l" style={{ opacity: bGlossB }} />
        <motion.div className="fb-overlay fb-gloss-r" style={{ opacity: bGlossA }} />
      </div>
      {k < n - 1 && <Strip k={k + 1} index={index} p={p} bend={bend} size={size} tier={tier} />}
    </motion.div>
  );
}

/** Soft penumbra the lifted page throws onto the page beneath it. */
function CastShadow({ index, p, bend, size }: { index: number; p: MotionValue<number>; bend: Bend; size: BookSize }) {
  const rigid = isRigid(index);
  const w = rigid ? size.boardW : size.innerW;
  const { innerW, innerH, boardW, m } = size;
  const reach = innerW * 0.5;

  const proj = useTransform(() => edgeProjection(p.get(), bend.dir, rigid) * w);
  const strength = useTransform(() => liftShadow(p.get()) * (rigid ? 0.75 : 0.6));
  const spread = useTransform(() => 0.25 + 0.75 * liftShadow(p.get()));

  const rightOpacity = useTransform(() => (proj.get() > 0 ? strength.get() : 0));
  const leftOpacity = useTransform(() => (proj.get() < 0 ? strength.get() : 0));

  return (
    <>
      <div className="fb-shadow-clip" style={{ left: boardW, top: m, width: innerW, height: innerH }}>
        <motion.div
          className="fb-cast fb-cast-r"
          style={{ width: reach, x: proj, scaleX: spread, opacity: rightOpacity }}
        />
      </div>
      <div className="fb-shadow-clip" style={{ left: boardW - innerW, top: m, width: innerW, height: innerH }}>
        <motion.div
          className="fb-cast fb-cast-l"
          style={{ width: reach, left: innerW - reach, x: proj, scaleX: spread, opacity: leftOpacity }}
        />
      </div>
    </>
  );
}

/** Position of a leaf inside the book (spine at x = boardW). */
function sheetBox(index: number, size: BookSize): CSSProperties {
  const rigid = isRigid(index);
  return {
    left: size.boardW,
    top: rigid ? 0 : size.m,
    width: rigid ? size.boardW : size.innerW,
    height: rigid ? size.boardH : size.innerH,
  };
}

function LeafImpl({ index, p, bend, size, tier }: LeafProps) {
  // Leaves never depth-sort against each other: z-index decides. Resting
  // leaves stack by side; anything mid-turn sits above both stacks.
  const zIndex = useTransform(() => {
    const v = p.get();
    const base = v > 0.5 ? 100 + index : 100 + (LEAVES - index);
    return v > 0.0005 && v < 0.9995 ? base + 200 : base;
  });

  return (
    <motion.div
      className="fb-leaf"
      style={{
        zIndex,
        perspective: Math.round(size.boardH * 4.2),
        perspectiveOrigin: `${size.boardW}px ${size.boardH * 0.45}px`,
      }}
      aria-hidden
    >
      {bend ? (
        <>
          <CastShadow index={index} p={p} bend={bend} size={size} />
          <div className="fb-sheet" style={sheetBox(index, size)}>
            <Strip k={0} index={index} p={p} bend={bend} size={size} tier={tier} />
          </div>
        </>
      ) : (
        <FlatLeaf index={index} p={p} size={size} tier={tier} />
      )}
    </motion.div>
  );
}

export const Leaf = memo(LeafImpl);
