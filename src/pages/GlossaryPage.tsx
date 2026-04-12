import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Book } from 'lucide-react';
import terms from '../data/glossary.json';
import Footer from '../components/Footer';

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    
    const query = searchQuery.toLowerCase();
    return terms.filter(term => 
      term.term.toLowerCase().includes(query) || 
      term.shortDefinition.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const sortedTerms = useMemo(() => 
    filteredTerms.sort((a, b) => a.term.localeCompare(b.term)),
    [filteredTerms]
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-black/40 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            to="/" 
            className="font-semibold text-slate-100 hover:text-brand transition-colors flex items-center gap-2"
            data-testid="link-home"
          >
            <ArrowLeft size={16} />
            The Money Tree of Life
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              to="/read" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="link-read"
            >
              Read
            </Link>
            <Link 
              to="/read/search" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="link-search"
            >
              <Search size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">Financial Glossary</h2>
          <p className="text-slate-300">Key terms and definitions to help you understand money concepts</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms..." 
              className="w-full px-4 py-3 pl-12 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:border-brand focus:outline-none"
              data-testid="input-search"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        <div className="mb-4 text-sm text-slate-400">
          {searchQuery.trim() ? `Found ${sortedTerms.length} term${sortedTerms.length !== 1 ? 's' : ''}` : `${terms.length} terms total`}
        </div>

        <div className="grid gap-4" data-testid="glossary-terms">
          {sortedTerms.length > 0 ? (
            sortedTerms.map(term => (
              <div 
                key={term.id} 
                className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-brand/30 transition-colors"
                data-testid={`term-${term.term.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <h3 className="text-lg font-semibold text-brand mb-2 capitalize">{term.term}</h3>
                <p className="text-slate-300 leading-relaxed">{term.shortDefinition}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No terms found</h3>
              <p className="text-slate-500">Try adjusting your search query</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-brand hover:text-brand/80 transition-colors"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
