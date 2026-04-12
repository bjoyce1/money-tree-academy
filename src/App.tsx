import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { useReadingStore } from "@/state/readingStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import HomePage from "@/pages/HomePage";
import ReadHomePage from "@/pages/ReadHomePage";
import ChapterPage from "@/pages/ChapterPage";
import GlossaryPage from "@/pages/GlossaryPage";
import SearchPage from "@/pages/SearchPage";
import CharacterSelectionPage from "@/pages/CharacterSelectionPage";
import CharacterProfilePage from "@/pages/CharacterProfilePage";
import DashboardPage from "@/pages/DashboardPage";
import EnhancedFeaturesPage from "@/pages/EnhancedFeaturesPage";
import MockLoginScreen from "@/components/MockLoginScreen";
import NotFound from "@/pages/NotFound";
import MobileBottomNav from "@/components/MobileBottomNav";

function ThemeInitializer() {
  const { theme } = useReadingStore();
  useEffect(() => {
    document.body.classList.remove(
      "theme-day", "theme-sepia", "theme-night",
      "theme-contrast", "theme-pink", "theme-blue"
    );
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ThemeInitializer />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login-mockup" element={<MockLoginScreen />} />
            <Route path="/enhanced-features" element={<EnhancedFeaturesPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/characters" element={<CharacterSelectionPage />} />
            <Route path="/characters/:characterId" element={<CharacterProfilePage />} />
            <Route path="/read" element={<ReadHomePage />} />
            <Route path="/read/glossary" element={<GlossaryPage />} />
            <Route path="/read/search" element={<SearchPage />} />
            <Route path="/read/:slug" element={<ChapterPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MobileBottomNav />
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
