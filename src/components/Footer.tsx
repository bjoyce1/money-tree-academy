import { Link } from "wouter";
import { BookOpen, Sprout, Heart, GraduationCap, Target, Users } from "lucide-react";
import book from "../data/book.json";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg book-cover flex items-center justify-center">
                <Sprout className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{book.title}</h3>
                <p className="text-sm text-slate-400">By {book.author}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Growing financial wisdom through storytelling and interactive learning.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <GraduationCap size={16} />
              <span>Ages {book.audienceAgeMin}-{book.audienceAgeMax} • {book.totalChapters} Chapters</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-4">Explore</h4>
            <nav className="space-y-3">
              <Link 
                href="/read" 
                className="block text-slate-400 hover:text-brand transition-colors text-sm"
              >
                Read Book
              </Link>
              <Link 
                href="/read/glossary" 
                className="block text-slate-400 hover:text-brand transition-colors text-sm"
              >
                Glossary
              </Link>
              <Link 
                href="/read/search" 
                className="block text-slate-400 hover:text-brand transition-colors text-sm"
              >
                Search
              </Link>
              <Link 
                href="/" 
                className="block text-slate-400 hover:text-brand transition-colors text-sm"
              >
                Home
              </Link>
            </nav>
          </div>

          {/* Learning Features */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-4">Features</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <BookOpen size={14} />
                Interactive Reading
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Target size={14} />
                Chapter Quizzes
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Users size={14} />
                Personal Notes
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Sprout size={14} />
                Glossary Popups
              </li>
            </ul>
          </div>

          {/* Educational Mission */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-4">Our Mission</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Teaching kids the tools they need to save, plan, share, and grow their own financial future.
            </p>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="text-brand2" size={16} />
                <span className="text-slate-200 font-medium text-sm">Financial Literacy</span>
              </div>
              <p className="text-slate-400 text-xs">
                Every child deserves to understand how money works and how to use it wisely.
              </p>
            </div>
          </div>
        </div>

        {/* Key Concepts */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <h4 className="text-slate-200 font-semibold mb-4 text-center">What You'll Learn</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sprout className="text-brand" size={20} />
              </div>
              <h5 className="text-slate-200 font-medium mb-1">Saving & Budgeting</h5>
              <p className="text-slate-400 text-xs">Build strong financial roots and organize your money with purpose</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand2/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="text-brand2" size={20} />
              </div>
              <h5 className="text-slate-200 font-medium mb-1">Earning & Investing</h5>
              <p className="text-slate-400 text-xs">Create value for others and grow your money over time</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Heart className="text-purple-400" size={20} />
              </div>
              <h5 className="text-slate-200 font-medium mb-1">Sharing & Protecting</h5>
              <p className="text-slate-400 text-xs">Give back to your community and protect what you've built</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 {book.author}. All rights reserved. | The Money Tree of Life
          </p>
          <p className="text-slate-600 text-xs mt-2">
            "Money is like a seed. Plant it wisely, and it grows into something wonderful."
          </p>
        </div>
      </div>
    </footer>
  );
}