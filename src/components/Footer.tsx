import { Link } from "react-router-dom";
import { BookOpen, Sprout, Heart, GraduationCap, Target, Users } from "lucide-react";
import book from "../data/book.json";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Sprout className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground">{book.title}</h3>
                <p className="text-sm text-muted-foreground">By {book.author}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Growing financial wisdom through storytelling and interactive learning.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap size={16} />
              <span>Ages {book.audienceAgeMin}-{book.audienceAgeMax} • {book.totalChapters} Chapters</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-foreground font-extrabold mb-4">Explore</h4>
            <nav className="space-y-3">
              <Link to="/read" className="block text-muted-foreground hover:text-primary transition-colors text-sm font-bold">Read Book</Link>
              <Link to="/read/glossary" className="block text-muted-foreground hover:text-primary transition-colors text-sm font-bold">Glossary</Link>
              <Link to="/read/search" className="block text-muted-foreground hover:text-primary transition-colors text-sm font-bold">Search</Link>
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors text-sm font-bold">Home</Link>
            </nav>
          </div>

          {/* Learning Features */}
          <div>
            <h4 className="text-foreground font-extrabold mb-4">Features</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground"><BookOpen size={14} className="text-primary" /> Interactive Reading</li>
              <li className="flex items-center gap-2 text-muted-foreground"><Target size={14} className="text-golden" /> Chapter Quizzes</li>
              <li className="flex items-center gap-2 text-muted-foreground"><Users size={14} className="text-violet" /> Character Guides</li>
              <li className="flex items-center gap-2 text-muted-foreground"><Sprout size={14} className="text-coral" /> Glossary Popups</li>
            </ul>
          </div>

          {/* Educational Mission */}
          <div>
            <h4 className="text-foreground font-extrabold mb-4">Our Mission</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Teaching kids the tools they need to save, plan, share, and grow their own financial future.
            </p>
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="text-coral" size={16} />
                <span className="text-foreground font-bold text-sm">Financial Literacy</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Every child deserves to understand how money works and how to use it wisely.
              </p>
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <h4 className="text-foreground font-extrabold mb-4 text-center">What You'll Learn</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sprout className="text-primary" size={20} />
              </div>
              <h5 className="text-foreground font-bold mb-1">Saving & Budgeting</h5>
              <p className="text-muted-foreground text-xs">Build strong financial roots and organize your money with purpose</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-golden/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Target className="text-golden" size={20} />
              </div>
              <h5 className="text-foreground font-bold mb-1">Earning & Investing</h5>
              <p className="text-muted-foreground text-xs">Create value for others and grow your money over time</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-violet/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Heart className="text-violet" size={20} />
              </div>
              <h5 className="text-foreground font-bold mb-1">Sharing & Protecting</h5>
              <p className="text-muted-foreground text-xs">Give back to your community and protect what you've built</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 {book.author}. All rights reserved. | The Money Tree of Life
          </p>
          <p className="text-muted-foreground/50 text-xs mt-2">
            "Money is like a seed. Plant it wisely, and it grows into something wonderful."
          </p>
        </div>
      </div>
    </footer>
  );
}
