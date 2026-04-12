import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchRecommendations } from '@/services/harnessService';

interface Recs { recommendations: string[]; focusArea: string; encouragement: string; }

export default function SmartRecommendations() {
  const progress = useAppStore(s => s.progress);
  const [recs, setRecs] = useState<Recs | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchRecommendations({
      completedChapters: Object.keys(progress.chaptersCompleted).filter(k => progress.chaptersCompleted[k]),
      quizResults: progress.quizResults,
      streakDays: progress.streakDays || 0,
      coins: progress.coins,
    }).then(setRecs).catch(() => setRecs(null)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-6 animate-pulse"><div className="h-5 bg-slate-700 rounded w-48 mb-3" /><div className="h-4 bg-slate-700 rounded w-full" /></div>;
  if (!recs) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="text-emerald-400" size={18} />{recs.focusArea}
        </h3>
        <button onClick={load} className="text-slate-400 hover:text-emerald-400 transition-colors"><RefreshCw size={14} /></button>
      </div>
      <p className="text-emerald-300 text-sm mb-4 italic">{recs.encouragement}</p>
      <div className="space-y-2">
        {recs.recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
            </div>
            <p className="text-sm text-slate-300">{rec}</p>
          </div>
        ))}
      </div>
      <Link to="/read" className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm w-full">
        Continue learning <ArrowRight size={14} />
      </Link>
    </div>
  );
}
