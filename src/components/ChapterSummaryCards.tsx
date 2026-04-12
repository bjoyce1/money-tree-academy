import { useState, useMemo } from 'react';
import { BookOpen, Key, Lightbulb, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface SummaryCard {
  id: string;
  title: string;
  content: string;
  type: 'concept' | 'definition' | 'tip' | 'example';
  icon: React.ReactNode;
  color: string;
}

interface ChapterSummaryCardsProps {
  chapterId: string;
  chapterTitle: string;
  chapterContent: string;
  chapterOrder: number;
}

export default function ChapterSummaryCards({ 
  chapterId, 
  chapterTitle, 
  chapterContent, 
  chapterOrder 
}: ChapterSummaryCardsProps) {
  const [completedCards, setCompletedCards] = useState<string[]>(() => {
    const stored = localStorage.getItem(`summary_progress_${chapterId}`);
    return stored ? JSON.parse(stored) : [];
  });

  // Extract key concepts and create summary cards
  const summaryCards = useMemo(() => {
    const cards: SummaryCard[] = [];
    
    // Clean content for analysis
    const textContent = chapterContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Generate concept-based cards based on chapter topic
    const chapterTopics = getChapterTopics(chapterTitle, textContent);
    
    chapterTopics.forEach((topic, index) => {
      cards.push({
        id: `concept-${index}`,
        title: topic.title,
        content: topic.description,
        type: 'concept',
        icon: <Key className="text-blue-400" size={20} />,
        color: 'border-blue-500/30 bg-blue-950/20'
      });
    });

    // Add practical tips
    const tips = getChapterTips(chapterTitle, textContent);
    tips.forEach((tip, index) => {
      cards.push({
        id: `tip-${index}`,
        title: tip.title,
        content: tip.content,
        type: 'tip',
        icon: <Lightbulb className="text-yellow-400" size={20} />,
        color: 'border-yellow-500/30 bg-yellow-950/20'
      });
    });

    // Add key takeaways
    const takeaways = getKeyTakeaways(chapterTitle, chapterOrder);
    takeaways.forEach((takeaway, index) => {
      cards.push({
        id: `takeaway-${index}`,
        title: takeaway.title,
        content: takeaway.content,
        type: 'example',
        icon: <Sparkles className="text-purple-400" size={20} />,
        color: 'border-purple-500/30 bg-purple-950/20'
      });
    });

    return cards;
  }, [chapterId, chapterTitle, chapterContent, chapterOrder]);

  const markCardComplete = (cardId: string) => {
    const updated = completedCards.includes(cardId) 
      ? completedCards.filter(id => id !== cardId)
      : [...completedCards, cardId];
    
    setCompletedCards(updated);
    localStorage.setItem(`summary_progress_${chapterId}`, JSON.stringify(updated));
  };

  const completionRate = Math.round((completedCards.length / summaryCards.length) * 100);

  return (
    <div className="mt-12 border-t border-slate-700 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand2" size={24} />
          <div>
            <h3 className="text-2xl font-bold text-slate-100">Chapter Summary</h3>
            <p className="text-slate-400">Review key concepts from {chapterTitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Progress</div>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-slate-700 rounded-full h-2">
              <div 
                className="progress-bar h-full rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-300">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => {
          const isCompleted = completedCards.includes(card.id);
          return (
            <div
              key={card.id}
              className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 ${
                isCompleted 
                  ? `${card.color} opacity-75` 
                  : `${card.color} hover:border-opacity-60`
              }`}
              onClick={() => markCardComplete(card.id)}
              data-testid={`summary-card-${card.id}`}
            >
              {/* Completion Checkmark */}
              <div className={`absolute top-3 right-3 transition-opacity ${
                isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
              }`}>
                <CheckCircle 
                  className={isCompleted ? 'text-green-400' : 'text-slate-500'} 
                  size={20} 
                />
              </div>

              {/* Card Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1">
                  {card.icon}
                </div>
                <h4 className="font-semibold text-slate-100 leading-tight">
                  {card.title}
                </h4>
              </div>

              {/* Card Content */}
              <p className="text-sm text-slate-300 leading-relaxed">
                {card.content}
              </p>

              {/* Card Type Badge */}
              <div className="flex items-center justify-between mt-4">
                <span className="px-2 py-1 text-xs font-medium bg-slate-800 text-slate-400 rounded">
                  {card.type.charAt(0).toUpperCase() + card.type.slice(1)}
                </span>
                <ArrowRight className="text-slate-500" size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completionRate === 100 && (
        <div className="text-center p-6 bg-gradient-to-r from-green-950/20 to-blue-950/20 border border-green-500/30 rounded-xl">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h4 className="text-xl font-bold text-green-300 mb-2">Chapter Mastered! 🎉</h4>
          <p className="text-green-200">
            You've reviewed all key concepts from this chapter. Great job building your financial knowledge!
          </p>
        </div>
      )}

      {/* Study Tip */}
      <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Lightbulb className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h5 className="font-semibold text-slate-100 mb-1">Study Tip</h5>
            <p className="text-sm text-slate-300">
              Click on each summary card to mark it as reviewed. Try explaining each concept in your own words 
              to a family member to reinforce your learning!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions to generate chapter-specific content
function getChapterTopics(chapterTitle: string, content: string): Array<{title: string, description: string}> {
  const title = chapterTitle.toLowerCase();
  
  // Generate topics based on chapter title and common financial literacy themes
  if (title.includes('saving') || title.includes('money')) {
    return [
      {
        title: "The Power of Saving",
        description: "Saving money helps you reach your goals and prepares you for unexpected expenses. Even small amounts saved regularly can grow into something significant over time."
      },
      {
        title: "Building Good Money Habits",
        description: "Creating routines around money management, like tracking spending or setting aside savings first, helps build lifelong financial success."
      }
    ];
  } else if (title.includes('budget') || title.includes('spending')) {
    return [
      {
        title: "Smart Spending Choices",
        description: "Learning to distinguish between needs and wants helps you make better spending decisions and avoid wasting money on things you don't really need."
      },
      {
        title: "Creating a Budget Plan",
        description: "A budget is a plan for your money that helps you track income and expenses, ensuring you have enough for both necessities and savings."
      }
    ];
  } else if (title.includes('earn') || title.includes('job') || title.includes('work')) {
    return [
      {
        title: "Ways to Earn Money",
        description: "There are many ways young people can earn money, from helping with chores to starting small businesses like lemonade stands or pet sitting."
      },
      {
        title: "Value of Hard Work",
        description: "Working for your money teaches valuable lessons about responsibility, time management, and the satisfaction of earning your own way."
      }
    ];
  } else {
    return [
      {
        title: "Financial Responsibility",
        description: "Being responsible with money means making thoughtful decisions, keeping track of what you spend, and always thinking about your future goals."
      },
      {
        title: "Building Wealth Over Time",
        description: "Wealth isn't built overnight. It comes from consistently making good financial choices, saving regularly, and learning about money throughout your life."
      }
    ];
  }
}

function getChapterTips(chapterTitle: string, content: string): Array<{title: string, content: string}> {
  const title = chapterTitle.toLowerCase();
  
  if (title.includes('saving')) {
    return [
      {
        title: "Start Small, Dream Big",
        content: "Begin by saving just $1 per week. After a year, you'll have $52! Small amounts add up to create opportunities for bigger purchases."
      }
    ];
  } else if (title.includes('spending')) {
    return [
      {
        title: "The 24-Hour Rule",
        content: "Before buying something you want (but don't need), wait 24 hours. You'll often find that the urge to buy goes away, saving you money!"
      }
    ];
  } else {
    return [
      {
        title: "Make Money Learning Fun",
        content: "Turn financial learning into a game! Set savings challenges, track your progress with charts, or compete with siblings to see who can save more."
      }
    ];
  }
}

function getKeyTakeaways(chapterTitle: string, chapterOrder: number): Array<{title: string, content: string}> {
  return [
    {
      title: "Remember This",
      content: `The most important lesson from this chapter is that good money habits start young. Every financial decision you make today is practice for managing larger amounts as you grow up.`
    },
    {
      title: "Apply It Now",
      content: `Look for one way to apply what you learned this week. Whether it's starting a savings jar, helping with family budgeting, or earning money through chores, take action!`
    }
  ];
}