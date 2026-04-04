/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Gamepad2, Search, X, Maximize2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import gamesData from './data/games.json';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// In-memory cache for AI generated images
const aiImageCache = new Map();

// Track when the last quota exceeded error occurred to avoid redundant calls
let lastQuotaExceededTime = 0;
const QUOTA_COOLDOWN_MS = 1000 * 60 * 15; // 15 minutes cooldown

// In-memory and localStorage cache for AI generated images
const getCachedAIImage = (title) => {
  const cached = localStorage.getItem(`ai_thumb_${title}`);
  if (cached) return cached;
  return aiImageCache.get(title);
};

const setCachedAIImage = (title, data) => {
  aiImageCache.set(title, data);
  try {
    localStorage.setItem(`ai_thumb_${title}`, data);
  } catch {
    // LocalStorage might be full
    console.warn("LocalStorage full, AI image not cached permanently");
  }
};

async function generateGameImage(gameTitle) {
  const cached = getCachedAIImage(gameTitle);
  if (cached) return cached;

  // Check if we are in a quota cooldown period
  if (Date.now() - lastQuotaExceededTime < QUOTA_COOLDOWN_MS) {
    console.warn("AI Image Generation skipped due to recent quota exhaustion.");
    return null;
  }

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A vibrant, professional cartoon style game thumbnail for a game titled "${gameTitle}". The artwork should be high-quality digital art, colorful, playful, and appealing to children. No text, no letters, no numbers in the image. 3D render style (like Pixar) or clean modern vector art. Central focus on a character or object representing the game.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        },
      },
    });

    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (part) {
      const base64Data = `data:image/png;base64,${part.inlineData.data}`;
      setCachedAIImage(gameTitle, base64Data);
      return base64Data;
    }
  } catch (error) {
    console.error("AI Image Generation failed:", error);
    
    // Check if it's a 429 error (Quota Exceeded)
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      lastQuotaExceededTime = Date.now();
      console.warn("Quota exceeded for AI Image Generation. Entering cooldown period.");
    }
  }
  return null;
}

const shuffledAllGames = [...gamesData].sort(() => 0.5 - Math.random());

const getGameThumbnail = (url, title, size = '400x300') => {
  const [width, height] = size.split('x');
  const encodedUrl = encodeURIComponent(url);
  
  // Jetpack's i0.wp.com is excellent at bypassing GameDistribution's hotlinking protection.
  if (url.includes('gamedistribution.com')) {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return `https://i0.wp.com/${cleanUrl}?resize=${width},${height}`;
  }
  
  // Google Gadgets Proxy is the "gold standard" for bypassing hotlinking protection.
  const googleProxy = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodedUrl}`;
  
  // Problematic domains get the "double proxy" treatment: 
  // Google for the bypass, wsrv.nl for the resizing/optimization.
  if (url.includes('crazygames.com') || url.includes('gamepix.com')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(googleProxy)}&w=${width}&h=${height}&fit=cover&output=webp`;
  }
  
  // Default to wsrv.nl for others as it provides better resizing/optimization
  return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&h=${height}&fit=cover&output=webp`;
};

const GameThumbnail = ({ game, size = '400x300', className = "" }) => {
  const [width, height] = size.split('x');
  const [src, setSrc] = useState(getGameThumbnail(game.thumbnail, game.title, size));
  const [errorStage, setErrorStage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleError = async () => {
    if (errorStage === 0) {
      // Stage 1: Try Google Proxy
      setSrc(`https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(game.thumbnail)}`);
      setErrorStage(1);
    } else if (errorStage === 1) {
      // Stage 2: Try wsrv.nl directly
      setSrc(`https://wsrv.nl/?url=${encodeURIComponent(game.thumbnail)}&w=${width}&h=${height}&fit=cover`);
      setErrorStage(2);
    } else if (errorStage === 2) {
      // Stage 3: AI Generation
      setIsGenerating(true);
      const aiImage = await generateGameImage(game.title);
      if (aiImage) {
        setSrc(aiImage);
        setIsGenerating(false);
        setErrorStage(3);
      } else {
        // Final fallback to LoremFlickr
        setSrc(`https://loremflickr.com/${width}/${height}/game,${encodeURIComponent(game.title)}`);
        setIsGenerating(false);
        setErrorStage(4);
      }
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 z-10 p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
          <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">AI Art...</p>
        </div>
      )}
      <img
        src={src}
        alt={game.title}
        className={`w-full h-full object-cover transition-transform duration-500 ${!isGenerating ? 'group-hover:scale-110' : ''}`}
        onError={handleError}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

function GameContent() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const selectedGame = useMemo(() => {
    if (!slug) return null;
    return gamesData.find(g => g.id === slug) || null;
  }, [slug]);

  useEffect(() => {
    if (slug && !selectedGame) {
      navigate('/', { replace: true });
    }
  }, [slug, selectedGame, navigate]);

  const filteredGames = gamesData.filter(game =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGameSelect = (game) => {
    navigate(`/gry-za-darmo/${game.id}`);
  };

  const recommendedGames = useMemo(() => {
    if (!selectedGame) return [];
    return shuffledAllGames
      .filter(g => g.id !== selectedGame.id)
      .slice(0, 6);
  }, [selectedGame]);

  const closeGame = () => {
    navigate('/');
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Mobile Search */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Szukaj gier..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Hero Section */}
            {searchQuery === '' && (
              <section className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 md:p-12">
                <div className="relative z-10 max-w-2xl">
                  <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                    Najlepsze <span className="text-indigo-200">gry za darmo i gry online</span> dla każdego.
                  </h2>
                  <p className="text-indigo-100 text-lg mb-8 opacity-90">
                    Witaj na GryZaDarmo! Znajdziesz u nas najlepsze <strong>gry za darmo</strong> oraz <strong>gry online</strong> dla każdego. 
                    Nasza kolekcja obejmuje <strong>gry dla dzieci</strong>, popularne <strong>gry poki</strong>, <strong>gry dla dzieci online</strong> oraz wciągające <strong>gry przeglądarkowe</strong>. 
                    Jeśli szukasz wyzwań, sprawdź nasze <strong>gry brainrot</strong> lub zaproś znajomego do <strong>gry dla 2 osob</strong>. 
                    Wszystkie gry są dostępne bezpośrednio w przeglądarce, bez konieczności instalacji.
                  </p>
                  <button 
                    onClick={() => document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20"
                  >
                    Zagraj Teraz
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-l from-indigo-600 to-transparent" />
                  <img 
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&h=600&q=80" 
                    alt="Arcade Background" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </section>
            )}

            {/* Games Grid */}
            <div id="games-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredGames.map((game) => (
                <motion.div
                  key={game.id}
                  layoutId={game.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-colors"
                  onClick={() => handleGameSelect(game)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <GameThumbnail game={game} size="400x300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                      {game.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-zinc-500 text-lg">Nie znaleziono gier dla &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* Game Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeGame}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">{selectedGame.title}</h2>
                  <p className="text-xs text-zinc-500">Grasz teraz w {selectedGame.title}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  title="Pełny ekran"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all text-sm font-medium"
                  onClick={() => {
                    const iframe = document.getElementById('game-iframe');
                    if (iframe?.requestFullscreen) iframe.requestFullscreen();
                  }}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Pełny ekran</span>
                </button>
                <button
                  onClick={closeGame}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Game Window */}
              <div className="lg:col-span-3 space-y-6">
                <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-zinc-800 relative">
                  <iframe
                    id="game-iframe"
                    src={selectedGame.url}
                    className="w-full h-full border-none"
                    title={selectedGame.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                <div className="bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800/50">
                  <h3 className="text-lg font-bold mb-2">O grze</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {selectedGame.description}
                  </p>
                </div>
              </div>

              {/* Recommendations Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-indigo-500" />
                    Polecane gry
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {recommendedGames.map((game) => (
                    <div
                      key={game.id}
                        className="group flex gap-3 p-2 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-500/30 hover:bg-zinc-800/50 transition-all"
                        onClick={() => handleGameSelect(game)}
                      >
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                          <GameThumbnail game={game} size="100x100" />
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <h4 className="font-bold text-sm text-zinc-200 group-hover:text-indigo-400 transition-colors truncate">
                            {game.title}
                          </h4>
                          <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                            {game.description}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => window.location.href = '/'}
          >
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-50 transition-colors">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Gry za darmo, gry online, gry dla dzieci, gry poki, gry dla dzieci online, gry przeglądarkowe, gry brainrot, gry dla 2 osob - GryZaDarmo
            </h1>
          </div>

          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Szukaj gier..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest hidden sm:block">
              Dostępnych gier: {gamesData.length}
            </span>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<GameContent />} />
        <Route path="/gry-za-darmo/:slug" element={<GameContent />} />
      </Routes>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 mt-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-zinc-400">GryZaDarmo</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <a href="#" className="hover:text-indigo-400 transition-colors">Polityka Prywatności</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Regulamin</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Kontakt</a>
          </div>
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} GryZaDarmo. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
}
