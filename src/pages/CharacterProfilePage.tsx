import { useRoute, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Award, BookOpen, Lightbulb, Target, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import { CHARACTERS, Character, useCharacterCompanion } from '../components/CharacterCompanion';
import CharacterIntroduction from '../components/CharacterIntroduction';
import { useState, useEffect } from 'react';
import voiceService from '../services/voiceService';

export default function CharacterProfilePage() {
  const [, params] = useRoute('/characters/:characterId');
  const characterId = params?.characterId;
  const character = CHARACTERS.find(c => c.id === characterId);
  const { getSelectedCharacter } = useCharacterCompanion();
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(getSelectedCharacter());
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [introductionCharacter, setIntroductionCharacter] = useState<Character | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  useEffect(() => {
    setSelectedCharacter(getSelectedCharacter());
  }, []);

  // Clean up voice when component unmounts
  useEffect(() => {
    return () => {
      voiceService.stopCurrent();
      setIsPlayingVoice(false);
    };
  }, []);

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Character Not Found</h1>
          <Link to="/characters" className="text-purple-400 hover:text-purple-300">
            ← Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  const selectAsGuide = () => {
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

  const playCharacterVoice = async () => {
    if (!character) return;
    
    if (isPlayingVoice) {
      voiceService.stopCurrent();
      setIsPlayingVoice(false);
      return;
    }

    const introductionText = `Hello! I'm ${character.name}, your financial literacy companion! ${character.catchphrase} 
    
I specialize in ${character.speciality} and I'm here to guide you through "The Money Tree of Life." Together, we'll explore finance, celebrate your achievements, and build your bright financial future!

Ready to start this adventure? Let's grow your money tree together!`;

    try {
      setIsPlayingVoice(true);
      await voiceService.playCharacterSpeech(character.id, introductionText);
      setIsPlayingVoice(false);
    } catch (error) {
      // Error playing voice - handled by voice service
      setIsPlayingVoice(false);
    }
  };

  const isSelected = selectedCharacter.id === character.id;

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case 'Investment & Planning': return <TrendingUp className="text-green-400" size={24} />;
      case 'Entrepreneurship & Budgeting': return <Lightbulb className="text-yellow-400" size={24} />;
      case 'Saving & Goal Setting': return <Target className="text-blue-400" size={24} />;
      case 'Understanding Money & Research': return <BookOpen className="text-purple-400" size={24} />;
      default: return <Star className="text-slate-400" size={24} />;
    }
  };

  const getPersonalityTraits = (personality: string) => {
    return personality.split(' & ').map(trait => trait.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/characters" className="flex items-center gap-2 text-slate-300 hover:text-slate-100 transition-colors">
            <ArrowLeft size={20} />
            Back to Characters
          </Link>
          <h1 className="text-xl font-bold">Character Profile</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Character Profile */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-3xl p-8 mb-8">
          {/* Character Header */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="relative">
              <img
                src={character.image}
                alt={character.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-purple-400/50 shadow-2xl"
                data-testid="character-profile-image"
              />
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <Heart size={16} className="text-white" fill="currentColor" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-bold mb-2">{character.name}</h2>
              <p className="text-xl text-slate-300 mb-4">{character.personality}</p>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                {getSpecialtyIcon(character.speciality)}
                <span className="text-lg text-purple-300">Specializes in {character.speciality}</span>
              </div>
              <blockquote className="text-lg italic text-purple-200 border-l-4 border-purple-400 pl-4">
                "{character.catchphrase}"
              </blockquote>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              {isSelected ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold">
                  <Heart size={20} fill="currentColor" />
                  Your Current Guide
                </div>
              ) : (
                <button
                  onClick={selectAsGuide}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
                  data-testid="select-character-button"
                >
                  <Heart size={20} />
                  Choose as My Guide
                </button>
              )}
              
              {/* Voice Control Button */}
              <button
                onClick={playCharacterVoice}
                className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-colors ${
                  isPlayingVoice ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
                data-testid={isPlayingVoice ? "stop-profile-voice" : "play-profile-voice"}
                aria-label={isPlayingVoice ? "Stop character voice" : "Play character voice"}
              >
                {isPlayingVoice ? (
                  <>
                    <VolumeX size={20} />
                    Stop Voice
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    Hear My Voice!
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Character Details */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Personality Traits */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="text-yellow-400" size={20} />
              Personality Traits
            </h3>
            <div className="space-y-3">
              {getPersonalityTraits(character.personality).map((trait, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-slate-200">{trait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expertise Area */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="text-purple-400" size={20} />
              Area of Expertise
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {getSpecialtyIcon(character.speciality)}
              <span className="text-lg text-slate-200">{character.speciality}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {character.speciality === 'Investment & Planning' && 
                `${character.name} excels at helping young learners understand how to make smart money decisions for the future. She teaches about different types of investments, how to plan for goals, and the importance of thinking strategically about money.`}
              {character.speciality === 'Entrepreneurship & Budgeting' && 
                `${character.name} loves inspiring creativity in financial thinking. She helps students understand how to start their own projects, manage budgets, and turn creative ideas into financial success.`}
              {character.speciality === 'Saving & Goal Setting' && 
                `${character.name} is passionate about helping students set clear financial goals and develop the discipline to achieve them. He teaches the importance of saving money and staying focused on what matters most.`}
              {character.speciality === 'Understanding Money & Research' && 
                `${character.name} enjoys exploring how money works and helping students ask the right questions. He teaches about financial research, understanding complex concepts, and developing analytical thinking skills.`}
            </p>
          </div>

          {/* How They Help */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Heart className="text-red-400" size={20} />
              How They Encourage You
            </h3>
            <div className="space-y-3">
              {character.encouragementMessages.slice(0, 2).map((message, index) => (
                <div key={index} className="text-slate-300 text-sm leading-relaxed italic">
                  "{message}"
                </div>
              ))}
            </div>
          </div>

          {/* Celebration Style */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="text-yellow-400" size={20} />
              How They Celebrate Success
            </h3>
            <div className="space-y-3">
              {character.celebrationMessages.slice(0, 2).map((message, index) => (
                <div key={index} className="text-slate-300 text-sm leading-relaxed italic">
                  "{message}"
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Choose This Character */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-center">Why Choose {character.name} as Your Guide?</h3>
          <p className="text-slate-300 text-center leading-relaxed">
            {character.name} will be your personal learning companion throughout your financial journey. 
            They'll provide personalized advice, celebrate your achievements, and offer encouragement when you need it most. 
            Choose {character.name} if you're interested in {character.speciality.toLowerCase()} and want a 
            {character.personality.toLowerCase()} approach to learning about money.
          </p>
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