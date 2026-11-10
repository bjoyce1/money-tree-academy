import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { SEQ, SPRITE, SPRITE_URL, TOTAL_PAGES, chapterForSeq, pageImage, type Chapter, type Tier } from "./book";
import Endpaper from "./Endpaper";

export type Panel = null | "contents" | "grid" | "zoom";

interface ChromeProps {
  children: ReactNode;
  rootRef: RefObject<HTMLDivElement | null>;
  spread: number;
  side: "left" | "right";
  single: boolean;
  pageLabel: string;
  chapter: Chapter;
  chapters: Chapter[];
  anchorSeq: number;
  visibleSeqs: number[];
  panel: Panel;
  setPanel: (p: Panel) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (seq: number) => void;
  canPrev: boolean;
  canNext: boolean;
  tier: Tier;
}

const pageNo = (seq: number) => seq + 1;

/** A page thumbnail cut from the sprite sheet (endpapers drawn in CSS). */
export function Thumb({ seq, w }: { seq: number; w: number }) {
  const face = SEQ[seq];
  const h = Math.round(w * 1.5);
  if (face.kind === "endpaper") {
    return (
      <div className="fb-thumb fb-thumb-endpaper" style={{ width: w, height: h }} aria-hidden>
        <span>✦</span>
      </div>
    );
  }
  const i = face.n - 1;
  const col = i % SPRITE.cols;
  const row = Math.floor(i / SPRITE.cols);
  return (
    <div
      className="fb-thumb"
      aria-hidden
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${SPRITE_URL})`,
        backgroundSize: `${SPRITE.cols * w}px ${SPRITE.rows * h}px`,
        backgroundPosition: `${-col * w}px ${-row * h}px`,
      }}
    />
  );
}

function IconButton({
  label,
  onClick,
  children,
  active,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      className={`fb-icon${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={{ type: "spring", visualDuration: 0.2, bounce: 0.3 }}
    >
      {children}
    </motion.button>
  );
}

/* ---------------------------------------------------------------- scrubber */

function Scrubber({ anchorSeq, onGoTo }: { anchorSeq: number; onGoTo: (seq: number) => void }) {
  const [scrub, setScrub] = useState<number | null>(null);
  const value = scrub ?? anchorSeq;
  const pct = (value / (TOTAL_PAGES - 1)) * 100;
  const commitScrub = () => {
    if (scrub !== null && scrub !== anchorSeq) onGoTo(scrub);
    setScrub(null);
  };

  return (
    <div className="fb-scrub">
      <AnimatePresence>
        {scrub !== null && (
          <motion.div
            className="fb-scrub-preview"
            style={{ left: `clamp(70px, ${pct}%, calc(100% - 70px))` }}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", visualDuration: 0.22, bounce: 0.2 }}
          >
            <Thumb seq={value} w={72} />
            <div className="fb-scrub-meta">
              <span className="fb-scrub-ch">{chapterForSeq(value).label}</span>
              <span>Page {pageNo(value)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <input
        type="range"
        min={0}
        max={TOTAL_PAGES - 1}
        step={1}
        value={value}
        aria-label="Go to page"
        aria-valuetext={`Page ${pageNo(value)}, ${chapterForSeq(value).title}`}
        style={{ ["--pct" as string]: `${pct}%` }}
        onChange={(e) => setScrub(Number(e.target.value))}
        onPointerUp={commitScrub}
        onKeyUp={commitScrub}
        onBlur={commitScrub}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- zoom */

function ZoomViewer({ seqs, onClose }: { seqs: number[]; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pages = seqs.filter((s) => s >= 0 && s < TOTAL_PAGES);

  const setZoom = (s: number) => {
    const next = Math.min(4, Math.max(1, s));
    setScale(next);
    if (next === 1) {
      animate(x, 0, { type: "spring", visualDuration: 0.35, bounce: 0 });
      animate(y, 0, { type: "spring", visualDuration: 0.35, bounce: 0 });
    }
  };

  return (
    <motion.div
      className="fb-zoom"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed page view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onWheel={(e) => setZoom(scale * (1 - e.deltaY * 0.0015))}
    >
      <div className="fb-zoom-bar">
        <span className="fb-zoom-hint">Scroll or double-click to zoom · drag to move</span>
        <IconButton label="Zoom out" onClick={() => setZoom(scale - 0.5)} disabled={scale <= 1}>
          <ZoomOut size={18} />
        </IconButton>
        <span className="fb-zoom-pct">{Math.round(scale * 100)}%</span>
        <IconButton label="Zoom in" onClick={() => setZoom(scale + 0.5)} disabled={scale >= 4}>
          <ZoomIn size={18} />
        </IconButton>
        <IconButton label="Close zoom" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      <div className="fb-zoom-canvas">
        <motion.div
          className="fb-zoom-pages"
          drag
          dragMomentum
          dragElastic={0.12}
          onDragEnd={() => scale === 1 && setZoom(1)}
          onDoubleClick={() => setZoom(scale > 1 ? 1 : 2.2)}
          style={{ x, y }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale }}
          transition={{ type: "spring", visualDuration: 0.35, bounce: 0.1 }}
        >
          {pages.map((s) => {
            const f = SEQ[s];
            return f.kind === "pdf" ? (
              <img
                key={s}
                src={pageImage(f.n, "hd")}
                alt={`Page ${pageNo(s)}`}
                className="fb-zoom-img"
                draggable={false}
              />
            ) : (
              <div key={s} className="fb-zoom-img fb-zoom-endpaper">
                <Endpaper variant={f.variant} />
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- chrome */

export function Chrome(props: ChromeProps) {
  const {
    children,
    rootRef,
    single,
    pageLabel,
    chapter,
    chapters,
    anchorSeq,
    visibleSeqs,
    panel,
    setPanel,
    soundOn,
    setSoundOn,
    onNext,
    onPrev,
    onGoTo,
    canPrev,
    canNext,
  } = props;
  const [fullscreen, setFullscreen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (panel === "contents" || panel === "grid") closeRef.current?.focus();
  }, [panel]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  };

  const jump = (seq: number) => {
    setPanel(null);
    // Let the panel start closing before the pages riffle.
    window.setTimeout(() => onGoTo(seq), 120);
  };

  return (
    <>
      <header className="fb-bar">
        <Link href="/" className="fb-back" aria-label="Back to home">
          <ArrowLeft size={18} />
          <span className="fb-back-text">Home</span>
        </Link>
        <div className="fb-title">
          <span className="fb-title-book">The Money Tree of Life</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={chapter.title}
              className="fb-title-ch"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {chapter.label === chapter.title ? chapter.title : `${chapter.label} · ${chapter.title}`}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="fb-tools">
          <IconButton label="Contents (C)" onClick={() => setPanel(panel === "contents" ? null : "contents")} active={panel === "contents"}>
            <List size={18} />
          </IconButton>
          <IconButton label="All pages" onClick={() => setPanel(panel === "grid" ? null : "grid")} active={panel === "grid"}>
            <LayoutGrid size={18} />
          </IconButton>
          <IconButton label="Zoom (Z)" onClick={() => setPanel("zoom")}>
            <ZoomIn size={18} />
          </IconButton>
          <IconButton label={soundOn ? "Mute page sounds" : "Turn on page sounds"} onClick={() => setSoundOn(!soundOn)} active={soundOn}>
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </IconButton>
          <IconButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </div>
      </header>

      <div className="fb-middle">
        {!single && (
          <motion.button
            type="button"
            className="fb-arrow fb-arrow-l"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="Previous page"
            whileHover={canPrev ? { scale: 1.08, x: -3 } : undefined}
            whileTap={canPrev ? { scale: 0.92 } : undefined}
          >
            <ChevronLeft size={26} />
          </motion.button>
        )}
        {children}
        {!single && (
          <motion.button
            type="button"
            className="fb-arrow fb-arrow-r"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Next page"
            whileHover={canNext ? { scale: 1.08, x: 3 } : undefined}
            whileTap={canNext ? { scale: 0.92 } : undefined}
          >
            <ChevronRight size={26} />
          </motion.button>
        )}
      </div>

      <footer className="fb-foot">
        {single && (
          <IconButton label="Previous page" onClick={onPrev} disabled={!canPrev}>
            <ChevronLeft size={20} />
          </IconButton>
        )}
        <span className="fb-page-label" aria-hidden>
          {pageLabel}
          <span className="fb-page-total"> / {TOTAL_PAGES}</span>
        </span>
        <Scrubber anchorSeq={anchorSeq} onGoTo={onGoTo} />
        {single && (
          <IconButton label="Next page" onClick={onNext} disabled={!canNext}>
            <ChevronRight size={20} />
          </IconButton>
        )}
      </footer>

      <AnimatePresence>
        {panel === "contents" && (
          <motion.div key="contents-scrim" className="fb-scrim" onClick={() => setPanel(null)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
        )}
        {panel === "contents" && (
          <motion.aside
            key="contents"
            className="fb-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Contents"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", visualDuration: 0.4, bounce: 0.05 }}
          >
            <div className="fb-drawer-head">
              <h2>Contents</h2>
              <button ref={closeRef} type="button" className="fb-icon" onClick={() => setPanel(null)} aria-label="Close contents">
                <X size={18} />
              </button>
            </div>
            <ol className="fb-toc">
              {chapters.map((c, i) => {
                const current = c.seq === chapter.seq;
                return (
                  <motion.li
                    key={c.seq}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.022, duration: 0.25 }}
                  >
                    <button
                      type="button"
                      className={`fb-toc-item${current ? " is-current" : ""}`}
                      onClick={() => jump(c.seq)}
                      aria-current={current ? "true" : undefined}
                    >
                      <Thumb seq={c.seq} w={34} />
                      <span className="fb-toc-text">
                        <span className="fb-toc-label">{c.label}</span>
                        <span className="fb-toc-title">{c.title}</span>
                      </span>
                      <span className="fb-toc-page">{pageNo(c.seq)}</span>
                    </button>
                  </motion.li>
                );
              })}
            </ol>
          </motion.aside>
        )}

        {panel === "grid" && (
          <motion.div
            key="grid"
            className="fb-grid-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="All pages"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", visualDuration: 0.35, bounce: 0.05 }}
          >
            <div className="fb-drawer-head">
              <h2>All pages</h2>
              <button ref={closeRef} type="button" className="fb-icon" onClick={() => setPanel(null)} aria-label="Close all pages">
                <X size={18} />
              </button>
            </div>
            <div className="fb-grid">
              {SEQ.map((_, s) => {
                const visible = visibleSeqs.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    className={`fb-grid-item${visible ? " is-current" : ""}${s % 2 === 1 ? " is-verso" : ""}`}
                    onClick={() => jump(s)}
                    aria-label={`Page ${pageNo(s)}${visible ? " (open)" : ""}`}
                  >
                    <Thumb seq={s} w={96} />
                    <span>{s === 0 ? "Cover" : s === TOTAL_PAGES - 1 ? "Back" : pageNo(s)}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {panel === "zoom" && <ZoomViewer key="zoom" seqs={visibleSeqs} onClose={() => setPanel(null)} />}
      </AnimatePresence>
    </>
  );
}
