import { useState, useEffect } from "react";
import { Gauge, Accessibility, Minus, Plus, ArrowUp, Settings } from "lucide-react";
import PreferencesMenu from "./PreferencesMenu";

interface FloatingActionsProps {
  onPreferencesChange?: (preferences: Record<string, boolean>) => void;
}

const FloatingActions: React.FC<FloatingActionsProps> = ({ onPreferencesChange }) => {
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [showPerformanceMenu, setShowPerformanceMenu] = useState(false);
  const [showPreferencesMenu, setShowPreferencesMenu] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(() => {
    return document.documentElement.classList.contains("high-contrast");
  });
  const [fontScale, setFontScale] = useState(() => {
    const stored = localStorage.getItem('fontScale');
    return stored ? parseFloat(stored) : 1;
  });
  const [lineHeight, setLineHeight] = useState(() => {
    const stored = localStorage.getItem('lineHeight');
    return stored ? parseFloat(stored) : 1.6;
  });
  const [contentWidth, setContentWidth] = useState(() => {
    const stored = localStorage.getItem('contentWidth');
    return stored ? parseInt(stored) : 720;
  });

  // Apply high contrast and font scaling
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", isHighContrast);
    localStorage.setItem('highContrast', isHighContrast.toString());
  }, [isHighContrast]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}rem`;
    localStorage.setItem('fontScale', fontScale.toString());
  }, [fontScale]);

  // Apply line height and content width
  useEffect(() => {
    document.documentElement.style.setProperty('--line-height', lineHeight.toString());
    localStorage.setItem('lineHeight', lineHeight.toString());
  }, [lineHeight]);

  useEffect(() => {
    document.documentElement.style.setProperty('--max-content-width', `${contentWidth}px`);
    localStorage.setItem('contentWidth', contentWidth.toString());
  }, [contentWidth]);

  // Track scroll position for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedHighContrast = localStorage.getItem('highContrast') === 'true';
    setIsHighContrast(storedHighContrast);
  }, []);

  // Toggle all collapsible sections closed to improve performance
  const collapseAllSections = () => {
    const buttons = document.querySelectorAll('[data-collapse-button]');
    buttons.forEach(btn => {
      const buttonElement = btn as HTMLElement;
      // Only click if the section is currently open (check for expanded state)
      const isExpanded = buttonElement.getAttribute('aria-expanded') === 'true' || 
                        buttonElement.textContent?.includes('−');
      if (isExpanded) {
        buttonElement.click();
      }
    });
    setShowPerformanceMenu(false);
  };

  // Stop all current audio (narration or companion speech)
  const stopAudio = () => {
    // Stop any HTML5 audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    // Stop speech synthesis if available
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Try to stop voice service if available
    try {
      // This will work if voiceService is imported and available
      const voiceService = (window as any).voiceService;
      if (voiceService && typeof voiceService.stopCurrent === 'function') {
        voiceService.stopCurrent();
      }
    } catch (error) {
      // Voice service not available
    }

    setShowPerformanceMenu(false);
  };

  const increaseFontSize = () => {
    setFontScale(prev => Math.min(1.5, prev + 0.1));
  };

  const decreaseFontSize = () => {
    setFontScale(prev => Math.max(0.8, prev - 0.1));
  };

  const resetFontSize = () => {
    setFontScale(1);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPreferences = () => {
    setShowPreferencesMenu(true);
    setShowPerformanceMenu(false);
  };

  const handlePreferencesChange = (preferences: Record<string, boolean>) => {
    if (onPreferencesChange) {
      onPreferencesChange(preferences);
    }
  };

  // Line height controls
  const increaseLineHeight = () => {
    setLineHeight(prev => Math.min(2.5, prev + 0.1));
  };

  const decreaseLineHeight = () => {
    setLineHeight(prev => Math.max(1.2, prev - 0.1));
  };

  const resetLineHeight = () => {
    setLineHeight(1.6);
  };

  // Content width controls
  const increaseContentWidth = () => {
    setContentWidth(prev => Math.min(1000, prev + 50));
  };

  const decreaseContentWidth = () => {
    setContentWidth(prev => Math.max(500, prev - 50));
  };

  const resetContentWidth = () => {
    setContentWidth(720);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-floating-menu]') && !target.closest('[data-testid="preferences-menu"]')) {
        setShowAccessibilityMenu(false);
        setShowPerformanceMenu(false);
        setShowPreferencesMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Floating buttons */}
      <div className="fixed bottom-4 right-3 sm:right-4 flex flex-col gap-2 sm:gap-3 z-50" data-floating-menu>
        {/* Back to top button */}
        {showBackToTop && (
          <button
            aria-label="Back to top"
            className="p-3 sm:p-3 rounded-full shadow-lg bg-slate-600 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all transform hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={scrollToTop}
            data-testid="button-back-to-top"
          >
            <ArrowUp size={18} className="sm:w-5 sm:h-5" />
          </button>
        )}
        
        <button
          aria-label="Accessibility settings"
          className="p-3 sm:p-3 rounded-full shadow-lg bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => {
            setShowAccessibilityMenu(!showAccessibilityMenu);
            setShowPerformanceMenu(false);
          }}
          data-testid="button-accessibility-settings"
        >
          <Accessibility size={18} className="sm:w-5 sm:h-5" />
        </button>
        <button
          aria-label="Performance settings"
          className="p-3 sm:p-3 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => {
            setShowPerformanceMenu(!showPerformanceMenu);
            setShowAccessibilityMenu(false);
          }}
          data-testid="button-performance-settings"
        >
          <Gauge size={18} className="sm:w-5 sm:h-5" />
        </button>
        <button
          aria-label="Layout preferences and themes"
          className="p-3 sm:p-3 rounded-full shadow-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={openPreferences}
          data-testid="button-preferences-settings"
        >
          <Settings size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Accessibility menu */}
      {showAccessibilityMenu && (
        <div 
          className="fixed bottom-20 right-3 sm:right-4 p-3 sm:p-4 rounded-xl shadow-xl bg-slate-800 border border-slate-600 z-50 w-[calc(100vw-1.5rem)] max-w-[320px] sm:min-w-[280px]"
          data-floating-menu
          data-testid="accessibility-menu"
        >
          <h4 className="font-bold mb-3 text-slate-100 flex items-center gap-2">
            <Accessibility size={16} />
            Accessibility
          </h4>
          
          <button
            className="w-full mb-3 p-2 rounded-md bg-purple-600/20 hover:bg-purple-600/30 text-slate-100 transition-colors text-left"
            onClick={() => setIsHighContrast(!isHighContrast)}
            data-testid="button-toggle-high-contrast"
          >
            {isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
          </button>
          
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-200 text-sm font-medium">Font Size</span>
              <span className="text-slate-400 text-xs">{Math.round(fontScale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                onClick={decreaseFontSize}
                disabled={fontScale <= 0.8}
                data-testid="button-decrease-font"
                aria-label="Decrease font size"
              >
                <Minus size={14} />
              </button>
              <button
                className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors text-xs"
                onClick={resetFontSize}
                data-testid="button-reset-font"
              >
                Reset
              </button>
              <button
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                onClick={increaseFontSize}
                disabled={fontScale >= 1.5}
                data-testid="button-increase-font"
                aria-label="Increase font size"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Line Height Controls */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-200 text-sm font-medium">Line Height</span>
              <span className="text-slate-400 text-xs">{lineHeight.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                onClick={decreaseLineHeight}
                disabled={lineHeight <= 1.2}
                data-testid="button-decrease-line-height"
                aria-label="Decrease line height"
              >
                <Minus size={14} />
              </button>
              <button
                className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors text-xs"
                onClick={resetLineHeight}
                data-testid="button-reset-line-height"
              >
                Reset
              </button>
              <button
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                onClick={increaseLineHeight}
                disabled={lineHeight >= 2.5}
                data-testid="button-increase-line-height"
                aria-label="Increase line height"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Content Width Controls */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-200 text-sm font-medium">Content Width</span>
              <span className="text-slate-400 text-xs">{contentWidth}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                onClick={decreaseContentWidth}
                disabled={contentWidth <= 500}
                data-testid="button-decrease-content-width"
                aria-label="Decrease content width"
              >
                <Minus size={14} />
              </button>
              <button
                className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors text-xs"
                onClick={resetContentWidth}
                data-testid="button-reset-content-width"
              >
                Reset
              </button>
              <button
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                onClick={increaseContentWidth}
                disabled={contentWidth >= 1000}
                data-testid="button-increase-content-width"
                aria-label="Increase content width"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            className="w-full p-2 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            onClick={() => setShowAccessibilityMenu(false)}
            data-testid="button-close-accessibility"
          >
            Close
          </button>
        </div>
      )}

      {/* Performance menu */}
      {showPerformanceMenu && (
        <div 
          className="fixed bottom-20 right-3 sm:right-4 p-3 sm:p-4 rounded-xl shadow-xl bg-slate-800 border border-slate-600 z-50 w-[calc(100vw-1.5rem)] max-w-[320px] sm:min-w-[280px]"
          data-floating-menu
          data-testid="performance-menu"
        >
          <h4 className="font-bold mb-3 text-slate-100 flex items-center gap-2">
            <Gauge size={16} />
            Performance
          </h4>
          
          <button
            className="w-full mb-3 p-2 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-slate-100 transition-colors text-left"
            onClick={collapseAllSections}
            data-testid="button-collapse-all"
          >
            Collapse all sections
          </button>
          
          <button
            className="w-full mb-3 p-2 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-slate-100 transition-colors text-left"
            onClick={stopAudio}
            data-testid="button-stop-audio"
          >
            Stop all audio
          </button>

          <button
            className="w-full mb-3 p-2 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-slate-100 transition-colors text-left flex items-center gap-2"
            onClick={openPreferences}
            data-testid="button-open-preferences"
          >
            <Settings size={16} />
            Layout Preferences
          </button>

          <button
            className="w-full p-2 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            onClick={() => setShowPerformanceMenu(false)}
            data-testid="button-close-performance"
          >
            Close
          </button>
        </div>
      )}

      {/* Preferences Menu */}
      <PreferencesMenu 
        isOpen={showPreferencesMenu}
        onClose={() => setShowPreferencesMenu(false)}
        onPreferencesChange={handlePreferencesChange}
      />layoutPreferences
    </>
  );
};

export default FloatingActions;