
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAnimeList } from '../services/anilist';
import { Anime } from '../types';
import AnimeCard from '../components/AnimeCard';
import { SlidersHorizontal, Search as SearchIcon, Filter, X, Trophy, Flame, Zap, Clock } from 'lucide-react';
import { triggerStaggerReveal } from '../motion/staggerReveal';
import { useReducedMotion } from '../motion/reducedMotion';

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery",
  "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"
];

const STATUSES = [
  { label: 'Finished', value: 'FINISHED' },
  { label: 'Ongoing', value: 'RELEASING' },
  { label: 'Upcoming', value: 'NOT_YET_RELEASED' },
];

const CELESTIAL_TABS = [
  { label: 'Most Watched', value: 'POPULARITY_DESC', icon: <Flame size={20} /> },
  { label: 'Most Liked', value: 'SCORE_DESC', icon: <Trophy size={20} /> },
  { label: 'Recent Manifestations', value: 'START_DATE_DESC', icon: <Zap size={20} /> },
  { label: 'Trending in Void', value: 'TRENDING_DESC', icon: <Clock size={20} /> },
];

const Browse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const resultsGridRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Filter states
  const query = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'TRENDING_DESC';

  const loadData = useCallback(async (isLoadMore = false) => {
    setLoading(true);
    try {
      const data = await fetchAnimeList({
        search: query || undefined,
        genre: genre || undefined,
        status: status || undefined,
        sort: [sort],
        page: isLoadMore ? page + 1 : 1,
        perPage: 24
      });

      if (isLoadMore) {
        setResults(prev => [...prev, ...data.media]);
        setPage(prev => prev + 1);
      } else {
        setResults(data.media);
        setPage(1);
      }
      setHasNextPage(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error("Browse load error", error);
    } finally {
      setLoading(false);
    }
  }, [query, genre, status, sort, page]);

  useEffect(() => {
    loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genre, status, sort]);

  // Trigger stagger reveal when results change
  useEffect(() => {
    if (results.length > 0 && resultsGridRef.current) {
      // Small delay to let DOM render
      requestAnimationFrame(() => {
        if (resultsGridRef.current) {
          triggerStaggerReveal(resultsGridRef.current, '.stagger-item', prefersReducedMotion);
        }
      });
    }
  }, [results, prefersReducedMotion]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* 3D Celestial Header */}
      <div className="flex flex-col gap-12 mb-16">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black font-arabic tracking-tighter" dangerouslySetInnerHTML={{
            __html: query ? `SCANNING VOID FOR "${query}"` : 'THE INFINITE <span class="text-gold-gradient">CATALOG</span>'
          }} />
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">Filter through dimensions of content, aggregated from the highest anime archives.</p>
        </div>

        {/* High-Level Celestial Tabs */}
        <div className="flex flex-wrap justify-center gap-4">
          {CELESTIAL_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParam('sort', tab.value)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-500 font-black uppercase tracking-widest text-xs ${sort === tab.value
                  ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.3)] scale-105'
                  : 'bg-[#080808] border-white/5 text-slate-500 hover:border-amber-500/30'
                }`}
            >
              <span className={sort === tab.value ? 'text-black' : 'text-amber-500'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border transition-all font-bold text-sm ${showFilters ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
          >
            <SlidersHorizontal size={18} />
            <span>DIMENSION FILTERS</span>
          </button>
        </div>

        <div className="glass px-6 py-3.5 rounded-2xl border border-white/10 flex items-center gap-4">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Aggregate Method:</span>
          <span className="text-xs font-black text-amber-500 uppercase tracking-widest">MULTI-SOURCE (MAL/AL/IMDb)</span>
        </div>
      </div>

      {/* Advanced Filters Drawer */}
      {showFilters && (
        <div className="glass rounded-[2.5rem] p-10 mb-12 border-2 border-purple-500/20 animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <button onClick={() => setShowFilters(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            {/* Genre Orbs */}
            <div className="space-y-6">
              <label className="text-sm font-black text-amber-500 uppercase tracking-[0.2em]">Select Genre Element</label>
              <div className="flex flex-wrap gap-3">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => updateParam('genre', genre === g ? '' : g)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border ${genre === g ? 'bg-amber-500 border-amber-400 text-black' : 'bg-[#0a0a0a] border-white/5 text-slate-500 hover:border-amber-500/20'
                      }`}
                  >
                    {g.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Spheres */}
            <div className="space-y-6">
              <label className="text-sm font-black text-amber-500 uppercase tracking-[0.2em]">Existence Status</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => updateParam('status', status === s.value ? '' : s.value)}
                    className={`flex items-center justify-center py-4 rounded-2xl text-xs font-black transition-all border ${status === s.value ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-[#0a0a0a] border-white/5 text-slate-600 hover:border-purple-500/20'
                      }`}
                  >
                    {s.label.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={clearFilters} className="text-xs font-black text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-2">
                <X size={14} /> RESET ALL DIMENSIONS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid with Stagger Reveal */}
      {results.length > 0 ? (
        <div ref={resultsGridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 perspective-1000">
          {results.map(anime => (
            <div key={anime.id} className="stagger-item">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
          <div className="w-24 h-24 bg-[#0a0a0a] border border-white/5 rounded-full flex items-center justify-center gold-glow">
            <SearchIcon className="text-slate-800" size={48} />
          </div>
          <h3 className="text-3xl font-black font-arabic">The Void is Empty</h3>
          <p className="text-slate-500 max-w-sm">We scanned all known dimensions but found no manifest for your query.</p>
          <button onClick={clearFilters} className="text-amber-500 font-black tracking-widest uppercase hover:underline">
            RE-ESTABLISH CONNECTION
          </button>
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center mt-24">
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="relative overflow-hidden bg-amber-500 text-black font-black py-5 px-16 rounded-[2rem] transition-all shadow-[0_0_40px_rgba(250,204,21,0.2)] hover:scale-105 active:scale-95 flex items-center gap-4"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'FETCH MORE MANIFESTS'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Browse;
