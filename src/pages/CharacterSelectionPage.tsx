import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Star, Award, Users, BookOpen } from 'lucide-react';
import { CHARACTERS, Character, useCharacterCompanion } from '../components/CharacterCompanion';
import CharacterIntroduction from '../components/CharacterIntroduction';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CharacterSelectionPage() {
  const { getSelectedCharacter } = useCharacterCompanion();
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(getSelectedCharacter());
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [introductionCharacter, setIntroductionCharacter] = useState<Character | null>(null);

  useEffect(() => {
    setSelectedCharacter(getSelectedCharacter());
  }, []);

  const selectCharacter = (character: Character) => {
    const companionState = {
      selectedCharacterId: character.id,
      lastInteraction: Date.now(),
      totalInteractions: 0,
      messagesShown: []
    };
    localStorage.setItem('character_companion', JSON.stringify(companionState));
    setSelectedCharacter(character);
    setIntroductionCharacter(character);
    setShowIntroduction(true);
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'Investment & Planning': return 'from-emerald-500 to-green-400';
      case 'Entrepreneurship & Budgeting': return 'from-amber-500 to-yellow-400';
      case 'Saving & Goal Setting': return 'from-blue-500 to-cyan-400';
      case 'Understanding Money & Research': return 'from-violet to-purple-400';
      default: return 'from-primary to-emerald-400';
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-xl font-extrabold">Choose Your Guide</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-violet text-sm font-bold mb-6">
            <Users size={16} />
            Meet Your Guides
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Choose Your Perfect
            <span className="bg-gradient-to-r from-violet to-purple-400 bg-clip-text text-transparent"> Learning Companion</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Meet the characters from "The Money Tree of Life" who will guide you through your financial learning journey.
          </p>
        </motion.div>

        {/* Current Selection */}
        {selectedCharacter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-primary/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <img src={selectedCharacter.image} alt={selectedCharacter.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-foreground">Current Learning Companion</h3>
                <p className="text-primary font-bold">{selectedCharacter.name} - {selectedCharacter.speciality}</p>
              </div>
              <div className="text-primary">
                <Heart size={24} fill="currentColor" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Character Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {CHARACTERS.map((character, i) => {
            const isSelected = selectedCharacter?.id === character.id;
            return (
              <motion.div
                key={character.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass-card rounded-2xl p-8 transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isSelected ? 'pulse-glow !border-primary/40 !bg-primary/5' : ''
                }`}
                onClick={() => selectCharacter(character)}
                data-testid={`character-card-${character.id}`}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                    <Heart size={16} className="text-primary-foreground" fill="currentColor" />
                  </div>
                )}

                <div className="flex flex-col items-center mb-6">
                  <img src={character.image} alt={character.name}
                    className={`w-24 h-24 rounded-full object-cover border-4 shadow-xl mb-4 ${isSelected ? 'border-primary' : 'border-violet/30'}`} />
                  <h3 className="text-2xl font-extrabold text-foreground">{character.name}</h3>
                  <p className="text-muted-foreground font-bold">{character.personality}</p>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getSpecialtyColor(character.speciality)} rounded-full text-white text-sm font-bold mb-4`}>
                  <Award size={16} />
                  {character.speciality}
                </div>

                <blockquote className="text-violet italic text-center mb-6 border-l-4 border-violet/30 pl-4 font-bold">
                  "{character.catchphrase}"
                </blockquote>

                <div className="space-y-3 mb-6">
                  <div className="text-sm">
                    <span className="text-muted-foreground font-bold">Sample encouragement:</span>
                    <p className="text-foreground/80 italic">"{character.encouragementMessages[0]}"</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link 
                    to={`/characters/${character.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 glass-card text-foreground rounded-full text-sm font-bold transition-all hover:scale-105"
                    data-testid={`view-profile-${character.id}`}
                  >
                    <BookOpen size={16} />
                    View Profile
                  </Link>
                  {!isSelected ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); selectCharacter(character); }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet to-purple-500 text-white rounded-full text-sm font-bold transition-all hover:scale-105"
                      data-testid={`select-${character.id}`}
                    >
                      <Heart size={16} />
                      Choose Guide
                    </button>
                  ) : (
                    <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      <Heart size={16} fill="currentColor" />
                      Selected ✨
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Get Started Section */}
        <div className="glass-card rounded-2xl p-8 text-center border-violet/20">
          <h3 className="text-2xl font-extrabold mb-4">Ready to Start Learning?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {selectedCharacter ? (
              <>Great choice! {selectedCharacter.name} is ready to guide you through your financial learning journey.</>
            ) : (
              "Choose your learning companion above and begin your journey to financial literacy."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/read"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-emerald-400 text-primary-foreground rounded-full font-extrabold text-lg transition-all hover:scale-105 shadow-lg min-h-[48px]"
              data-testid="start-reading-button"
            >
              <BookOpen size={20} />
              Start Reading
            </Link>
            <Link to="/"
              className="inline-flex items-center gap-2 px-8 py-4 glass-card text-foreground rounded-full font-bold text-lg transition-all hover:scale-105 min-h-[48px]"
              data-testid="back-home-button"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {introductionCharacter && (
        <CharacterIntroduction
          character={introductionCharacter}
          isOpen={showIntroduction}
          onClose={() => { setShowIntroduction(false); setIntroductionCharacter(null); }}
        />
      )}
    </div>
  );
}
