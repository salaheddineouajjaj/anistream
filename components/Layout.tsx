
import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, Menu, X, Play, Heart, History, Compass, Sparkles } from 'lucide-react';
import { usePageTransition3D } from '../motion/pageTransition3d';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  // 3D page transition on route change
  usePageTransition3D(contentRef);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Compass size={20} /> },
    { name: 'Browse', path: '/browse', icon: <Search size={20} /> },
    { name: 'Watchlist', path: '/profile#watchlist', icon: <Heart size={20} /> },
    { name: 'History', path: '/profile#history', icon: <History size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform">
                <Play className="fill-black text-black ml-1" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter hidden sm:inline-block font-arabic">
                ANI<span className="gold-text-gradient">STREAM</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-bold tracking-wide transition-all hover:text-amber-400 ${location.pathname === link.path ? 'text-amber-500' : 'text-slate-400'
                    }`}
                >
                  {link.name.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-2 focus-within:border-amber-500/50 transition-all">
              <Search className="text-amber-500/50" size={18} />
              <input
                type="text"
                placeholder="Search the void..."
                className="bg-transparent border-none focus:ring-0 text-sm w-48 xl:w-72 placeholder:text-slate-600 ml-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <Link to="/profile" className="w-10 h-10 flex items-center justify-center border border-amber-500/20 rounded-2xl hover:bg-amber-500/10 transition-colors">
              <User size={20} className="text-amber-500" />
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-amber-500"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden glass border-b border-amber-500/20 p-6 absolute top-20 left-0 w-full animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="flex items-center bg-white/5 border border-amber-500/20 rounded-2xl px-4 py-3">
                <Search className="text-amber-500" size={20} />
                <input
                  type="text"
                  placeholder="Search anime..."
                  className="bg-transparent border-none focus:ring-0 text-base w-full placeholder:text-slate-500 ml-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <div className="grid grid-cols-1 gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-slate-300 active:bg-amber-500 active:text-black transition-all"
                  >
                    <span className="text-amber-500">{link.icon}</span>
                    <span className="font-bold">{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        <div ref={contentRef} className="preserve-3d" style={{ willChange: 'transform, opacity' }}>
          {children}
        </div>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-amber-500/10 py-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Play className="fill-black text-black ml-1" size={20} />
              </div>
              <span className="text-2xl font-black font-arabic">ANI<span className="gold-text-gradient">STREAM</span></span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Experience anime from another dimension. Pure gold quality, mystical Arabic subtitles, and unparalleled speeds.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
              <Link to="/" className="hover:text-amber-500 transition-colors">Terms</Link>
              <Link to="/" className="hover:text-amber-500 transition-colors">Privacy</Link>
              <Link to="/" className="hover:text-amber-500 transition-colors">DMCA</Link>
            </div>
            <p className="text-slate-700 text-[10px] font-bold uppercase tracking-tighter">
              © {new Date().getFullYear()} CELESTIAL ANISTREAM • MADE IN THE VOID
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
