import { Link } from "wouter";
import { BookOpen, GraduationCap, Lightbulb, StickyNote, Search, Sun, Moon, Eye, Contrast } from "lucide-react";
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import book from "../data/book.json";
import bookCoverImage from "@assets/book-cover.png";
import moneyTreeLogo from "@assets/logo.png";
import Footer from "../components/Footer";
import ReadingStreaks from '../components/ReadingStreaks';
import AchievementSystem from '../components/AchievementSystem';
import ProgressTree from '../components/ProgressTree';
import ChapterSummaryCards from '../components/ChapterSummaryCards';
import ReadingSpeedTracker from '../components/ReadingSpeedTracker';
import RealWorldActivities from '../components/RealWorldActivities';
import MiniGames from '../components/MiniGames';
import CoinsSystem from '../components/CoinsSystem';
import RewardsShop from '../components/RewardsShop';
import CharacterCompanion from '../components/CharacterCompanion';

const themes = ['day', 'sepia', 'night', 'contrast'] as const;
type Theme = typeof themes[number];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    if (user?.theme) return user.theme as Theme;
    return (localStorage.getItem('theme') as Theme) || 'night';
  });
  const [scrollY, setScrollY] = useState(0);

  // Sync theme with user data
  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      setTheme(user.theme as Theme);
    }
  }, [user]);

  useEffect(() => {
    document.body.classList.remove('theme-day', 'theme-sepia', 'theme-night', 'theme-contrast');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);


  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getThemeIcon = (currentTheme: Theme) => {
    switch (currentTheme) {
      case 'day': return <Sun size={16} className="text-yellow-400" />;
      case 'sepia': return <Eye size={16} className="text-amber-400" />;
      case 'night': return <Moon size={16} className="text-slate-400" />;
      case 'contrast': return <Contrast size={16} className="text-purple-400" />;
      default: return <Moon size={16} className="text-slate-400" />;
    }
  };

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden">
            <img 
              src={moneyTreeLogo} 
              alt="Money Tree Logo" 
              className="object-contain"
              style={{ width: '55px', height: '55px' }}
            />
          </div>
          <h1 className="font-bold text-slate-100 text-[18px]">{book.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6">
            <Link 
              href="/home" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link 
              href="/read" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="nav-read"
            >
              Read
            </Link>
            <Link 
              href="/characters" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="nav-characters"
            >
              Characters
            </Link>
            <Link 
              href="/dashboard" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="nav-dashboard"
            >
              Dashboard
            </Link>
            <Link 
              href="/read/glossary" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="nav-glossary"
            >
              Glossary
            </Link>
          </nav>
          
          <button
            onClick={cycleTheme}
            className="p-2 border border-slate-600 rounded hover:border-brand transition-colors"
            data-testid="button-theme-switcher"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {getThemeIcon(theme)}
          </button>
        </div>
      </header>
      {/* Hero Image with Parallax Effect */}
      <div className="relative overflow-hidden h-[600px] mb-12">
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            opacity: Math.max(0, 1 - (scrollY / 400))
          }}
        >
          <img 
            src={bookCoverImage} 
            alt="The Money Tree of Life - Growing Financial Literacy for Kids" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
        </div>
      </div>
      {/* Hero Content */}
      <main className="w-full max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-8 -mt-32 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 text-brand text-sm font-medium backdrop-blur-sm">
            <GraduationCap size={16} />
            Ages {book.audienceAgeMin}-{book.audienceAgeMax}
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
            Learn Money Skills That 
            <span className="text-brand"> Grow</span> Over Time
          </h2>
          <p className="text-xl text-slate-200 leading-relaxed max-w-2xl">
            {book.description}
          </p>
          <div className="text-slate-300">
            <p>By {book.author}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/read" 
              className="inline-flex items-center gap-2 bg-brand text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand/90 transition-colors shadow-lg"
              data-testid="button-start-reading"
            >
              <BookOpen size={20} />
              Start Reading
            </Link>
            <Link 
              href="/characters" 
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors shadow-lg"
              data-testid="button-choose-guide"
            >
              <GraduationCap size={20} />
              Choose Your Guide
            </Link>
            <Link 
              href="/read/glossary" 
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors"
              data-testid="button-browse-glossary"
            >
              <BookOpen size={20} />
              Browse Glossary
            </Link>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 mb-20">
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-brand/50 transition-colors">
            <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="text-brand" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Interactive Quizzes</h3>
            <p className="text-slate-400">Test your knowledge with engaging quizzes after each chapter</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-brand/50 transition-colors">
            <div className="w-12 h-12 bg-brand2/20 rounded-lg flex items-center justify-center mb-4">
              <StickyNote className="text-brand2" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Personal Notes</h3>
            <p className="text-slate-400">Take notes and track your learning progress</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-brand/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Search className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Smart Search</h3>
            <p className="text-slate-400">Quickly find concepts and terms across all chapters</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
