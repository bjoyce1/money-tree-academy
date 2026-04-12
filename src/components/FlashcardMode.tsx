import { useState, useEffect } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Shuffle, CheckCircle, X, Zap } from 'lucide-react';
import glossary from '../data/glossary.json';

interface FlashcardModeProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  isFlipped: boolean;
  isCorrect?: boolean;
}

export default function FlashcardMode({ isOpen, onClose }: FlashcardModeProps) {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStudyMode, setIsStudyMode] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, streak: 0 });

  // Initialize cards from glossary
  useEffect(() => {
    if (isOpen) {
      const flashcards: FlashcardData[] = glossary.map(item => ({
        id: item.id,
        term: item.term,
        definition: item.shortDefinition,
        isFlipped: false
      }));
      
      setCards(shuffleArray([...flashcards]));
      setCurrentIndex(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setSessionStats({ correct: 0, total: 0, streak: 0 });
    }
  }, [isOpen]);

  const shuffleArray = (array: FlashcardData[]): FlashcardData[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const flipCard = () => {
    setCards(prev => prev.map((card, index) => 
      index === currentIndex 
        ? { ...card, isFlipped: !card.isFlipped }
        : card
    ));
  };

  const markCard = (isCorrect: boolean) => {
    const updatedStats = {
      correct: sessionStats.correct + (isCorrect ? 1 : 0),
      total: sessionStats.total + 1,
      streak: isCorrect ? sessionStats.streak + 1 : 0
    };
    
    setSessionStats(updatedStats);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }

    setCards(prev => prev.map((card, index) => 
      index === currentIndex 
        ? { ...card, isCorrect }
        : card
    ));

    // Auto advance to next card
    setTimeout(() => {
      nextCard();
    }, 500);
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of deck - show results
      setIsStudyMode(false);
    }
    
    // Reset flip state for next card
    setCards(prev => prev.map((card, index) => 
      index === currentIndex + 1 || (currentIndex === cards.length - 1 && index === 0)
        ? { ...card, isFlipped: false }
        : card
    ));
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCards(prev => prev.map((card, index) => 
        index === currentIndex - 1 
          ? { ...card, isFlipped: false }
          : card
      ));
    }
  };

  const restartSession = () => {
    setCards(shuffleArray([...cards]));
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSessionStats({ correct: 0, total: 0, streak: 0 });
    setIsStudyMode(true);
  };

  const shuffleCards = () => {
    setCards(shuffleArray([...cards]));
    setCurrentIndex(0);
  };

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400" size={20} />
            <h3 className="font-semibold text-slate-100">Flashcard Study Mode</h3>
          </div>
          <div className="flex items-center gap-2">
            {isStudyMode && (
              <>
                <button
                  onClick={shuffleCards}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
                  data-testid="button-shuffle-cards"
                  title="Shuffle Cards"
                >
                  <Shuffle size={16} />
                </button>
                <button
                  onClick={restartSession}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
                  data-testid="button-restart"
                  title="Restart"
                >
                  <RotateCcw size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              data-testid="button-close-flashcards"
            >
              <X className="text-slate-400" size={16} />
            </button>
          </div>
        </div>

        {isStudyMode && currentCard ? (
          <>
            {/* Progress Bar */}
            <div className="px-4 pt-4">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <div className="flex gap-4">
                  <span>Streak: {sessionStats.streak}</span>
                  <span>Accuracy: {accuracy}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Flashcard */}
            <div className="p-8">
              <div 
                className={`relative w-full h-64 cursor-pointer transition-transform duration-300 ${
                  currentCard.isFlipped ? 'scale-105' : 'hover:scale-102'
                }`}
                onClick={flipCard}
                data-testid="flashcard"
              >
                <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
                  !currentCard.isFlipped 
                    ? 'border-brand bg-gradient-to-br from-slate-800 to-slate-900' 
                    : 'border-brand2 bg-gradient-to-br from-slate-900 to-slate-800'
                } shadow-lg flex items-center justify-center p-6`}>
                  
                  {!currentCard.isFlipped ? (
                    <div className="text-center">
                      <h4 className="text-2xl font-bold text-slate-100 mb-4">
                        {currentCard.term}
                      </h4>
                      <p className="text-slate-400 text-sm">Click to see definition</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-lg text-slate-200 leading-relaxed mb-4">
                        {currentCard.definition}
                      </p>
                      <p className="text-slate-500 text-sm">Did you know this definition?</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                  className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
                  data-testid="button-prev-card"
                >
                  <ChevronLeft className="text-slate-300" size={20} />
                </button>

                {currentCard.isFlipped && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => markCard(false)}
                      className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors flex items-center gap-2"
                      data-testid="button-mark-incorrect"
                    >
                      <X size={16} />
                      Didn't Know
                    </button>
                    <button
                      onClick={() => markCard(true)}
                      className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center gap-2"
                      data-testid="button-mark-correct"
                    >
                      <CheckCircle size={16} />
                      Knew It!
                    </button>
                  </div>
                )}

                <button
                  onClick={nextCard}
                  disabled={currentIndex === cards.length - 1}
                  className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
                  data-testid="button-next-card"
                >
                  <ChevronRight className="text-slate-300" size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Results Screen */
          <div className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-100 mb-2">Study Session Complete!</h3>
              <p className="text-slate-400">Here's how you did:</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-950/20 border border-green-500/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                <div className="text-sm text-green-300">Correct</div>
              </div>
              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{incorrectCount}</div>
                <div className="text-sm text-red-300">Incorrect</div>
              </div>
              <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
                <div className="text-sm text-blue-300">Accuracy</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={restartSession}
                className="px-6 py-3 rounded-lg bg-brand hover:bg-brand/90 text-slate-900 font-semibold transition-colors"
                data-testid="button-study-again"
              >
                Study Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors"
                data-testid="button-finish-session"
              >
                Finish Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick access button for flashcards
export function FlashcardButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-40"
        data-testid="button-open-flashcards"
        title="Study with Flashcards"
      >
        <Zap size={20} />
      </button>
      
      <FlashcardMode isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}