import { useState, useEffect } from 'react';
import { Award, Trophy, Star, Zap, BookOpen, PenTool, Calculator, Target, Users, Heart } from 'lucide-react';
import { useCoins } from './CoinsSystem';

interface Achievement {
  id: string;
  category: 'chapters' | 'learning' | 'engagement' | 'special';
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  currentProgress: number;
  unlocked: boolean;
  unlockedDate?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface ActivityStats {
  chaptersCompleted: number;
  notesCreated: number;
  glossaryUsed: number;
  textHighlighted: number;
  quizzesCompleted: number;
  bookmarksCreated: number;
  calculatorUsed: number;
  flashcardsStudied: number;
  activitiesCompleted: number;
  summaryCardsReviewed: number;
  totalReadingTime: number; // in minutes
}

export default function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    chaptersCompleted: 0,
    notesCreated: 0,
    glossaryUsed: 0,
    textHighlighted: 0,
    quizzesCompleted: 0,
    bookmarksCreated: 0,
    calculatorUsed: 0,
    flashcardsStudied: 0,
    activitiesCompleted: 0,
    summaryCardsReviewed: 0,
    totalReadingTime: 0
  });
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const { awardCoins } = useCoins();

  // Load stats and achievements on mount
  useEffect(() => {
    loadUserStats();
    updateAchievements();
  }, []);

  // Listen for achievement events from other components
  useEffect(() => {
    const handleAchievementEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      updateStat(type, data);
    };

    window.addEventListener('achievement-event', handleAchievementEvent as EventListener);
    return () => window.removeEventListener('achievement-event', handleAchievementEvent as EventListener);
  }, []);

  const loadUserStats = () => {
    // Aggregate stats from various localStorage sources
    const completed = JSON.parse(localStorage.getItem('completed_chapters') || '[]').length;
    const notes = Object.keys(localStorage).filter(key => key.startsWith('notes_ch-')).length;
    const bookmarks = JSON.parse(localStorage.getItem('user_bookmarks') || '[]').length;
    const highlights = Object.keys(localStorage).filter(key => key.startsWith('highlights_')).length;
    const activities = Object.keys(localStorage).filter(key => key.startsWith('activities_')).length;
    const summaries = Object.keys(localStorage).filter(key => key.startsWith('summary_progress_')).length;
    
    // Get quiz completion count
    const quizzes = Object.keys(localStorage).filter(key => key.startsWith('quiz_results_')).length;
    
    // Get reading time from reading sessions
    const readingSessions = JSON.parse(localStorage.getItem('reading_sessions') || '[]');
    const totalTime = readingSessions.reduce((sum: number, session: any) => sum + (session.totalActiveTime || 0), 0);

    setStats({
      chaptersCompleted: completed,
      notesCreated: notes,
      glossaryUsed: 0, // Will be tracked going forward
      textHighlighted: highlights,
      quizzesCompleted: quizzes,
      bookmarksCreated: bookmarks,
      calculatorUsed: 0, // Will be tracked going forward
      flashcardsStudied: 0, // Will be tracked going forward
      activitiesCompleted: activities,
      summaryCardsReviewed: summaries,
      totalReadingTime: Math.round(totalTime / 60) // Convert to minutes
    });
  };

  const updateStat = (type: string, data?: any) => {
    setStats(prev => {
      const newStats = { ...prev };
      
      switch (type) {
        case 'chapter-completed':
          newStats.chaptersCompleted = Math.max(prev.chaptersCompleted, data?.count || prev.chaptersCompleted + 1);
          break;
        case 'note-created':
          newStats.notesCreated = prev.notesCreated + 1;
          break;
        case 'glossary-used':
          newStats.glossaryUsed = prev.glossaryUsed + 1;
          break;
        case 'text-highlighted':
          newStats.textHighlighted = prev.textHighlighted + 1;
          break;
        case 'quiz-completed':
          newStats.quizzesCompleted = prev.quizzesCompleted + 1;
          break;
        case 'bookmark-created':
          newStats.bookmarksCreated = prev.bookmarksCreated + 1;
          break;
        case 'calculator-used':
          newStats.calculatorUsed = prev.calculatorUsed + 1;
          break;
        case 'flashcard-studied':
          newStats.flashcardsStudied = prev.flashcardsStudied + 1;
          break;
        case 'activity-completed':
          newStats.activitiesCompleted = prev.activitiesCompleted + 1;
          break;
        case 'summary-reviewed':
          newStats.summaryCardsReviewed = prev.summaryCardsReviewed + 1;
          break;
        case 'reading-time':
          newStats.totalReadingTime = prev.totalReadingTime + (data?.minutes || 1);
          break;
      }
      
      // Save updated stats
      localStorage.setItem('achievement_stats', JSON.stringify(newStats));
      
      // Update achievements after stats change
      setTimeout(() => updateAchievements(), 100);
      
      return newStats;
    });
  };

  const updateAchievements = () => {
    const currentStats = stats.chaptersCompleted > 0 ? stats : JSON.parse(localStorage.getItem('achievement_stats') || JSON.stringify(stats));
    
    const allAchievements: Achievement[] = [
      // Chapter Achievements
      {
        id: 'first-chapter',
        category: 'chapters',
        name: 'First Steps',
        description: 'Complete your first chapter',
        icon: <BookOpen className="text-green-400" size={16} />,
        requirement: 1,
        currentProgress: currentStats.chaptersCompleted,
        unlocked: currentStats.chaptersCompleted >= 1,
        rarity: 'common'
      },
      {
        id: 'chapter-explorer',
        category: 'chapters',
        name: 'Chapter Explorer',
        description: 'Complete 3 chapters',
        icon: <BookOpen className="text-blue-400" size={16} />,
        requirement: 3,
        currentProgress: currentStats.chaptersCompleted,
        unlocked: currentStats.chaptersCompleted >= 3,
        rarity: 'common'
      },
      {
        id: 'halfway-hero',
        category: 'chapters',
        name: 'Halfway Hero',
        description: 'Complete 5 chapters',
        icon: <Trophy className="text-purple-400" size={16} />,
        requirement: 5,
        currentProgress: currentStats.chaptersCompleted,
        unlocked: currentStats.chaptersCompleted >= 5,
        rarity: 'uncommon'
      },
      {
        id: 'book-master',
        category: 'chapters',
        name: 'Book Master',
        description: 'Complete all 10 chapters',
        icon: <Award className="text-yellow-400" size={16} />,
        requirement: 10,
        currentProgress: currentStats.chaptersCompleted,
        unlocked: currentStats.chaptersCompleted >= 10,
        rarity: 'legendary'
      },

      // Learning Achievements
      {
        id: 'note-taker',
        category: 'learning',
        name: 'Note Taker',
        description: 'Create your first note',
        icon: <PenTool className="text-indigo-400" size={16} />,
        requirement: 1,
        currentProgress: currentStats.notesCreated,
        unlocked: currentStats.notesCreated >= 1,
        rarity: 'common'
      },
      {
        id: 'thoughtful-reader',
        category: 'learning',
        name: 'Thoughtful Reader',
        description: 'Create 5 notes',
        icon: <PenTool className="text-indigo-500" size={16} />,
        requirement: 5,
        currentProgress: currentStats.notesCreated,
        unlocked: currentStats.notesCreated >= 5,
        rarity: 'uncommon'
      },
      {
        id: 'highlighter',
        category: 'learning',
        name: 'Highlighter',
        description: 'Highlight 10 text passages',
        icon: <Star className="text-yellow-400" size={16} />,
        requirement: 10,
        currentProgress: currentStats.textHighlighted,
        unlocked: currentStats.textHighlighted >= 10,
        rarity: 'common'
      },
      {
        id: 'quiz-master',
        category: 'learning',
        name: 'Quiz Master',
        description: 'Complete 5 quizzes',
        icon: <Target className="text-red-400" size={16} />,
        requirement: 5,
        currentProgress: currentStats.quizzesCompleted,
        unlocked: currentStats.quizzesCompleted >= 5,
        rarity: 'uncommon'
      },

      // Engagement Achievements
      {
        id: 'bookworm',
        category: 'engagement',
        name: 'Bookworm',
        description: 'Create 10 bookmarks',
        icon: <BookOpen className="text-orange-400" size={16} />,
        requirement: 10,
        currentProgress: currentStats.bookmarksCreated,
        unlocked: currentStats.bookmarksCreated >= 10,
        rarity: 'uncommon'
      },
      {
        id: 'calculator-wizard',
        category: 'engagement',
        name: 'Calculator Wizard',
        description: 'Use the calculator 20 times',
        icon: <Calculator className="text-green-500" size={16} />,
        requirement: 20,
        currentProgress: currentStats.calculatorUsed,
        unlocked: currentStats.calculatorUsed >= 20,
        rarity: 'uncommon'
      },
      {
        id: 'flashcard-champion',
        category: 'engagement',
        name: 'Flashcard Champion',
        description: 'Complete 3 flashcard sessions',
        icon: <Zap className="text-yellow-500" size={16} />,
        requirement: 3,
        currentProgress: currentStats.flashcardsStudied,
        unlocked: currentStats.flashcardsStudied >= 3,
        rarity: 'rare'
      },
      {
        id: 'active-learner',
        category: 'engagement',
        name: 'Active Learner',
        description: 'Complete 10 real-world activities',
        icon: <Users className="text-blue-500" size={16} />,
        requirement: 10,
        currentProgress: currentStats.activitiesCompleted,
        unlocked: currentStats.activitiesCompleted >= 10,
        rarity: 'rare'
      },

      // Special Achievements
      {
        id: 'dedicated-reader',
        category: 'special',
        name: 'Dedicated Reader',
        description: 'Read for 60 minutes total',
        icon: <Heart className="text-pink-400" size={16} />,
        requirement: 60,
        currentProgress: currentStats.totalReadingTime,
        unlocked: currentStats.totalReadingTime >= 60,
        rarity: 'rare'
      },
      {
        id: 'completionist',
        category: 'special',
        name: 'Completionist',
        description: 'Use every feature at least once',
        icon: <Award className="text-rainbow" size={16} />,
        requirement: 8,
        currentProgress: [
          currentStats.chaptersCompleted > 0,
          currentStats.notesCreated > 0,
          currentStats.textHighlighted > 0,
          currentStats.bookmarksCreated > 0,
          currentStats.quizzesCompleted > 0,
          currentStats.calculatorUsed > 0,
          currentStats.flashcardsStudied > 0,
          currentStats.activitiesCompleted > 0
        ].filter(Boolean).length,
        unlocked: [
          currentStats.chaptersCompleted > 0,
          currentStats.notesCreated > 0,
          currentStats.textHighlighted > 0,
          currentStats.bookmarksCreated > 0,
          currentStats.quizzesCompleted > 0,
          currentStats.calculatorUsed > 0,
          currentStats.flashcardsStudied > 0,
          currentStats.activitiesCompleted > 0
        ].filter(Boolean).length >= 8,
        rarity: 'legendary'
      }
    ];

    // Check for newly unlocked achievements
    const previousAchievements = achievements;
    const newlyUnlockedAchievements = allAchievements.filter(achievement => 
      achievement.unlocked && !previousAchievements.find(prev => prev.id === achievement.id && prev.unlocked)
    );

    if (newlyUnlockedAchievements.length > 0) {
      setNewlyUnlocked(newlyUnlockedAchievements);
      newlyUnlockedAchievements.forEach(achievement => {
        // Award coins based on rarity
        const coinReward = achievement.rarity === 'legendary' ? 50 : 
                          achievement.rarity === 'rare' ? 30 :
                          achievement.rarity === 'uncommon' ? 20 : 10;
        awardCoins(coinReward, `Achievement: ${achievement.name}`, 'achievement');
        
        showAchievementNotification(achievement);
      });
    }

    // Add unlock dates
    allAchievements.forEach(achievement => {
      if (achievement.unlocked && !achievement.unlockedDate) {
        achievement.unlockedDate = new Date().toISOString().split('T')[0];
      }
    });

    setAchievements(allAchievements);
  };

  const showAchievementNotification = (achievement: Achievement) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-bounce max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-2xl">🏆</div>
        <div>
          <div class="font-bold">Achievement Unlocked!</div>
          <div class="text-sm opacity-90">${achievement.name}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-slate-500 bg-slate-900/30';
      case 'uncommon': return 'border-green-500 bg-green-950/30';
      case 'rare': return 'border-blue-500 bg-blue-950/30';
      case 'legendary': return 'border-yellow-500 bg-yellow-950/30';
      default: return 'border-slate-500 bg-slate-900/30';
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="mb-6">
      {/* Achievement Summary Bar */}
      <div 
        className="bg-gradient-to-r from-yellow-950/20 to-orange-950/20 border border-yellow-500/30 rounded-xl p-4 cursor-pointer hover:border-yellow-400/50 transition-colors"
        onClick={() => setShowAchievements(!showAchievements)}
        data-testid="achievement-summary"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="text-yellow-400" size={20} />
            <div>
              <h3 className="font-semibold text-slate-100">Achievements</h3>
              <p className="text-slate-400 text-sm">{unlockedCount}/{totalCount} unlocked • {completionPercentage}% complete</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-slate-700 rounded-full h-2">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="text-2xl">🏆</span>
          </div>
        </div>
      </div>

      {/* Expanded Achievement Panel */}
      {showAchievements && (
        <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked 
                    ? getRarityColor(achievement.rarity)
                    : 'border-slate-700 bg-slate-900/30 opacity-60'
                }`}
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-shrink-0 mt-1">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      achievement.unlocked ? 'text-slate-100' : 'text-slate-400'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-slate-400 mb-2">
                      {achievement.description}
                    </p>
                    {!achievement.unlocked && (
                      <div className="text-xs text-slate-500">
                        Progress: {achievement.currentProgress}/{achievement.requirement}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-900/30 text-yellow-300' :
                    achievement.rarity === 'rare' ? 'bg-blue-900/30 text-blue-300' :
                    achievement.rarity === 'uncommon' ? 'bg-green-900/30 text-green-300' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {achievement.rarity}
                  </span>
                  {achievement.unlocked && (
                    <span className="text-green-400 text-sm">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for other components to trigger achievement events
export const useAchievements = () => {
  const triggerAchievement = (type: string, data?: any) => {
    window.dispatchEvent(new CustomEvent('achievement-event', { detail: { type, data } }));
  };

  return { triggerAchievement };
};