import { ReactNode, useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Search, BarChart3, ChevronUp, Coins } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import chapters from '../data/chapters.json'

type Props = {
  children: ReactNode
  currentSlug?: string
}

const themes = ['day', 'sepia', 'night', 'contrast'] as const
type Theme = typeof themes[number]

export default function ReaderShell({ children, currentSlug }: Props) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'night')
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('fontSize') || 18))
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScroll, setLastScroll] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.body.classList.remove('theme-day', 'theme-sepia', 'theme-night', 'theme-contrast')
    document.body.classList.add(`theme-${theme}`)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('fontSize', String(fontSize))
  }, [fontSize])

  useEffect(() => {
    if (!isMobile) return
    const onScroll = () => {
      const y = window.scrollY
      setHeaderVisible(y < 60 || y < lastScroll)
      setShowBackToTop(y > 400)
      setLastScroll(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobile, lastScroll])

  const currentChapter = chapters.find(ch => ch.slug === currentSlug)
  const currentIndex = currentChapter ? chapters.indexOf(currentChapter) : -1
  const completedChapters = JSON.parse(localStorage.getItem('completed_chapters') || '[]')

  return (
    <div className="min-h-screen pb-safe">
      {/* Mobile header */}
      <header
        className={`
          lg:hidden sticky top-0 z-30 glass-nav
          transition-transform duration-300 ease-out
          ${headerVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="flex items-center justify-between h-12 px-3 safe-area-top">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 rounded-xl active:bg-muted/60 transition-colors touch-manipulation"
            aria-label="Open chapters"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 text-center px-2">
            {currentChapter ? (
              <span className="text-sm font-extrabold truncate block">
                Ch. {currentChapter.order} · {currentChapter.title}
              </span>
            ) : (
              <span className="text-sm font-extrabold">The Money Tree of Life</span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <Link to="/dashboard" className="p-2 rounded-xl active:bg-muted/60 transition-colors touch-manipulation" aria-label="Dashboard">
              <BarChart3 size={20} />
            </Link>
            <Link to="/read/search" className="p-2 rounded-xl active:bg-muted/60 transition-colors touch-manipulation" aria-label="Search">
              <Search size={20} />
            </Link>
          </div>
        </div>

        {/* Compact mobile controls */}
        <div className="flex items-center justify-between px-3 pb-2 gap-2">
          <select
            value={theme}
            onChange={e => setTheme(e.target.value as Theme)}
            className="bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs font-bold appearance-none flex-shrink-0"
          >
            <option value="day">☀️ Day</option>
            <option value="sepia">📜 Sepia</option>
            <option value="night">🌙 Night</option>
            <option value="contrast">⚡ Contrast</option>
          </select>

          {currentChapter && (
            <div className="flex-1 mx-2">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-golden rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / chapters.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(f => Math.max(14, f - 2))}
              className="w-8 h-8 flex items-center justify-center rounded-xl glass-card text-xs font-extrabold active:bg-muted transition-colors touch-manipulation"
              aria-label="Decrease font size"
            >
              A−
            </button>
            <button
              onClick={() => setFontSize(f => Math.min(28, f + 2))}
              className="w-8 h-8 flex items-center justify-center rounded-xl glass-card text-xs font-extrabold active:bg-muted transition-colors touch-manipulation"
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>
        </div>
      </header>

      {/* Mobile chapter drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[300px] p-0 border-r-0 bg-background/95 backdrop-blur-xl">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-white/10">
            <SheetTitle className="text-base font-extrabold">Chapters</SheetTitle>
          </SheetHeader>
          <nav className="overflow-y-auto h-[calc(100%-60px)] overscroll-contain">
            {chapters.map(ch => {
              const isCompleted = completedChapters.includes(ch.id);
              return (
                <Link
                  key={ch.id}
                  to={`/read/${ch.slug}`}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 transition-colors touch-manipulation
                    active:bg-muted/60
                    ${currentSlug === ch.slug
                      ? 'bg-primary/10 border-l-3 border-primary'
                      : 'border-l-3 border-transparent hover:bg-white/5'}
                  `}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0
                    ${currentSlug === ch.slug
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-white/10 text-muted-foreground'}
                  `}>
                    {isCompleted ? '✓' : ch.order}
                  </span>
                  <div className="min-w-0">
                    <span className={`text-sm font-bold block truncate ${
                      currentSlug === ch.slug ? 'text-primary' : ''
                    }`}>
                      {ch.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{ch.estReadMinutes} min</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop header */}
      <header className="hidden lg:block sticky top-0 z-30 glass-nav">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDesktopOpen(!desktopOpen)}
              className="px-3 py-2 rounded-xl glass-card hover:scale-105 transition-all font-bold text-sm"
            >
              {desktopOpen ? 'Hide Chapters' : 'Show Chapters'}
            </button>
            <Link to="/" className="font-extrabold">The Money Tree of Life</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="px-3 py-2 rounded-xl glass-card hover:scale-105 transition-all font-bold text-sm">
              Dashboard
            </Link>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value as Theme)}
              className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-sm font-bold"
            >
              <option value="day">Day</option>
              <option value="sepia">Sepia</option>
              <option value="night">Night</option>
              <option value="contrast">High Contrast</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(f => Math.max(14, f - 2))}
                className="px-2 py-1 rounded-xl glass-card hover:scale-105 transition-all text-sm font-bold"
                aria-label="Decrease font size"
              >A</button>
              <span className="w-10 text-center text-sm font-bold">{fontSize}</span>
              <button
                onClick={() => setFontSize(f => Math.min(28, f + 2))}
                className="px-2 py-1 rounded-xl glass-card hover:scale-105 transition-all text-sm font-bold"
                aria-label="Increase font size"
              >A</button>
            </div>
            <Link to="/read/search" className="text-muted-foreground hover:text-primary transition-colors font-bold text-sm">
              Search
            </Link>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="max-w-6xl mx-auto flex">
          {/* Desktop sidebar */}
          <aside className={`
            hidden lg:block transition-all duration-300
            ${desktopOpen ? 'w-64' : 'w-0'}
            overflow-hidden border-r border-white/5
          `}>
            <nav className="py-4 sticky top-16">
              {chapters.map(ch => {
                const isCompleted = completedChapters.includes(ch.id);
                return (
                  <Link
                    key={ch.id}
                    to={`/read/${ch.slug}`}
                    className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-xl mx-1 hover:bg-white/5 transition-colors text-sm font-bold
                      ${currentSlug === ch.slug ? 'bg-primary/10 border-l-2 border-primary' : ''}
                    `}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isCompleted ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
                    }`}>
                      {isCompleted ? '✓' : ch.order}
                    </span>
                    <span className="truncate">{ch.title}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 px-3 sm:px-4 lg:px-4 py-4 lg:py-6 min-w-0">
            <div
              style={{ fontSize }}
              className="reader-prose w-full max-w-none lg:max-w-3xl mx-auto"
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Back to top FAB */}
      {showBackToTop && isMobile && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 z-30 w-10 h-10 rounded-full bg-gradient-to-r from-primary to-emerald-400 text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
          aria-label="Back to top"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  )
}
