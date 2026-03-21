
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, PlayCircle, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import { Anime } from '../types';
import { animate } from 'animejs';
import { useRafThrottle } from '../motion/raf';
import { useReducedMotion, isMobile } from '../motion/reducedMotion';

interface AnimeCardProps {
  anime: Anime;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mobile = useRef(isMobile());
  const [isHovered, setIsHovered] = useState(false);

  // Simulated multi-source scores
  const alScore = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "?.?";
  const malScore = anime.averageScore ? ((anime.averageScore / 10) + (Math.random() * 0.4 - 0.2)).toFixed(2) : "?.??";
  const imdbScore = anime.averageScore ? ((anime.averageScore / 10) - (Math.random() * 0.5)).toFixed(1) : "?.?";

  // 3D tilt on mouse move (desktop only)
  const handleMouseMove = useRafThrottle(useCallback((e: MouseEvent) => {
    if (!cardRef.current || prefersReducedMotion || mobile.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    const translateZ = 20;

    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(1.02)`;

    // Shine overlay position
    if (shineRef.current) {
      const shineX = (x / rect.width) * 100;
      const shineY = (y / rect.height) * 100;
      shineRef.current.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(250,204,21,0.15) 0%, transparent 60%)`;
      shineRef.current.style.opacity = '1';
    }
  }, [prefersReducedMotion]));

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current || prefersReducedMotion || mobile.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
    cardRef.current.style.transition = 'transform 0.6s cubic-bezier(0.03, 0.98, 0.52, 0.99)';
    if (shineRef.current) {
      shineRef.current.style.opacity = '0';
    }
    setIsHovered(false);
  }, [prefersReducedMotion]);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = 'transform 0.15s ease-out';
    setIsHovered(true);
  }, []);

  // Click press-in effect
  const handleClick = useCallback(() => {
    if (!cardRef.current || prefersReducedMotion) return;
    animate(cardRef.current, {
      scale: [1, 0.96, 1.02, 1],
      duration: 400,
      ease: 'outBack(2)'
    });
  }, [prefersReducedMotion]);

  // Mobile: subtle floating animation
  useEffect(() => {
    if (!mobile.current || prefersReducedMotion || !cardRef.current) return;
    const anim = animate(cardRef.current, {
      translateY: [0, -4, 0],
      duration: 3000 + Math.random() * 2000,
      loop: true,
      ease: 'inOutSine'
    });
    return () => { anim.pause(); };
  }, [prefersReducedMotion]);

  return (
    <Link
      to={`/anime/${anime.id}`}
      className="group relative flex flex-col gap-4 perspective-container"
      onClick={handleClick}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove as any}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-3xl bg-[#080808] border border-white/5 will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.03, 0.98, 0.52, 0.99), border-color 0.5s, box-shadow 0.5s',
          boxShadow: isHovered ? '0 25px 60px -15px rgba(250,204,21,0.25), 0 0 0 1px rgba(250,204,21,0.3)' : '0 10px 30px -10px rgba(0,0,0,0.3)',
          borderColor: isHovered ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.05)'
        }}
      >
        <img
          src={anime.coverImage.extraLarge || anime.coverImage.large}
          alt={anime.title.english || anime.title.romaji}
          className="h-full w-full object-cover transition-transform duration-1000 opacity-70 group-hover:opacity-100"
          style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
          loading="lazy"
        />

        {/* Shine overlay */}
        <div
          ref={shineRef}
          className="shine-overlay rounded-3xl"
          style={{ transition: 'opacity 0.3s ease' }}
        />

        {/* Hover info */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-6 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center backdrop-blur-xl group-hover:scale-110 transition-transform">
              <PlayCircle className="text-amber-500 w-10 h-10 fill-amber-500/20" />
            </div>
          </div>

          {/* Multi-Rating Hub */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/5 text-center">
              <div className="text-[7px] font-black text-slate-500 uppercase">MAL</div>
              <div className="text-[10px] font-black text-amber-500">{malScore}</div>
            </div>
            <div className="bg-amber-500/10 backdrop-blur-md p-1 rounded-lg border border-amber-500/20 text-center">
              <div className="text-[7px] font-black text-amber-500 uppercase">AL</div>
              <div className="text-[10px] font-black text-white">{alScore}</div>
            </div>
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/5 text-center">
              <div className="text-[7px] font-black text-slate-500 uppercase">IMDb</div>
              <div className="text-[10px] font-black text-purple-400">{imdbScore}</div>
            </div>
          </div>
        </div>

        {/* Floating Badges */}
        {anime.averageScore && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl px-2.5 py-1.5 rounded-2xl border border-amber-500/20 flex items-center gap-1.5 text-xs font-black text-amber-500 gold-glow">
            <Star size={14} fill="currentColor" />
            {alScore}
          </div>
        )}

        {anime.trending > 50 && (
          <div className="absolute top-4 left-4 bg-purple-600 px-3 py-1 rounded-xl text-white text-[10px] font-black uppercase tracking-tighter shadow-2xl flex items-center gap-1">
            <TrendingUp size={12} /> HOT
          </div>
        )}
      </div>

      <div className="px-2 space-y-2">
        <h3 className="font-bold text-base line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors font-arabic tracking-tight">
          {anime.title.english || anime.title.romaji}
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-purple-500/40" /> {anime.seasonYear}</span>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <span>{anime.episodes || '?'} EPS</span>
        </div>
      </div>
    </Link>
  );
};

export default AnimeCard;
