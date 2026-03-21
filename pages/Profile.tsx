
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchAnimeDetails } from '../services/anilist';
import { User, Heart, History, Settings, Play, Trash2, ChevronRight } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import { useStaggerDepthReveal } from '../motion/staggerReveal';
import { useReducedMotion, isMobile } from '../motion/reducedMotion';

const Profile: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('watchlist');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const watchlistGridRef = useRef<HTMLDivElement>(null);
  const historyGridRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mobile = useRef(isMobile());

  // Stagger reveal for watchlist
  useStaggerDepthReveal(watchlistGridRef, '.stagger-item');

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const storedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const storedHistory = JSON.parse(localStorage.getItem('history') || '[]');

        setHistory(storedHistory);

        if (storedWatchlist.length > 0) {
          const detailPromises = storedWatchlist.map((id: number) => fetchAnimeDetails(id));
          const detailedAnimes = await Promise.all(detailPromises);
          setWatchlist(detailedAnimes);
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    if (location.hash === '#history') setActiveTab('history');
  }, [location.hash]);

  const clearHistory = () => {
    localStorage.removeItem('history');
    setHistory([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="glass rounded-3xl p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center gap-8 border border-amber-500/10 bg-gradient-to-br from-[#0a0a0a] to-[#080808]">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-amber-500 flex items-center justify-center text-4xl font-black text-black shadow-2xl shadow-amber-500/30 overflow-hidden ring-4 ring-amber-500/20 ring-offset-4 ring-offset-[#020202]">
            <User size={64} />
          </div>
          <button className="absolute bottom-1 right-1 bg-white p-2 rounded-full text-slate-900 hover:bg-amber-50 transition-colors shadow-lg">
            <Settings size={16} />
          </button>
        </div>

        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-black">Guest User</h1>
          <p className="text-slate-400">Joined Oct 2023 • Premium Member</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
            <div className="text-center bg-white/5 border border-amber-500/10 rounded-2xl px-6 py-2">
              <div className="text-xl font-black text-amber-400">{watchlist.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Watchlist</div>
            </div>
            <div className="text-center bg-white/5 border border-amber-500/10 rounded-2xl px-6 py-2">
              <div className="text-xl font-black text-amber-400">{history.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Watched</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
        {[
          { id: 'watchlist', label: 'My Watchlist', icon: <Heart size={18} /> },
          { id: 'history', label: 'Recent History', icon: <History size={18} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-8 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-white'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'watchlist' && (
          <div className="animate-in fade-in duration-500">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : watchlist.length > 0 ? (
              <div ref={watchlistGridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 perspective-1000">
                {watchlist.map(anime => (
                  <div key={anime.id} className="stagger-item">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-4">
                <Heart size={48} className="mx-auto text-slate-800" />
                <h3 className="text-xl font-bold">Your watchlist is empty</h3>
                <p className="text-slate-500">Start exploring and add some shows to watch later!</p>
                <Link to="/browse" className="inline-block bg-amber-500 text-black font-black py-3 px-8 rounded-xl">Browse Catalog</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-500 space-y-4">
            {history.length > 0 && (
              <div className="flex justify-end mb-4">
                <button onClick={clearHistory} className="flex items-center gap-2 text-rose-500 text-sm font-bold hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-all">
                  <Trash2 size={16} /> CLEAR ALL
                </button>
              </div>
            )}
            {history.length > 0 ? (
              <div ref={historyGridRef} className="space-y-4">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="glass rounded-2xl p-4 flex items-center justify-between group hover:border-amber-500/30 transition-all will-change-transform"
                    style={{
                      transform: 'perspective(600px) rotateY(0)',
                      transition: 'transform 0.4s ease, border-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (prefersReducedMotion || mobile.current) return;
                      (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(-2deg) translateZ(10px) translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(0) translateZ(0) translateY(0)';
                    }}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-16 rounded-xl overflow-hidden bg-[#0a0a0a] shrink-0">
                        <img src={h.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      </div>
                      <div>
                        <Link to={`/anime/${h.id}`} className="font-bold hover:text-amber-400 transition-colors">{h.title.english || h.title.romaji}</Link>
                        <div className="text-xs text-slate-500 mt-1">
                          Episode {h.episode} • Viewed {new Date(h.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Link to={`/watch/${h.id}/${h.episode}`} className="p-3 bg-amber-500 rounded-full text-black shadow-lg shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all">
                      <Play size={20} fill="currentColor" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-4">
                <History size={48} className="mx-auto text-slate-800" />
                <h3 className="text-xl font-bold">No history found</h3>
                <p className="text-slate-500">Shows you watch will appear here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl animate-in fade-in duration-500 space-y-8">
            <section className="space-y-4">
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest">Interface Settings</h4>
              <div className="glass rounded-2xl p-6 divide-y divide-white/5">
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">Primary Subtitle Language</div>
                    <div className="text-xs text-slate-500">Automatically select this language for subtitles.</div>
                  </div>
                  <select className="bg-[#0a0a0a] border border-white/10 rounded-lg text-sm px-4 py-2">
                    <option>Arabic (العربية)</option>
                    <option>English</option>
                  </select>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">Auto-play Next Episode</div>
                    <div className="text-xs text-slate-500">Automatically play the next episode when current ends.</div>
                  </div>
                  <div className="w-12 h-6 bg-amber-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest">Danger Zone</h4>
              <div className="glass rounded-2xl p-6 border-rose-500/20">
                <button className="text-rose-500 font-bold border border-rose-500/20 hover:bg-rose-500/10 px-6 py-3 rounded-xl transition-all w-full text-left flex justify-between items-center">
                  Delete Account & All Data
                  <ChevronRight size={18} />
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
