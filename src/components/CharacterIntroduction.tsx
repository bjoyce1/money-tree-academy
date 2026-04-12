import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Character } from './CharacterCompanion';
import voiceService from '../services/voiceService';

interface CharacterIntroductionProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
}

export default function CharacterIntroduction({ character, isOpen, onClose }: CharacterIntroductionProps) {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [, setLocation] = useLocation();

  const introductionText = `Hello! I'm ${character.name}, your financial literacy companion! ${character.catchphrase} 

I specialize in ${character.speciality} and I'm here to guide you through "The Money Tree of Life." Together, we'll explore finance, celebrate your achievements, and build your bright financial future!

Ready to start this adventure? Let's grow your money tree together!`;

  // Clean up voice when modal closes
  useEffect(() => {
    if (!isOpen) {
      voiceService.stopCurrent();
      setIsPlayingVoice(false);
    }
  }, [isOpen]);

  const playIntroduction = async () => {
    if (isPlayingVoice) {
      voiceService.stopCurrent();
      setIsPlayingVoice(false);
      return;
    }

    try {
      setIsPlayingVoice(true);
      await voiceService.playCharacterSpeech(character.id, introductionText);
      setIsPlayingVoice(false);
    } catch (error) {
      // Error playing introduction - handled by voice service
      setIsPlayingVoice(false);
    }
  };

  const handleClose = () => {
    voiceService.stopCurrent();
    setIsPlayingVoice(false);
    onClose();
  };

  const handleStartLearning = () => {
    voiceService.stopCurrent();
    setIsPlayingVoice(false);
    onClose();
    setLocation('/read');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-purple-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-sm border-b border-purple-500/30 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-400" size={24} />
              <h2 className="text-2xl font-bold text-slate-100">Meet Your Learning Companion!</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              data-testid="close-introduction"
            >
              <X className="text-slate-400" size={20} />
            </button>
          </div>
        </div>

        {/* Character Avatar with Pop-out Animation */}
        <div className="p-8 text-center">
          <div className="relative inline-block mb-6">
            <div className="relative">
              <img
                src={character.image}
                alt={character.name}
                className={`w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-2xl transition-all duration-1000 ${
                  isOpen ? 'animate-bounce-in scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
                style={{
                  animation: isOpen ? 'popOut 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none'
                }}
              />
              {/* Sparkle effects around avatar */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles size={16} className="text-yellow-800" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-300"></div>
              <div className="absolute top-1/2 -right-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-500"></div>
            </div>
            
            {/* Character name with animation */}
            <h3 className={`text-3xl font-bold text-slate-100 mt-4 transition-all duration-700 delay-300 ${
              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {character.name}
            </h3>
            <p className={`text-purple-300 text-lg transition-all duration-700 delay-500 ${
              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {character.personality}
            </p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white text-sm font-medium mt-2 transition-all duration-700 delay-700 ${
              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {character.speciality}
            </div>
          </div>

          {/* Introduction Text */}
          <div className={`bg-slate-800/30 border border-purple-500/30 rounded-xl p-6 mb-6 transition-all duration-700 delay-1000 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <blockquote className="text-purple-200 italic text-lg mb-4 border-l-4 border-purple-400 pl-4">
              "{character.catchphrase}"
            </blockquote>
            
            <div className="text-slate-300 leading-relaxed space-y-4 text-left">
              <p>
                <strong className="text-purple-300">Hello there!</strong> I'm {character.name}, and I'm absolutely thrilled to be your learning companion on this amazing financial literacy journey!
              </p>
              <p>
                As someone who specializes in <strong className="text-purple-300">{character.speciality}</strong>, I'm here to guide you through every step of "The Money Tree of Life." My personality is {character.personality.toLowerCase()}, which means I'll bring my unique perspective to help you understand money in a way that clicks for you.
              </p>
              <p>
                Together, we'll explore the fascinating world of finance, celebrate your achievements, and work towards building your bright financial future. I'll be right here whenever you need encouragement, have questions, or want to dive deeper into any topic.
              </p>
              <p className="text-purple-200 font-medium">
                Are you ready to start this incredible adventure? Let's grow your money tree together! 🌳✨
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-1200 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              onClick={playIntroduction}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-colors ${
                isPlayingVoice ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
              data-testid={isPlayingVoice ? "stop-introduction" : "play-introduction"}
              aria-label={isPlayingVoice ? "Stop character introduction" : "Play character introduction"}
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
            
            <button
              onClick={handleStartLearning}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-colors"
              data-testid="start-learning"
            >
              Let's Start Learning!
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popOut {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(-90deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: popOut 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}