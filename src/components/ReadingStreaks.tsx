import React, { useState, useCallback, useEffect } from 'react';
import { Flame, Calendar, Award, Target, TrendingUp } from 'lucide-react';
import { useCoins } from './CoinsSystem';

interface ReadingSession {
  date: string;
  chapterId: string;
  chapterTitle: string;
  readingTime: number; // in seconds
  completedChapter: boolean;
}

type StreakData = {
  lastReadISO: string;
  streakCount: number;
  longestStreak: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  unlocked: boolean;
  unlockedDate?: string;
}

const ReadingStreaks: React.FC = () => {
  const { awardCoins } = useCoins();
  
  const [streakData, setStreakData] = useState<StreakData>(() => {
    try {
      const raw = localStorage.getItem('reading_streaks');
      return raw ? JSON.parse(raw) : { lastReadISO: '', streakCount: 0, longestStreak: 0 };
    } catch {
      return { lastReadISO: '', streakCount: 0, longestStreak: 0 };
    }
  });

  const [todayRead, setTodayRead] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);

  const recordReadingDay = useCallback(() => {
    const today = new Date();
    const todayISO = today.toISOString();

    let streakCount = 1;
    let longestStreak = Math.max(1, streakData.longestStreak);

    if (streakData.lastReadISO) {
      const last = new Date(streakData.lastReadISO);
      const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const diffDays = Math.round((startOf(today) - startOf(last)) / 86400000);

      if (diffDays === 0) {
        // already counted today
        setTodayRead(true);
        return;
      } else if (diffDays === 1) {
        streakCount = streakData.streakCount + 1;
        longestStreak = Math.max(longestStreak, streakCount);
      } else {
        streakCount = 1;
      }
    }

    const newStreakData: StreakData = {
      lastReadISO: todayISO,
      streakCount,
      longestStreak
    };

    setStreakData(newStreakData);
    setTodayRead(true);
    localStorage.setItem('reading_streaks', JSON.stringify(newStreakData));

    // Award coins for streak
    const streakCoins = Math.min(5 + streakCount * 2, 20); // 7-20 coins based on streak
    awardCoins(streakCoins, `${streakCount} day reading streak!`, 'streak');
    
    // Update badges
    updateBadges(newStreakData);
    
    // Show streak notification
    showStreakNotification(streakCount);
  }, [streakData, awardCoins]);

  // Update reading streak when user reads
  useEffect(() => {
    const handleReadingActivity = () => {
      recordReadingDay();
    };

    // Listen for reading activity
    window.addEventListener('reading-activity', handleReadingActivity);
    return () => window.removeEventListener('reading-activity', handleReadingActivity);
  }, [recordReadingDay]);

  // optional hydration or side effects
  useEffect(() => {
    // Check if user read today on mount
    const today = new Date().toISOString().split('T')[0];
    const lastRead = streakData.lastReadISO ? new Date(streakData.lastReadISO).toISOString().split('T')[0] : '';
    setTodayRead(lastRead === today);
  }, [streakData.lastReadISO]);

  const updateBadges = (data: StreakData) => {
    const today = new Date().toISOString().split('T')[0];
    
    const streakBadges: Badge[] = [
      {
        id: 'first-read',
        name: 'First Steps',
        description: 'Started your reading journey!',
        icon: <Flame className="text-orange-400" size={16} />,
        requirement: 1,
        unlocked: data.streakCount >= 1,
        unlockedDate: data.streakCount >= 1 ? today : undefined
      },
      {
        id: 'streak-3',
        name: 'Getting Started',
        description: '3 days reading streak',
        icon: <Flame className="text-orange-500" size={16} />,
        requirement: 3,
        unlocked: data.streakCount >= 3,
        unlockedDate: data.streakCount >= 3 ? today : undefined
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: '7 days reading streak',
        icon: <Flame className="text-red-400" size={16} />,
        requirement: 7,
        unlocked: data.streakCount >= 7,
        unlockedDate: data.streakCount >= 7 ? today : undefined
      },
      {
        id: 'streak-14',
        name: 'Two Week Champion',
        description: '14 days reading streak',
        icon: <Award className="text-purple-400" size={16} />,
        requirement: 14,
        unlocked: data.streakCount >= 14,
        unlockedDate: data.streakCount >= 14 ? today : undefined
      },
      {
        id: 'streak-30',
        name: 'Monthly Master',
        description: '30 days reading streak',
        icon: <Award className="text-yellow-400" size={16} />,
        requirement: 30,
        unlocked: data.streakCount >= 30,
        unlockedDate: data.streakCount >= 30 ? today : undefined
      },
      {
        id: 'longest-10',
        name: 'Persistence Pro',
        description: 'Longest streak of 10+ days',
        icon: <TrendingUp className="text-green-400" size={16} />,
        requirement: 10,
        unlocked: data.longestStreak >= 10,
        unlockedDate: data.longestStreak >= 10 ? today : undefined
      }
    ];

    setBadges(streakBadges);
    
    // Store unlocked badges
    const unlockedBadges = streakBadges.filter(b => b.unlocked);
    localStorage.setItem('unlocked_streak_badges', JSON.stringify(unlockedBadges));
  };

  const showStreakNotification = (streak: number) => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span>🔥</span>
        <span class="font-semibold">${streak} Day Streak!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const getStreakMessage = () => {
    if (streakData.streakCount === 0) {
      return "Start reading to begin your streak!";
    } else if (streakData.streakCount === 1) {
      return "Great start! Come back tomorrow to continue your streak.";
    } else if (streakData.streakCount < 7) {
      return `Awesome! Keep it up for ${7 - streakData.streakCount} more days to earn the Week Warrior badge!`;
    } else if (streakData.streakCount < 30) {
      return `Amazing streak! You're ${30 - streakData.streakCount} days away from Monthly Master!`;
    } else {
      return "Incredible dedication! You're a true reading master! 🎉";
    }
  };

  const getStreakColor = () => {
    if (streakData.streakCount >= 30) return 'text-yellow-400';
    if (streakData.streakCount >= 14) return 'text-purple-400';
    if (streakData.streakCount >= 7) return 'text-red-400';
    if (streakData.streakCount >= 3) return 'text-orange-400';
    return 'text-slate-400';
  };

  // Manually trigger reading activity for testing
  const markReadingDay = () => {
    recordReadingDay();
  };

  return (
    <div className="bg-gradient-to-r from-orange-950/20 to-red-950/20 border border-orange-500/30 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Flame className={`${getStreakColor()} animate-pulse`} size={24} />
          <div>
            <h3 className="text-xl font-bold text-slate-100">Reading Streak</h3>
            <p className="text-slate-400 text-sm">{getStreakMessage()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getStreakColor()}`}>
            {streakData.streakCount}
          </div>
          <div className="text-xs text-slate-400">Days in a row</div>
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className="text-lg font-bold text-purple-400">{streakData.longestStreak}</div>
          <div className="text-xs text-slate-400">Longest Streak</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className="text-lg font-bold text-blue-400">{streakData.streakCount}</div>
          <div className="text-xs text-slate-400">Current Days</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className={`text-lg font-bold ${todayRead ? 'text-green-400' : 'text-slate-500'}`}>
            {todayRead ? '✓' : '○'}
          </div>
          <div className="text-xs text-slate-400">Today</div>
        </div>
      </div>

      {/* Streak Badges */}
      <div>
        <h4 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Award size={16} />
          Streak Badges
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-2 rounded-lg border transition-all ${
                badge.unlocked
                  ? 'border-green-500/30 bg-green-950/20'
                  : 'border-slate-700 bg-slate-900/50 opacity-60'
              }`}
              title={badge.description}
            >
              <div className="flex items-center gap-2 mb-1">
                {badge.icon}
                <span className={`text-xs font-medium ${
                  badge.unlocked ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {badge.name}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {badge.unlocked ? '✓ Unlocked' : `${badge.requirement} days`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual trigger button for testing */}
      {!todayRead && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={markReadingDay}
            className="w-full py-2 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-colors"
            data-testid="button-mark-reading-day"
          >
            Mark Today as Read! 🔥
          </button>
        </div>
      )}
    </div>
  );
}

export default ReadingStreaks;

// Hook to trigger reading activity from other components
export const useReadingStreaks = () => {
  const triggerReadingActivity = () => {
    window.dispatchEvent(new CustomEvent('reading-activity'));
  };

  return { triggerReadingActivity };
};