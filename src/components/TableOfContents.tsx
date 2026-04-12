import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";

interface TocSection {
  id: string;
  title: string;
  isOpen: boolean;
}

interface TableOfContentsProps {
  sections: TocSection[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ sections }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  // Track which section is currently in view
  useEffect(() => {
    const observerOptions = {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all section elements
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
      setIsOpen(false); // Close TOC on mobile after navigation
    }
  };

  const visibleSections = sections.filter(section => section.isOpen);

  if (visibleSections.length === 0) {
    return null; // Don't show TOC if no sections are visible
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        className="fixed top-28 left-3 z-40 p-2.5 rounded-full shadow-lg bg-muted/90 backdrop-blur text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors lg:hidden touch-manipulation"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close table of contents" : "Open table of contents"}
        data-testid="button-toggle-toc"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-4 top-1/2 transform -translate-y-1/2 z-40 w-64">
        <div className="backdrop-blur-sm border border-slate-600 rounded-xl p-4 shadow-xl max-h-96 overflow-y-auto bg-[#1e293b6b] pl-[22px] pr-[22px] ml-[12px] mr-[12px] mt-[-3px] mb-[-3px] pt-[7px] pb-[7px]">
          <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <Menu size={16} />
            Table of Contents
          </h3>
          <nav role="navigation" aria-label="Chapter sections">
            <ul className="space-y-2">
              {visibleSections.map((section) => (
                <li key={section.id}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                      activeSection === section.id
                        ? "bg-purple-600/20 text-purple-300 border-l-2 border-purple-400"
                        : "text-slate-300 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                    onClick={() => scrollToSection(section.id)}
                    data-testid={`toc-${section.id}`}
                  >
                    <span>{section.title}</span>
                    <ChevronRight 
                      size={14} 
                      className={`transition-transform ${
                        activeSection === section.id ? "rotate-90" : "group-hover:translate-x-1"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-80 max-w-[80vw] h-full bg-slate-900 border-r border-slate-600 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Menu size={16} />
                Table of Contents
              </h3>
              <button
                className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
                aria-label="Close table of contents"
              >
                <X size={20} />
              </button>
            </div>
            <nav role="navigation" aria-label="Chapter sections">
              <ul className="space-y-3">
                {visibleSections.map((section) => (
                  <li key={section.id}>
                    <button
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        activeSection === section.id
                          ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                          : "text-slate-300 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                      onClick={() => scrollToSection(section.id)}
                      data-testid={`toc-mobile-${section.id}`}
                    >
                      <span>{section.title}</span>
                      <ChevronRight 
                        size={14} 
                        className={`transition-transform ${
                          activeSection === section.id ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default TableOfContents;