import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Trophy, Clock, TrendingUp, Star, Coins, Calendar,
  Target, Users, ArrowLeft, BarChart3, Award
} from 'lucide-react';
import ReaderShell from '../components/ReaderShell';
import chapters from '../data/chapters.json';
import HarnessStatsPanel from '../components/HarnessStatsPanel';
import ProgressReport from '../components/ProgressReport';

interface ProgressStats {
  chaptersCompleted: number;
  totalChapters: number;
  currentStreak: number;
  longestStreak: number;
  totalCoins: number;
  totalReadingTime: number;
  achievementsUnlocked: number;
  lastReadingDate: string | null;
  averageQuizScore: number;
  notesCreated: number;
}

function ProgressRing({ value, max, size = 80, strokeWidth = 6, color = 'stroke-primary', label, sublabel }: { 
  value: number; max: number; size?: number; strokeWidth?: number; color?: string; label: string; sublabel: string 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-white/10" />
          <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none"
            className={color} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold">{value}</span>
        </div>
      </div>
      <span className="text-sm font-bold mt-2">{label}</span>
      <span className="text-xs text-muted-foreground">{sublabel}</span>
    </div>
  );
}

export default function DashboardPage() {
  const stats = useMemo((): ProgressStats => {
    const completedChapters = JSON.parse(localStorage.getItem('completed_chapters') || '[]');
    const streakData = JSON.parse(localStorage.getItem('reading_streaks') || '{}');
    const coinsData = JSON.parse(localStorage.getItem('coins_data') || '{}');
    const achievementStats = JSON.parse(localStorage.getItem('achievement_stats') || '{}');
    const readingSpeedData = JSON.parse(localStorage.getItem('reading_speed_data') || '{}');
    const quizResults = JSON.parse(localStorage.getItem('quiz_results') || '{}');
    const notesData = JSON.parse(localStorage.getItem('notes_data') || '{}');

    const totalReadingTime = Object.values(readingSpeedData).reduce((total: number, chapterData: any) => {
      return total + (chapterData?.totalTime || 0);
    }, 0);

    const quizScores = Object.values(quizResults).map((result: any) => result?.score || 0).filter(score => score > 0);
    const averageQuizScore = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;

    const notesCreated = Object.values(notesData).reduce((total: number, chapterNotes: any) => {
      return total + (Array.isArray(chapterNotes) ? chapterNotes.length : 0);
    }, 0);

    return {
      chaptersCompleted: completedChapters.length,
      totalChapters: chapters.length,
      currentStreak: streakData.currentStreak || 0,
      longestStreak: streakData.longestStreak || 0,
      totalCoins: coinsData.total || 0,
      totalReadingTime: Math.round((totalReadingTime as number) / 60),
      achievementsUnlocked: Object.keys(achievementStats).length,
      lastReadingDate: streakData.lastReadingDate || null,
      averageQuizScore: Math.round(averageQuizScore),
      notesCreated: notesCreated as number
    };
  }, []);

  const progressPercentage = Math.round((stats.chaptersCompleted / stats.totalChapters) * 100);

  return (
    <ReaderShell>
      <div className="fade-in px-3 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight" data-testid="dashboard-title">
              📊 Learning Progress
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base font-bold">Track your reading journey and achievements</p>
          </div>
          <Link 
            to="/read" 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet to-purple-500 text-white rounded-full font-bold transition-all hover:scale-105 touch-manipulation self-start"
            data-testid="link-back-to-reading"
          >
            <ArrowLeft size={16} />
            Back to Reading
          </Link>
        </div>

        {/* Progress Rings Overview */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
            <ProgressRing value={stats.chaptersCompleted} max={stats.totalChapters} color="stroke-emerald-400" label="Chapters" sublabel={`of ${stats.totalChapters}`} />
            <ProgressRing value={stats.currentStreak} max={30} color="stroke-blue-400" label="Streak" sublabel="days" />
            <ProgressRing value={stats.totalCoins} max={1000} size={80} color="stroke-amber-400" label="Coins" sublabel="earned" />
            <ProgressRing value={stats.achievementsUnlocked} max={20} color="stroke-violet" label="Awards" sublabel="unlocked" />
          </div>
        </div>

        {/* Detailed Progress Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Chapter Progress */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="text-violet" size={20} />
              Chapter Progress
            </h2>
            <div className="space-y-2">
              {chapters.map((chapter) => {
                const isCompleted = JSON.parse(localStorage.getItem('completed_chapters') || '[]').includes(chapter.id);
                const isCurrentlyReading = localStorage.getItem('resumeSlug') === chapter.slug;
                
                return (
                  <div 
                    key={chapter.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isCompleted ? 'bg-primary/10 border border-primary/20' : 
                      isCurrentlyReading ? 'bg-golden/10 border border-golden/20' : 
                      'bg-white/5'
                    }`}
                    data-testid={`chapter-progress-${chapter.slug}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${
                      isCompleted ? 'bg-primary text-primary-foreground' :
                      isCurrentlyReading ? 'bg-golden text-primary-foreground' :
                      'bg-white/10 text-muted-foreground'
                    }`}>
                      {isCompleted ? '✓' : chapter.order}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground text-sm">{chapter.title}</p>
                      <p className="text-xs text-muted-foreground">{chapter.estReadMinutes} min read</p>
                    </div>
                    {isCurrentlyReading && (
                      <span className="px-2 py-1 bg-golden/20 text-golden text-xs rounded-full font-bold">
                        Reading
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reading Analytics */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              Reading Analytics
            </h2>
            <div className="space-y-3">
              {[
                { icon: Clock, color: 'text-blue-400', label: 'Total Reading Time', value: `${stats.totalReadingTime} min`, testId: 'total-reading-time' },
                { icon: Star, color: 'text-golden', label: 'Average Quiz Score', value: `${stats.averageQuizScore}%`, testId: 'average-quiz-score' },
                { icon: Users, color: 'text-violet', label: 'Notes Created', value: String(stats.notesCreated), testId: 'notes-created' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <item.icon className={item.color} size={16} />
                    <span className="text-foreground/80 text-sm font-bold">{item.label}</span>
                  </div>
                  <span className="font-extrabold text-foreground" data-testid={item.testId}>{item.value}</span>
                </div>
              ))}
              {stats.lastReadingDate && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-coral" size={16} />
                    <span className="text-foreground/80 text-sm font-bold">Last Session</span>
                  </div>
                  <span className="font-extrabold text-foreground" data-testid="last-reading-date">
                    {new Date(stats.lastReadingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-extrabold text-foreground mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { to: '/read', icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', title: 'Continue Reading', desc: 'Resume learning journey', testId: 'link-continue-reading' },
              { to: '/glossary', icon: Star, color: 'text-violet', bg: 'bg-violet/10', title: 'Study Glossary', desc: 'Review key terms', testId: 'link-glossary' },
              { to: '/search', icon: TrendingUp, color: 'text-golden', bg: 'bg-golden/10', title: 'Search Content', desc: 'Find specific topics', testId: 'link-search' },
            ].map(action => (
              <Link key={action.to} to={action.to}
                className="flex items-center gap-3 p-4 glass-card rounded-2xl hover:scale-105 transition-all"
                data-testid={action.testId}
              >
                <div className={`w-10 h-10 ${action.bg} rounded-xl flex items-center justify-center`}>
                  <action.icon className={action.color} size={20} />
                </div>
                <div>
                  <p className="font-bold text-foreground">{action.title}</p>
                  <p className="text-muted-foreground text-sm">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Harness */}
        <div className="mt-8 glass-card rounded-2xl p-6 border-primary/20">
          <h2 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary" size={20} />
            AI Harness Intelligence
          </h2>
          <p className="text-muted-foreground text-sm mb-4 font-bold">Your AI tutor adapts to how you learn.</p>
          <HarnessStatsPanel />
        </div>

        {/* Progress Insights */}
        <div className="mt-8 glass-card rounded-2xl p-6 border-violet/20">
          <h2 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="text-violet" size={20} />
            Progress Insights
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-foreground mb-3">Learning Milestones</h3>
              <div className="space-y-2">
                {[
                  { threshold: 1, label: 'First chapter completed' },
                  { threshold: 3, label: 'Getting started (3 chapters)' },
                  { threshold: 5, label: 'Halfway point (5 chapters)' },
                  { threshold: 8, label: 'Almost finished (8 chapters)' },
                  { threshold: 10, label: 'Book completed!' },
                ].map(milestone => (
                  <div key={milestone.threshold} className={`flex items-center gap-2 text-sm font-bold ${stats.chaptersCompleted >= milestone.threshold ? 'text-primary' : 'text-muted-foreground/50'}`}>
                    {stats.chaptersCompleted >= milestone.threshold ? '✅' : '⏳'} {milestone.label}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-3">Engagement</h3>
              <div className="space-y-3">
                {[
                  { label: 'Reading Consistency', value: stats.currentStreak >= 7 ? 'Excellent' : stats.currentStreak >= 3 ? 'Good' : 'Building',
                    color: stats.currentStreak >= 7 ? 'text-primary' : stats.currentStreak >= 3 ? 'text-golden' : 'text-muted-foreground' },
                  { label: 'Quiz Performance', value: stats.averageQuizScore >= 80 ? 'Excellent' : stats.averageQuizScore >= 60 ? 'Good' : stats.averageQuizScore > 0 ? 'Improving' : 'Not Started',
                    color: stats.averageQuizScore >= 80 ? 'text-primary' : stats.averageQuizScore >= 60 ? 'text-golden' : 'text-muted-foreground' },
                  { label: 'Note Taking', value: stats.notesCreated >= 10 ? 'Active' : stats.notesCreated >= 5 ? 'Good' : stats.notesCreated > 0 ? 'Starting' : 'Not Started',
                    color: stats.notesCreated >= 10 ? 'text-primary' : stats.notesCreated >= 5 ? 'text-golden' : 'text-muted-foreground' },
                ].map(metric => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <span className="text-foreground/80 font-bold text-sm">{metric.label}</span>
                    <span className={`font-extrabold ${metric.color}`}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Parent/Teacher Report */}
        <div className="mt-8">
          <ProgressReport />
        </div>
      </div>
    </ReaderShell>
  );
}
