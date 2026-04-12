import { useState, useEffect } from 'react';
import { GamepadIcon, Trophy, Star, Shuffle, CheckCircle, X, Target, Coins } from 'lucide-react';
import { useCoins } from './CoinsSystem';

interface GameScore {
  gameId: string;
  score: number;
  maxScore: number;
  timeElapsed: number;
  completed: boolean;
  date: string;
}

interface MiniGame {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'budgeting' | 'saving' | 'shopping' | 'knowledge' | 'investing';
  color: string;
}

const MINI_GAMES: MiniGame[] = [
  {
    id: 'budget-puzzle',
    name: 'Budget Puzzle',
    description: 'Sort expenses into Needs, Wants, Save, and Share categories',
    icon: <Target className="text-blue-400" size={20} />,
    difficulty: 'Easy',
    category: 'budgeting',
    color: 'border-blue-500/30 bg-blue-950/20'
  },
  {
    id: 'savings-calculator',
    name: 'Savings Challenge',
    description: 'Calculate how long it takes to reach your savings goals',
    icon: <Coins className="text-green-400" size={20} />,
    difficulty: 'Medium',
    category: 'saving',
    color: 'border-green-500/30 bg-green-950/20'
  },
  {
    id: 'smart-shopping',
    name: 'Smart Shopping',
    description: 'Make the best purchases with your limited budget',
    icon: <CheckCircle className="text-purple-400" size={20} />,
    difficulty: 'Medium',
    category: 'shopping',
    color: 'border-purple-500/30 bg-purple-950/20'
  },
  {
    id: 'money-matching',
    name: 'Money Matching',
    description: 'Match financial terms with their correct definitions',
    icon: <Shuffle className="text-yellow-400" size={20} />,
    difficulty: 'Easy',
    category: 'knowledge',
    color: 'border-yellow-500/30 bg-yellow-950/20'
  }
];

export default function MiniGames() {
  const [selectedGame, setSelectedGame] = useState<MiniGame | null>(null);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [showGames, setShowGames] = useState(false);
  const { awardCoins } = useCoins();

  useEffect(() => {
    const stored = localStorage.getItem('mini_game_scores');
    if (stored) {
      setGameScores(JSON.parse(stored));
    }
  }, []);

  const saveGameScore = (score: GameScore) => {
    const updatedScores = [...gameScores.filter(s => s.gameId !== score.gameId || s.date !== score.date), score];
    setGameScores(updatedScores);
    localStorage.setItem('mini_game_scores', JSON.stringify(updatedScores));
    
    // Award coins based on performance
    const percentage = (score.score / score.maxScore) * 100;
    let coinReward = 10; // Base reward
    
    if (percentage === 100) {
      coinReward = 30; // Perfect score
    } else if (percentage >= 80) {
      coinReward = 25; // Excellent
    } else if (percentage >= 60) {
      coinReward = 20; // Good
    } else {
      coinReward = 15; // Participation
    }
    
    const game = MINI_GAMES.find(g => g.id === score.gameId);
    awardCoins(coinReward, `${game?.name} (${percentage.toFixed(0)}% score)`, 'quiz');
  };

  const getGameScore = (gameId: string): GameScore | null => {
    return gameScores.find(score => score.gameId === gameId) || null;
  };

  const renderGameInterface = () => {
    if (!selectedGame) return null;

    switch (selectedGame.id) {
      case 'budget-puzzle':
        return <BudgetPuzzleGame game={selectedGame} onComplete={(score) => { saveGameScore(score); setSelectedGame(null); }} />;
      case 'savings-calculator':
        return <SavingsCalculatorGame game={selectedGame} onComplete={(score) => { saveGameScore(score); setSelectedGame(null); }} />;
      case 'smart-shopping':
        return <SmartShoppingGame game={selectedGame} onComplete={(score) => { saveGameScore(score); setSelectedGame(null); }} />;
      case 'money-matching':
        return <MoneyMatchingGame game={selectedGame} onComplete={(score) => { saveGameScore(score); setSelectedGame(null); }} />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              {selectedGame.icon}
              <h3 className="text-xl font-bold text-slate-100">{selectedGame.name}</h3>
            </div>
            <button
              onClick={() => setSelectedGame(null)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              data-testid="button-close-game"
            >
              <X className="text-slate-400" size={20} />
            </button>
          </div>
          <div className="p-6">
            {renderGameInterface()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Mini-Games Summary */}
      <div 
        className="bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-500/30 rounded-xl p-4 cursor-pointer hover:border-indigo-400/50 transition-colors"
        onClick={() => setShowGames(!showGames)}
        data-testid="mini-games-summary"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GamepadIcon className="text-indigo-400" size={20} />
            <div>
              <h3 className="font-semibold text-slate-100">Mini-Games</h3>
              <p className="text-slate-400 text-sm">Fun financial literacy challenges and puzzles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <span className="text-sm text-slate-400">{gameScores.filter(s => s.completed).length}/{MINI_GAMES.length}</span>
          </div>
        </div>
      </div>

      {/* Expanded Games Panel */}
      {showGames && (
        <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {MINI_GAMES.map((game) => {
              const score = getGameScore(game.id);
              const isCompleted = score?.completed || false;
              
              return (
                <div
                  key={game.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${game.color}`}
                  onClick={() => setSelectedGame(game)}
                  data-testid={`game-${game.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {game.icon}
                      <div>
                        <h4 className="font-semibold text-slate-100">{game.name}</h4>
                        <p className="text-sm text-slate-300 mb-2">{game.description}</p>
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="text-green-400" size={20} />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded ${
                      game.difficulty === 'Easy' ? 'bg-green-900/30 text-green-300' :
                      game.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-300' :
                      'bg-red-900/30 text-red-300'
                    }`}>
                      {game.difficulty}
                    </span>
                    {score && (
                      <span className="text-slate-400">
                        Best: {Math.round((score.score / score.maxScore) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Budget Puzzle Game Component
function BudgetPuzzleGame({ game, onComplete }: { game: MiniGame; onComplete: (score: GameScore) => void }) {
  const expenses = [
    { name: 'School Lunch', amount: 5, correctCategory: 'needs' },
    { name: 'Video Game', amount: 25, correctCategory: 'wants' },
    { name: 'College Fund', amount: 20, correctCategory: 'save' },
    { name: 'Charity Donation', amount: 5, correctCategory: 'share' },
    { name: 'School Supplies', amount: 15, correctCategory: 'needs' },
    { name: 'Ice Cream', amount: 3, correctCategory: 'wants' },
    { name: 'Birthday Fund', amount: 10, correctCategory: 'save' },
    { name: 'Gift for Friend', amount: 8, correctCategory: 'share' }
  ];

  const [categorized, setCategorized] = useState<{[key: string]: typeof expenses}>({
    needs: [],
    wants: [],
    save: [],
    share: []
  });
  const [remaining, setRemaining] = useState(expenses);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const handleDrop = (item: typeof expenses[0], category: string) => {
    setRemaining(prev => prev.filter(exp => exp.name !== item.name));
    setCategorized(prev => ({
      ...prev,
      [category]: [...prev[category], item]
    }));

    if (item.correctCategory === category) {
      setScore(prev => prev + 1);
    }

    // Check if game is complete
    if (remaining.length === 1) {
      const finalScore = item.correctCategory === category ? score + 1 : score;
      const timeElapsed = Date.now() - startTime;
      
      setTimeout(() => {
        setGameCompleted(true);
        onComplete({
          gameId: game.id,
          score: finalScore,
          maxScore: expenses.length,
          timeElapsed,
          completed: true,
          date: new Date().toISOString().split('T')[0]
        });
      }, 1000);
    }
  };

  const categories = [
    { id: 'needs', name: 'Needs', color: 'bg-green-600', description: 'Must have' },
    { id: 'wants', name: 'Wants', color: 'bg-blue-600', description: 'Nice to have' },
    { id: 'save', name: 'Save', color: 'bg-purple-600', description: 'For the future' },
    { id: 'share', name: 'Share', color: 'bg-orange-600', description: 'Help others' }
  ];

  if (gameCompleted) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-100 mb-2">Great Job!</h3>
        <p className="text-slate-300 mb-4">You correctly categorized {score} out of {expenses.length} expenses!</p>
        <div className="text-4xl mb-4">
          {score === expenses.length ? '🎉' : score >= expenses.length * 0.7 ? '👏' : '💪'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-slate-300 mb-2">Drag each expense to the correct budget category!</p>
        <p className="text-sm text-slate-400">Score: {score}/{expenses.length}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {categories.map(category => (
          <div key={category.id} className="text-center">
            <div className={`${category.color} text-white p-3 rounded-t-lg`}>
              <h4 className="font-semibold">{category.name}</h4>
              <p className="text-xs opacity-90">{category.description}</p>
            </div>
            <div 
              className="min-h-32 bg-slate-800 border-2 border-dashed border-slate-600 rounded-b-lg p-2"
              onDrop={(e) => {
                e.preventDefault();
                const itemName = e.dataTransfer.getData('text/plain');
                const item = remaining.find(exp => exp.name === itemName);
                if (item) handleDrop(item, category.id);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {categorized[category.id].map(item => (
                <div key={item.name} className="bg-slate-700 text-slate-200 p-2 rounded mb-1 text-xs">
                  {item.name} (${item.amount})
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {remaining.map(expense => (
          <div
            key={expense.name}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', expense.name)}
            className="bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 p-3 rounded-lg cursor-move hover:from-slate-600 hover:to-slate-700 transition-colors"
          >
            <div className="font-medium">{expense.name}</div>
            <div className="text-sm text-slate-400">${expense.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Savings Calculator Game Component  
function SavingsCalculatorGame({ game, onComplete }: { game: MiniGame; onComplete: (score: GameScore) => void }) {
  const challenges = [
    { goal: 'New Bike', cost: 120, weeklyAllowance: 10, question: 'How many weeks to save?', answer: 12 },
    { goal: 'Video Game', cost: 60, monthlyEarnings: 25, question: 'How many months to save?', answer: 3 },
    { goal: 'College Fund', cost: 1000, yearlyGifts: 200, question: 'How many years to save?', answer: 5 },
    { goal: 'Phone', cost: 300, dailySavings: 2, question: 'How many days to save?', answer: 150 }
  ];

  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = () => {
    const challenge = challenges[currentChallenge];
    const correct = parseInt(userAnswer) === challenge.answer;
    
    if (correct) {
      setScore(prev => prev + 1);
      setFeedback('Correct! Great math skills! 🎉');
    } else {
      setFeedback(`Not quite! The answer is ${challenge.answer}. Keep practicing! 💪`);
    }

    setTimeout(() => {
      if (currentChallenge < challenges.length - 1) {
        setCurrentChallenge(prev => prev + 1);
        setUserAnswer('');
        setFeedback('');
      } else {
        const timeElapsed = Date.now() - startTime;
        setGameCompleted(true);
        onComplete({
          gameId: game.id,
          score,
          maxScore: challenges.length,
          timeElapsed,
          completed: true,
          date: new Date().toISOString().split('T')[0]
        });
      }
    }, 2000);
  };

  if (gameCompleted) {
    return (
      <div className="text-center py-8">
        <Coins className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-100 mb-2">Savings Master!</h3>
        <p className="text-slate-300 mb-4">You solved {score} out of {challenges.length} challenges!</p>
        <div className="text-4xl">
          {score === challenges.length ? '🏆' : score >= challenges.length * 0.7 ? '🌟' : '📈'}
        </div>
      </div>
    );
  }

  const challenge = challenges[currentChallenge];
  
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Challenge {currentChallenge + 1}/{challenges.length}</h3>
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg mb-4">
          <h4 className="font-bold text-lg">{challenge.goal}</h4>
          <p className="text-lg">${challenge.cost}</p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg mb-4">
        <p className="text-slate-300 mb-2">{challenge.question}</p>
        <p className="text-sm text-slate-400 mb-4">
          Savings rate: ${Object.entries(challenge).find(([key]) => key.includes('allowance') || key.includes('earnings') || key.includes('gifts') || key.includes('savings'))?.[1]} per {Object.keys(challenge).find(key => key.includes('weekly')) ? 'week' : Object.keys(challenge).find(key => key.includes('monthly')) ? 'month' : Object.keys(challenge).find(key => key.includes('yearly')) ? 'year' : 'day'}
        </p>
        
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 focus:border-green-400 focus:outline-none mb-4"
          placeholder="Enter your answer"
          data-testid="savings-answer-input"
        />
        
        <button
          onClick={handleSubmit}
          disabled={!userAnswer}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          data-testid="savings-submit-button"
        >
          Submit Answer
        </button>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg ${feedback.includes('Correct') ? 'bg-green-950/30 text-green-300' : 'bg-yellow-950/30 text-yellow-300'}`}>
          {feedback}
        </div>
      )}
    </div>
  );
}

// Smart Shopping Game Component
function SmartShoppingGame({ game, onComplete }: { game: MiniGame; onComplete: (score: GameScore) => void }) {
  const items = [
    { name: 'Healthy Lunch', price: 8, value: 9, category: 'Food' },
    { name: 'Designer T-Shirt', price: 45, value: 15, category: 'Clothing' },
    { name: 'Math Workbook', price: 12, value: 25, category: 'Education' },
    { name: 'Expensive Headphones', price: 150, value: 80, category: 'Electronics' },
    { name: 'Quality Backpack', price: 35, value: 40, category: 'School' },
    { name: 'Candy Bar', price: 2, value: 3, category: 'Snacks' },
    { name: 'Used Book', price: 5, value: 20, category: 'Education' },
    { name: 'Premium Game', price: 60, value: 30, category: 'Entertainment' }
  ];

  const [budget] = useState(100);
  const [spent, setSpent] = useState(0);
  const [purchased, setPurchased] = useState<typeof items>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const handlePurchase = (item: typeof items[0]) => {
    if (spent + item.price <= budget) {
      setSpent(prev => prev + item.price);
      setPurchased(prev => [...prev, item]);
    }
  };

  const handleFinish = () => {
    const totalValue = purchased.reduce((sum, item) => sum + item.value, 0);
    const efficiency = totalValue / Math.max(spent, 1);
    const score = Math.min(10, Math.round(efficiency * 2));
    const timeElapsed = Date.now() - startTime;
    
    setGameCompleted(true);
    onComplete({
      gameId: game.id,
      score,
      maxScore: 10,
      timeElapsed,
      completed: true,
      date: new Date().toISOString().split('T')[0]
    });
  };

  if (gameCompleted) {
    const totalValue = purchased.reduce((sum, item) => sum + item.value, 0);
    const efficiency = totalValue / Math.max(spent, 1);
    
    return (
      <div className="text-center py-8">
        <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-100 mb-2">Shopping Complete!</h3>
        <div className="bg-slate-800 p-4 rounded-lg mb-4">
          <p className="text-slate-300">Budget Used: ${spent}/${budget}</p>
          <p className="text-slate-300">Total Value: {totalValue} points</p>
          <p className="text-green-400 font-semibold">Efficiency Score: {efficiency.toFixed(2)}x</p>
        </div>
        <div className="text-4xl">
          {efficiency >= 2 ? '🛍️🏆' : efficiency >= 1.5 ? '🛒✨' : '💰📚'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Smart Shopping Challenge</h3>
        <p className="text-slate-300 mb-2">Buy items with the best value for your budget!</p>
        <div className="bg-slate-800 p-3 rounded-lg">
          <p className="text-lg text-green-400">Budget: ${budget} | Spent: ${spent} | Remaining: ${budget - spent}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {items.map(item => {
          const canAfford = spent + item.price <= budget;
          const isPurchased = purchased.some(p => p.name === item.name);
          
          return (
            <div
              key={item.name}
              className={`p-4 rounded-lg border transition-all ${
                isPurchased ? 'border-green-500/30 bg-green-950/20' :
                canAfford ? 'border-slate-600 bg-slate-800 hover:border-slate-500' :
                'border-slate-700 bg-slate-900 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-slate-100">{item.name}</h4>
                  <p className="text-xs text-slate-400">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-100">${item.price}</p>
                  <p className="text-xs text-green-400">{item.value} value</p>
                </div>
              </div>
              
              <button
                onClick={() => handlePurchase(item)}
                disabled={!canAfford || isPurchased}
                className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                  isPurchased ? 'bg-green-600 text-white' :
                  canAfford ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                  'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                data-testid={`buy-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {isPurchased ? 'Purchased ✓' : canAfford ? 'Buy Now' : 'Can\'t Afford'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={handleFinish}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          data-testid="finish-shopping"
        >
          Finish Shopping
        </button>
      </div>
    </div>
  );
}

// Money Matching Game Component
function MoneyMatchingGame({ game, onComplete }: { game: MiniGame; onComplete: (score: GameScore) => void }) {
  const terms = [
    { term: 'Budget', definition: 'A plan for how to spend your money' },
    { term: 'Savings', definition: 'Money you keep for later instead of spending now' },
    { term: 'Investment', definition: 'Using money to try to make more money over time' },
    { term: 'Interest', definition: 'Extra money you earn or pay on borrowed money' },
    { term: 'Expenses', definition: 'Things you spend money on' },
    { term: 'Income', definition: 'Money you receive from work or other sources' }
  ];

  const [shuffledDefinitions, setShuffledDefinitions] = useState<string[]>([]);
  const [matches, setMatches] = useState<{[key: string]: string}>({});
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const definitions = [...terms.map(t => t.definition)].sort(() => Math.random() - 0.5);
    setShuffledDefinitions(definitions);
  }, []);

  const handleMatch = (term: string, definition: string) => {
    const correct = terms.find(t => t.term === term)?.definition === definition;
    
    setMatches(prev => ({
      ...prev,
      [term]: definition
    }));

    if (correct) {
      setScore(prev => prev + 1);
    }

    // Check if game is complete
    if (Object.keys(matches).length === terms.length - 1) {
      const timeElapsed = Date.now() - startTime;
      setTimeout(() => {
        setGameCompleted(true);
        onComplete({
          gameId: game.id,
          score: correct ? score + 1 : score,
          maxScore: terms.length,
          timeElapsed,
          completed: true,
          date: new Date().toISOString().split('T')[0]
        });
      }, 1000);
    }
  };

  if (gameCompleted) {
    return (
      <div className="text-center py-8">
        <Shuffle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-100 mb-2">Perfect Matching!</h3>
        <p className="text-slate-300 mb-4">You matched {score} out of {terms.length} correctly!</p>
        <div className="text-4xl">
          {score === terms.length ? '🧠🏆' : score >= terms.length * 0.7 ? '📖✨' : '🔄💪'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Money Matching Challenge</h3>
        <p className="text-slate-300">Match each financial term with its correct definition!</p>
        <p className="text-sm text-slate-400">Score: {score}/{terms.length}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Terms Column */}
        <div>
          <h4 className="font-semibold text-slate-100 mb-4 text-center">Terms</h4>
          <div className="space-y-3">
            {terms.map(({ term }) => (
              <div
                key={term}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  matches[term] ? 'border-green-500/30 bg-green-950/20' : 'border-blue-500/30 bg-blue-950/20 hover:border-blue-400/50'
                }`}
                data-testid={`term-${term.toLowerCase()}`}
              >
                <div className="font-semibold text-slate-100">{term}</div>
                {matches[term] && (
                  <div className="text-xs text-slate-400 mt-1">Matched!</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Definitions Column */}
        <div>
          <h4 className="font-semibold text-slate-100 mb-4 text-center">Definitions</h4>
          <div className="space-y-3">
            {shuffledDefinitions.map((definition, index) => {
              const matchedTerm = Object.entries(matches).find(([_, def]) => def === definition)?.[0];
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    matchedTerm ? 'border-green-500/30 bg-green-950/20 opacity-60' : 'border-purple-500/30 bg-purple-950/20 hover:border-purple-400/50'
                  }`}
                  onClick={() => {
                    if (!matchedTerm) {
                      // Find the first unmatched term
                      const unmatchedTerm = terms.find(t => !matches[t.term])?.term;
                      if (unmatchedTerm) {
                        handleMatch(unmatchedTerm, definition);
                      }
                    }
                  }}
                  data-testid={`definition-${index}`}
                >
                  <div className="text-slate-200 text-sm">{definition}</div>
                  {matchedTerm && (
                    <div className="text-xs text-green-400 mt-1">Matched with {matchedTerm}!</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}