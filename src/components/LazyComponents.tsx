import { lazy, Suspense } from 'react';

// Lazy load heavy components
const LazyMiniGames = lazy(() => import('./MiniGames'));
const LazyRewardsShop = lazy(() => import('./RewardsShop'));
const LazyAiChatInterface = lazy(() => import('./AiChatInterface'));

// Loading component
const ComponentLoader = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    <span className="ml-3 text-slate-400">Loading {name}...</span>
  </div>
);

// Wrapper components with suspense
export const MiniGamesLazy: React.FC = () => (
  <Suspense fallback={<ComponentLoader name="Mini Games" />}>
    <LazyMiniGames />
  </Suspense>
);

export const RewardsShopLazy: React.FC = () => (
  <Suspense fallback={<ComponentLoader name="Rewards Shop" />}>
    <LazyRewardsShop />
  </Suspense>
);

export const AiChatInterfaceLazy: React.FC<{ chapterId: string; chapterTitle: string }> = (props) => (
  <Suspense fallback={<ComponentLoader name="AI Chat" />}>
    <LazyAiChatInterface {...props} />
  </Suspense>
);