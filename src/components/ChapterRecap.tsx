import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { fetchRecap } from '@/services/harnessService';

export default function ChapterRecap({ chapterId }: { chapterId: string }) {
  const progress = useAppStore(s => s.progress);
  const [data, setData] = useState<{ recap: string; previousChapterSlug?: string } | null>(null);

  useEffect(() => {
    fetchRecap(chapterId, Object.keys(progress.chaptersCompleted).filter(k => progress.chaptersCompleted[k]))
      .then(setData).catch(() => setData(null));
  }, [chapterId]);

  if (!data || !data.recap) return null;

  return (
    <div className="mb-6 p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="text-indigo-400" size={16} />
        <span className="text-sm font-medium text-indigo-300">Previously on Money Tree...</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{data.recap}</p>
      {data.previousChapterSlug && (
        <Link to={`/read/${data.previousChapterSlug}`} className="inline-flex items-center gap-1 mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          <ArrowLeft size={12} /> Go back to previous chapter
        </Link>
      )}
    </div>
  );
}
