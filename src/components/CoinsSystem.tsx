import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Star, Gift } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { coinsAPI } from '@/lib/api';

interface CoinTransaction {
  id: string;
  amount: number;
  reason: string;
  type: 'earned' | 'spent';
  timestamp: number;
  category: 'reading' | 'achievement' | 'streak' | 'quiz' | 'daily' | 'purchase' | 'bonus';
}

interface CoinsData {
  totalCoins: number;
  totalEarned: number;
  totalSpent: number;
  transactions: CoinTransaction[];
  lastDailyBonus: string;
  streakMultiplier: number;
}

export default function CoinsSystem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const [dailyBonusAvailable, setDailyBonusAvailable] = useState(false);
  
  // Get user coin data from guest user object
  const totalCoins = 0; // Always use localStorage for coins
  
  // Fallback localStorage state for guest users
  const [localCoinsData, setLocalCoinsData] = useState<CoinsData>({
    totalCoins: 0,
    totalEarned: 0,
    totalSpent: 0,
    transactions: [],
    lastDailyBonus: '',
    streakMultiplier: 1
  });

  useEffect(() => {
    loadLocalCoinsData();
    checkDailyBonus();
  }, []);

  // Listen for coin events from other components
  useEffect(() => {
    const handleCoinEvent = (event: CustomEvent) => {
      const { amount, reason, category } = event.detail;
      awardCoins(amount, reason, category);
    };

    const handleCoinsUpdate = () => {
      loadLocalCoinsData();
    };

    window.addEventListener('coin-earned', handleCoinEvent as any);
    window.addEventListener('coins-updated', handleCoinsUpdate);

    return () => {
      window.removeEventListener('coin-earned', handleCoinEvent as any);
      window.removeEventListener('coins-updated', handleCoinsUpdate);
    };
  }, []);

  const loadLocalCoinsData = () => {
    const stored = localStorage.getItem('coins_data');
    if (stored) {
      const data = JSON.parse(stored);
      setLocalCoinsData(data);
      
      // Apply streak multiplier if it's been a while since last activity
      const now = Date.now();
      const lastActivity = data.lastActivity || now;
      const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (daysSinceActivity >= 1) {
        const multiplier = Math.min(3, 1 + (daysSinceActivity * 0.1)); // Max 3x multiplier
        setLocalCoinsData(prev => ({
          ...prev,
          streakMultiplier: multiplier
        }));
      }
    }
  };

  const awardCoinsMutation = useMutation({
    mutationFn: async (coinData: { amount: number; reason: string; category: string }) => {
      // For guest users, just update localStorage
      return coinData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    }
  });

  const saveLocalCoinsData = (data: CoinsData) => {
    localStorage.setItem('coins_data', JSON.stringify(data));
    setLocalCoinsData(data);
  };

  const awardCoins = (baseAmount: number, reason: string, category: CoinTransaction['category']) => {
    const multipliedAmount = Math.round(baseAmount * localCoinsData.streakMultiplier);
    
    // For authenticated users, use the API
    if (user && user.id !== 'guest') {
      awardCoinsMutation.mutate({
        amount: multipliedAmount,
        reason,
        category
      });
    } else {
      // For guest users, update localStorage
      const transaction: CoinTransaction = {
        id: `${Date.now()}_${Math.random()}`,
        amount: multipliedAmount,
        reason,
        type: 'earned',
        timestamp: Date.now(),
        category
      };

      const updatedData: CoinsData = {
        ...localCoinsData,
        totalCoins: localCoinsData.totalCoins + multipliedAmount,
        totalEarned: localCoinsData.totalEarned + multipliedAmount,
        transactions: [transaction, ...localCoinsData.transactions].slice(0, 50),
        lastActivity: Date.now()
      };

      saveLocalCoinsData(updatedData);
    }
    
    showCoinNotification(multipliedAmount, reason);
  };

  const spendCoins = (amount: number, reason: string): boolean => {
    const currentCoins = localCoinsData.totalCoins;
    if (currentCoins < amount) {
      return false; // Insufficient funds
    }

    if (false) { // Always use localStorage
      // This would be for authenticated users
      return false;
    } else {
      // Guest users - update localStorage
      const transaction: CoinTransaction = {
        id: `${Date.now()}_${Math.random()}`,
        amount,
        reason,
        type: 'spent',
        timestamp: Date.now(),
        category: 'purchase'
      };

      const updatedData: CoinsData = {
        ...localCoinsData,
        totalCoins: localCoinsData.totalCoins - amount,
        totalSpent: localCoinsData.totalSpent + amount,
        transactions: [transaction, ...localCoinsData.transactions].slice(0, 50)
      };

      saveLocalCoinsData(updatedData);
      return true;
    }
  };

  const checkDailyBonus = () => {
    const today = new Date().toDateString();
    const lastBonus = localCoinsData.lastDailyBonus;
    if (lastBonus !== today) {
      setDailyBonusAvailable(true);
    }
  };

  const claimDailyBonus = () => {
    const today = new Date().toDateString();
    const baseBonus = 10;
    const streakBonus = Math.min(10, Math.floor(localCoinsData.streakMultiplier * 5));
    const totalBonus = baseBonus + streakBonus;

    awardCoins(totalBonus, `Daily bonus (+${streakBonus} streak bonus)`, 'daily');
    
    if (user && user.id === 'guest') {
      // Update localStorage for guest users
      const updatedData = {
        ...localCoinsData,
        lastDailyBonus: today
      };
      saveLocalCoinsData(updatedData);
    }
    // For authenticated users, lastDailyBonus is handled in the API
    setDailyBonusAvailable(false);
  };

  const showCoinNotification = (amount: number, reason: string) => {
    // Create floating notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-lg">🪙</span>
        <div>
          <div class="font-semibold">+${amount} coins!</div>
          <div class="text-xs opacity-90">${reason}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const getCategoryIcon = (category: CoinTransaction['category']) => {
    switch (category) {
      case 'reading': return '📖';
      case 'achievement': return '🏆';
      case 'streak': return '🔥';
      case 'quiz': return '🧠';
      case 'daily': return '🎁';
      case 'bonus': return '✨';
      default: return '💰';
    }
  };

  return (
    <div className="relative">
      {/* Coins Display */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        data-testid="button-coins-display"
      >
        <Coins size={20} />
        <span className="font-bold">{localCoinsData.totalCoins}</span>
        {localCoinsData.streakMultiplier > 1 && (
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
            {localCoinsData.streakMultiplier.toFixed(1)}x
          </span>
        )}
        {dailyBonusAvailable && (
          <Gift size={16} className="text-green-200 animate-pulse" />
        )}
      </button>

      {/* Detailed Coins Panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Coins size={20} className="text-yellow-500" />
              Your Coins
            </h4>
            <button
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-slate-800 rounded-lg">
              <div className="text-yellow-500 font-bold text-lg">{localCoinsData.totalCoins}</div>
              <div className="text-xs text-slate-400">Current</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded-lg">
              <div className="text-green-400 font-bold text-lg">{localCoinsData.totalEarned}</div>
              <div className="text-xs text-slate-400">Earned</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded-lg">
              <div className="text-red-400 font-bold text-lg">{localCoinsData.totalSpent}</div>
              <div className="text-xs text-slate-400">Spent</div>
            </div>
          </div>

          {/* Daily Bonus */}
          {dailyBonusAvailable && (
            <button
              onClick={claimDailyBonus}
              className="w-full mb-4 p-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              data-testid="button-claim-daily-bonus"
            >
              <Gift size={16} />
              <span>Claim Daily Bonus!</span>
            </button>
          )}

          {/* Recent Transactions */}
          {localCoinsData.transactions.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <TrendingUp size={16} />
                Recent Activity
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {localCoinsData.transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-2 rounded flex items-center justify-between ${
                      transaction.type === 'earned' 
                        ? 'bg-green-950/20 border border-green-500/20' 
                        : 'bg-red-950/20 border border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
                      <div>
                        <div className={`font-medium ${
                          transaction.type === 'earned' ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} coins
                        </div>
                        <div className="text-xs text-slate-400">{transaction.reason}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coins Earning Guide */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
            <h5 className="font-semibold text-slate-200 mb-2">How to Earn Coins:</h5>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-300">
              <div>📖 Reading chapters: 15-25 coins</div>
              <div>🏆 Unlocking achievements: 10-50 coins</div>
              <div>🔥 Daily reading streak: 5-20 coins</div>
              <div>🧠 Completing quizzes: 10-30 coins</div>
              <div>🎁 Daily bonus: 10-20 coins</div>
              <div>✨ Perfect quiz scores: 15 extra coins</div>
            </div>
            {localCoinsData.streakMultiplier > 1 && (
              <div className="mt-2 text-orange-300 text-sm">
                🔥 Current streak multiplier: {localCoinsData.streakMultiplier.toFixed(1)}x on all earnings!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for other components to award/spend coins
export const useCoins = () => {
  const awardCoins = (amount: number, reason: string, category: CoinTransaction['category']) => {
    window.dispatchEvent(new CustomEvent('coin-earned', { detail: { amount, reason, category } }));
  };

  const spendCoins = (amount: number, reason: string): boolean => {
    const coinsData = JSON.parse(localStorage.getItem('coins_data') || '{"totalCoins": 0}');
    if (coinsData.totalCoins < amount) {
      return false;
    }

    // Create spending transaction
    const transaction = {
      id: `${Date.now()}_${Math.random()}`,
      amount,
      reason,
      type: 'spent',
      timestamp: Date.now(),
      category: 'purchase'
    };

    const updatedData = {
      ...coinsData,
      totalCoins: coinsData.totalCoins - amount,
      totalSpent: (coinsData.totalSpent || 0) + amount,
      transactions: [transaction, ...(coinsData.transactions || [])].slice(0, 50)
    };

    localStorage.setItem('coins_data', JSON.stringify(updatedData));
    
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('coins-updated'));
    
    return true;
  };

  const getCurrentCoins = (): number => {
    const coinsData = JSON.parse(localStorage.getItem('coins_data') || '{"totalCoins": 0}');
    return coinsData.totalCoins;
  };

  return { awardCoins, spendCoins, getCurrentCoins };
};