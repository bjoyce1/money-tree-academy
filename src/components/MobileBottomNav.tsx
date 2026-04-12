import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/read', icon: BookOpen, label: 'Read' },
  { path: '/read/search', icon: Search, label: 'Search' },
  { path: '/dashboard', icon: BarChart3, label: 'Progress' },
  { path: '/characters', icon: User, label: 'Guides' },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const isReading = /^\/read\/[^/]+$/.test(pathname) && pathname !== '/read/search' && pathname !== '/read/glossary';

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40',
        'glass-nav safe-area-bottom transition-transform duration-300',
        isReading && 'translate-y-full'
      )}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              role="tab"
              aria-selected={active}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-0.5',
                'text-[10px] font-bold transition-colors touch-manipulation',
                'active:scale-95 active:opacity-70',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
