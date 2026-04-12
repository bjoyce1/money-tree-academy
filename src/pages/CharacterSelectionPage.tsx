import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Star, Award, Users, BookOpen } from 'lucide-react';
import { CHARACTERS, Character, useCharacterCompanion } from '../components/CharacterCompanion';
import CharacterIntroduction from '../components/CharacterIntroduction';
import { useState, useEffect } from 'react';

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
    
    // Show character introduction
    setIntroductionCharacter(character);
    setShowIntroduction(true);
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'Investment & Planning': return 'from-green-600 to-emerald-600';
      case 'Entrepreneurship & Budgeting': return 'from-yellow-600 to-amber-600';
      case 'Saving & Goal Setting': return 'from-blue-600 to-cyan-600';
      case 'Understanding Money & Research': return 'from-purple-600 to-violet-600';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-slate-100 transition-colors">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-xl font-bold">Choose Your Learning Companion</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-6">
            <Users size={16} />
            Meet Your Guides
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your Perfect
            <span className="text-purple-400"> Learning Companion</span>
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Meet the characters from "The Money Tree of Life" who will guide you through your financial learning journey. 
            Each companion has their own expertise and personality to help you succeed.
          </p>
        </div>

        {/* Current Selection */}
        {selectedCharacter && (
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <img
                src={selectedCharacter.image}
                alt={selectedCharacter.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-green-400"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-100">Current Learning Companion</h3>
                <p className="text-green-200">{selectedCharacter.name} - {selectedCharacter.speciality}</p>
              </div>
              <div className="text-green-400">
                <Heart size={24} fill="currentColor" />
              </div>
            </div>
          </div>
        )}

        {/* Character Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {CHARACTERS.map((character) => {
            const isSelected = selectedCharacter?.id === character.id;
            return (
              <div
                key={character.id}
                className={`relative bg-slate-800/30 border rounded-2xl p-8 transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isSelected 
                    ? 'border-green-500 shadow-lg shadow-green-500/20' 
                    : 'border-slate-700 hover:border-purple-400/50'
                }`}
                onClick={() => selectCharacter(character)}
                data-testid={`character-card-${character.id}`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Heart size={16} className="text-white" fill="currentColor" />
                  </div>
                )}

                {/* Character Image */}
                <div className="flex flex-col items-center mb-6">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-400/50 shadow-xl mb-4"
                  />
                  <h3 className="text-2xl font-bold text-slate-100">{character.name}</h3>
                  <p className="text-slate-300">{character.personality}</p>
                </div>

                {/* Specialty Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getSpecialtyColor(character.speciality)} rounded-full text-white text-sm font-medium mb-4`}>
                  <Award size={16} />
                  {character.speciality}
                </div>

                {/* Catchphrase */}
                <blockquote className="text-purple-200 italic text-center mb-6 border-l-4 border-purple-400 pl-4">
                  "{character.catchphrase}"
                </blockquote>

                {/* Quick Preview */}
                <div className="space-y-3 mb-6">
                  <div className="text-sm">
                    <span className="text-slate-400">Sample encouragement:</span>
                    <p className="text-slate-300 italic">"{character.encouragementMessages[0]}"</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link 
                    href={`/characters/${character.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                    data-testid={`view-profile-${character.id}`}
                  >
                    <BookOpen size={16} />
                    View Profile
                  </Link>
                  {!isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCharacter(character);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      data-testid={`select-${character.id}`}
                    >
                      <Heart size={16} />
                      Choose Guide
                    </button>
                  )}
                  {isSelected && (
                    <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                      <Heart size={16} fill="currentColor" />
                      Selected
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Get Started Section */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Learning?</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            {selectedCharacter ? (
              <>
                Great choice! {selectedCharacter.name} is ready to guide you through your financial learning journey. 
                Start reading and watch as your companion helps you grow your money knowledge.
              </>
            ) : (
              "Choose your learning companion above and begin your journey to financial literacy with personalized guidance and encouragement."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/read"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
              data-testid="start-reading-button"
            >
              <BookOpen size={20} />
              Start Reading
            </Link>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold text-lg transition-colors"
              data-testid="back-home-button"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      
      {/* Character Introduction Modal */}
      {introductionCharacter && (
        <CharacterIntroduction
          character={introductionCharacter}
          isOpen={showIntroduction}
          onClose={() => {
            setShowIntroduction(false);
            setIntroductionCharacter(null);
          }}
        />
      )}
    </div>
  );
}