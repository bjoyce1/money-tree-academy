import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { progressAPI } from '@/lib/api';
import ReaderShell from '../components/ReaderShell';
import chapters from '../data/chapters.json';
import GlossaryPopover from '../components/GlossaryPopover';
import QuizBlock from '../components/QuizBlock';
import NotesPanel from '../components/NotesPanel';
import TextToSpeechPlayer from '../components/TextToSpeechPlayer';
import HighlightManager, { useHighlights } from '../components/HighlightManager';
import BookmarkManager from '../components/BookmarkManager';
import ReadingSpeedTracker from '../components/ReadingSpeedTracker';
import ChapterSummaryCards from '../components/ChapterSummaryCards';
import RealWorldActivities from '../components/RealWorldActivities';
import ReadingStreaks, { useReadingStreaks } from '../components/ReadingStreaks';
import AchievementSystem, { useAchievements } from '../components/AchievementSystem';
import { useCoins } from '../components/CoinsSystem';
import ProgressTree from '../components/ProgressTree';
import { MiniGamesLazy, RewardsShopLazy, AiChatInterfaceLazy } from '../components/LazyComponents';
import CoinsSystem from '../components/CoinsSystem';
import CharacterCompanion from '../components/CharacterCompanion';
import FloatingActions from '../components/FloatingActions';
import TableOfContents from '../components/TableOfContents';

// CollapsibleSection component
const CollapsibleSection: React.FC<{id?: string; title: string; children: React.ReactNode}> = ({ id, title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div id={id} className="mb-6 border border-slate-700 rounded-lg scroll-mt-20">
      <button
        data-collapse-button
        aria-expanded={isOpen}
        className="w-full flex justify-between items-center px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-t-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-slate-100">{title}</span>
        <span className="text-xl text-slate-300">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

function renderHtml(html: string) {
  return { __html: html };
}

export default function ChapterPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chapter = useMemo(() => chapters.find(c => c.slug === slug), [slug]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [sectionPreferences, setSectionPreferences] = useState({
    'progress-rewards': true,
    'reading-tools': true,
    'learning-activities': true,
    'ai-chat': true,
  });
  const { triggerReadingActivity } = useReadingStreaks();
  const { triggerAchievement } = useAchievements();
  const { awardCoins } = useCoins();

  // Table of contents sections
  const tocSections = [
    { id: 'progress-rewards', title: 'Progress & Rewards', isOpen: sectionPreferences['progress-rewards'] },
    { id: 'reading-tools', title: 'Reading Tools', isOpen: sectionPreferences['reading-tools'] },
    { id: 'learning-activities', title: 'Learning Activities', isOpen: sectionPreferences['learning-activities'] },
    { id: 'ai-chat', title: 'AI Chat', isOpen: sectionPreferences['ai-chat'] },
  ];

  // Handle section preferences change
  const handlePreferencesChange = (preferences: Record<string, boolean>) => {
    setSectionPreferences(prev => ({ ...prev, ...preferences }));
  };

  // Skip to content handler
  const skipToContent = () => {
    const contentElement = document.getElementById('chapter-content');
    if (contentElement) {
      contentElement.focus();
      contentElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mutation to update reading progress
  const updateProgressMutation = useMutation({
    mutationFn: (resumeSlug: string) => progressAPI.update(resumeSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reading-progress'] });
    },
  });

  useEffect(() => {
    if (slug) localStorage.setItem('resumeSlug', slug);
  }, [slug]);

  // Track scroll position for bookmarks
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        setScrollPosition(Math.min(100, Math.max(0, scrollPercent)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track page visibility for reading speed tracker
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Trigger reading activity when user starts reading
  useEffect(() => {
    if (chapter && isPageVisible) {
      // Trigger reading activity after user has been on page for 30 seconds
      const timer = setTimeout(() => {
        triggerReadingActivity();
        triggerAchievement('reading-time', { minutes: 1 });
        
        // Award reading coins
        const readingCoins = 15 + Math.floor(Math.random() * 10); // 15-25 coins for reading
        awardCoins(readingCoins, `Reading Chapter ${chapter.order}`, 'reading');
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [chapter, isPageVisible, triggerReadingActivity, triggerAchievement, awardCoins]);

  // Track chapter completion
  useEffect(() => {
    if (chapter) {
      // Always use localStorage for guest mode
      const completed = JSON.parse(localStorage.getItem('completed_chapters') || '[]');
      if (completed.includes(chapter.id)) {
        triggerAchievement('chapter-completed', { count: completed.length });
      }
    }
  }, [chapter, triggerAchievement]);

  // Calculate approximate word count for the chapter
  const wordCount = useMemo(() => {
    if (!chapter) return 0;
    const text = chapter.sections.map(s => s.htmlBody).join(' ').replace(/<[^>]+>/g, ' ');
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }, [chapter]);

  // Calculate reading progress
  const [wordsRead, setWordsRead] = useState(0);
  const [readingTimeInMinutes, setReadingTimeInMinutes] = useState(0);

  useEffect(() => {
    // Simulate reading progress - in a real app this would track actual reading
    const interval = setInterval(() => {
      setWordsRead(prev => Math.min(wordCount, prev + Math.floor(Math.random() * 20) + 5));
      setReadingTimeInMinutes(prev => prev + 0.1);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [wordCount]);

  if (!chapter) {
    return (
      <ReaderShell>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Chapter not found</h2>
          <Link 
            to="/read" 
            className="text-brand hover:text-brand/80 transition-colors"
            data-testid="link-back-to-read"
          >
            Back to Reading Home
          </Link>
        </div>
      </ReaderShell>
    );
  }

  const prev = chapters.find(c => c.order === chapter.order - 1);
  const next = chapters.find(c => c.order === chapter.order + 1);

  // Replace [[term]] with glossary popover component slots
  const bodyWithGlossary = chapter.sections.map(s => s.htmlBody).join('')
    .replace(/\[\[(.+?)\]\]/g, (_m, term) => `<span data-popover="${term}">${term}</span>`);

  // Apply highlights to content
  const highlightedContent = useHighlights(chapter.id, bodyWithGlossary);

  return (
    <ReaderShell currentSlug={chapter.slug}>
      {/* Skip to content link for accessibility */}
      <button
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        onClick={skipToContent}
        data-testid="skip-to-content"
      >
        Skip to chapter content
      </button>

      {/* Table of Contents */}
      <TableOfContents sections={tocSections} />

      <div className="fade-in px-3 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight" data-testid="chapter-title">
              {chapter.title}
            </h2>
            <div className="text-sm text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={14} />
              {chapter.estReadMinutes} min read
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-sm text-slate-400">Chapter {chapter.order} of {chapters.length}</div>
            <div className="w-full sm:w-32 bg-slate-700 rounded-full h-2 mt-1">
              <div 
                className="progress-bar h-full rounded-full" 
                style={{ width: `${(chapter.order / chapters.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mb-4 px-3 sm:px-0">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="progress-bar h-full rounded-full transition-all duration-300" 
              style={{ width: `${(wordsRead / wordCount) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span>{wordsRead} / {wordCount} words</span>
            <span>{readingTimeInMinutes.toFixed(1)} min</span>
          </div>
        </div>

        <CharacterCompanion showSelection={true} />

        <TextToSpeechPlayer text={bodyWithGlossary} chapterTitle={chapter.title} />

        <div 
          id="chapter-content"
          ref={contentRef} 
          className="space-y-4 mb-6 focus:outline-none" 
          data-testid="chapter-content"
          tabIndex={-1}
          style={{
            lineHeight: 'var(--line-height, 1.6)',
            maxWidth: 'var(--max-content-width, 720px)',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          <Glossarized html={highlightedContent} />
        </div>

        {sectionPreferences['progress-rewards'] && (
          <CollapsibleSection id="progress-rewards" title="Progress & Rewards">
            <ReadingStreaks />
            <AchievementSystem />
            <ProgressTree />
            <MiniGamesLazy />
            <CoinsSystem />
            <RewardsShopLazy />
          </CollapsibleSection>
        )}

        {sectionPreferences['reading-tools'] && (
          <CollapsibleSection id="reading-tools" title="Reading Tools">
            <BookmarkManager
              chapterId={chapter.id}
              chapterTitle={chapter.title}
              currentScrollPosition={scrollPosition}
            />
            <ReadingSpeedTracker 
              chapterId={chapter.id} 
              chapterTitle={chapter.title} 
              wordCount={wordCount}
              isVisible={isPageVisible}
            />
          </CollapsibleSection>
        )}

        {sectionPreferences['learning-activities'] && (
          <CollapsibleSection id="learning-activities" title="Learning Activities">
            {chapter.quizId && <QuizBlock quizId={chapter.quizId} />}
            <ChapterSummaryCards 
              chapterId={chapter.id}
              chapterTitle={chapter.title}
              chapterContent={bodyWithGlossary}
              chapterOrder={chapter.order}
            />
            <RealWorldActivities 
              chapterId={chapter.id}
              chapterTitle={chapter.title}
              chapterOrder={chapter.order}
            />
            <NotesPanel chapterId={chapter.id} />
          </CollapsibleSection>
        )}

        {sectionPreferences['ai-chat'] && (
          <CollapsibleSection id="ai-chat" title="AI Chat">
            <AiChatInterfaceLazy 
              chapterId={chapter.id}
              chapterTitle={chapter.title}
            />
          </CollapsibleSection>
        )}

        <HighlightManager chapterId={chapter.id} contentRef={contentRef} />

        <FloatingActions onPreferencesChange={handlePreferencesChange} />

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-700 pt-6 sm:pt-8 gap-4 px-3 sm:px-0">
          {prev ? (
            <Link 
              to={`/read/${prev.slug}`} 
              className="text-brand hover:text-brand/80 transition-colors flex items-center gap-2"
              data-testid="link-previous"
            >
              <ArrowLeft size={16} />
              Previous: {prev.title}
            </Link>
          ) : (
            <span className="text-slate-500">No previous chapter</span>
          )}
          {next ? (
            <Link 
              to={`/read/${next.slug}`} 
              className="text-brand hover:text-brand/80 transition-colors flex items-center gap-2"
              data-testid="link-next"
            >
              Next: {next.title}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <span className="text-slate-500">Last chapter</span>
          )}
        </div>
      </div>
    </ReaderShell>
  );
}

function Glossarized({ html }: { html: string }) {
  // naive split by span tags inserted above
  const regex = /<span data-popover="([^"]+)">([^<]+)<\/span>/g;
  const chunks: Array<string | { term: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const start = match.index;
    if (start > lastIndex) chunks.push(html.slice(lastIndex, start));
    chunks.push({ term: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < html.length) chunks.push(html.slice(lastIndex));

  return (
    <div className="prose-invert reader-prose text-slate-300">
      {chunks.map((c, i) =>
        typeof c === 'string'
          ? <span key={i} dangerouslySetInnerHTML={{ __html: c }} />
          : <GlossaryPopover key={i} term={c.term} />
      )}
    </div>
  );
}