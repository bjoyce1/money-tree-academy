import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Lightbulb, StickyNote, Search, Sun, Moon, Eye, Contrast, Sparkles, TrendingUp, Star } from "lucide-react";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import book from "../data/book.json";
import bookCoverImage from "@/assets/book-cover.png";
import moneyTreeLogo from "@/assets/logo.png";
import Footer from "../components/Footer";

const themes = ['day', 'sepia', 'night', 'contrast'] as const;
type Theme = typeof themes[number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'night';
  });

  useEffect(() => {
    document.body.classList.remove('theme-day', 'theme-sepia', 'theme-night', 'theme-contrast');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const getThemeIcon = (currentTheme: Theme) => {
    switch (currentTheme) {
      case 'day': return <Sun size={16} className="text-brand2" />;
      case 'sepia': return <Eye size={16} className="text-brand2" />;
      case 'night': return <Moon size={16} className="text-muted-foreground" />;
      case 'contrast': return <Contrast size={16} className="text-primary" />;
      default: return <Moon size={16} className="text-muted-foreground" />;
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
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between p-6 relative z-20">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden">
            <img src={moneyTreeLogo} alt="Money Tree Logo" className="object-contain" style={{ width: '55px', height: '55px' }} />
          </div>
          <h1 className="font-bold text-foreground text-[18px]">{book.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6">
            {[
              { to: "/home", label: "Home" },
              { to: "/read", label: "Read" },
              { to: "/characters", label: "Characters" },
              { to: "/dashboard", label: "Dashboard" },
              { to: "/read/glossary", label: "Glossary" },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={cycleTheme}
            className="p-2 border border-border rounded-lg hover:border-primary transition-colors"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {getThemeIcon(theme)}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background orbs */}
        <FloatingOrb className="w-96 h-96 bg-primary -top-20 -left-20" delay={0} />
        <FloatingOrb className="w-72 h-72 bg-brand2 top-40 right-10" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-primary bottom-10 left-1/3" delay={4} />

        <div className="w-full max-w-6xl mx-auto px-6 pt-8 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
            {/* Left: Text content */}
            <motion.div className="flex flex-col gap-6 relative z-10" {...stagger} initial="initial" animate="animate">
              <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-semibold w-fit backdrop-blur-sm border border-primary/20">
                <Sparkles size={14} />
                Ages {book.audienceAgeMin}–{book.audienceAgeMax} · Interactive Learning
              </motion.div>

              <motion.h2 {...fadeUp(0.1)} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                Learn Money Skills
                <br />
                That <span className="text-primary relative">
                  Grow
                  <motion.span
                    className="absolute -bottom-1 left-0 w-full h-1 bg-primary/40 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    style={{ originX: 0 }}
                  />
                </span> Over Time
              </motion.h2>

              <motion.p {...fadeUp(0.2)} className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                {book.description}
              </motion.p>

              <motion.p {...fadeUp(0.25)} className="text-sm text-muted-foreground">
                By <span className="text-foreground font-medium">{book.author}</span>
              </motion.p>

              {/* CTA buttons */}
              <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/read"
                  className="group inline-flex items-center justify-center gap-2.5 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                >
                  <BookOpen size={20} />
                  Start Reading
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </Link>
                <Link
                  to="/characters"
                  className="inline-flex items-center justify-center gap-2.5 bg-secondary text-secondary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-secondary/80 transition-all border border-border"
                >
                  <GraduationCap size={20} />
                  Choose Your Guide
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div {...fadeUp(0.4)} className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {['🧒', '👧', '🧑', '👦'].map((emoji, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-sm">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-foreground font-semibold">4 character guides</span> · Interactive quizzes · Mini-games
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Book cover with decorative elements */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow behind book */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-brand2/10 rounded-3xl blur-2xl" />

              {/* Book cover */}
              <div className="relative group">
                <motion.div
                  className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50"
                  whileHover={{ y: -8, rotateY: -3 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  style={{ perspective: 1000 }}
                >
                  <img
                    src={bookCoverImage}
                    alt="The Money Tree of Life - Growing Financial Literacy for Kids"
                    className="w-full max-w-md h-auto object-cover"
                  />
                </motion.div>

                {/* Floating badges */}
                <motion.div
                  className="absolute -top-4 -right-4 z-20 bg-brand2 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Star size={12} fill="currentColor" />
                  Free to Read
                </motion.div>

                <motion.div
                  className="absolute -bottom-3 -left-3 z-20 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <TrendingUp size={12} />
                  {book.totalChapters} Chapters
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          {[
            { icon: Lightbulb, color: "primary", title: "Interactive Quizzes", desc: "Test your knowledge with engaging quizzes after each chapter" },
            { icon: StickyNote, color: "brand2", title: "Personal Notes", desc: "Take notes and track your learning progress" },
            { icon: Search, color: "primary", title: "Smart Search", desc: "Quickly find concepts and terms across all chapters" },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all hover:-translate-y-1"
            >
              <div className={`w-12 h-12 bg-${feature.color}/15 rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className={`text-${feature.color}`} size={22} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
