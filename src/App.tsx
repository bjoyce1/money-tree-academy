import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import HomePage from "@/pages/HomePage";

// Every other route loads on demand, so the home page ships only itself.
const ReadHomePage = lazy(() => import("@/pages/ReadHomePage"));
const ChapterPage = lazy(() => import("@/pages/ChapterPage"));
const GlossaryPage = lazy(() => import("@/pages/GlossaryPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const CharacterSelectionPage = lazy(() => import("@/pages/CharacterSelectionPage"));
const CharacterProfilePage = lazy(() => import("@/pages/CharacterProfilePage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const FlipBookPage = lazy(() => import("@/pages/FlipBookPage"));
const GrowTheTreePage = lazy(() => import("@/pages/GrowTheTreePage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Notifications = lazy(() => import("@/components/Notifications"));

/** A quiet navy screen while a route's code arrives (usually a few frames). */
function RouteFallback() {
  return <div aria-busy="true" aria-label="Loading" className="min-h-screen bg-night" />;
}

function page(Component: ComponentType) {
  return function Page() {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Component />
      </Suspense>
    );
  };
}

const routes = {
  read: page(ReadHomePage),
  chapter: page(ChapterPage),
  glossary: page(GlossaryPage),
  search: page(SearchPage),
  characters: page(CharacterSelectionPage),
  character: page(CharacterProfilePage),
  dashboard: page(DashboardPage),
  flipbook: page(FlipBookPage),
  growTheTree: page(GrowTheTreePage),
  notFound: page(NotFound),
};

function Router() {
  const [location] = useLocation();

  // New pages start at the top, unless the link points at a spot on the page.
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/read" component={routes.read} />
      <Route path="/read/glossary" component={routes.glossary} />
      <Route path="/read/search" component={routes.search} />
      <Route path="/read/:slug" component={routes.chapter} />
      <Route path="/characters" component={routes.characters} />
      <Route path="/characters/:characterId" component={routes.character} />
      <Route path="/dashboard" component={routes.dashboard} />
      <Route path="/flipbook" component={routes.flipbook} />
      <Route path="/play/grow-the-tree" component={routes.growTheTree} />
      <Route component={routes.notFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router />
        <Suspense fallback={null}>
          <Notifications />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
