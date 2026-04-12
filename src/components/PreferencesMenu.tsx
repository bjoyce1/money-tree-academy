import { useState, useEffect } from "react";
import { Settings, X, Eye, EyeOff } from "lucide-react";

interface SectionPreference {
  id: string;
  title: string;
  enabled: boolean;
}

interface PreferencesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange: (preferences: Record<string, boolean>) => void;
}

const DEFAULT_SECTIONS = [
  { id: "progress-rewards", title: "Progress & Rewards", enabled: true },
  { id: "reading-tools", title: "Reading Tools", enabled: true },
  { id: "ai-chat-top", title: "Move AI Chat to Top", enabled: false },

  { id: "learning-activities", title: "Learning Activities", enabled: true },
  { id: "ai-chat", title: "AI Chat", enabled: true },
];

const THEME_OPTIONS = [
  { id: 'default', label: 'Default', className: '' },
  { id: 'pink', label: 'Pink (Princess)', className: 'theme-pink' },
  { id: 'blue', label: 'Blue (Explorer)', className: 'theme-blue' },
];

const PreferencesMenu: React.FC<PreferencesMenuProps> = ({
  isOpen,
  onClose,
  onPreferencesChange,
}) => {
  const [sections, setSections] = useState<SectionPreference[]>(DEFAULT_SECTIONS);
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem('selectedTheme') || 'default';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Apply theme function with animation
  const applyTheme = (themeId: string) => {
    setIsTransitioning(true);
    
    // Add a subtle fade effect during transition
    document.documentElement.style.opacity = '0.95';
    
    setTimeout(() => {
      // Remove all existing theme classes
      document.documentElement.className = document.documentElement.className
        .replace(/theme-\w+/g, '')
        .trim();
      
      // Add new theme class if not default
      const theme = THEME_OPTIONS.find(t => t.id === themeId);
      if (theme && theme.className) {
        document.documentElement.classList.add(theme.className);
      }
      
      // Restore opacity and end transition
      setTimeout(() => {
        document.documentElement.style.opacity = '1';
        setIsTransitioning(false);
      }, 100);
    }, 150);
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('sectionPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        const updatedSections = DEFAULT_SECTIONS.map(section => ({
          ...section,
          enabled: parsed[section.id] ?? section.enabled
        }));
        setSections(updatedSections);
        
        // Notify parent of current preferences
        const preferencesObj = updatedSections.reduce((acc, section) => {
          acc[section.id] = section.enabled;
          return acc;
        }, {} as Record<string, boolean>);
        onPreferencesChange(preferencesObj);
      } catch (error) {
        // Error loading section preferences from localStorage
      }
    }
  }, [onPreferencesChange]);

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(selectedTheme);
  }, []);

  // Handle theme change with animation
  const handleThemeChange = (themeId: string) => {
    if (isTransitioning) return; // Prevent rapid theme switching
    
    setSelectedTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('selectedTheme', themeId);
  };

  const toggleSection = (sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, enabled: !section.enabled }
        : section
    );
    
    setSections(updatedSections);
    
    // Save to localStorage
    const preferencesObj = updatedSections.reduce((acc, section) => {
      acc[section.id] = section.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    
    localStorage.setItem('sectionPreferences', JSON.stringify(preferencesObj));
    onPreferencesChange(preferencesObj);
  };

  const resetToDefaults = () => {
    if (isTransitioning) return; // Prevent reset during transition
    
    setSections(DEFAULT_SECTIONS);
    localStorage.removeItem('sectionPreferences');
    
    // Reset theme to default with animation
    setSelectedTheme('default');
    applyTheme('default');
    localStorage.removeItem('selectedTheme');
    
    const defaultPrefs = DEFAULT_SECTIONS.reduce((acc, section) => {
      acc[section.id] = section.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    
    onPreferencesChange(defaultPrefs);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-md shadow-2xl"
        role="dialog"
        aria-labelledby="preferences-title"
        aria-modal="true"
        data-testid="preferences-menu"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="preferences-title" className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Settings size={20} />
            Layout Preferences
          </h2>
          <button
            className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            onClick={onClose}
            aria-label="Close preferences"
            data-testid="button-close-preferences"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-slate-400">
            Choose which sections to show on chapter pages. Disabled sections will be hidden to reduce clutter.
          </p>
          
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600"
              >
                <div className="flex items-center gap-3">
                  {section.enabled ? (
                    <Eye size={16} className="text-green-400" />
                  ) : (
                    <EyeOff size={16} className="text-slate-500" />
                  )}
                  <span className={`font-medium ${
                    section.enabled ? "text-slate-200" : "text-slate-500"
                  }`}>
                    {section.title}
                  </span>
                </div>
                
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                    section.enabled ? "bg-purple-600" : "bg-slate-600"
                  }`}
                  onClick={() => toggleSection(section.id)}
                  role="switch"
                  aria-checked={section.enabled}
                  aria-labelledby={`label-${section.id}`}
                  data-testid={`toggle-${section.id}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      section.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Selection Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-200">Theme Selection</h3>
          <p className="text-sm text-slate-400">
            Choose a fun theme that makes reading more enjoyable!
          </p>
          
          <div className="space-y-2">
            {THEME_OPTIONS.map((theme) => (
              <label
                key={theme.id}
                className="flex items-center p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700/70 cursor-pointer transition-colors"
                data-testid={`theme-option-${theme.id}`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme.id}
                  checked={selectedTheme === theme.id}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="sr-only"
                />
                <div 
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                    selectedTheme === theme.id
                      ? 'border-purple-400 bg-purple-400 scale-110'
                      : 'border-slate-400 bg-transparent scale-100'
                  } ${isTransitioning && selectedTheme === theme.id ? 'animate-pulse' : ''}`}
                >
                  {selectedTheme === theme.id && (
                    <div className={`w-2 h-2 rounded-full bg-white transition-all duration-300 ${
                      isTransitioning ? 'scale-0' : 'scale-100'
                    }`} />
                  )}
                </div>
                <span className={`font-medium text-slate-200 transition-all duration-300 ${
                  isTransitioning && selectedTheme === theme.id ? 'opacity-75' : 'opacity-100'
                }`}>
                  {theme.label}
                  {isTransitioning && selectedTheme === theme.id && (
                    <span className="ml-2 text-xs text-purple-300 animate-pulse">Applying...</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-200 transition-colors text-sm"
            onClick={resetToDefaults}
            data-testid="button-reset-defaults"
          >
            Reset to Defaults
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
            onClick={onClose}
            data-testid="button-save-preferences"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesMenu;