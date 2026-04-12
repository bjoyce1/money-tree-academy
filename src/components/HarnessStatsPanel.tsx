import { useState, useEffect } from 'react';
import { BarChart3, Zap, MessageSquare, Brain } from 'lucide-react';
import { fetchHarnessStats } from '@/services/harnessService';

export default function HarnessStatsPanel() {
  const [stats, setStats] = useState<{ totalRuns: number; configBreakdown: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHarnessStats().then(setStats).catch(() => setStats({ totalRuns: 0, configBreakdown: {} })).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm animate-pulse">Loading harness data...</div>;
  if (!stats || stats.totalRuns === 0) return (
    <div className="text-center py-6">
      <Brain className="text-emerald-400 mx-auto mb-3" size={32} />
      <p className="text-slate-300 font-medium">No AI interactions yet</p>
      <p className="text-slate-400 text-sm mt-1">Chat with your guide to start building your learning profile.</p>
    </div>
  );

  const labels: Record<string, string> = { chapter_discussion: "Conversations", quiz_generation: "Quizzes", practice_scenario: "Scenarios", glossary_explain: "Terms explained" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1"><MessageSquare className="text-emerald-400" size={16} /><span className="text-xs text-slate-400">Total interactions</span></div>
          <span className="text-2xl font-bold text-slate-100">{stats.totalRuns}</span>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="text-emerald-400" size={16} /><span className="text-xs text-slate-400">Configs used</span></div>
          <span className="text-2xl font-bold text-slate-100">{Object.keys(stats.configBreakdown).length}</span>
        </div>
      </div>
      {Object.entries(stats.configBreakdown).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Breakdown</h4>
          {Object.entries(stats.configBreakdown).map(([config, count]) => {
            const pct = Math.round((count / stats.totalRuns) * 100);
            return (
              <div key={config} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 flex-1">{labels[config] || config}</span>
                <div className="w-24 bg-slate-700 rounded-full h-1.5"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} /></div>
                <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
