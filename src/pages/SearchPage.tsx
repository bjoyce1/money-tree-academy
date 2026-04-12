import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, ExternalLink, Book } from 'lucide-react';
import chapters from '../data/chapters.json';
import Footer from '../components/Footer';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    
    const list: { slug: string, title: string, excerpt: string }[] = [];
    chapters.forEach(ch => {
      ch.sections.forEach(s => {
        const idx = s.htmlBody.toLowerCase().indexOf(term);
        if (idx >= 0) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(s.htmlBody.length, idx + 80);
          const excerpt = s.htmlBody.slice(start, end).replace(/<[^>]+>/g, '');
          list.push({ 
            slug: ch.slug, 
            title: ch.title, 
            excerpt: '...' + excerpt + '...' 
          });
        }
      });
    });
    return list;
  }, [query]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-black/40 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/" 
            className="font-semibold text-slate-100 hover:text-brand transition-colors flex items-center gap-2"
            data-testid="link-home"
          >
            <ArrowLeft size={16} />
            The Money Tree of Life
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/read" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="link-read"
            >
              Read
            </Link>
            <Link 
              href="/read/glossary" 
              className="text-slate-300 hover:text-brand transition-colors"
              data-testid="link-glossary"
            >
              Glossary
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">Search Chapters</h2>
          <p className="text-slate-300">Find specific concepts and information across all chapters</p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search for concepts, terms, or ideas..." 
              className="w-full px-4 py-4 pl-12 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:border-brand focus:outline-none text-lg"
              data-testid="input-search"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          </div>
        </div>

        <div data-testid="search-results">
          {query.trim() === '' ? (
            <div className="text-center text-slate-400 py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p>Enter a search term to find relevant content across all chapters</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, i) => (
                <div 
                  key={i} 
                  className="bg-slate-900 border border-slate-700 rounded-lg p-6"
                  data-testid={`result-${i}`}
                >
                  <h3 className="font-semibold text-slate-100 mb-2">{result.title}</h3>
                  <p className="text-slate-300 mb-3">{result.excerpt}</p>
                  <Link 
                    href={`/read/${result.slug}`} 
                    className="text-brand hover:text-brand/80 transition-colors inline-flex items-center gap-1"
                    data-testid={`link-${result.slug}`}
                  >
                    <ExternalLink size={14} />
                    Open Chapter
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No results found</h3>
              <p className="text-slate-500">Try different keywords or check your spelling</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
