import { useState, useEffect, useRef } from 'react';
import { Timer, Zap, Target, TrendingUp, Award } from 'lucide-react';

interface ReadingSession {
  chapterId: string;
  chapterTitle: string;
  startTime: number;
  endTime?: number;
  totalActiveTime: number; // in seconds
  wordsRead: number;
  wpm: number;
  date: string;
}

interface ReadingSpeedTrackerProps {
  chapterId: string;
  chapterTitle: string;
  wordCount: number;
  isVisible: boolean;
}

export default function ReadingSpeedTracker({ chapterId, chapterTitle, wordCount, isVisible }: ReadingSpeedTrackerProps) {
  const [isReading, setIsReading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [totalActiveTime, setTotalActiveTime] = useState(0);
  const [currentWPM, setCurrentWPM] = useState(0);
  const [averageWPM, setAverageWPM] = useState(0);
  const [todaysSessions, setTodaysSessions] = useState<ReadingSession[]>([]);
  const [personalBest, setPersonalBest] = useState(0);
  
  const inactivityTimer = useRef<NodeJS.Timeout>();
  const lastActivityTime = useRef<number>(Date.now());
  const sessionUpdateInterval = useRef<NodeJS.Timeout>();

  // Target WPM based on age groups (financial literacy book for kids)
  const getTargetWPM = () => {
    return 150; // Good target for 8-15 year olds reading educational content
  };

  // Load reading history
  useEffect(() => {
    const stored = localStorage.getItem('reading_sessions');
    const sessions: ReadingSession[] = stored ? JSON.parse(stored) : [];
    
    // Get today's sessions
    const today = new Date().toISOString().split('T')[0];
    const todaysSessions = sessions.filter(s => s.date === today);
    setTodaysSessions(todaysSessions);
    
    // Calculate averages and personal best
    if (sessions.length > 0) {
      const totalWPM = sessions.reduce((sum, s) => sum + s.wpm, 0);
      setAverageWPM(Math.round(totalWPM / sessions.length));
      setPersonalBest(Math.max(...sessions.map(s => s.wpm)));
    }

    // Load existing session for this chapter
    const existingSession = sessions.find(s => s.chapterId === chapterId && !s.endTime);
    if (existingSession) {
      setTotalActiveTime(existingSession.totalActiveTime);
      setSessionStartTime(existingSession.startTime);
    }
  }, [chapterId]);

  // Track user activity (scrolling, clicking, mouse movement)
  useEffect(() => {
    if (!isVisible) return;

    const handleActivity = () => {
      lastActivityTime.current = Date.now();
      
      if (!isReading && sessionStartTime) {
        setIsReading(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseReading();
      } else if (sessionStartTime) {
        setIsReading(true);
      }
    };

    const events = ['scroll', 'click', 'mousemove', 'keypress'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVisible, isReading, sessionStartTime]);

  // Start reading session
  useEffect(() => {
    if (isVisible && !sessionStartTime) {
      const startTime = Date.now();
      setSessionStartTime(startTime);
      setIsReading(true);
      lastActivityTime.current = startTime;
    }
  }, [isVisible]);

  // Monitor for inactivity
  useEffect(() => {
    if (!isReading) return;

    const checkInactivity = () => {
      const timeSinceActivity = Date.now() - lastActivityTime.current;
      if (timeSinceActivity > 5000) { // 5 seconds of inactivity
        pauseReading();
      }
    };

    inactivityTimer.current = setInterval(checkInactivity, 1000);
    return () => {
      if (inactivityTimer.current) {
        clearInterval(inactivityTimer.current);
      }
    };
  }, [isReading]);

  // Update reading statistics
  useEffect(() => {
    if (!isReading || !sessionStartTime) return;

    const updateStats = () => {
      const now = Date.now();
      const newActiveTime = totalActiveTime + 1;
      setTotalActiveTime(newActiveTime);

      if (newActiveTime > 0) {
        // Calculate WPM based on estimated words read vs time
        const timeInMinutes = newActiveTime / 60;
        const estimatedWordsRead = Math.min(wordCount, (newActiveTime / (wordCount * 0.4)) * wordCount); // Assume average reading
        const wpm = Math.round(estimatedWordsRead / timeInMinutes);
        setCurrentWPM(wpm);
      }
    };

    sessionUpdateInterval.current = setInterval(updateStats, 1000);
    return () => {
      if (sessionUpdateInterval.current) {
        clearInterval(sessionUpdateInterval.current);
      }
    };
  }, [isReading, sessionStartTime, totalActiveTime, wordCount]);

  const pauseReading = () => {
    setIsReading(false);
    if (inactivityTimer.current) {
      clearInterval(inactivityTimer.current);
    }
  };

  const saveSession = () => {
    if (!sessionStartTime) return;

    const session: ReadingSession = {
      chapterId,
      chapterTitle,
      startTime: sessionStartTime,
      endTime: Date.now(),
      totalActiveTime,
      wordsRead: Math.min(wordCount, Math.round((totalActiveTime / 60) * currentWPM)),
      wpm: currentWPM,
      date: new Date().toISOString().split('T')[0],
    };

    const stored = localStorage.getItem('reading_sessions');
    const sessions: ReadingSession[] = stored ? JSON.parse(stored) : [];
    const updatedSessions = [...sessions.filter(s => s.chapterId !== chapterId || s.endTime), session];
    
    localStorage.setItem('reading_sessions', JSON.stringify(updatedSessions));
  };

  // Save session when component unmounts or chapter changes
  useEffect(() => {
    return () => {
      if (sessionStartTime && totalActiveTime > 30) { // Only save sessions longer than 30 seconds
        saveSession();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeedCategory = (wpm: number): { label: string; color: string; icon: React.ReactNode } => {
    const target = getTargetWPM();
    if (wpm >= target * 1.2) {
      return { label: 'Excellent', color: 'text-green-400', icon: <Award size={16} /> };
    } else if (wpm >= target) {
      return { label: 'Good', color: 'text-blue-400', icon: <TrendingUp size={16} /> };
    } else if (wpm >= target * 0.8) {
      return { label: 'Improving', color: 'text-yellow-400', icon: <Target size={16} /> };
    } else {
      return { label: 'Keep Practicing', color: 'text-slate-400', icon: <Zap size={16} /> };
    }
  };

  const speedCategory = getSpeedCategory(currentWPM);
  const progress = Math.min(100, (currentWPM / getTargetWPM()) * 100);

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="text-green-400" size={20} />
          <h3 className="font-semibold text-slate-100">Reading Speed Tracker</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1 ${speedCategory.color}`}>
            {speedCategory.icon}
            <span>{speedCategory.label}</span>
          </div>
        </div>
      </div>

      {/* Current Session Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-800 rounded-lg">
          <div className="text-lg font-bold text-green-400">{currentWPM}</div>
          <div className="text-xs text-slate-400">Words/Min</div>
        </div>
        <div className="text-center p-3 bg-slate-800 rounded-lg">
          <div className="text-lg font-bold text-blue-400">{formatTime(totalActiveTime)}</div>
          <div className="text-xs text-slate-400">Reading Time</div>
        </div>
        <div className="text-center p-3 bg-slate-800 rounded-lg">
          <div className="text-lg font-bold text-purple-400">{getTargetWPM()}</div>
          <div className="text-xs text-slate-400">Target WPM</div>
        </div>
        <div className="text-center p-3 bg-slate-800 rounded-lg">
          <div className="text-lg font-bold text-yellow-400">{personalBest}</div>
          <div className="text-xs text-slate-400">Personal Best</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Progress to Target ({getTargetWPM()} WPM)</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className="h-full rounded-full transition-all duration-500 progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Reading Status */}
      <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isReading ? 'bg-green-400' : 'bg-slate-500'}`}></div>
          <span className="text-sm text-slate-300">
            {isReading ? 'Reading now...' : 'Paused (inactive)'}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          {todaysSessions.length} sessions today
        </div>
      </div>

      {/* Tips for Improvement */}
      {currentWPM > 0 && currentWPM < getTargetWPM() && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="text-sm font-medium text-blue-300 mb-1">💡 Reading Tip</div>
          <div className="text-xs text-blue-200">
            {currentWPM < getTargetWPM() * 0.7 
              ? "Try to read phrases rather than individual words to improve speed."
              : "Great progress! Focus on understanding while maintaining your pace."
            }
          </div>
        </div>
      )}
    </div>
  );
}