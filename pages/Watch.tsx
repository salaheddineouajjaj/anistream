
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAnimeDetails } from '../services/anilist';
import { fetchAllEpisodes, EpisodesResponse, EpisodeDetail } from '../services/episodes';
import {
  ANIME_SERVERS, getEmbedUrl, resolveTMDBId, StreamServer
} from '../services/streaming';
import {
  Play, ChevronLeft, ChevronRight,
  Share2, Monitor, Zap, Loader2,
  AlertTriangle, RefreshCw, Globe, Shield, Languages
} from 'lucide-react';
import { animate } from 'animejs';
import { useReducedMotion, isMobile } from '../motion/reducedMotion';
import { useAmbientLight } from '../motion/ambientLight';

const Watch: React.FC = () => {
  const { id, episode } = useParams<{ id: string, episode: string }>();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<any>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState('');
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [episodesData, setEpisodesData] = useState<EpisodesResponse | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeDetail | null>(null);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Ambient light behind the player
  const { pulseGlow } = useAmbientLight(playerContainerRef, {
    color: 'rgba(250, 204, 21, 0.2)',
    intensity: 1
  });

  // Load anime details + resolve TMDB ID + generate embed URL
  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      setIframeLoading(true);
      try {
        const data = await fetchAnimeDetails(parseInt(id));
        setAnime(data);

        const englishTitle = data.title.english || '';
        const romajiTitle = data.title.romaji || '';
        const resolvedId = await resolveTMDBId(englishTitle, romajiTitle);
        setTmdbId(resolvedId);

        const epNum = parseInt(episode || '1');
        const url = getEmbedUrl(resolvedId, epNum, 1, selectedIdx);
        setEmbedUrl(url);

        // Fetch real episode data
        try {
          const eps = await fetchAllEpisodes(parseInt(id));
          setEpisodesData(eps);
          const curEp = eps.episodes.find(e => e.number === epNum) || null;
          setCurrentEpisode(curEp);
        } catch (err) {
          console.warn('Failed to fetch episodes:', err);
        }

        // Save to watch history
        const history = JSON.parse(localStorage.getItem('history') || '[]');
        const updatedHistory = [{
          id: data.id,
          title: data.title,
          cover: data.coverImage.large,
          episode: epNum,
          timestamp: Date.now()
        }, ...history.filter((h: any) => h.id !== data.id)].slice(0, 50);
        localStorage.setItem('history', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Watch error", error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id, episode]);

  // Update embed URL when server changes
  useEffect(() => {
    if (!anime || tmdbId === undefined) return;
    const epNum = parseInt(episode || '1');
    const url = getEmbedUrl(tmdbId, epNum, 1, selectedIdx);
    setEmbedUrl(url);
    setIframeLoading(true);
    pulseGlow(0.9, 1.2);
  }, [selectedIdx]);

  // Switch server with 3D arc animation
  const switchServer = useCallback((idx: number) => {
    setSelectedIdx(idx);
    pulseGlow(0.9, 1.2);

    if (carouselRef.current && !prefersReducedMotion) {
      const buttons = carouselRef.current.querySelectorAll('.server-btn');
      buttons.forEach((btn, i) => {
        const el = btn as HTMLElement;
        if (i === idx) {
          animate(el, {
            scale: [0.95, 1.05, 1],
            translateZ: [0, 30, 15],
            duration: 500,
            ease: 'outBack(2)'
          });
        } else {
          animate(el, {
            scale: [1, 0.97],
            translateZ: [0, -5],
            duration: 300,
            ease: 'outQuad'
          });
        }
      });
    }
  }, [prefersReducedMotion, pulseGlow]);

  const currentEpNum = parseInt(episode || '1');
  const totalEps = episodesData?.totalEpisodes || anime?.episodes || 0;
  const hasPrev = currentEpNum > 1;
  const hasNext = currentEpNum < totalEps;
  const currentServer = ANIME_SERVERS[selectedIdx];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Link to={`/anime/${id}`} className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-black text-xs uppercase tracking-[0.2em] group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            العودة للتفاصيل
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
            {anime?.title.english || anime?.title.romaji}
            <span className="text-amber-500"> / الحلقة {episode}</span>
          </h1>
          {currentEpisode && currentEpisode.title !== `Episode ${episode}` && (
            <p className="text-slate-400 text-lg font-medium">{currentEpisode.title}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {tmdbId && (
              <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded-full font-black uppercase">
                TMDB: {tmdbId}
              </span>
            )}
            {!tmdbId && (
              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-full font-black uppercase">
                ⚠ TMDB Not Found — Try switching servers
              </span>
            )}
            {currentServer.arabicSubs && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-black flex items-center gap-1">
                <Languages size={10} /> ترجمة عربية
              </span>
            )}
            {currentServer.lowAds && (
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full font-black flex items-center gap-1">
                <Shield size={10} /> إعلانات قليلة
              </span>
            )}
          </div>
        </div>

        {/* Episode Navigation */}
        <div className="flex gap-3">
          {hasPrev && (
            <Link
              to={`/watch/${id}/${currentEpNum - 1}`}
              className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-bold text-sm hover:bg-white/10 hover:border-amber-500/30 transition-all"
            >
              <ChevronLeft size={18} /> السابقة
            </Link>
          )}
          {hasNext && (
            <Link
              to={`/watch/${id}/${currentEpNum + 1}`}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-black font-black text-sm rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              التالية <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Quick Server Switch — Above the player */}
      <div className="flex flex-wrap gap-2">
        {ANIME_SERVERS.map((s, i) => (
          <button
            key={s.name}
            onClick={() => switchServer(i)}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${selectedIdx === i
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:border-amber-500/30 hover:text-amber-400'
              }`}
          >
            {s.name}
            {s.arabicSubs && <span className="text-[8px] opacity-70">عربي</span>}
            {selectedIdx === i && <Zap size={10} fill="currentColor" />}
          </button>
        ))}
      </div>

      {/* Video Player — Iframe Embed */}
      <div
        ref={playerContainerRef}
        className="relative"
        style={{ overflow: 'visible' }}
      >
        <div className="relative aspect-video w-full bg-black rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] border border-amber-500/10">
          {/* Loading overlay */}
          {iframeLoading && (
            <div className="absolute inset-0 z-10 bg-[#050505] flex flex-col items-center justify-center gap-4">
              <Loader2 size={48} className="text-amber-500 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-amber-500 font-black text-sm uppercase tracking-widest">جاري تحميل الحلقة</p>
                <p className="text-slate-600 text-xs">السيرفر: {currentServer.name}</p>
                <p className="text-slate-700 text-[10px]">{currentServer.nameAr}</p>
              </div>
            </div>
          )}

          {/* Anime embed player (iframe) */}
          {embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              referrerPolicy="origin"
              {...(!currentServer.noSandbox ? {
                sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
              } : {})}
              onLoad={() => {
                setIframeLoading(false);
                pulseGlow(0.8, 1.15);
              }}
              style={{ minHeight: '100%' }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <AlertTriangle size={48} className="text-amber-500" />
              <div className="text-center">
                <p className="text-amber-400 font-black text-lg">لم يتم العثور على الأنمي</p>
                <p className="text-slate-500 text-sm mt-1">
                  هذا الأنمي غير موجود في قاعدة البيانات. جرب أنمي آخر
                </p>
              </div>
            </div>
          )}

          {/* Server badge overlay */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md text-amber-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
              <Zap size={12} fill="currentColor" />
              {currentServer.name} • {currentServer.quality}
              {currentServer.arabicSubs && <span className="text-emerald-400 mr-1">• عربي</span>}
            </div>
          </div>
        </div>

        {/* Reload button */}
        <div className="flex items-center justify-between mt-3 px-2">
          <p className="text-[10px] text-slate-700 font-mono truncate max-w-[70%]" dir="ltr">
            {embedUrl || 'No embed URL'}
          </p>
          <button
            onClick={() => {
              setIframeLoading(true);
              setEmbedUrl(prev => {
                const base = prev.split('#')[0];
                return base + '#t=' + Date.now();
              });
            }}
            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-amber-500 transition-colors"
          >
            <RefreshCw size={10} /> إعادة تحميل
          </button>
        </div>
      </div>

      {/* Server & Episode Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          {/* Server Selector — Full Grid */}
          <section className="glass rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                <Monitor size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black">اختر السيرفر</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {ANIME_SERVERS.length} servers available • Switch if current doesn't work
                </p>
              </div>
            </div>
            <div ref={carouselRef} className="grid grid-cols-2 sm:grid-cols-3 gap-4 perspective-1000">
              {ANIME_SERVERS.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => switchServer(i)}
                  className={`server-btn relative p-5 rounded-2xl border text-left transition-all will-change-transform preserve-3d ${selectedIdx === i
                    ? 'bg-amber-500 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.2)] scale-[1.02]'
                    : 'bg-[#111] border-white/5 hover:border-amber-500/30'
                    }`}
                  style={{
                    transform: selectedIdx === i ? 'perspective(600px) translateZ(10px)' : 'perspective(600px) translateZ(0)',
                    transition: 'transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99), background 0.3s, border-color 0.3s, box-shadow 0.3s'
                  }}
                >
                  {/* Server name */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-black text-base ${selectedIdx === i ? 'text-black' : 'text-amber-500'}`}>
                      {s.name}
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full ${s.health === 'perfect' ? 'bg-green-500' : s.health === 'stable' ? 'bg-amber-500' : 'bg-orange-500'
                      }`} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  </div>

                  {/* Arabic name */}
                  <div className={`text-xs font-bold mb-2 ${selectedIdx === i ? 'text-black/50' : 'text-slate-600'}`}>
                    {s.nameAr}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${selectedIdx === i ? 'bg-black/10 text-black/70' : 'bg-white/5 text-slate-500'
                      }`}>
                      {s.quality}
                    </span>
                    {s.arabicSubs && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${selectedIdx === i ? 'bg-black/10 text-black/70' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                        <Languages size={8} /> عربي
                      </span>
                    )}
                    {s.lowAds && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${selectedIdx === i ? 'bg-black/10 text-black/70' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                        <Shield size={8} /> قليل الإعلانات
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Tip */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <Globe size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-amber-400">نصيحة:</strong>{' '}
                السيرفرات الأولى (VIDSRC, MULTI-SRC) هي الأفضل وتحتوي على ترجمة عربية مدمجة مع إعلانات قليلة.
                إذا لم يعمل سيرفر، جرب سيرفر آخر.
                اضغط على زر <strong className="text-white">CC</strong> في المشغل لاختيار اللغة العربية.
              </p>
            </div>
          </section>
        </div>

        {/* Episode Navigator */}
        <div className="space-y-6">
          <div className="glass rounded-[2.5rem] p-8 h-fit sticky top-28 border border-purple-500/20 shadow-[0_0_40px_rgba(126,34,206,0.1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <div className="w-1 h-6 bg-purple-500 rounded-full" />
              الحلقات
              {episodesData && (
                <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-2 py-1 rounded-full ml-auto">
                  {episodesData.totalEpisodes} حلقة
                </span>
              )}
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
              {(episodesData?.episodes || Array.from({ length: anime?.episodes || 12 }, (_, i) => ({
                number: i + 1,
                title: `الحلقة ${i + 1}`,
                filler: false,
                recap: false,
                aired: undefined,
                streamingLinks: [],
                durationEstimate: '24 min',
              }))).map((ep) => (
                <Link
                  key={ep.number}
                  to={`/watch/${id}/${ep.number}`}
                  className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${currentEpNum === ep.number
                      ? 'bg-purple-900/20 border-purple-500 text-purple-300'
                      : 'bg-[#111] border-white/5 hover:border-amber-500/30'
                    }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${currentEpNum === ep.number
                      ? 'bg-purple-500 text-white'
                      : ep.filler
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-[#050505] text-amber-500'
                    }`}>
                    {ep.number.toString().padStart(2, '0')}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-black truncate">{ep.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-600">{ep.durationEstimate}</span>
                      {ep.filler && <span className="text-[8px] font-black bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded uppercase">فيلر</span>}
                      {ep.recap && <span className="text-[8px] font-black bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded uppercase">مُلخص</span>}
                    </div>
                  </div>
                  {currentEpNum === ep.number && (
                    <Play size={14} className="text-purple-400 shrink-0" fill="currentColor" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
