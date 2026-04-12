import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Search, Home, BarChart3 } from 'lucide-react'
import chapters from '../data/chapters.json'

type Props = {
  children: ReactNode
  currentSlug?: string
}

const themes = ['day', 'sepia', 'night', 'contrast'] as const
type Theme = typeof themes[number]

export default function ReaderShell({ children, currentSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'night')
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('fontSize') || 18))

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.body.classList.remove('theme-day', 'theme-sepia', 'theme-night', 'theme-contrast')
    document.body.classList.add(`theme-${theme}`)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('fontSize', String(fontSize))
  }, [fontSize])

  return (
    <div className="min-h-screen">
      {/* Mobile-first header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-black/40 border-b border-slate-800">
        <div className="px-3 sm:px-4 py-3">
          {/* Mobile layout */}
          <div className="lg:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setOpen(!open)} 
                className="p-2 rounded-md border border-slate-600 hover:bg-slate-700 transition-colors touch-manipulation"
                aria-label="Toggle chapters menu"
                data-testid="button-toggle-chapters-mobile"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link to="/" className="font-semibold text-sm sm:text-base truncate">
                The Money Tree of Life
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Link 
                href="/dashboard" 
                className="p-2 rounded-md border border-slate-600 hover:bg-slate-700 transition-colors touch-manipulation"
                aria-label="Dashboard"
                data-testid="link-dashboard-mobile"
              >
                <BarChart3 size={18} />
              </Link>
              <Link 
                href="/read/search" 
                className="p-2 rounded-md border border-slate-600 hover:bg-slate-700 transition-colors touch-manipulation"
                aria-label="Search"
                data-testid="link-search-mobile"
              >
                <Search size={18} />
              </Link>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:flex max-w-6xl mx-auto items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setOpen(!open)} 
                className="px-3 py-2 rounded border border-slate-600 hover:bg-slate-700 transition-colors"
                data-testid="button-toggle-chapters-desktop"
              >
                {open ? 'Hide Chapters' : 'Show Chapters'}
              </button>
              <Link to="/" className="font-semibold">The Money Tree of Life</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard" 
                className="px-3 py-2 rounded border border-slate-600 hover:bg-slate-700 transition-colors"
                data-testid="link-dashboard-desktop"
              >
                Dashboard
              </Link>
              <select 
                value={theme} 
                onChange={e => setTheme(e.target.value as Theme)} 
                className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm"
                data-testid="select-theme"
              >
                <option value="day">Day</option>
                <option value="sepia">Sepia</option>
                <option value="night">Night</option>
                <option value="contrast">High Contrast</option>
              </select>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFontSize(f => Math.max(14, f - 2))} 
                  className="px-2 py-1 border border-slate-600 rounded hover:bg-slate-700 transition-colors text-sm"
                  data-testid="button-decrease-font-size"
                  aria-label="Decrease font size"
                >
                  A
                </button>
                <span className="w-10 text-center text-sm">{fontSize}</span>
                <button 
                  onClick={() => setFontSize(f => Math.min(28, f + 2))} 
                  className="px-2 py-1 border border-slate-600 rounded hover:bg-slate-700 transition-colors text-sm"
                  data-testid="button-increase-font-size"
                  aria-label="Increase font size"
                >
                  A
                </button>
              </div>
              <Link 
                href="/read/search" 
                className="underline hover:text-slate-300 transition-colors"
                data-testid="link-search-desktop"
              >
                Search
              </Link>
            </div>
          </div>

          {/* Mobile controls row */}
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
            <select 
              value={theme} 
              onChange={e => setTheme(e.target.value as Theme)} 
              className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm flex-1 max-w-[120px]"
              data-testid="select-theme-mobile"
            >
              <option value="day">Day</option>
              <option value="sepia">Sepia</option>
              <option value="night">Night</option>
              <option value="contrast">Contrast</option>
            </select>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFontSize(f => Math.max(14, f - 2))} 
                className="p-2 border border-slate-600 rounded hover:bg-slate-700 transition-colors text-xs touch-manipulation"
                data-testid="button-decrease-font-size-mobile"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <span className="w-8 text-center text-sm">{fontSize}</span>
              <button 
                onClick={() => setFontSize(f => Math.min(28, f + 2))} 
                className="p-2 border border-slate-600 rounded hover:bg-slate-700 transition-colors text-xs touch-manipulation"
                data-testid="button-increase-font-size-mobile"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative">
        {/* Mobile overlay */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        )}

        <div className="max-w-6xl mx-auto flex">
          {/* Sidebar */}
          <aside className={`
            lg:relative lg:transition-all
            ${open ? 'lg:w-64' : 'lg:w-0'} 
            lg:overflow-hidden lg:border-r lg:border-slate-800 lg:pr-2
            ${open ? 'fixed' : 'hidden'}
            lg:block
            left-0 top-0 bottom-0 z-20 w-80 max-w-[80vw]
            bg-slate-900 border-r border-slate-600 
            lg:bg-transparent lg:border-slate-800
          `}>
            <nav className="py-4 px-4 lg:px-0 h-full overflow-y-auto">
              <div className="lg:hidden mb-4 pb-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-100">Chapters</h2>
                  <button 
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    aria-label="Close chapters menu"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              {chapters.map(ch => (
                <Link
                  key={ch.id}
                  href={`/read/${ch.slug}`}
                  className={`
                    block px-3 py-3 lg:px-2 lg:py-2 rounded hover:bg-slate-800 transition-colors
                    ${currentSlug === ch.slug ? 'bg-slate-800 border-l-2 border-purple-500' : ''}
                    text-sm lg:text-base touch-manipulation
                  `}
                  onClick={() => setOpen(false)} // Close mobile menu on navigation
                  data-testid={`chapter-link-${ch.slug}`}
                >
                  <span className="font-medium">{ch.order}.</span> {ch.title}
                </Link>
              ))}
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
    </div>
  )
}