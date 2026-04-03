/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Gamepad2, Search, X, Maximize2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './data/games.json';

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGames, setFilteredGames] = useState(gamesData);

  useEffect(() => {
    const filtered = gamesData.filter(game =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredGames(filtered);
  }, [searchQuery]);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
  };

  const closeGame = () => {
    setSelectedGame(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setSelectedGame(null)}
          >
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              UnblockedHub
            </h1>
          </div>

          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search games..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest hidden sm:block">
              {gamesData.length} Games Available
            </span>
          </div>
        </div>
      </header>

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
                  placeholder="Search games..."
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
                      Your Ultimate Portal for <span className="text-indigo-200">Unblocked Fun.</span>
                    </h2>
                    <p className="text-indigo-100 text-lg mb-8 opacity-90">
                      High-quality web games, no downloads, no blocks. Just pure entertainment.
                    </p>
                    <button 
                      onClick={() => document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20"
                    >
                      Browse Games
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-l from-indigo-600 to-transparent" />
                    <img 
                      src="https://picsum.photos/seed/arcade/800/600" 
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
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
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
                  <p className="text-zinc-500 text-lg">No games found matching "{searchQuery}"</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
            >
              <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
                <button
                  onClick={closeGame}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Hub</span>
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-600 rounded-md">
                    <Gamepad2 className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-bold text-zinc-100">{selectedGame.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    title="Fullscreen"
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    onClick={() => {
                      const iframe = document.getElementById('game-iframe');
                      if (iframe?.requestFullscreen) iframe.requestFullscreen();
                    }}
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closeGame}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-black relative">
                <iframe
                  id="game-iframe"
                  src={selectedGame.url}
                  className="w-full h-full border-none"
                  title={selectedGame.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      {!selectedGame && (
        <footer className="border-t border-zinc-800 py-12 mt-20">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-zinc-400">UnblockedHub</span>
            </div>
            <div className="flex gap-8 text-sm text-zinc-500">
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Contact Us</a>
            </div>
            <p className="text-sm text-zinc-600">
              © {new Date().getFullYear()} UnblockedHub. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
