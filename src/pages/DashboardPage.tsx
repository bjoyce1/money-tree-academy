import { useMemo } from 'react';
import { Link } from 'wouter';
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp, 
  Star, 
  Coins, 
  Calendar,
  Target,
  Users,
  ArrowLeft,
  BarChart3,
  Award
} from 'lucide-react';
import ReaderShell from '../components/ReaderShell';
import chapters from '../data/chapters.json';

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

export default function DashboardPage() {
  // Calculate progress stats from localStorage
  const stats = useMemo((): ProgressStats => {
    const completedChapters = JSON.parse(localStorage.getItem('completed_chapters') || '[]');
    const streakData = JSON.parse(localStorage.getItem('reading_streaks') || '{}');
    const coinsData = JSON.parse(localStorage.getItem('coins_data') || '{}');
    const achievementStats = JSON.parse(localStorage.getItem('achievement_stats') || '{}');
    const readingSpeedData = JSON.parse(localStorage.getItem('reading_speed_data') || '{}');
    const quizResults = JSON.parse(localStorage.getItem('quiz_results') || '{}');
    const notesData = JSON.parse(localStorage.getItem('notes_data') || '{}');

    // Calculate total reading time from reading speed data
    const totalReadingTime = Object.values(readingSpeedData).reduce((total: number, chapterData: any) => {
      return total + (chapterData?.totalTime || 0);
    }, 0);

    // Calculate average quiz score
    const quizScores = Object.values(quizResults).map((result: any) => result?.score || 0).filter(score => score > 0);
    const averageQuizScore = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;

    // Count total notes
    const notesCreated = Object.values(notesData).reduce((total: number, chapterNotes: any) => {
      return total + (Array.isArray(chapterNotes) ? chapterNotes.length : 0);
    }, 0);

    return {
      chaptersCompleted: completedChapters.length,
      totalChapters: chapters.length,
      currentStreak: streakData.currentStreak || 0,
      longestStreak: streakData.longestStreak || 0,
      totalCoins: coinsData.total || 0,
      totalReadingTime: Math.round(totalReadingTime / 60), // Convert to minutes
      achievementsUnlocked: Object.keys(achievementStats).length,
      lastReadingDate: streakData.lastReadingDate || null,
      averageQuizScore: Math.round(averageQuizScore),
      notesCreated
    };
  }, []);

  const progressPercentage = Math.round((stats.chaptersCompleted / stats.totalChapters) * 100);

  return (
    <ReaderShell>
      <div className="fade-in px-3 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight" data-testid="dashboard-title">
              Learning Progress Dashboard
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Track reading progress and achievements</p>
          </div>
          <Link 
            href="/read" 
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors touch-manipulation self-start"
            data-testid="link-back-to-reading"
          >
            <ArrowLeft size={16} />
            Back to Reading
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="text-green-400" size={24} />
              <span className="text-2xl font-bold text-green-300">{stats.chaptersCompleted}</span>
            </div>
            <h3 className="font-semibold text-slate-100 mb-1">Chapters Read</h3>
            <p className="text-slate-400 text-sm">out of {stats.totalChapters} total</p>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{progressPercentage}% complete</p>
          </div>

          <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-blue-400" size={24} />
              <span className="text-2xl font-bold text-blue-300">{stats.currentStreak}</span>
            </div>
            <h3 className="font-semibold text-slate-100 mb-1">Reading Streak</h3>
            <p className="text-slate-400 text-sm">days in a row</p>
            <div className="flex items-center gap-2 mt-3">
              <Target className="text-blue-400" size={14} />
              <span className="text-xs text-slate-400">Best: {stats.longestStreak} days</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-950/50 to-yellow-900/30 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Coins className="text-yellow-400" size={24} />
              <span className="text-2xl font-bold text-yellow-300">{stats.totalCoins}</span>
            </div>
            <h3 className="font-semibold text-slate-100 mb-1">Coins Earned</h3>
            <p className="text-slate-400 text-sm">from learning activities</p>
            <div className="flex items-center gap-2 mt-3">
              <TrendingUp className="text-yellow-400" size={14} />
              <span className="text-xs text-slate-400">Keep earning!</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="text-purple-400" size={24} />
              <span className="text-2xl font-bold text-purple-300">{stats.achievementsUnlocked}</span>
            </div>
            <h3 className="font-semibold text-slate-100 mb-1">Achievements</h3>
            <p className="text-slate-400 text-sm">unlocked so far</p>
            <div className="flex items-center gap-2 mt-3">
              <Award className="text-purple-400" size={14} />
              <span className="text-xs text-slate-400">Keep going!</span>
            </div>
          </div>
        </div>

        {/* Detailed Progress Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Chapter Progress */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              Chapter Progress
            </h2>
            
            <div className="space-y-3">
              {chapters.map((chapter) => {
                const isCompleted = JSON.parse(localStorage.getItem('completed_chapters') || '[]').includes(chapter.id);
                const isCurrentlyReading = localStorage.getItem('resumeSlug') === chapter.slug;
                
                return (
                  <div 
                    key={chapter.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isCompleted ? 'bg-green-950/30 border border-green-500/20' : 
                      isCurrentlyReading ? 'bg-blue-950/30 border border-blue-500/20' : 
                      'bg-slate-800/30'
                    }`}
                    data-testid={`chapter-progress-${chapter.slug}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrentlyReading ? 'bg-blue-500 text-white' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {isCompleted ? '✓' : chapter.order}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-200">{chapter.title}</p>
                      <p className="text-xs text-slate-400">{chapter.estReadMinutes} min read</p>
                    </div>
                    {isCurrentlyReading && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                        Currently Reading
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reading Analytics */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="text-green-400" size={20} />
              Reading Analytics
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="text-blue-400" size={16} />
                  <span className="text-slate-300">Total Reading Time</span>
                </div>
                <span className="font-bold text-slate-100" data-testid="total-reading-time">
                  {stats.totalReadingTime} minutes
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-400" size={16} />
                  <span className="text-slate-300">Average Quiz Score</span>
                </div>
                <span className="font-bold text-slate-100" data-testid="average-quiz-score">
                  {stats.averageQuizScore}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-400" size={16} />
                  <span className="text-slate-300">Notes Created</span>
                </div>
                <span className="font-bold text-slate-100" data-testid="notes-created">
                  {stats.notesCreated}
                </span>
              </div>

              {stats.lastReadingDate && (
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-indigo-400" size={16} />
                    <span className="text-slate-300">Last Reading Session</span>
                  </div>
                  <span className="font-bold text-slate-100" data-testid="last-reading-date">
                    {new Date(stats.lastReadingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Quick Actions</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/read"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-950/50 to-blue-900/30 border border-blue-500/30 rounded-lg hover:from-blue-900/50 hover:to-blue-800/30 transition-all"
              data-testid="link-continue-reading"
            >
              <BookOpen className="text-blue-400" size={20} />
              <div>
                <p className="font-semibold text-slate-100">Continue Reading</p>
                <p className="text-slate-400 text-sm">Resume learning journey</p>
              </div>
            </Link>

            <Link 
              href="/glossary"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-950/50 to-purple-900/30 border border-purple-500/30 rounded-lg hover:from-purple-900/50 hover:to-purple-800/30 transition-all"
              data-testid="link-glossary"
            >
              <Star className="text-purple-400" size={20} />
              <div>
                <p className="font-semibold text-slate-100">Study Glossary</p>
                <p className="text-slate-400 text-sm">Review key terms</p>
              </div>
            </Link>

            <Link 
              href="/search"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-950/50 to-green-900/30 border border-green-500/30 rounded-lg hover:from-green-900/50 hover:to-green-800/30 transition-all"
              data-testid="link-search"
            >
              <TrendingUp className="text-green-400" size={20} />
              <div>
                <p className="font-semibold text-slate-100">Search Content</p>
                <p className="text-slate-400 text-sm">Find specific topics</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Progress Insights */}
        <div className="mt-8 bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-400" size={20} />
            Progress Insights
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-200 mb-3">Learning Milestones</h3>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${stats.chaptersCompleted >= 1 ? 'text-green-300' : 'text-slate-500'}`}>
                  {stats.chaptersCompleted >= 1 ? '✅' : '⏳'} First chapter completed
                </div>
                <div className={`flex items-center gap-2 ${stats.chaptersCompleted >= 3 ? 'text-green-300' : 'text-slate-500'}`}>
                  {stats.chaptersCompleted >= 3 ? '✅' : '⏳'} Getting started (3 chapters)
                </div>
                <div className={`flex items-center gap-2 ${stats.chaptersCompleted >= 5 ? 'text-green-300' : 'text-slate-500'}`}>
                  {stats.chaptersCompleted >= 5 ? '✅' : '⏳'} Halfway point (5 chapters)
                </div>
                <div className={`flex items-center gap-2 ${stats.chaptersCompleted >= 8 ? 'text-green-300' : 'text-slate-500'}`}>
                  {stats.chaptersCompleted >= 8 ? '✅' : '⏳'} Almost finished (8 chapters)
                </div>
                <div className={`flex items-center gap-2 ${stats.chaptersCompleted >= 10 ? 'text-green-300' : 'text-slate-500'}`}>
                  {stats.chaptersCompleted >= 10 ? '✅' : '⏳'} Book completed!
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-3">Engagement Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Reading Consistency</span>
                  <span className={`font-semibold ${
                    stats.currentStreak >= 7 ? 'text-green-300' :
                    stats.currentStreak >= 3 ? 'text-yellow-300' :
                    'text-slate-400'
                  }`}>
                    {stats.currentStreak >= 7 ? 'Excellent' :
                     stats.currentStreak >= 3 ? 'Good' :
                     'Building'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Quiz Performance</span>
                  <span className={`font-semibold ${
                    stats.averageQuizScore >= 80 ? 'text-green-300' :
                    stats.averageQuizScore >= 60 ? 'text-yellow-300' :
                    'text-slate-400'
                  }`}>
                    {stats.averageQuizScore >= 80 ? 'Excellent' :
                     stats.averageQuizScore >= 60 ? 'Good' :
                     stats.averageQuizScore > 0 ? 'Improving' : 'Not Started'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Note Taking</span>
                  <span className={`font-semibold ${
                    stats.notesCreated >= 10 ? 'text-green-300' :
                    stats.notesCreated >= 5 ? 'text-yellow-300' :
                    'text-slate-400'
                  }`}>
                    {stats.notesCreated >= 10 ? 'Active' :
                     stats.notesCreated >= 5 ? 'Moderate' :
                     stats.notesCreated > 0 ? 'Getting Started' : 'Not Started'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {stats.chaptersCompleted > 0 && (
          <div className="mt-8 bg-gradient-to-r from-amber-950/50 to-orange-950/50 border border-amber-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Star className="text-amber-400" size={20} />
              Parent/Teacher Recommendations
            </h2>
            
            <div className="space-y-4">
              {stats.currentStreak === 0 && (
                <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-200 font-medium mb-2">📅 Build a Reading Routine</p>
                  <p className="text-slate-300 text-sm">
                    Encourage daily reading sessions, even if just 10-15 minutes. Consistency builds strong financial literacy habits.
                  </p>
                </div>
              )}

              {stats.averageQuizScore > 0 && stats.averageQuizScore < 70 && (
                <div className="p-4 bg-yellow-950/30 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 font-medium mb-2">🎯 Quiz Review Suggested</p>
                  <p className="text-slate-300 text-sm">
                    Consider reviewing quiz questions together. This helps reinforce key concepts and improves understanding.
                  </p>
                </div>
              )}

              {stats.notesCreated === 0 && stats.chaptersCompleted >= 2 && (
                <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-200 font-medium mb-2">📝 Encourage Note-Taking</p>
                  <p className="text-slate-300 text-sm">
                    Notes help children process and remember what they learn. Encourage writing down thoughts and questions.
                  </p>
                </div>
              )}

              {stats.chaptersCompleted >= 5 && (
                <div className="p-4 bg-green-950/30 border border-green-500/30 rounded-lg">
                  <p className="text-green-200 font-medium mb-2">🎉 Great Progress!</p>
                  <p className="text-slate-300 text-sm">
                    Excellent work! Consider discussing real-world applications of the concepts learned so far.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ReaderShell>
  );
}