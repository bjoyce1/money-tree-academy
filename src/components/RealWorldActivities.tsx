import { useState } from 'react';
import { Home, CheckCircle2, Clock, Users, Target } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  timeNeeded: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'family' | 'solo' | 'community';
  icon: React.ReactNode;
}

interface RealWorldActivitiesProps {
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
}

export default function RealWorldActivities({ chapterId, chapterTitle, chapterOrder }: RealWorldActivitiesProps) {
  const [completedActivities, setCompletedActivities] = useState<string[]>(() => {
    const stored = localStorage.getItem(`activities_${chapterId}`);
    return stored ? JSON.parse(stored) : [];
  });

  const activities = getChapterActivities(chapterTitle, chapterOrder);

  const toggleActivity = (activityId: string) => {
    const updated = completedActivities.includes(activityId) 
      ? completedActivities.filter(id => id !== activityId)
      : [...completedActivities, activityId];
    
    setCompletedActivities(updated);
    localStorage.setItem(`activities_${chapterId}`, JSON.stringify(updated));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-950/20 border-green-500/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-950/20 border-yellow-500/30';
      case 'Hard': return 'text-red-400 bg-red-950/20 border-red-500/30';
      default: return 'text-slate-400 bg-slate-950/20 border-slate-500/30';
    }
  };

  const completionRate = Math.round((completedActivities.length / activities.length) * 100);

  return (
    <div className="mt-8 border-t border-slate-700 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Home className="text-orange-400" size={24} />
          <div>
            <h3 className="text-xl font-bold text-slate-100">Real-World Activities</h3>
            <p className="text-slate-400">Try these activities at home to practice what you learned</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Completed</div>
          <div className="text-lg font-bold text-orange-400">{completedActivities.length}/{activities.length}</div>
        </div>
      </div>

      <div className="grid gap-4 mb-6">
        {activities.map((activity) => {
          const isCompleted = completedActivities.includes(activity.id);
          return (
            <div
              key={activity.id}
              className={`p-4 rounded-xl border transition-all ${
                isCompleted 
                  ? 'border-green-500/30 bg-green-950/10' 
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-100 mb-1">{activity.title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{activity.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActivity(activity.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isCompleted 
                      ? 'text-green-400 hover:text-green-300' 
                      : 'text-slate-500 hover:text-green-400'
                  }`}
                  data-testid={`activity-toggle-${activity.id}`}
                >
                  <CheckCircle2 size={20} fill={isCompleted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock size={12} />
                  <span>{activity.timeNeeded}</span>
                </div>
                <div className={`px-2 py-1 rounded border ${getDifficultyColor(activity.difficulty)}`}>
                  {activity.difficulty}
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Users size={12} />
                  <span className="capitalize">{activity.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completionRate === 100 && (
        <div className="text-center p-6 bg-gradient-to-r from-orange-950/20 to-yellow-950/20 border border-orange-500/30 rounded-xl">
          <Target className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <h4 className="text-xl font-bold text-orange-300 mb-2">All Activities Complete! 🎯</h4>
          <p className="text-orange-200">
            Great job practicing these real-world money skills! You're building habits that will last a lifetime.
          </p>
        </div>
      )}
    </div>
  );
}

function getChapterActivities(chapterTitle: string, chapterOrder: number): Activity[] {
  const title = chapterTitle.toLowerCase();
  
  if (title.includes('saving') || title.includes('seed')) {
    return [
      {
        id: 'savings-jar',
        title: 'Start a Savings Jar',
        description: 'Find an empty jar and decorate it. Put in any coins or dollars you have at home. Set a goal to add something every day for one week.',
        timeNeeded: '30 minutes setup',
        difficulty: 'Easy',
        category: 'solo',
        icon: <Target className="text-green-400" size={20} />
      },
      {
        id: 'family-budget-talk',
        title: 'Family Money Talk',
        description: 'Ask a parent or guardian to explain one family expense (like groceries or utilities). Discuss why it\'s important and how your family plans for it.',
        timeNeeded: '15 minutes',
        difficulty: 'Easy',
        category: 'family',
        icon: <Users className="text-blue-400" size={20} />
      },
      {
        id: 'counting-coins',
        title: 'Coin Counting Challenge',
        description: 'Gather all loose coins around your house. Sort them by type and count the total value. Challenge yourself to save them all!',
        timeNeeded: '20 minutes',
        difficulty: 'Easy',
        category: 'solo',
        icon: <CheckCircle2 className="text-yellow-400" size={20} />
      }
    ];
  } else if (title.includes('budget') || title.includes('branch')) {
    return [
      {
        id: 'allowance-budget',
        title: 'Plan Your Allowance',
        description: 'If you get allowance, divide your next payment into needs, wants, save, and share categories before you spend any of it.',
        timeNeeded: '15 minutes',
        difficulty: 'Medium',
        category: 'solo',
        icon: <Target className="text-purple-400" size={20} />
      },
      {
        id: 'grocery-helper',
        title: 'Grocery Budget Helper',
        description: 'Next time someone goes grocery shopping, help make a shopping list. Estimate costs and try to stay within a budget.',
        timeNeeded: '45 minutes',
        difficulty: 'Medium',
        category: 'family',
        icon: <Users className="text-green-400" size={20} />
      }
    ];
  } else if (title.includes('earn') || title.includes('leaves')) {
    return [
      {
        id: 'chore-list',
        title: 'Create a Chore Earning Chart',
        description: 'Make a list of extra chores you could do to earn money. Discuss fair prices with your family and commit to one task this week.',
        timeNeeded: '30 minutes',
        difficulty: 'Medium',
        category: 'family',
        icon: <CheckCircle2 className="text-blue-400" size={20} />
      },
      {
        id: 'skill-inventory',
        title: 'Skills & Services Inventory',
        description: 'List three things you\'re good at that could help others (like organizing, pet care, or teaching younger kids). Think about how these could earn money.',
        timeNeeded: '20 minutes',
        difficulty: 'Easy',
        category: 'solo',
        icon: <Target className="text-orange-400" size={20} />
      }
    ];
  } else {
    return [
      {
        id: 'money-goal',
        title: 'Set a Money Goal',
        description: 'Choose something you want to buy that costs more than $5. Calculate how much you need to save each week to afford it in one month.',
        timeNeeded: '15 minutes',
        difficulty: 'Easy',
        category: 'solo',
        icon: <Target className="text-brand" size={20} />
      },
      {
        id: 'track-spending',
        title: 'Track Your Spending',
        description: 'For three days, write down every time you spend money and what you bought. Look for patterns in your spending.',
        timeNeeded: '5 min/day for 3 days',
        difficulty: 'Medium',
        category: 'solo',
        icon: <CheckCircle2 className="text-purple-400" size={20} />
      },
      {
        id: 'community-giving',
        title: 'Community Giving Research',
        description: 'Research one local charity or cause you care about. Discuss with your family how you might contribute time or money to help.',
        timeNeeded: '30 minutes',
        difficulty: 'Medium',
        category: 'family',
        icon: <Users className="text-green-400" size={20} />
      }
    ];
  }
}