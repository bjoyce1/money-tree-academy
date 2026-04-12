import { Link } from "react-router-dom";
import { ArrowLeft, Play, Sprout, Search, Lock, Heart, Award, Coins } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import chapters from "../data/chapters.json";
import Footer from "../components/Footer";
import SmartRecommendations from "../components/SmartRecommendations";
import { CHARACTERS, Character, useCharacterCompanion } from "../components/CharacterCompanion";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const CHAPTER_COLORS = [
  'from-emerald-500 to-green-400',
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-amber-500 to-yellow-400',
  'from-rose-500 to-pink-400',
  'from-teal-500 to-emerald-400',
  'from-indigo-500 to-blue-400',
  'from-orange-500 to-amber-400',
  'from-fuchsia-500 to-pink-400',
  'from-lime-500 to-green-400',
  'from-sky-500 to-blue-400',
  'from-red-500 to-rose-400',
];

function ProgressRing({ progress, size = 44, strokeWidth = 3, color = 'stroke-primary' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-white/10" />
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none"
        className={color} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
}

export default function ReadHomePage() {
  const { user } = useAuth();
  const { getSelectedCharacter } = useCharacterCompanion();
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(getSelectedCharacter());
  const resumeSlug = localStorage.getItem('resumeSlug');
  const completedChapters = JSON.parse(localStorage.getItem('completed_chapters') || '[]');
  const coins = JSON.parse(localStorage.getItem('coins_data') || '{}').total || 0;

  useEffect(() => {
    setSelectedCharacter(getSelectedCharacter());
  }, []);

  const selectCharacter = async (character: Character) => {
    try {
      const companionState = {
        selectedCharacterId: character.id,
        lastInteraction: Date.now(),
        totalInteractions: 0,
        messagesShown: []
      };
      localStorage.setItem('character_companion', JSON.stringify(companionState));
      setSelectedCharacter(character);
      const event = new CustomEvent('character-celebration', {
        detail: { message: `Great choice! ${character.name} is now your reading companion. Ready to learn together?` }
      });
      window.dispatchEvent(event);
    } catch (error) {}
  };

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-nav">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-extrabold hover:text-primary transition-colors flex items-center gap-2" data-testid="link-home">
            <ArrowLeft size={16} className="lg:block hidden" />
            The Money Tree of Life
          </Link>
          <div className="flex items-center gap-4">
            {/* Coins */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card text-golden text-sm font-bold">
              <Coins size={14} />
              {coins}
            </div>
            {/* Guide avatar */}
            {selectedCharacter && (
              <img src={selectedCharacter.image} alt={selectedCharacter.name}
                className="w-8 h-8 rounded-full border-2 border-violet object-cover" />
            )}
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/characters" className="text-muted-foreground hover:text-primary transition-colors font-bold text-sm">Guides</Link>
              <Link to="/read/glossary" className="text-muted-foreground hover:text-primary transition-colors font-bold text-sm">Glossary</Link>
              <Link to="/read/search" className="text-muted-foreground hover:text-primary transition-colors"><Search size={16} /></Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Characters */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Choose Your Learning Companion
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select a character to guide you through your financial learning journey
            </p>
          </motion.div>

          {/* Character Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {CHARACTERS.map((character, i) => {
              const isSelected = selectedCharacter?.id === character.id;
              return (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => selectCharacter(character)}
                  className={`relative glass-card rounded-2xl p-4 md:p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isSelected ? 'pulse-glow !border-primary/50 !bg-primary/10' : ''
                  }`}
                  data-testid={`hero-character-${character.id}`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                      <Heart size={12} className="text-primary-foreground" fill="currentColor" />
                    </div>
                  )}
                  <div className="flex flex-col items-center mb-3">
                    <img src={character.image} alt={character.name}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 shadow-lg mb-3 ${isSelected ? 'border-primary' : 'border-violet/50'}`}
                    />
                    <h3 className="font-extrabold text-foreground text-center">{character.name}</h3>
                    <p className="text-xs text-muted-foreground text-center">{character.personality}</p>
                  </div>
                  <div className="text-center mb-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-violet/20 rounded-full text-violet text-xs font-bold">
                      <Award size={12} />
                      {character.speciality.split(' & ')[0]}
                    </div>
                  </div>
                  <div className="text-center">
                    {isSelected ? (
                      <div className="text-primary text-sm font-bold">✨ Your Guide</div>
                    ) : (
                      <div className="text-muted-foreground text-sm">Click to Choose</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Resume / Start buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card rounded-2xl p-6 border-primary/20">
            <h3 className="text-xl font-extrabold text-foreground mb-2 flex items-center gap-2">
              <Play className="text-primary" size={20} />
              Resume Reading
            </h3>
            <p className="text-muted-foreground mb-4">Continue where you left off</p>
            <Link
              to={resumeSlug ? `/read/${resumeSlug}` : `/read/${chapters[0].slug}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-emerald-400 text-primary-foreground px-6 py-3 rounded-full font-bold hover:scale-105 transition-all min-h-[48px]"
              data-testid={resumeSlug ? "button-resume" : "button-start-first"}
            >
              {resumeSlug ? 'Resume Chapter' : `Chapter 1: ${chapters[0].title}`}
            </Link>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xl font-extrabold text-foreground mb-2 flex items-center gap-2">
              <Sprout className="text-golden" size={20} />
              Start from Beginning
            </h3>
            <p className="text-muted-foreground mb-4">Begin your journey from Chapter 1</p>
            <Link
              to={`/read/${chapters[0].slug}`}
              className="inline-flex items-center gap-2 glass-card text-foreground px-6 py-3 rounded-full font-bold hover:scale-105 transition-all min-h-[48px]"
              data-testid="button-chapter-1"
            >
              Go to Chapter 1
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <SmartRecommendations />
        </div>

        {/* Adventure Path Chapter List */}
        <div>
          <h3 className="text-2xl font-extrabold text-foreground mb-6">Your Adventure Path</h3>
          <div className="adventure-path space-y-0">
            {chapters.map((chapter, index) => {
              const isUnlocked = index === 0 || resumeSlug;
              const isCompleted = completedChapters.includes(chapter.id);
              const isCurrent = resumeSlug === chapter.slug;
              const progress = isCompleted ? 100 : isCurrent ? 60 : 0;
              const colorClass = CHAPTER_COLORS[index % CHAPTER_COLORS.length];

              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-14 pb-6"
                  data-testid={`chapter-${chapter.slug}`}
                >
                  {/* Level node */}
                  <div className="absolute left-0 top-1 z-10">
                    <div className="relative">
                      <ProgressRing progress={progress} size={44} strokeWidth={3} color={isCompleted ? 'stroke-primary' : isCurrent ? 'stroke-golden' : 'stroke-muted-foreground/30'} />
                      <div className={`absolute inset-0 flex items-center justify-center`}>
                        {isUnlocked ? (
                          <span className={`text-sm font-extrabold ${isCompleted ? 'text-primary' : isCurrent ? 'text-golden' : 'text-muted-foreground'}`}>
                            {isCompleted ? '✓' : chapter.order}
                          </span>
                        ) : (
                          <Lock className="text-muted-foreground/40" size={14} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chapter card */}
                  <div className={`glass-card rounded-2xl p-4 transition-all group ${
                    isUnlocked ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  } ${isCurrent ? '!border-golden/30 !bg-golden/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`} />
                          <h4 className={`font-extrabold transition-colors ${
                            isUnlocked ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'
                          }`}>
                            {chapter.title}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-golden/20 text-golden text-xs rounded-full font-bold">Reading</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isUnlocked ? `Level ${chapter.order} · ${chapter.estReadMinutes} min` : 'Complete previous levels to unlock'}
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="text-primary text-sm font-bold">⭐ Complete</div>
                      )}
                    </div>
                    {isUnlocked && (
                      <Link to={`/read/${chapter.slug}`} className="absolute inset-0" data-testid={`link-chapter-${chapter.slug}`} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
