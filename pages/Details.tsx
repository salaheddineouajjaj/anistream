
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetails } from '../services/anilist';
import { fetchAllEpisodes, EpisodeDetail, EpisodesResponse } from '../services/episodes';
import { Play, Heart, Share2, Star, Calendar, Clock, List, ChevronRight, AlertTriangle, ExternalLink, Tv } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import { useReducedMotion, isMobile } from '../motion/reducedMotion';

const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<any>(null);
  const [episodesData, setEpisodesData] = useState<EpisodesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [epsLoading, setEpsLoading] = useState(true);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [hoveredEp, setHoveredEp] = useState<number | null>(null);
  const [epPage, setEpPage] = useState(1); // Pagination for episodes
  const EPS_PER_PAGE = 24;

  const episodeGridRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mobile = useRef(isMobile());

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      setLoading(true);
      setEpsLoading(true);
      try {
        const data = await fetchAnimeDetails(parseInt(id));
        setAnime(data);

        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        setIsWatchlisted(watchlist.includes(parseInt(id)));
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch episodes separately (may be slower due to Jikan rate limits)
  useEffect(() => {
    const loadEpisodes = async () => {
      if (!id) return;
      setEpsLoading(true);
      try {
        const eps = await fetchAllEpisodes(parseInt(id));
        setEpisodesData(eps);
      } catch (error) {
        console.error("Failed to load episodes", error);
      } finally {
        setEpsLoading(false);
      }
    };
    loadEpisodes();
  }, [id]);

  const toggleWatchlist = () => {
    if (!id) return;
    const animeId = parseInt(id);
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (isWatchlisted) {
      watchlist = watchlist.filter((item: number) => item !== animeId);
    } else {
      watchlist.push(animeId);
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    setIsWatchlisted(!isWatchlisted);
  };

  // Episode depth zoom: hovered pops forward, neighbors recede
  const handleEpisodeHover = useCallback((index: number) => {
    if (prefersReducedMotion || mobile.current || !episodeGridRef.current) return;
    setHoveredEp(index);

    const tiles = episodeGridRef.current.querySelectorAll('.episode-tile');
    tiles.forEach((tile, i) => {
      const el = tile as HTMLElement;
      if (i === index) {
        el.style.transform = 'perspective(600px) translateZ(25px) scale(1.04)';
        el.style.zIndex = '10';
        el.style.boxShadow = '0 15px 40px -10px rgba(250,204,21,0.25)';
        el.style.borderColor = 'rgba(250,204,21,0.4)';
      } else {
        const dist = Math.abs(i - index);
        const recede = Math.max(0, 12 - dist * 4);
        const scaleDown = Math.max(0.96, 1 - dist * 0.01);
        el.style.transform = `perspective(600px) translateZ(-${recede}px) scale(${scaleDown})`;
        el.style.zIndex = '1';
        el.style.boxShadow = '';
        el.style.borderColor = '';
      }
    });
  }, [prefersReducedMotion]);

  const handleEpisodeLeave = useCallback(() => {
    if (prefersReducedMotion || mobile.current || !episodeGridRef.current) return;
    setHoveredEp(null);

    const tiles = episodeGridRef.current.querySelectorAll('.episode-tile');
    tiles.forEach((tile) => {
      const el = tile as HTMLElement;
      el.style.transform = 'perspective(600px) translateZ(0) scale(1)';
      el.style.zIndex = '';
      el.style.boxShadow = '';
      el.style.borderColor = '';
    });
  }, [prefersReducedMotion]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!anime) return <div className="p-20 text-center">Anime not found.</div>;

  const recommendations = anime.recommendations?.nodes?.map((n: any) => n.mediaRecommendation).filter(Boolean).slice(0, 6) || [];

  // Episode pagination
  const allEpisodes = episodesData?.episodes || [];
  const totalPages = Math.ceil(allEpisodes.length / EPS_PER_PAGE);
  const paginatedEpisodes = allEpisodes.slice((epPage - 1) * EPS_PER_PAGE, epPage * EPS_PER_PAGE);

  return (
    <div className="pb-20">
      {/* Banner */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <div className="absolute inset-0">
          <img
            src={anime.bannerImage || anime.coverImage.extraLarge}
            className="w-full h-full object-cover"
            alt="Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Left: Poster & Basic Info */}
          <div className="w-full md:w-72 shrink-0 space-y-6">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#020202] bg-[#0a0a0a]">
              <img
                src={anime.coverImage.extraLarge}
                className="w-full h-full object-cover"
                alt="Poster"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={`/watch/${anime.id}/1`}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Play className="fill-black" size={20} />
                WATCH NOW
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={toggleWatchlist}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${isWatchlisted ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                >
                  <Heart size={20} fill={isWatchlisted ? "currentColor" : "none"} />
                  {isWatchlisted ? 'In List' : 'Watchlist'}
                </button>
                <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 py-3 rounded-xl transition-all">
                  <Share2 size={20} />
                  Share
                </button>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Format</span>
                <span className="font-semibold">{anime.format || 'TV'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-amber-400">{anime.status}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Season</span>
                <span className="font-semibold uppercase">{anime.season} {anime.seasonYear}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Episodes</span>
                <span className="font-semibold">{episodesData ? episodesData.totalEpisodes : (anime.episodes || '??')}</span>
              </div>
              {episodesData?.malId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">MAL ID</span>
                  <a href={`https://myanimelist.net/anime/${episodesData.malId}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-400 hover:underline flex items-center gap-1">
                    {episodesData.malId} <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {episodesData && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Data Sources</span>
                  <span className="text-[10px] font-black text-amber-500 uppercase">{episodesData.sources.join(' + ')}</span>
                </div>
              )}
            </div>

            {/* Official Streaming Links */}
            {episodesData && episodesData.streamingEpisodes.length > 0 && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest">Official Streams</h4>
                <div className="space-y-2">
                  {/* Deduplicate by site */}
                  {[...new Set(episodesData.streamingEpisodes.map(s => s.site))].map(site => (
                    <a
                      key={site}
                      href={episodesData.streamingEpisodes.find(s => s.site === site)?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
                    >
                      <Tv size={16} className="text-amber-500" />
                      <span className="text-sm font-bold group-hover:text-amber-400 transition-colors">{site}</span>
                      <ExternalLink size={12} className="ml-auto text-slate-600 group-hover:text-amber-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Main Details */}
          <div className="flex-grow pt-4 md:pt-36">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {anime.genres.map((g: string) => (
                <Link
                  key={g}
                  to={`/browse?genre=${g}`}
                  className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full hover:bg-amber-500/20 transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-2 text-white leading-tight">
              {anime.title.english || anime.title.romaji}
            </h1>
            <h2 className="text-lg text-slate-500 font-medium mb-6">
              {anime.title.romaji} • {anime.title.native}
            </h2>

            <div className="flex flex-wrap items-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <Star className="text-amber-400" size={24} fill="currentColor" />
                <div>
                  <div className="text-xl font-black text-amber-400">{anime.averageScore / 10}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Rating</div>
                </div>
              </div>
              {anime.nextAiringEpisode && (
                <div className="flex items-center gap-2 text-amber-400">
                  <Calendar size={24} />
                  <div>
                    <div className="text-sm font-bold">EP {anime.nextAiringEpisode.episode}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Next Airing</div>
                  </div>
                </div>
              )}
              {episodesData?.cached && (
                <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <Clock size={14} />
                  <span>Cached data</span>
                </div>
              )}
            </div>

            <div className="mb-12">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <List className="text-amber-500" size={20} />
                Synopsis
              </h3>
              <div
                className="text-slate-400 leading-relaxed font-light"
                dangerouslySetInnerHTML={{ __html: anime.description }}
              />
            </div>

            {/* EPISODES — Now with real data from API */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Tv className="text-amber-500" size={22} />
                  Episodes
                  {episodesData && (
                    <span className="bg-amber-500/10 text-amber-500 text-xs font-black px-3 py-1 rounded-full">
                      {episodesData.totalEpisodes} total
                    </span>
                  )}
                </h3>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 8) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setEpPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${epPage === i + 1
                            ? 'bg-amber-500 text-black'
                            : 'bg-white/5 text-slate-500 hover:bg-white/10'
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {totalPages > 8 && (
                      <span className="text-slate-600 text-xs px-2">...{totalPages}</span>
                    )}
                  </div>
                )}
              </div>

              {epsLoading ? (
                <div className="flex items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                  <span className="text-slate-500 text-sm font-medium">Loading episode data from MAL + AniList...</span>
                </div>
              ) : (
                <div
                  ref={episodeGridRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  onMouseLeave={handleEpisodeLeave}
                >
                  {paginatedEpisodes.map((ep, i) => (
                    <Link
                      key={ep.number}
                      to={`/watch/${anime.id}/${ep.number}`}
                      className="episode-tile group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all will-change-transform"
                      style={{
                        transform: 'perspective(600px) translateZ(0) scale(1)',
                        transition: 'transform 0.35s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.35s ease, border-color 0.35s ease'
                      }}
                      onMouseEnter={() => handleEpisodeHover(i)}
                    >
                      <div className="flex items-stretch">
                        {/* Thumbnail */}
                        <div className="relative w-28 h-20 bg-[#0a0a0a] shrink-0 overflow-hidden">
                          {ep.thumbnail ? (
                            <img
                              src={ep.thumbnail}
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                              alt={ep.title}
                              loading="lazy"
                            />
                          ) : (
                            <img
                              src={anime.coverImage.large}
                              className="w-full h-full object-cover opacity-30 blur-sm"
                              alt="Episode"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                          {/* Episode number badge */}
                          <div className="absolute top-1 left-1 bg-black/80 text-amber-500 text-[10px] font-black px-1.5 py-0.5 rounded">
                            {ep.number}
                          </div>
                        </div>

                        {/* Episode info */}
                        <div className="flex-grow p-3 flex flex-col justify-center min-w-0">
                          <div className="text-sm font-bold truncate group-hover:text-amber-400 transition-colors">
                            {ep.title}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-slate-600 uppercase font-bold">
                              {ep.durationEstimate}
                            </span>
                            {ep.aired && (
                              <span className="text-[10px] text-slate-600">
                                {new Date(ep.aired).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            {ep.score && ep.score > 0 && (
                              <span className="text-[10px] text-amber-500 font-black flex items-center gap-0.5">
                                <Star size={8} fill="currentColor" /> {ep.score.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {/* Filler / Recap badges */}
                          <div className="flex gap-1 mt-1">
                            {ep.filler && (
                              <span className="text-[8px] font-black bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                <AlertTriangle size={8} /> Filler
                              </span>
                            )}
                            {ep.recap && (
                              <span className="text-[8px] font-black bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase">
                                Recap
                              </span>
                            )}
                            {ep.streamingLinks.length > 0 && (
                              <span className="text-[8px] font-black bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase">
                                {ep.streamingLinks[0].site}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination bottom */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-8">
                  <button
                    onClick={() => setEpPage(p => Math.max(1, p - 1))}
                    disabled={epPage === 1}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-white/10 transition-all"
                  >
                    ← Prev
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-500">
                    Page {epPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setEpPage(p => Math.min(totalPages, p + 1))}
                    disabled={epPage === totalPages}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-white/10 transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section>
                <h3 className="text-xl font-bold mb-6">You Might Also Like</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {recommendations.map((rec: any) => (
                    <Link key={rec.id} to={`/anime/${rec.id}`} className="group space-y-2">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5">
                        <img
                          src={rec.coverImage.large}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={rec.title.romaji}
                        />
                      </div>
                      <div className="text-xs font-semibold line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {rec.title.english || rec.title.romaji}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
