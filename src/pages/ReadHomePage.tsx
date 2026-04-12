import { Link } from "react-router-dom";
import { ArrowLeft, Play, Sprout, Home, Search, Book, Lock, Heart, Award } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { progressAPI, companionAPI } from '@/lib/api';
import chapters from "../data/chapters.json";
import Footer from "../components/Footer";
import SmartRecommendations from "../components/SmartRecommendations";
import { CHARACTERS, Character, useCharacterCompanion } from "../components/CharacterCompanion";
import { useState, useEffect } from "react";

export default function ReadHomePage() {
  const { user } = useAuth();
  const { getSelectedCharacter } = useCharacterCompanion();
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(getSelectedCharacter());
  
  // Get reading progress from localStorage (guest mode)
  const resumeSlug = localStorage.getItem('resumeSlug');

  useEffect(() => {
    setSelectedCharacter(getSelectedCharacter());
  }, []);

  const selectCharacter = async (character: Character) => {
    try {
      // Store in localStorage for guest users
      const companionState = {
        selectedCharacterId: character.id,
        lastInteraction: Date.now(),
        totalInteractions: 0,
        messagesShown: []
      };
      localStorage.setItem('character_companion', JSON.stringify(companionState));
      
      setSelectedCharacter(character);
      
      // Show success message
      const event = new CustomEvent('character-celebration', {
        detail: {
          message: `Great choice! ${character.name} is now your reading companion. Ready to learn together?`
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      // Error selecting character
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      {/* Header — simplified on mobile since bottom nav handles navigation */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/90 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            to="/" 
            className="font-semibold hover:text-primary transition-colors flex items-center gap-2"
            data-testid="link-home"
          >
            <ArrowLeft size={16} className="lg:block hidden" />
            The Money Tree of Life
          </Link>
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/characters" className="text-muted-foreground hover:text-primary transition-colors">
              Characters
            </Link>
            <Link to="/read/glossary" className="text-muted-foreground hover:text-primary transition-colors">
              Glossary
            </Link>
            <Link to="/read/search" className="text-muted-foreground hover:text-primary transition-colors">
              <Search size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Characters */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
              Choose Your Learning Companion
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Select a character from "The Money Tree of Life" to guide you through your financial learning journey
            </p>
          </div>

          {/* Character Selection Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {CHARACTERS.map((character) => {
              const isSelected = selectedCharacter?.id === character.id;
              return (
                <div
                  key={character.id}
                  onClick={() => selectCharacter(character)}
                  className={`relative bg-slate-800/50 border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isSelected 
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20 bg-purple-900/30' 
                      : 'border-slate-700 hover:border-purple-400/50'
                  }`}
                  data-testid={`hero-character-${character.id}`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <Heart size={12} className="text-white" fill="currentColor" />
                    </div>
                  )}

                  {/* Character Image */}
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-400/50 shadow-lg mb-3"
                    />
                    <h3 className="font-semibold text-slate-100 text-center">{character.name}</h3>
                    <p className="text-xs text-slate-400 text-center">{character.personality}</p>
                  </div>

                  {/* Specialty */}
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 rounded-full text-purple-300 text-xs">
                      <Award size={12} />
                      {character.speciality.split(' & ')[0]}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="text-center">
                    {isSelected ? (
                      <div className="text-purple-300 text-sm font-medium">
                        Your Guide
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm">
                        Click to Choose
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Selection Display */}
          {selectedCharacter && (
            <div className="mt-8 bg-slate-800/30 border border-purple-500/30 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-4">
                <img
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-400"
                />
                <div>
                  <h4 className="font-semibold text-slate-100">
                    {selectedCharacter.name} is your learning companion
                  </h4>
                  <p className="text-sm text-purple-300">
                    Specializing in {selectedCharacter.speciality}
                  </p>
                </div>
                <div className="text-purple-400">
                  <Heart size={20} fill="currentColor" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Start Your Financial Journey</h2>
          <p className="text-xl text-slate-300">Choose how you'd like to begin reading</p>
          <div className="mt-6">
            <Link 
              to="/characters" 
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              data-testid="button-choose-character-guide"
            >
              <Sprout size={18} />
              Choose Your Learning Guide
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
              <Play className="text-brand" size={20} />
              Resume Reading
            </h3>
            <p className="text-slate-300 mb-4">Continue where you left off</p>
            {resumeSlug ? (
              <Link 
                to={`/read/${resumeSlug}`}
                className="bg-brand text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-brand/90 transition-colors inline-block"
                data-testid="button-resume"
              >
                Resume Chapter
              </Link>
            ) : (
              <Link 
                to={`/read/${chapters[0].slug}`}
                className="bg-brand text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-brand/90 transition-colors inline-block"
                data-testid="button-start-first"
              >
                Chapter 1: {chapters[0].title}
              </Link>
            )}
          </div>
          <div className="border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
              <Sprout className="text-brand2" size={20} />
              Start from Beginning
            </h3>
            <p className="text-slate-300 mb-4">Begin your journey from Chapter 1</p>
            <Link 
              to={`/read/${chapters[0].slug}`}
              className="bg-slate-800 text-slate-300 px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors inline-block"
              data-testid="button-chapter-1"
            >
              Go to Chapter 1
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <SmartRecommendations />
        </div>

        <div>
          <h3 className="text-2xl font-semibold text-slate-100 mb-6">All Chapters</h3>
          <div className="grid gap-4">
            {chapters.map((chapter, index) => {
              const isUnlocked = index === 0 || resumeSlug;
              return (
                <div
                  key={chapter.id}
                  className={`relative flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg transition-all group ${
                    isUnlocked 
                      ? 'hover:border-brand/50 cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  data-testid={`chapter-${chapter.slug}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isUnlocked 
                        ? 'bg-brand/20' 
                        : 'bg-slate-700'
                    }`}>
                      {isUnlocked ? (
                        <span className="font-bold text-brand">{chapter.order}</span>
                      ) : (
                        <Lock className="text-slate-500" size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-semibold transition-colors ${
                        isUnlocked 
                          ? 'text-slate-100 group-hover:text-brand' 
                          : 'text-slate-400'
                      }`}>
                        {chapter.title}
                      </h4>
                      <p className={`text-sm ${
                        isUnlocked 
                          ? 'text-slate-400' 
                          : 'text-slate-500'
                      }`}>
                        {isUnlocked 
                          ? `Learn about ${chapter.title.toLowerCase()}` 
                          : 'Complete previous chapters to unlock'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${
                      isUnlocked ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {chapter.estReadMinutes} min
                    </div>
                    <div className="w-16 bg-slate-700 rounded-full h-1 mt-1">
                      <div className={`h-full rounded-full ${
                        resumeSlug === chapter.slug ? 'bg-brand w-full' : 'bg-slate-600 w-0'
                      }`}></div>
                    </div>
                  </div>
                  {isUnlocked && (
                    <Link 
                      to={`/read/${chapter.slug}`} 
                      className="absolute inset-0"
                      data-testid={`link-chapter-${chapter.slug}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
