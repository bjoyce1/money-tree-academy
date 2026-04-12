import { useState, useEffect } from 'react';
import { Heart, Settings, Sparkles, MessageCircle, X, Volume2, VolumeX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { companionAPI } from '@/lib/api';
import CharacterIntroduction from './CharacterIntroduction';
import aishaImage from '@/assets/aisha.png';
import emmaImage from '@/assets/emma.png';
import liamImage from '@/assets/liam.png';
import mateoImage from '@/assets/mateo.png';
import voiceService from '../services/voiceService';

export interface Character {
  id: string;
  name: string;
  image: string;
  personality: string;
  speciality: string;
  catchphrase: string;
  celebrationMessages: string[];
  encouragementMessages: string[];
}

export const CHARACTERS: Character[] = [
  {
    id: 'aisha',
    name: 'Aisha',
    image: aishaImage,
    personality: 'Confident & Strategic',
    speciality: 'Investment & Planning',
    catchphrase: "Smart money moves build bright futures!",
    celebrationMessages: [
      "Outstanding work! You're building real financial wisdom! 💪",
      "That's the kind of strategic thinking that leads to success! 🎯",
      "Your financial confidence is growing every day! ✨",
      "Excellent achievement! You're becoming a money master! 🏆"
    ],
    encouragementMessages: [
      "Every financial expert started exactly where you are now.",
      "Your dedication to learning will pay off big time!",
      "Remember, small consistent steps lead to big results.",
      "You're developing skills that will serve you for life!"
    ]
  },
  {
    id: 'emma',
    name: 'Emma',
    image: emmaImage,
    personality: 'Creative & Innovative',
    speciality: 'Entrepreneurship & Budgeting',
    catchphrase: "Creative minds build creative wealth!",
    celebrationMessages: [
      "Fantastic creativity in your financial thinking! 🎨",
      "You're innovating your way to financial success! 💡",
      "That's the entrepreneurial spirit we love to see! 🚀",
      "Creative problem-solving at its finest! 🌟"
    ],
    encouragementMessages: [
      "Think outside the box - that's where great ideas live!",
      "Your creative approach to money will open new doors.",
      "Innovation starts with curiosity, and you've got plenty!",
      "Keep dreaming big and taking smart financial steps!"
    ]
  },
  {
    id: 'liam',
    name: 'Liam',
    image: liamImage,
    personality: 'Focused & Ambitious',
    speciality: 'Saving & Goal Setting',
    catchphrase: "Focus + Action = Financial Freedom!",
    celebrationMessages: [
      "Your focus and determination are paying off! 🎯",
      "That's what happens when ambition meets knowledge! 🔥",
      "You're crushing your financial learning goals! 💪",
      "Focused effort always leads to amazing results! ⭐"
    ],
    encouragementMessages: [
      "Stay focused on your goals - you're closer than you think!",
      "Ambitious minds like yours achieve incredible things.",
      "Your determination is your superpower in building wealth.",
      "Keep that focus sharp - it's your key to success!"
    ]
  },
  {
    id: 'mateo',
    name: 'Mateo',
    image: mateoImage,
    personality: 'Curious & Analytical',
    speciality: 'Understanding Money & Research',
    catchphrase: "Knowledge is the foundation of wealth!",
    celebrationMessages: [
      "Your curiosity is unlocking financial wisdom! 🔍",
      "Analytical thinking leads to smart money decisions! 🧠",
      "You're asking all the right questions! ❓",
      "Knowledge + curiosity = unstoppable success! 📚"
    ],
    encouragementMessages: [
      "Keep asking questions - that's how experts are made!",
      "Your analytical mind will solve any financial challenge.",
      "Curiosity is the best investment you can make.",
      "Every question you ask makes you financially smarter!"
    ]
  }
];

interface CompanionMessage {
  id: string;
  text: string;
  type: 'encouragement' | 'tip' | 'celebration' | 'reminder';
  timestamp: number;
}

interface CompanionState {
  selectedCharacterId: string;
  lastInteraction: number;
  totalInteractions: number;
  messagesShown: string[];
}

interface CharacterCompanionProps {
  showSelection?: boolean;
}

export default function CharacterCompanion({ showSelection = false }: CharacterCompanionProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Get companion data from API
  const { data: apiCompanion } = useQuery({
    queryKey: ['/api/character-companion'],
    enabled: isAuthenticated,
  });
  
  const [companion, setCompanion] = useState<CompanionState>(() => {
    // Use API data if available, otherwise fallback to localStorage
    if (apiCompanion && typeof apiCompanion === 'object') {
      return {
        selectedCharacterId: (apiCompanion as any).selectedCharacterId || 'aisha',
        lastInteraction: new Date((apiCompanion as any).lastInteraction || Date.now()).getTime(),
        totalInteractions: (apiCompanion as any).totalInteractions || 0,
        messagesShown: (apiCompanion as any).messagesShown || []
      };
    }
    
    const stored = localStorage.getItem('character_companion');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      selectedCharacterId: 'aisha', // Default to Aisha
      lastInteraction: Date.now(),
      totalInteractions: 0,
      messagesShown: []
    };
  });
  
  const [currentMessage, setCurrentMessage] = useState<CompanionMessage | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showCharacterDetails, setShowCharacterDetails] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [introductionCharacter, setIntroductionCharacter] = useState<Character | null>(null);

  const selectedCharacter = CHARACTERS.find(c => c.id === companion.selectedCharacterId) || CHARACTERS[0];

  // Check for companion messages based on user progress
  useEffect(() => {
    checkForMessages();
  }, [selectedCharacter]);

  // Mutation to update companion state
  const updateCompanionMutation = useMutation({
    mutationFn: (companionData: Partial<CompanionState>) => 
      companionAPI.update({
        selectedCharacterId: companionData.selectedCharacterId,
        lastInteraction: companionData.lastInteraction ? new Date(companionData.lastInteraction) : new Date(),
        totalInteractions: companionData.totalInteractions,
        messagesShown: companionData.messagesShown
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/character-companion'] });
    },
  });

  // Save companion state
  useEffect(() => {
    if (isAuthenticated) {
      updateCompanionMutation.mutate(companion);
    } else {
      localStorage.setItem('character_companion', JSON.stringify(companion));
    }
  }, [companion, isAuthenticated]);
  
  // Sync with API data when it loads
  useEffect(() => {
    if (apiCompanion && isAuthenticated && typeof apiCompanion === 'object') {
      setCompanion({
        selectedCharacterId: (apiCompanion as any).selectedCharacterId || 'aisha',
        lastInteraction: new Date((apiCompanion as any).lastInteraction || Date.now()).getTime(),
        totalInteractions: (apiCompanion as any).totalInteractions || 0,
        messagesShown: (apiCompanion as any).messagesShown || []
      });
    }
  }, [apiCompanion, isAuthenticated]);

  // Listen for events that trigger companion reactions
  useEffect(() => {
    const handleCompanionEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      reactToEvent(type, data);
    };

    const handleCharacterCelebration = (event: CustomEvent) => {
      const { message } = event.detail;
      showCompanionMessage({
        id: `celebration-${Date.now()}`,
        text: message,
        type: 'celebration',
        timestamp: Date.now()
      });
    };

    const handleCharacterEncouragement = (event: CustomEvent) => {
      const { message } = event.detail;
      showCompanionMessage({
        id: `encouragement-${Date.now()}`,
        text: message,
        type: 'encouragement',
        timestamp: Date.now()
      });
    };

    window.addEventListener('companion-event', handleCompanionEvent as EventListener);
    window.addEventListener('character-celebration', handleCharacterCelebration as EventListener);
    window.addEventListener('character-encouragement', handleCharacterEncouragement as EventListener);
    
    return () => {
      window.removeEventListener('companion-event', handleCompanionEvent as EventListener);
      window.removeEventListener('character-celebration', handleCharacterCelebration as EventListener);
      window.removeEventListener('character-encouragement', handleCharacterEncouragement as EventListener);
    };
  }, [companion, selectedCharacter]);

  const checkForMessages = () => {
    const completedChapters = JSON.parse(localStorage.getItem('completed_chapters') || '[]').length;
    const streakData = JSON.parse(localStorage.getItem('reading_streaks') || '{}');
    const currentStreak = streakData.currentStreak || 0;
    const achievements = JSON.parse(localStorage.getItem('achievement_stats') || '{}');
    
    // Welcome message for new users
    if (completedChapters === 0 && !companion.messagesShown.includes('welcome')) {
      showCompanionMessage({
        id: 'welcome',
        text: `Hello there! I'm ${selectedCharacter.name}, your learning companion. ${selectedCharacter.catchphrase} Let's build your financial future together! 💰✨`,
        type: 'encouragement',
        timestamp: Date.now()
      });
      return;
    }

    // First chapter celebration
    if (completedChapters === 1 && !companion.messagesShown.includes('first-chapter')) {
      const message = selectedCharacter.celebrationMessages[0];
      showCompanionMessage({
        id: 'first-chapter',
        text: `${message} You've completed your first chapter!`,
        type: 'celebration',
        timestamp: Date.now()
      });
      return;
    }

    // Reading streak encouragement
    if (currentStreak >= 3 && !companion.messagesShown.includes('streak-3')) {
      const message = selectedCharacter.encouragementMessages[1];
      showCompanionMessage({
        id: 'streak-3',
        text: `${message} Three days in a row! 🔥`,
        type: 'encouragement',
        timestamp: Date.now()
      });
      return;
    }

    // Halfway celebration
    if (completedChapters >= 5 && !companion.messagesShown.includes('halfway')) {
      const message = selectedCharacter.celebrationMessages[2];
      showCompanionMessage({
        id: 'halfway',
        text: `${message} You're halfway through the book! 🌳✨`,
        type: 'celebration',
        timestamp: Date.now()
      });
      return;
    }

    // Random tips for active users
    if (Date.now() - companion.lastInteraction > 300000 && Math.random() < 0.3) { // 5 minutes
      const tips = [
        "Did you know? Try explaining what you learned to a family member - it helps the knowledge stick! 🧠",
        `Tip from ${selectedCharacter.name}: Use the calculator to practice with real numbers from your life! 🧮`,
        "Remember: Every small amount saved is a seed planted for your future! 🌱",
        "Pro tip: The glossary is full of important words - try the flashcard mode to master them! 📚"
      ];
      
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      const tipId = `tip-${Date.now()}`;
      
      if (!companion.messagesShown.includes(tipId)) {
        showCompanionMessage({
          id: tipId,
          text: randomTip,
          type: 'tip',
          timestamp: Date.now()
        });
      }
    }
  };

  const reactToEvent = (eventType: string, data: any) => {
    let message: CompanionMessage | null = null;

    switch (eventType) {
      case 'achievement-unlocked':
        const celebrationMsg = selectedCharacter.celebrationMessages[
          Math.floor(Math.random() * selectedCharacter.celebrationMessages.length)
        ];
        message = {
          id: `achievement-${Date.now()}`,
          text: `${celebrationMsg} You unlocked "${data.name}"! 🏆`,
          type: 'celebration',
          timestamp: Date.now()
        };
        break;
        
      case 'chapter-completed':
        const chapterMsg = selectedCharacter.celebrationMessages[
          Math.floor(Math.random() * selectedCharacter.celebrationMessages.length)
        ];
        message = {
          id: `chapter-${Date.now()}`,
          text: `${chapterMsg} Chapter completed! 📖✨`,
          type: 'celebration',
          timestamp: Date.now()
        };
        break;
        
      case 'note-created':
        message = {
          id: `note-${Date.now()}`,
          text: `Great note-taking! Writing down your thoughts helps you remember better. Smart thinking! 📝`,
          type: 'encouragement',
          timestamp: Date.now()
        };
        break;
        
      case 'quiz-completed':
        const score = data?.score || 0;
        if (score >= 80) {
          const excellentMsg = selectedCharacter.celebrationMessages[
            Math.floor(Math.random() * selectedCharacter.celebrationMessages.length)
          ];
          message = {
            id: `quiz-excellent-${Date.now()}`,
            text: `${excellentMsg} Excellent quiz score! 🌟`,
            type: 'celebration',
            timestamp: Date.now()
          };
        } else if (score >= 60) {
          const encourageMsg = selectedCharacter.encouragementMessages[
            Math.floor(Math.random() * selectedCharacter.encouragementMessages.length)
          ];
          message = {
            id: `quiz-good-${Date.now()}`,
            text: `${encourageMsg} Keep practicing! 💪`,
            type: 'encouragement',
            timestamp: Date.now()
          };
        }
        break;
    }

    if (message) {
      showCompanionMessage(message);
      
      setCompanion(prev => ({
        ...prev,
        lastInteraction: Date.now(),
        totalInteractions: prev.totalInteractions + 1
      }));
    }
  };

  const showCompanionMessage = (message: CompanionMessage) => {
    if (companion.messagesShown.includes(message.id)) {
      return; // Don't show duplicate messages
    }
    
    setCurrentMessage(message);
    setShowMessage(true);
    
    // Mark message as shown
    setCompanion(prev => ({
      ...prev,
      messagesShown: [...prev.messagesShown, message.id],
      lastInteraction: Date.now()
    }));

    // Auto-hide message after 8 seconds
    setTimeout(() => {
      setShowMessage(false);
      setTimeout(() => setCurrentMessage(null), 300);
    }, 8000);
  };

  const dismissMessage = () => {
    setShowMessage(false);
    setTimeout(() => setCurrentMessage(null), 300);
    // Stop any playing voice
    voiceService.stopCurrent();
    setIsPlayingVoice(false);
  };

  const handleVoiceToggle = async (text: string) => {
    if (isPlayingVoice) {
      voiceService.stopCurrent();
      setIsPlayingVoice(false);
      return;
    }

    if (!voiceEnabled) return;

    try {
      setIsPlayingVoice(true);
      await voiceService.playCharacterSpeech(selectedCharacter.id, text);
      setIsPlayingVoice(false);
    } catch (error) {
      // Don't log cancellation errors as they're expected behavior
      if (!(error as Error).message?.includes('Speech cancelled')) {
        // Error playing voice handled by voice service
      }
      setIsPlayingVoice(false);
    }
  };

  const toggleVoiceEnabled = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isPlayingVoice) {
      voiceService.stopCurrent();
      setIsPlayingVoice(false);
    }
  };

  const selectCharacter = (character: Character) => {
    // Stop any current speech before starting new character introduction
    voiceService.stopCurrent();
    setIsPlayingVoice(false);
    
    setCompanion(prev => ({
      ...prev,
      selectedCharacterId: character.id,
      lastInteraction: Date.now()
    }));
    
    // Show character introduction modal
    setIntroductionCharacter(character);
    setShowIntroduction(true);
  };

  const showEncouragement = () => {
    const message = selectedCharacter.encouragementMessages[
      Math.floor(Math.random() * selectedCharacter.encouragementMessages.length)
    ];
    showCompanionMessage({
      id: `manual-encouragement-${Date.now()}`,
      text: message,
      type: 'encouragement',
      timestamp: Date.now()
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'celebration': return <Sparkles className="text-yellow-400" size={16} />;
      case 'tip': return <MessageCircle className="text-blue-400" size={16} />;
      case 'encouragement': return <Heart className="text-red-400" size={16} />;
      default: return <MessageCircle className="text-slate-400" size={16} />;
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-36 right-4 w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full overflow-hidden shadow-lg hover:scale-110 transition-transform z-40"
        data-testid="button-show-companion"
        title={`Show ${selectedCharacter.name}`}
      >
        <img 
          src={selectedCharacter.image} 
          alt={selectedCharacter.name}
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  return (
    <div className="mb-6">
      {/* Character Display */}
      <div className="bg-gradient-to-r from-purple-950/20 to-blue-950/20 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-100 flex items-center gap-2 text-[18px]">
            <Heart className="text-purple-400" size={20} />
            Your Learning Companion
          </h3>
          {showSelection && (
            <button
              onClick={() => setShowCharacterDetails(!showCharacterDetails)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              data-testid="character-settings"
            >
              <Settings size={16} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Mobile-first responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Character avatar - centered on mobile, left-aligned on desktop */}
          <div className="relative self-center sm:self-start">
            <img
              src={selectedCharacter.image}
              alt={selectedCharacter.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-purple-400/50"
              data-testid="character-avatar"
              onError={(e) => {
                // Character image failed to load
              }}
              onLoad={() => {
                // Character image loaded successfully
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <Heart size={10} className="sm:w-3 sm:h-3 text-white" />
            </div>
          </div>
          
          {/* Character info - centered on mobile, flex-1 on desktop */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h4 className="font-semibold text-slate-100 text-lg">{selectedCharacter.name}</h4>
              <button
                onClick={() => handleVoiceToggle(`Hello! I'm ${selectedCharacter.name}, your ${selectedCharacter.personality.toLowerCase()} companion specializing in ${selectedCharacter.speciality.toLowerCase()}. ${selectedCharacter.catchphrase} I'm here to help you on your financial learning journey!`)}
                className="p-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                disabled={isPlayingVoice}
                data-testid="button-play-companion-intro"
                title={isPlayingVoice ? 'Playing...' : 'Hear my introduction'}
              >
                {isPlayingVoice ? (
                  <VolumeX size={14} />
                ) : (
                  <Volume2 size={14} />
                )}
              </button>
            </div>
            <p className="text-slate-300 text-sm">{selectedCharacter.personality}</p>
            <p className="text-purple-300 text-xs">Specializes in {selectedCharacter.speciality}</p>
          </div>

          {/* Chat button - full width on mobile, auto width on desktop */}
          <button
            onClick={showEncouragement}
            className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors touch-manipulation"
            data-testid="character-encourage"
          >
            <MessageCircle size={16} className="inline mr-2 sm:mr-1" />
            Chat with {selectedCharacter.name}
          </button>
        </div>

        {/* Character Message */}
        {currentMessage && showMessage && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-purple-500/30 rounded-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getMessageIcon(currentMessage.type)}
              </div>
              <div className="flex-1">
                <p className="text-slate-200 text-sm leading-relaxed">{currentMessage.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-slate-500">- {selectedCharacter.name}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVoiceToggle(currentMessage.text)}
                      className="p-1 rounded hover:bg-slate-700 transition-colors" 
                      disabled={isPlayingVoice}
                      data-testid="button-play-voice"
                      title={isPlayingVoice ? 'Playing...' : 'Play voice'}
                    >
                      {isPlayingVoice ? (
                        <VolumeX className="text-purple-400" size={14} />
                      ) : (
                        <Volume2 className="text-slate-400 hover:text-purple-400" size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={dismissMessage}
                className="p-1 rounded hover:bg-slate-700 transition-colors"
                data-testid="button-dismiss-message"
              >
                <X className="text-slate-400" size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Character Selection Panel */}
      {showCharacterDetails && showSelection && (
        <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h4 className="font-semibold text-slate-100 mb-4">Choose Your Learning Companion</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            {CHARACTERS.map((character) => (
              <div
                key={character.id}
                onClick={() => selectCharacter(character)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                  selectedCharacter.id === character.id
                    ? 'border-purple-500 bg-purple-950/30'
                    : 'border-slate-700 hover:border-purple-400/50'
                }`}
                data-testid={`character-${character.id}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-600"
                  />
                  <div>
                    <h5 className="font-semibold text-slate-100">{character.name}</h5>
                    <p className="text-slate-400 text-xs">{character.personality}</p>
                  </div>
                  {selectedCharacter.id === character.id && (
                    <div className="ml-auto text-purple-400">
                      <Heart size={16} fill="currentColor" />
                    </div>
                  )}
                </div>
                <p className="text-slate-300 text-sm mb-2">{character.speciality}</p>
                <p className="text-purple-300 text-xs italic">"{character.catchphrase}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
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

// Hook for other components to trigger companion events and character interactions
export const useCompanion = () => {
  const triggerCompanionEvent = (type: string, data?: any) => {
    window.dispatchEvent(new CustomEvent('companion-event', { detail: { type, data } }));
  };

  return { triggerCompanionEvent };
};

// Hook for other components to interact with characters
export const useCharacterCompanion = () => {
  const getSelectedCharacter = (): Character => {
    const stored = localStorage.getItem('character_companion');
    if (stored) {
      try {
        const companionState = JSON.parse(stored);
        const character = CHARACTERS.find(c => c.id === companionState.selectedCharacterId);
        if (character) {
          return character;
        }
      } catch (error) {
        // Failed to parse character companion state from localStorage
      }
    }
    return CHARACTERS[0]; // Default to first character (Aisha)
  };

  const celebrateAchievement = (achievementName: string) => {
    const character = getSelectedCharacter();
    const message = character.celebrationMessages[
      Math.floor(Math.random() * character.celebrationMessages.length)
    ];
    
    // Trigger character celebration event
    window.dispatchEvent(new CustomEvent('character-celebration', { 
      detail: { character, message, achievementName } 
    }));
  };

  const encourageUser = () => {
    const character = getSelectedCharacter();
    const message = character.encouragementMessages[
      Math.floor(Math.random() * character.encouragementMessages.length)
    ];
    
    // Trigger character encouragement event
    window.dispatchEvent(new CustomEvent('character-encouragement', { 
      detail: { character, message } 
    }));
  };

  return { getSelectedCharacter, celebrateAchievement, encourageUser };
};