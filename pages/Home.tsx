
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchAnimeList } from '../services/anilist';
import { Anime } from '../types';
import AnimeCard from '../components/AnimeCard';
import { Play, Info, Sparkles, TrendingUp, ChevronLeft, ChevronRight, Star, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { useRafThrottle } from '../motion/raf';
import { useReducedMotion, isMobile } from '../motion/reducedMotion';
import { useStaggerDepthReveal } from '../motion/staggerReveal';

const Home: React.FC = () => {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [featured, setFeatured] = useState<Anime[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  const heroRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mobile = useRef(isMobile());

  // Stagger reveal for trending grid
  useStaggerDepthReveal(trendingRef, '.stagger-item');

  // Load continue watching from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    setContinueWatching(history.slice(0, 6));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const trendData = await fetchAnimeList({ sort: ['TRENDING_DESC'], perPage: 15 });
        const popData = await fetchAnimeList({ sort: ['POPULARITY_DESC'], perPage: 12 });

        setTrending(trendData.media);
        setPopular(popData.media);
        setFeatured(trendData.media.slice(0, 5));
      } catch (error) {
        console.error("Home load error", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % featured.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + featured.length) % featured.length);

  // --- HERO PARALLAX ---
  const handleHeroMouseMove = useRafThrottle(useCallback((e: MouseEvent) => {
    if (!heroRef.current || prefersReducedMotion || mobile.current) return;

    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Parallax layers
    const bg = heroRef.current.querySelector('.hero-bg') as HTMLElement;
    const particles = heroRef.current.querySelector('.hero-particles') as HTMLElement;
    const content = heroRef.current.querySelector('.hero-content') as HTMLElement;
    const rimGlow = heroRef.current.querySelector('.hero-rim') as HTMLElement;

    if (bg) bg.style.transform = `translate3d(${x * 12}px, ${y * 12}px, 0)`;
    if (particles) particles.style.transform = `translate3d(${x * 25}px, ${y * 25}px, 0)`;
    if (content) content.style.transform = `translate3d(${x * -8}px, ${y * -8}px, 0) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
    if (rimGlow) rimGlow.style.transform = `translate3d(${x * 40}px, ${y * 40}px, 0)`;
  }, [prefersReducedMotion]));

  const handleHeroMouseLeave = useCallback(() => {
    if (!heroRef.current || prefersReducedMotion || mobile.current) return;
    const layers = heroRef.current.querySelectorAll('.hero-bg, .hero-particles, .hero-content, .hero-rim');
    layers.forEach((el) => {
      (el as HTMLElement).style.transform = 'translate3d(0,0,0)';
      (el as HTMLElement).style.transition = 'transform 0.8s cubic-bezier(0.03, 0.98, 0.52, 0.99)';
    });
  }, [prefersReducedMotion]);

  // Mobile: gentle floating for hero
  useEffect(() => {
    if (!mobile.current || prefersReducedMotion) return;
    const hero = heroRef.current;
    if (!hero) return;
    const content = hero.querySelector('.hero-content') as HTMLElement;
    if (!content) return;

    const anim = animate(content, {
      translateY: [0, -6, 0],
      translateX: [0, 3, 0],
      duration: 5000,
      loop: true,
      ease: 'inOutSine'
    });
    return () => { anim.pause(); };
  }, [prefersReducedMotion, loading]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-amber-500 animate-pulse" size={32} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-32 pb-40">
      {/* 3D FEATURED SLIDER WITH PARALLAX */}
      <section
        ref={heroRef}
        className="relative h-[100vh] w-full flex items-center justify-center overflow-hidden pt-20"
        onMouseMove={handleHeroMouseMove as any}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* BG parallax layer */}
        <div className="hero-bg absolute inset-0 pointer-events-none overflow-hidden will-change-transform" style={{ transition: 'transform 0.15s ease-out' }}>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 blur-[150px] rounded-full"></div>
        </div>

        {/* Particles overlay */}
        <div className="hero-particles absolute inset-0 pointer-events-none will-change-transform" style={{ transition: 'transform 0.15s ease-out' }}>
          <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-amber-500/30 rounded-full floating"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-purple-500/40 rounded-full floating" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 bg-amber-500/20 rounded-full floating" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Neon rim glow that tracks cursor */}
        <div className="hero-rim absolute inset-0 pointer-events-none will-change-transform" style={{ transition: 'transform 0.1s ease-out' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[700px] rounded-[3rem] border-2 border-amber-500/5 shadow-[0_0_80px_rgba(250,204,21,0.05)] blur-sm"></div>
        </div>

        <div className="hero-content relative w-full max-w-7xl mx-auto h-[600px] perspective-container flex items-center justify-center will-change-transform" style={{ transition: 'transform 0.15s ease-out' }}>
          {featured.map((anime, idx) => {
            const isCenter = idx === activeIndex;
            const isLeft = idx === (activeIndex - 1 + featured.length) % featured.length;
            const isRight = idx === (activeIndex + 1) % featured.length;
            const isHidden = !isCenter && !isLeft && !isRight;

            let transform = "scale(0.6) translateZ(-500px) rotateY(0deg)";
            let opacity = 0;
            let zIndex = 0;

            if (isCenter) {
              transform = "scale(1) translateZ(100px) rotateY(0deg)";
              opacity = 1;
              zIndex = 30;
            } else if (isLeft) {
              transform = "scale(0.8) translateX(-350px) translateZ(-200px) rotateY(35deg)";
              opacity = 0.5;
              zIndex = 20;
            } else if (isRight) {
              transform = "scale(0.8) translateX(350px) translateZ(-200px) rotateY(-35deg)";
              opacity = 0.5;
              zIndex = 20;
            }

            return (
              <div
                key={anime.id}
                className="absolute w-[350px] md:w-[450px] h-[600px] transition-all duration-1000 ease-out cursor-pointer group"
                style={{ transform, opacity, zIndex, display: isHidden ? 'none' : 'block' }}
                onClick={() => isCenter ? null : setActiveIndex(idx)}
              >
                <div className={`relative w-full h-full rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 ${isCenter ? 'border-amber-500 shadow-[0_0_50px_rgba(250,204,21,0.3)]' : 'border-white/5 shadow-2xl'}`}>
                  <img src={anime.coverImage.extraLarge} className="w-full h-full object-cover" alt="" />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 transition-opacity duration-500 ${isCenter ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">Legendary</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star size={14} fill="currentColor" /> {anime.averageScore / 10}
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black font-arabic mb-4 line-clamp-2 leading-tight tracking-tighter">
                      {anime.title.english || anime.title.romaji}
                    </h2>
                    <div className="flex gap-4">
                      <Link to={`/watch/${anime.id}/1`} className="flex-grow flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-2xl transition-all">
                        <Play size={20} fill="black" /> WATCH NOW
                      </Link>
                      <Link to={`/anime/${anime.id}`} className="w-16 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all border border-white/10">
                        <Info size={24} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8">
          <button onClick={prevSlide} className="w-14 h-14 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
            <ChevronLeft size={28} />
          </button>
          <div className="flex gap-2">
            {featured.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-8 bg-amber-500' : 'w-2 bg-white/20'}`} />
            ))}
          </div>
          <button onClick={nextSlide} className="w-14 h-14 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
            <ChevronRight size={28} />
          </button>
        </div>
      </section>

      {/* CONTINUE WATCHING SHELF */}
      {continueWatching.length > 0 && (
        <div className="max-w-7xl mx-auto px-4">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-[1.25rem] flex items-center justify-center text-purple-400">
                <BookOpen size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black font-arabic tracking-tight">Continue Watching</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">Pick up where you left off</p>
              </div>
            </div>
            {/* Shelf with depth */}
            <div className="relative pb-4">
              <div className="flex gap-6 overflow-x-auto pb-6 custom-scroll">
                {continueWatching.map((item, i) => (
                  <Link
                    key={i}
                    to={`/watch/${item.id}/${item.episode}`}
                    className="group relative flex-shrink-0 w-44"
                    style={{
                      transform: 'perspective(600px) rotateY(0deg)',
                      transition: 'transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)'
                    }}
                    onMouseEnter={(e) => {
                      if (prefersReducedMotion || mobile.current) return;
                      (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(-5deg) translateZ(20px) translateY(-8px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(0deg) translateZ(0) translateY(0)';
                    }}
                  >
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[#080808] border border-white/5 group-hover:border-purple-500/40 group-hover:shadow-[0_20px_40px_-10px_rgba(147,51,234,0.3)] transition-all duration-500">
                      <img src={item.cover} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4">
                        <div className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full self-start mb-2">
                          EP {item.episode}
                        </div>
                        <div className="text-sm font-bold line-clamp-2">{item.title?.english || item.title?.romaji || 'Untitled'}</div>
                      </div>
                    </div>
                    {/* Shelf shadow */}
                    <div className="absolute -bottom-2 left-2 right-2 h-4 bg-gradient-to-t from-transparent to-black/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                ))}
              </div>
              {/* Shelf depth line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
            </div>
          </section>
        </div>
      )}

      {/* DISCOVERY GRID */}
      <div className="max-w-7xl mx-auto px-4 space-y-32">
        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-[1.25rem] flex items-center justify-center text-amber-500 gold-glow">
                <TrendingUp size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black font-arabic tracking-tight">Rising Dimension</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">The most viewed chronicles</p>
              </div>
            </div>
            <Link to="/browse?sort=TRENDING_DESC" className="group flex items-center gap-3 text-amber-500 text-xs font-black tracking-widest uppercase">
              View Grid <div className="w-6 h-px bg-amber-500 transition-all group-hover:w-12" />
            </Link>
          </div>
          <div ref={trendingRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 perspective-1000">
            {trending.map(anime => (
              <div key={anime.id} className="stagger-item">
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
        </section>

        {/* Mystery Box CTA */}
        <section className="relative overflow-hidden rounded-[4rem] p-16 md:p-32 text-center border-2 border-amber-500/10 bg-[#050505]">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full"></div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-10">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center text-amber-500 mx-auto floating">
              <Sparkles size={40} />
            </div>
            <h2 className="text-4xl md:text-7xl font-black font-arabic tracking-tighter leading-tight">
              Enter the <span className="text-gold-gradient">Celestial Gate</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
              Connect your soul to the infinite catalog of legends. Translated by high priests, streamed through the void.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="relative overflow-hidden bg-amber-500 text-black px-12 py-5 rounded-[2rem] font-black tracking-widest shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:scale-105 active:scale-95 transition-all">
                <span className="relative z-10">TRANSCEND NOW</span>
                <div className="absolute inset-0 gold-shimmer opacity-30"></div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
