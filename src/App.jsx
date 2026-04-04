/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Gamepad2, Search, X, Maximize2, ChevronLeft, Star, MessageSquare, Clock, Info, HelpCircle, Lightbulb, PlayCircle, Heart, ChevronDown, User, LogOut, LogIn, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  setDoc, 
  doc, 
  getDoc
} from 'firebase/firestore';
import gamesData from './data/games.json';

const shuffledAllGames = [...gamesData].sort(() => 0.5 - Math.random());

const CATEGORIES = [
  { id: 'brainrot', name: 'Gry Brainrot', keywords: ['brainrot', 'skibidi', 'obby', 'toilet', 'sigma', 'griddy', 'fanum', 'rizz', 'meme', 'memy', 'śmieszne'] },
  { id: 'io', name: 'Gry .io', keywords: ['.io', ' io', 'multiplayer', 'arena', 'wieloosobowa', 'online z innymi', 'online'] },
  { id: 'dla-2-osob', name: 'Gry dla 2 osób', keywords: ['2 osób', '2 graczy', 'multiplayer', 'wieloosobowa', '2 player', 'dla 2', 'fireboy', 'watergirl', 'ogień i woda', 'współpraca', 'kooperacja', 'duel', 'pojedynek', 'versus', 'vs'] },
  { id: 'wyscigowe', name: 'Gry Wyścigowe', keywords: ['wyścig', 'wyścigi', 'samochód', 'samochody', 'auto', 'auta', 'stunt', 'driver', 'moto', 'bike', 'racing', 'car', 'truck', 'drift', 'parking', 'jazda', 'pojazd', 'sanki', 'rower', 'motocykle', 'rowery'] },
  { id: 'logiczne', name: 'Gry Logiczne', keywords: ['puzzle', 'logiczna', 'zagadka', 'block', 'bubble', 'mahjong', 'logic', 'match 3', 'solitaire', 'sudoku', 'karciana', 'card', 'pasjans', 'układanka', 'myślenie', 'układanki', 'karty'] },
  { id: 'akcji', name: 'Gry Akcji', keywords: ['strzelanka', 'strzelanki', 'combat', 'strike', 'ninja', 'walka', 'walki', 'bitwa', 'bitwy', 'action', 'shooting', 'war', 'battle', 'zręcznościowa', 'arcade', 'fight', 'refleks', 'zręczność', 'przetrwanie', 'survival', 'wojna'] },
  { id: 'sportowe', name: 'Gry Sportowe', keywords: ['sport', 'piłka', 'nożna', 'football', 'soccer', 'basketball', 'koszykówka', 'tenis', 'golf', 'baseball', 'skate', 'rower', 'siatkówka', 'bieganie', 'skakanie', 'lekkoatletyka'] },
  { id: 'przygodowe', name: 'Gry Przygodowe', keywords: ['przygoda', 'przygody', 'adventure', 'quest', 'eksploracja', 'rpg', 'world', 'craft', 'survival', 'świat', 'podróż'] },
  { id: 'strategiczne', name: 'Gry Strategiczne', keywords: ['strategia', 'strategy', 'tower defense', 'td', 'obrona', 'rts', 'management', 'clicker', 'idle', 'tycoon', 'budowanie', 'zarządzanie'] },
  { id: 'ubieranki', name: 'Gry Ubieranki', keywords: ['ubieranka', 'dress up', 'fashion', 'moda', 'makijaż', 'makeup', 'style', 'salon', 'fryzjer', 'ubieranie', 'projektowanie'] },
  { id: 'gotowanie', name: 'Gry Gotowanie', keywords: ['gotowanie', 'cooking', 'kuchnia', 'kitchen', 'restauracja', 'restaurant', 'jedzenie', 'food', 'pizza', 'burger', 'cake', 'ciasto', 'pieczenie', 'serwowanie', 'kucharz', 'szef', 'piekarz'] },
  { id: 'symulatory', name: 'Gry Symulatory', keywords: ['symulator', 'simulator', 'sim', 'driving', 'flight', 'farming', 'tycoon', 'lekarz', 'doctor', 'podolog', 'dentysta', 'operacja', 'praca', 'zawód'] },
  { id: 'platformowki', name: 'Gry Platformówki', keywords: ['platformówka', 'platformer', 'jump', 'run', 'skakanie', 'bieganie', 'parkour', 'geometry', 'poziomy', 'przeszkody'] },
  { id: 'klasyczne', name: 'Gry Klasyczne', keywords: ['klasyczna', 'classic', 'retro', 'arcade', 'old school', 'pacman', 'snake', 'tetris', 'pinball', 'szachy', 'warcaby', 'karty', 'pasjans', 'stare gry'] },
  { id: 'edukacyjne', name: 'Gry Edukacyjne', keywords: ['edukacyjna', 'educational', 'nauka', 'learning', 'math', 'matematyka', 'ortografia', 'quiz', 'trivia', 'geografia', 'język', 'wiedza', 'szkoła'] },
  { id: 'horror', name: 'Gry Horror', keywords: ['horror', 'straszna', 'straszne', 'scary', 'ghost', 'zombie', 'survival', 'creepy', 'duch', 'duchy', 'potwór', 'strach', 'ucieczka'] },
  { id: 'muzyczne', name: 'Gry Muzyczne', keywords: ['muzyczna', 'muzyka', 'music', 'rytmiczna', 'rhythm', 'piano', 'guitar', 'dance', 'taniec', 'pianino', 'perkusja', 'śpiewanie', 'rytmu', 'gitara'] },
  { id: 'dla-dziewczyn', name: 'Gry dla Dziewczyn', keywords: ['dziewczyn', 'dziewczyny', 'girls', 'princess', 'księżniczka', 'księżniczki', 'barbie', 'pony', 'kucyk', 'cute', 'słodkie', 'miłość', 'love', 'tester', 'randka'] },
  { id: 'dla-chlopcow', name: 'Gry dla Chłopców', keywords: ['chłopców', 'chłopcy', 'boys', 'car', 'gun', 'soldier', 'war', 'robot', 'superhero', 'wojsko', 'czołg', 'tank', 'broń', 'czołgi'] },
  { id: 'swiateczne', name: 'Gry Świąteczne', keywords: ['świąteczna', 'święta', 'christmas', 'mikołaj', 'santa', 'snow', 'śnieg', 'winter', 'zima', 'halloween', 'easter', 'wielkanoc', 'wakacje'] },
  { id: 'inne', name: 'Inne Gry', keywords: [] },
];

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
  return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&h=${height}&fit=cover&output=webp&default=https%3A%2F%2Floremflickr.com%2F${width}%2F${height}%2Fgame%2C${encodeURIComponent(title)}`;
};

function GameContent({ onLoginRequired }) {
  const { slug, categoryId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const selectedGame = useMemo(() => {
    if (!slug) return null;
    return gamesData.find(g => g.id === slug) || null;
  }, [slug]);

  const currentCategory = useMemo(() => {
    if (!categoryId) return null;
    return CATEGORIES.find(c => c.id === categoryId) || null;
  }, [categoryId]);

  const gameCategory = useMemo(() => {
    if (!selectedGame) return null;
    // Try to find a category based on keywords
    return CATEGORIES.find(cat => 
      cat.keywords.some(k => 
        selectedGame.title.toLowerCase().includes(k.toLowerCase()) || 
        (selectedGame.description && selectedGame.description.toLowerCase().includes(k.toLowerCase()))
      )
    ) || CATEGORIES[0]; // Fallback to first category
  }, [selectedGame]);

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    const saved = localStorage.getItem('recentlyPlayed');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse recently played', e);
      }
    }
    return [];
  });

  useEffect(() => {
    if (selectedGame) {
      const timer = setTimeout(() => {
        setRecentlyPlayed(prev => {
          if (prev[0] === selectedGame.id) return prev;
          const updated = [selectedGame.id, ...prev.filter(id => id !== selectedGame.id)].slice(0, 10);
          localStorage.setItem('recentlyPlayed', JSON.stringify(updated));
          return updated;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedGame]);

  const recentlyPlayedGames = useMemo(() => {
    return recentlyPlayed
      .map(id => gamesData.find(g => g.id === id))
      .filter(Boolean);
  }, [recentlyPlayed]);

  // Scroll to top when game or category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, categoryId]);

  useEffect(() => {
    if (slug && !selectedGame) {
      navigate('/', { replace: true });
      return;
    }

    const updateMeta = (title, description, schemas = []) => {
      document.title = title;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }

      // Update Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);

      // Update Structured Data
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"].seo-schema');
      existingScripts.forEach(s => s.remove());

      schemas.forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.className = 'seo-schema';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    };

    const baseUrl = window.location.origin;
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "GryZaDarmo",
        "item": baseUrl
      }
    ];

    if (selectedGame) {
      const title = `${selectedGame.title} - Graj za darmo online na GryZaDarmo 🎮`;
      const description = `Zagraj w ${selectedGame.title} za darmo na GryZaDarmo. ${selectedGame.description.slice(0, 150)}... Najlepsze gry online dla dzieci i dorosłych!`;
      
      breadcrumbItems.push({
        "@type": "ListItem",
        "position": 2,
        "name": selectedGame.title,
        "item": `${baseUrl}/gry-za-darmo/${selectedGame.id}`
      });

      const gameSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": selectedGame.title,
        "description": selectedGame.description,
        "image": selectedGame.thumbnail,
        "url": `${baseUrl}/gry-za-darmo/${selectedGame.id}`,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "PLN"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250"
        }
      };

      updateMeta(title, description, [
        gameSchema,
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbItems
        }
      ]);
    } else if (currentCategory) {
      const title = `${currentCategory.name} - Najlepsze gry online na GryZaDarmo 🕹️`;
      const description = `Odkryj najlepsze ${currentCategory.name} za darmo online. Graj w wyselekcjonowane gry przeglądarkowe w kategorii ${currentCategory.name} na GryZaDarmo!`;
      
      breadcrumbItems.push({
        "@type": "ListItem",
        "position": 2,
        "name": currentCategory.name,
        "item": `${baseUrl}/kategoria/${currentCategory.id}`
      });

      updateMeta(title, description, [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbItems
        }
      ]);
    } else {
      const title = 'Gry za darmo, gry online, gry dla dzieci i gry poki - GryZaDarmo';
      const description = 'Najlepsze gry za darmo online. Graj w gry dla dzieci, gry poki, gry przeglądarkowe, gry brainrot oraz gry dla 2 osob. Darmowa rozrywka bez pobierania!';
      
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Czy gry na GryZaDarmo są naprawdę darmowe?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tak! Wszystkie gry na naszej platformie są w 100% darmowe i dostępne bezpośrednio w przeglądarce bez konieczności pobierania."
            }
          },
          {
            "@type": "Question",
            "name": "Czy muszę zakładać konto, aby grać?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Nie, nie wymagamy rejestracji. Możesz zacząć grać natychmiast po wejściu na stronę."
            }
          },
          {
            "@type": "Question",
            "name": "Jakie rodzaje gier oferujecie?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oferujemy szeroki wybór gier: od gier akcji i wyścigowych, przez gry logiczne i edukacyjne, aż po popularne gry .io i gry dla 2 osób."
            }
          }
        ]
      };

      updateMeta(title, description, [
        faqSchema,
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbItems
        }
      ]);
    }
  }, [slug, selectedGame, currentCategory, navigate]);

  const filteredGames = useMemo(() => {
    let games = gamesData;
    
    if (categoryId) {
      const category = CATEGORIES.find(c => c.id === categoryId);
      if (category) {
        if (category.id === 'inne') {
          // "Inne" category includes games that don't match any other category
          const otherCategories = CATEGORIES.filter(c => c.id !== 'inne');
          games = games.filter(game => 
            !otherCategories.some(cat => 
              cat.keywords.some(keyword => 
                game.title.toLowerCase().includes(keyword.toLowerCase()) || 
                game.description.toLowerCase().includes(keyword.toLowerCase())
              )
            )
          );
        } else {
          games = games.filter(game => 
            category.keywords.some(keyword => 
              game.title.toLowerCase().includes(keyword.toLowerCase()) || 
              game.description.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        }
      }
    }

    if (searchQuery) {
      games = games.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return games;
  }, [categoryId, searchQuery]);

  const handleGameSelect = (game) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(id => id !== game.id);
      const updated = [game.id, ...filtered].slice(0, 10);
      localStorage.setItem('recentlyPlayed', JSON.stringify(updated));
      return updated;
    });
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
      {/* Visual Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue transition-colors flex items-center gap-1">
          <Gamepad2 className="w-4 h-4" />
          GryZaDarmo
        </Link>
        {currentCategory && (
          <>
            <span className="text-zinc-300">/</span>
            <Link to={`/kategoria/${currentCategory.id}`} className="hover:text-brand-blue transition-colors">
              {currentCategory.name}
            </Link>
          </>
        )}
        {selectedGame && (
          <>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-600 truncate max-w-[200px]">{selectedGame.title}</span>
          </>
        )}
      </nav>

      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            {/* Mobile Search */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Szukaj gier..."
                className="w-full bg-white border-2 border-brand-yellow/30 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-yellow transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Hero Section */}
            {searchQuery === '' && !categoryId && (
              <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-blue p-8 md:p-12 shadow-xl shadow-brand-blue/20">
                <div className="relative z-10 max-w-2xl">
                  <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white font-display">
                    Najlepsze <span className="text-brand-yellow">gry za darmo</span> i gry online dla każdego! 🎮
                  </h2>
                  <p className="text-white/90 text-lg mb-8 font-medium">
                    Witaj na GryZaDarmo! Znajdziesz u nas najlepsze <strong>gry za darmo</strong> oraz <strong>gry online</strong> dla każdego. 
                    Nasza kolekcja obejmuje <strong>gry dla dzieci</strong>, popularne <strong>gry poki</strong>, <strong>gry dla dzieci online</strong> oraz wciągające <strong>gry przeglądarkowe</strong>. 
                  </p>
                  <button 
                    onClick={() => document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-brand-yellow text-zinc-900 px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_6px_0_#D4B100] hover:shadow-[0_4px_0_#D4B100] hover:translate-y-[2px]"
                  >
                    ZAGRAJ TERAZ!
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-l from-brand-blue to-transparent" />
                  <img 
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&h=600&q=80" 
                    alt="Fun Games" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </section>
            )}

            {/* Category Header */}
            {currentCategory && searchQuery === '' && (
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg mb-8">
                <h2 className="text-3xl font-black text-zinc-800 font-display flex items-center gap-3">
                  <Gamepad2 className="w-8 h-8 text-brand-blue" />
                  {currentCategory.name}
                </h2>
                <p className="text-zinc-500 mt-2 font-medium">
                  Przeglądasz najlepsze gry w kategorii: <strong>{currentCategory.name}</strong>. Znaleziono {filteredGames.length} gier.
                </p>
              </div>
            )}

            {/* Recently Played */}
            {recentlyPlayedGames.length > 0 && searchQuery === '' && !categoryId && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-3 font-display">
                    <Clock className="w-8 h-8 text-brand-blue" />
                    Ostatnio grane
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {recentlyPlayedGames.map((game) => (
                    <motion.div
                      key={`recent-${game.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative bg-white border-2 border-zinc-100 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
                      onClick={() => handleGameSelect(game)}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={getGameThumbnail(game.thumbnail, game.title, '200x200')}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-bold text-zinc-800 text-xs truncate font-display">
                          {game.title}
                        </h3>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Games Grid */}
            <div id="games-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
              {filteredGames.map((game) => (
                <motion.div
                  key={game.id}
                  layoutId={game.id}
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative bg-white border-2 border-zinc-100 rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
                  onClick={() => handleGameSelect(game)}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={getGameThumbnail(game.thumbnail, game.title, '400x300')}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.triedGoogle) {
                          e.currentTarget.dataset.triedGoogle = 'true';
                          e.currentTarget.src = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(game.thumbnail)}`;
                        } else {
                          const gameTitle = encodeURIComponent(game.title + " game");
                          e.currentTarget.src = `https://loremflickr.com/400/300/game,${gameTitle}`;
                          e.currentTarget.onerror = null;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-extrabold text-zinc-800 group-hover:text-brand-blue transition-colors text-lg font-display">
                      {game.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-zinc-400 text-xl font-bold">Nie znaleziono gier dla &quot;{searchQuery}&quot; 🔍</p>
              </div>
            )}

            {/* About Us SEO Section */}
            {searchQuery === '' && (
              <>
                <section className="mt-16 bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-zinc-800 mb-6 font-display flex items-center gap-3">
                      <Info className="w-8 h-8 text-brand-blue" />
                      O nas – Twoje centrum darmowej rozrywki
                    </h2>
                    <div className="prose prose-zinc max-w-none">
                      <p className="text-zinc-600 text-lg leading-relaxed font-medium mb-6">
                        Witaj na <strong>GryZaDarmo</strong> – Twoim ulubionym miejscu w sieci, gdzie znajdziesz najlepsze <strong>gry za darmo</strong> dostępne całkowicie <strong>online</strong>. Nasza platforma została stworzona z myślą o graczach w każdym wieku, oferując błyskawiczny dostęp do setek starannie wyselekcjonowanych tytułów bez konieczności zakładania konta czy pobierania plików.
                      </p>
                      <p className="text-zinc-600 text-lg leading-relaxed font-medium mb-6">
                        W naszej kolekcji znajdziesz wszystko, czego dusza zapragnie – od klasycznych zręcznościówek, przez popularne gry typu <strong>brainrot</strong>, aż po zaawansowane wyzwania logiczne. Jeśli szukasz emocji we dwoje, nasze gry <strong>dla dwóch osób</strong> pozwolą Ci na wspólną rywalizację lub kooperację z przyjacielem na jednym komputerze.
                      </p>
                      <p className="text-zinc-600 text-lg leading-relaxed font-medium">
                        Wszystkie nasze produkcje to gry <strong>przeglądarkowe</strong>, co sprawia, że są one idealnym wyborem na szybką partię podczas przerwy <strong>w szkole</strong>, na uczelni czy w pracy. Dbamy o to, aby nasza biblioteka była stale aktualizowana o najnowsze hity, zapewniając Ci świeżą dawkę zabawy każdego dnia. Graj, baw się i bij rekordy razem z nami!
                      </p>
                    </div>
                  </div>
                </section>

                {/* FAQ Section */}
                <section className="mt-12 bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-zinc-800 mb-8 font-display flex items-center gap-3">
                      <HelpCircle className="w-8 h-8 text-brand-pink" />
                      Często zadawane pytania (FAQ)
                    </h2>
                    <div className="grid gap-6">
                      <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-zinc-100">
                        <h3 className="text-lg font-black text-zinc-800 mb-2 font-display">Czy gry na GryZaDarmo są naprawdę darmowe?</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Tak! Wszystkie gry na naszej platformie są w 100% darmowe i dostępne bezpośrednio w przeglądarce bez konieczności pobierania.</p>
                      </div>
                      <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-zinc-100">
                        <h3 className="text-lg font-black text-zinc-800 mb-2 font-display">Czy muszę zakładać konto, aby grać?</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Nie, nie wymagamy rejestracji. Możesz zacząć grać natychmiast po wejściu na stronę.</p>
                      </div>
                      <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-zinc-100">
                        <h3 className="text-lg font-black text-zinc-800 mb-2 font-display">Jakie rodzaje gier oferujecie?</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Oferujemy szeroki wybór gier: od gier akcji i wyścigowych, przez gry logiczne i edukacyjne, aż po popularne gry .io i gry dla 2 osób.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            {/* Game Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border-2 border-zinc-100 shadow-xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeGame}
                  className="p-3 bg-zinc-100 hover:bg-brand-yellow text-zinc-600 hover:text-zinc-900 rounded-2xl transition-all shadow-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-zinc-800 font-display">{selectedGame.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-zinc-500 font-medium">Grasz teraz w {selectedGame.title} 🎮</p>
                    {gameCategory && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <Link 
                          to={`/kategoria/${gameCategory.id}`}
                          className="text-xs font-black px-2 py-1 bg-brand-blue/10 text-brand-blue rounded-lg hover:bg-brand-blue hover:text-white transition-all uppercase tracking-wider"
                        >
                          {gameCategory.name}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  title="Pełny ekran"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm font-black shadow-lg shadow-brand-blue/20"
                  onClick={() => {
                    const iframe = document.getElementById('game-iframe');
                    if (iframe?.requestFullscreen) iframe.requestFullscreen();
                  }}
                >
                  <Maximize2 className="w-5 h-5" />
                  <span>PEŁNY EKRAN</span>
                </button>
                <button
                  onClick={closeGame}
                  className="p-3 bg-zinc-100 hover:bg-brand-pink text-zinc-600 hover:text-white rounded-2xl transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Game Window */}
              <div className="lg:col-span-3 space-y-6">
                <div className="aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white relative">
                  <iframe
                    id="game-iframe"
                    src={selectedGame.url}
                    className="w-full h-full border-none"
                    title={selectedGame.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
                  <h3 className="text-xl font-black mb-4 font-display text-brand-blue">O grze</h3>
                  <p className="text-zinc-600 leading-relaxed font-medium text-lg">
                    {selectedGame.description}
                  </p>
                </div>

                {/* SEO Content Section */}
                <GameSEOContent game={selectedGame} similarGames={recommendedGames} />

                {/* Ratings & Comments */}
                <GameInteractions 
                  key={selectedGame.id} 
                  gameId={selectedGame.id} 
                  onLoginRequired={onLoginRequired}
                />
              </div>

              {/* Recommendations Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-zinc-800 flex items-center gap-2 text-lg font-display">
                    <Gamepad2 className="w-6 h-6 text-brand-pink" />
                    Polecane gry
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {recommendedGames.map((game) => (
                    <div
                      key={game.id}
                        className="group flex gap-3 p-3 bg-white border-2 border-zinc-50 rounded-2xl cursor-pointer hover:border-brand-blue/30 hover:shadow-lg transition-all"
                        onClick={() => handleGameSelect(game)}
                      >
                        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                          <img
                            src={getGameThumbnail(game.thumbnail, game.title, '100x100')}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <h4 className="font-black text-sm text-zinc-800 group-hover:text-brand-blue transition-colors truncate font-display">
                            {game.title}
                          </h4>
                          <p className="text-xs text-zinc-500 line-clamp-2 mt-1 font-medium">
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

function GameSEOContent({ game, similarGames }) {
  // Static content generation based on game data
  const seoData = useMemo(() => {
    const title = game.title;
    const desc = game.description;

    return {
      whyFun: `Gra ${title} to absolutny hit w świecie gier online! To, co sprawia, że ta produkcja jest tak wyjątkowa, to przede wszystkim jej niesamowita grywalność i przystępność. Niezależnie od tego, czy jesteś doświadczonym graczem, czy dopiero zaczynasz swoją przygodę z grami przeglądarkowymi, ${title} dostarczy Ci mnóstwo emocji. Gra łączy w sobie elementy zręcznościowe z logicznym myśleniem, co sprawia, że każda minuta spędzona przed ekranem jest pełna wyzwań. Dodatkowo, kolorowa oprawa graficzna i płynne animacje sprawiają, że rozgrywka jest niezwykle przyjemna dla oka. To idealny sposób na relaks po szkole lub pracy, oferujący szybką i satysfakcjonującą zabawę bez konieczności instalowania czegokolwiek na komputerze.`,
      description: `Witaj w świecie ${title}! Jest to jedna z najpopularniejszych gier w naszej kolekcji, która zdobyła serca tysięcy graczy na całym świecie. Głównym celem w ${title} jest ${desc.toLowerCase().replace('.', '')}, co wymaga od gracza nie tylko refleksu, ale również strategicznego podejścia. Gra została zaprojektowana tak, aby stopniowo wprowadzać nowe mechaniki, dzięki czemu poziom trudności rośnie wraz z Twoimi umiejętnościami. Każdy poziom to nowa przygoda i nowe przeszkody do pokonania. W ${title} liczy się każda sekunda i każdy ruch – jeden błąd może zadecydować o Twoim wyniku, dlatego musisz być stale skoncentrowany. To produkcja, która udowadnia, że darmowe gry online mogą oferować głębię i jakość porównywalną z płatnymi tytułami.`,
      howToPlay: `Rozpoczęcie przygody z ${title} jest niezwykle proste! Oto krótka instrukcja, która pomoże Ci stać się mistrzem:
      1. Po załadowaniu gry, kliknij przycisk startu, aby przejść do menu głównego.
      2. Używaj klawiszy strzałek lub myszki (zależnie od urządzenia), aby kontrolować swoją postać lub elementy gry.
      3. Twoim głównym zadaniem jest ${desc.toLowerCase()}. Pamiętaj, aby unikać przeszkód, które mogą przerwać Twoją passę.
      4. Zbieraj bonusy i ulepszenia rozrzucone na planszy – pomogą Ci one osiągnąć lepszy wynik i odblokować nowe funkcje.
      5. Gra kończy się, gdy stracisz wszystkie życia lub nie wykonasz zadania w określonym czasie. Nie poddawaj się – każda kolejna próba przybliża Cię do rekordu!`,
      tips: `Chcesz osiągnąć najlepszy wynik w ${title}? Skorzystaj z naszych sprawdzonych porad:
      - Zachowaj spokój: Wiele gier zręcznościowych wymaga zimnej krwi. Nie wykonuj gwałtownych ruchów, jeśli nie są one konieczne.
      - Poznaj mapę: Jeśli gra ma stałe poziomy, postaraj się zapamiętać rozmieszczenie pułapek. Wiedza to połowa sukcesu!
      - Wykorzystuj bonusy: Nie ignoruj ulepszeń. Często to właśnie one pozwalają przejść najtrudniejsze fragmenty rozgrywki.
      - Ćwicz regularnie: Refleks można wytrenować. Im więcej grasz w ${title}, tym lepsze będą Twoje wyniki.
      - Obserwuj innych: Jeśli to gra wieloosobowa, podpatruj techniki najlepszych graczy i staraj się je naśladować.`,
      faqs: [
        {
          question: `Czy gra ${title} jest całkowicie darmowa?`,
          answer: `Tak! W ${title} możesz grać zupełnie za darmo na naszej stronie GryZaDarmo. Nie wymagamy żadnych opłat ani subskrypcji.`
        },
        {
          question: `Czy muszę pobierać ${title}, aby w nią zagrać?`,
          answer: `Nie, ${title} to gra przeglądarkowa. Oznacza to, że uruchomisz ją bezpośrednio w swojej przeglądarce internetowej (Chrome, Firefox, Safari) bez konieczności instalacji.`
        },
        {
          question: `Czy ${title} działa na telefonach i tabletach?`,
          answer: `Większość naszych gier, w tym ${title}, jest zoptymalizowana pod kątem urządzeń mobilnych. Możesz cieszyć się rozgrywką na smartfonie lub tablecie z systemem Android lub iOS.`
        },
        {
          question: `Jak zapisać swój wynik w grze ${title}?`,
          answer: `Wiele gier automatycznie zapisuje Twoje postępy w pamięci przeglądarki. Pamiętaj jednak, że wyczyszczenie danych przeglądarki może spowodować utratę osiągnięć.`
        }
      ]
    };
  }, [game]);

  return (
    <div className="space-y-8">
      {/* Why this game is fun */}
      <section className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-4 font-display text-brand-pink flex items-center gap-2">
          <Heart className="w-6 h-6 fill-brand-pink" />
          Dlaczego ta gra jest fajna?
        </h3>
        <p className="text-zinc-600 leading-relaxed font-medium">
          {seoData.whyFun}
        </p>
      </section>

      {/* Detailed Description */}
      <section className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-4 font-display text-brand-blue flex items-center gap-2">
          <Info className="w-6 h-6" />
          Szczegółowy opis gry
        </h3>
        <div className="text-zinc-600 leading-relaxed font-medium space-y-4">
          {seoData.description.split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
        </div>
      </section>

      {/* How to Play */}
      <section className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-4 font-display text-brand-green flex items-center gap-2">
          <PlayCircle className="w-6 h-6" />
          Jak grać w {game.title}?
        </h3>
        <div className="text-zinc-600 leading-relaxed font-medium space-y-4">
          {seoData.howToPlay.split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
        </div>
      </section>

      {/* Tips & Strategies */}
      <section className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-4 font-display text-brand-yellow flex items-center gap-2">
          <Lightbulb className="w-6 h-6 fill-brand-yellow" />
          Porady i strategie
        </h3>
        <div className="text-zinc-600 leading-relaxed font-medium space-y-4">
          {seoData.tips.split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
        </div>
      </section>

      {/* Similar Games Section */}
      <section className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-6 font-display text-zinc-800 flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-brand-blue" />
          Podobne gry, które mogą Ci się spodobać
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {similarGames.slice(0, 3).map((g) => (
            <Link 
              key={g.id} 
              to={`/gry-za-darmo/${g.id}`}
              className="group block space-y-2"
            >
              <div className="aspect-video rounded-2xl overflow-hidden border-2 border-zinc-50 group-hover:border-brand-blue transition-all">
                <img 
                  src={g.thumbnail} 
                  alt={g.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="font-bold text-sm text-center text-zinc-700 group-hover:text-brand-blue truncate">{g.title}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-6 font-display text-zinc-800 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-brand-pink" />
          Często zadawane pytania (FAQ)
        </h3>
        <div className="space-y-6">
          {seoData.faqs.map((faq, i) => (
            <div key={i} className="space-y-2">
              <h4 className="font-black text-zinc-800 font-display">{faq.question}</h4>
              <p className="text-zinc-600 font-medium">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GameInteractions({ gameId, onLoginRequired }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch comments in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('gameId', '==', gameId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  // Fetch user's rating
  useEffect(() => {
    if (!user) return;

    const fetchRating = async () => {
      const ratingRef = doc(db, 'ratings', `${user.uid}_${gameId}`);
      const ratingSnap = await getDoc(ratingRef);
      if (ratingSnap.exists()) {
        setRating(ratingSnap.data().value);
      } else {
        setRating(0);
      }
    };

    fetchRating();
  }, [user, gameId]);

  const handleRate = async (val) => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    setRating(val);
    try {
      await setDoc(doc(db, 'ratings', `${user.uid}_${gameId}`), {
        userId: user.uid,
        gameId,
        value: val,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onLoginRequired?.();
      return;
    }
    if (!comment.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        gameId,
        userId: user.uid,
        author: user.displayName,
        text: comment,
        createdAt: serverTimestamp()
      });
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Ratings Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-6 font-display text-brand-pink flex items-center gap-2">
          <Star className="w-6 h-6 fill-brand-pink" />
          Oceń tę grę
        </h3>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRate(star)}
              className="p-1 transition-transform hover:scale-125 active:scale-95"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-brand-yellow text-brand-yellow'
                    : 'text-zinc-200'
                }`}
              />
            </button>
          ))}
          <span className="ml-4 font-black text-2xl text-zinc-400 font-display">
            {rating > 0 ? `${rating}/5` : 'Brak oceny'}
          </span>
        </div>
        {!user && (
          <p className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Zaloguj się, aby zapisać swoją ocenę</p>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-lg">
        <h3 className="text-xl font-black mb-6 font-display text-brand-blue flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Komentarze ({comments.length})
        </h3>
        
        <form onSubmit={handleCommentSubmit} className="mb-8 space-y-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "Napisz co myślisz o tej grze..." : "Zaloguj się, aby napisać komentarz..."}
            disabled={!user}
            className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:outline-none focus:border-brand-blue transition-all min-h-[100px] font-medium disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!user || !comment.trim()}
            className="px-8 py-3 bg-brand-blue text-white rounded-xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-blue/20 disabled:opacity-50 disabled:hover:scale-100"
          >
            DODAJ KOMENTARZ
          </button>
        </form>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-zinc-400 font-medium italic">Bądź pierwszym, który skomentuje tę grę!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-4 bg-zinc-50 rounded-2xl border-2 border-white shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-brand-pink text-sm">{c.author}</span>
                  <span className="text-xs text-zinc-400 font-bold">
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('pl-PL') : 'Przed chwilą'}
                  </span>
                </div>
                <p className="text-zinc-600 font-medium">{c.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TermsOfServiceContent() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Regulamin - GryZaDarmo';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Zapoznaj się z regulaminem serwisu GryZaDarmo. Ogólne warunki korzystania z darmowych gier online.');
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-zinc-100 shadow-xl max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-3 bg-zinc-100 hover:bg-brand-yellow text-zinc-600 hover:text-zinc-900 rounded-2xl transition-all shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-black text-zinc-900 font-display">Ogólne warunki korzystania z treści GryZaDarmo</h2>
        </div>

        <div className="prose prose-zinc max-w-none space-y-6 text-zinc-600 font-medium text-lg leading-relaxed">
          <p>
            Korzystając ze strony lub uzyskując do niej dostęp, zgadzasz się być związany niniejszą umową oraz warunkami naszej Polityki prywatności, które są włączone do niej przez odniesienie. Umowa ta pozostaje w pełni obowiązująca przez cały czas korzystania z dowolnej strony należącej do rodziny GryZaDarmo.
          </p>

          <p className="font-black text-brand-pink bg-brand-pink/5 p-4 rounded-2xl border-2 border-brand-pink/10">
            NIE KORZYSTAJ Z TEJ STRONY PODCZAS ZAJĘĆ LEKCYJNYCH. STRONA POWINNA BYĆ UŻYWANA WYŁĄCZNIE PODCZAS PRZERW LUB POZA SZKOŁĄ.
          </p>

          <p>
            GryZaDarmo nie gwarantuje dokładności jakichkolwiek informacji zawartych na naszych stronach ani dokładności informacji znajdujących się na stronach, do których linkujemy.
          </p>

          <p>
            Informacje zamieszczone na naszych stronach mają charakter uzupełniający wobec standardowych kursów akademickich i nauczania w klasie.
          </p>

          <p>
            Nie ponosimy odpowiedzialności za treści zawarte w materiałach licencjonowanych, które zostały stworzone przez osoby niezatrudnione przez GryZaDarmo, takich jak aplikacje GryZaDarmo.
          </p>

          <p>
            GryZaDarmo nie ponosi odpowiedzialności za reklamy, które mogą pojawić się na naszych stronach w wyniku błędu lub działania złośliwego oprogramowania.
          </p>

          <p>
            Materiały znajdujące się na tej stronie, jak również jej struktura i układ, nie mogą być kopiowane, modyfikowane, rozpowszechniane, przenoszone, dekompilowane, poddawane inżynierii wstecznej ani rozkładane na części – w całości lub w części.
          </p>

          <div className="bg-zinc-50 p-6 rounded-[2rem] border-2 border-zinc-100 text-sm font-mono uppercase">
            KORZYSTANIE Z SERWISÓW GryZaDarmo ODBYWA SIĘ NA ZASADZIE „TAK JAK JEST” („AS IS”) ORAZ „W MIARĘ DOSTĘPNOŚCI” („AS AVAILABLE”). WYRAŹNIE WYŁĄCZAMY WSZELKIE GWARANCJE, WYRAŻONE LUB DOROZUMIANE, W TYM MIĘDZY INNYMI GWARANCJE PRZYDATNOŚCI HANDLOWEJ LUB PRZYDATNOŚCI DO OKREŚLONEGO CELU. NIE GWARANTUJEMY, ŻE USŁUGA BĘDZIE DZIAŁAĆ NIEPRZERWANIE, BEZ BŁĘDÓW ANI ŻE BĘDZIE WOLNA OD WIRUSÓW LUB INNYCH SZKODLIWYCH ELEMENTÓW. W NAJSZERSZYM ZAKRESIE DOZWOLONYM PRZEZ PRAWO GryZaDarmo ORAZ PODMIOTY Z NIM POWIĄZANE NIE PONOSZĄ ODPOWIEDZIALNOŚCI ZA ŻADNE SZKODY POŚREDNIE, WTÓRNE, SZCZEGÓLNE, PRZYPADKOWE, PRZYKŁADOWE ANI KARNE, NAWET JEŚLI ZOSTALI POINFORMOWANI O MOŻLIWOŚCI ICH WYSTĄPIENIA. JEŚLI PRAWO NIE POZWALA NA CAŁKOWITE WYŁĄCZENIE ODPOWIEDZIALNOŚCI, NASZA ŁĄCZNA ODPOWIEDZIALNOŚĆ NIE PRZEKROCZY KWOTY OPŁAT (JEŚLI TAKIE ZOSTAŁY UISZCZONE) ZA KORZYSTANIE Z USŁUG. TWOIM WYŁĄCZNYM ŚRODKIEM OCHRONY SĄ POSTANOWIENIA WYRAŹNIE OKREŚLONE W NINIEJSZEJ UMOWIE. W NIEKTÓRYCH JURYSDYKCJACH WYŁĄCZENIA TE MOGĄ NIE MIEĆ ZASTOSOWANIA.
          </div>

          <p>
            Zobowiązujesz się korzystać ze stron GryZaDarmo zgodnie z obowiązującym prawem, przepisami i regulacjami. Zastrzegamy sobie prawo do zakończenia lub ograniczenia dostępu do serwisów GryZaDarmo według własnego uznania, jeśli uznamy, że korzystasz z nich w sposób naruszający niniejsze warunki lub prawa innych osób.
          </p>

          <p>
            W najszerszym zakresie dozwolonym przez prawo zobowiązujesz się zwolnić GryZaDarmo oraz podmioty powiązane z odpowiedzialności za wszelkie roszczenia, żądania lub szkody (w tym koszty i uzasadnione honoraria prawników) zgłaszane przez osoby trzecie w związku z Twoim korzystaniem z serwisów GryZaDarmo.
          </p>

          <p>
            Strony GryZaDarmo są zarządzane z terytorium Polski. Jeśli korzystasz z nich spoza Polski, wyrażasz zgodę na przekazywanie danych do Polski.
          </p>

          <p className="pt-4 border-t border-zinc-100 italic font-bold">
            Uwaga: Niniejszy dokument może ulec zmianie w dowolnym momencie. Zmiany będą publikowane na tej stronie. Dalsze korzystanie ze stron GryZaDarmo oznacza akceptację aktualnych warunków.
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function PrivacyPolicyContent() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Polityka Prywatności - GryZaDarmo';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Polityka prywatności serwisu GryZaDarmo. Dowiedz się, jak chronimy Twoje dane i dbamy o Twoją prywatność.');
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-zinc-100 shadow-xl max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-3 bg-zinc-100 hover:bg-brand-yellow text-zinc-600 hover:text-zinc-900 rounded-2xl transition-all shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-black text-zinc-900 font-display">Polityka prywatności GryZaDarmo</h2>
        </div>

        <div className="prose prose-zinc max-w-none space-y-6 text-zinc-600 font-medium text-lg leading-relaxed">
          <p>
            GryZaDarmo zobowiązuje się do ochrony Twojej prywatności. Niniejsza Polityka prywatności wyjaśnia, w jaki sposób zbieramy, wykorzystujemy i chronimy Twoje dane. Korzystając z naszej strony internetowej, wyrażasz zgodę na praktyki opisane w tej polityce.
          </p>

          <h3 className="text-xl font-black text-zinc-800 mt-8">1. Jakie informacje zbieramy</h3>
          <p>Zbieramy wyłącznie następujące rodzaje informacji:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Informacje podane przez użytkownika:</strong> wszelkie dane, które dobrowolnie przekazujesz za pośrednictwem formularzy, takie jak imię, adres e-mail lub inne informacje, które zdecydujesz się udostępnić.</li>
            <li><strong>Informacje z plików cookie:</strong> używamy plików cookie, aby ulepszyć Twoje doświadczenia podczas korzystania ze strony. Pliki cookie to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu, które pomagają nam zrozumieć preferencje użytkowników, poprawić funkcjonalność oraz analizować sposób korzystania ze strony.</li>
          </ul>

          <h3 className="text-xl font-black text-zinc-800 mt-8">2. Jak wykorzystujemy Twoje informacje</h3>
          <p>Zebrane informacje wykorzystujemy w następujących celach:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Odpowiadanie na zapytania, udzielanie wsparcia oraz komunikacja z użytkownikiem.</li>
            <li>Ulepszanie funkcjonalności strony oraz poprawa doświadczenia użytkownika.</li>
            <li>Analiza ruchu na stronie i sposobów jej użytkowania przy użyciu danych z plików cookie.</li>
          </ul>
          <p>Nie sprzedajemy, nie wymieniamy ani nie udostępniamy Twoich danych osobom trzecim, chyba że jest to wymagane przez prawo lub konieczne do ochrony naszych praw.</p>

          <h3 className="text-xl font-black text-zinc-800 mt-8">3. Pliki cookie i technologie śledzące</h3>
          <p>Pliki cookie pomagają nam zrozumieć, w jaki sposób odwiedzający korzystają z naszej strony. Możesz wyłączyć pliki cookie w ustawieniach swojej przeglądarki, jednak może to wpłynąć na działanie niektórych funkcji strony.</p>
          <p><strong>Rodzaje używanych plików cookie:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Niezbędne pliki cookie:</strong> konieczne do prawidłowego działania strony.</li>
            <li><strong>Analityczne pliki cookie:</strong> pomagają analizować sposób korzystania ze strony, aby ulepszać nasze usługi.</li>
          </ul>

          <h3 className="text-xl font-black text-zinc-800 mt-8">4. Bezpieczeństwo danych</h3>
          <p>Podejmujemy odpowiednie środki w celu ochrony Twoich danych przed nieautoryzowanym dostępem, zmianą lub ujawnieniem. Należy jednak pamiętać, że żadna metoda przesyłania ani przechowywania danych nie jest w 100% bezpieczna.</p>

          <h3 className="text-xl font-black text-zinc-800 mt-8">5. Twoje prawa</h3>
          <p>Masz prawo do:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Dostępu do swoich danych, ich aktualizacji lub usunięcia.</li>
            <li>Rezygnacji ze śledzenia przez pliki cookie poprzez zmianę ustawień przeglądarki.</li>
          </ul>
          <p>Aby skorzystać z tych praw, skontaktuj się z nami pod adresem: <a href="mailto:gryzadarmoonline@gmail.com" className="text-brand-blue hover:underline">gryzadarmoonline@gmail.com</a></p>

          <h3 className="text-xl font-black text-zinc-800 mt-8">6. Linki do stron trzecich</h3>
          <p>Nasza strona może zawierać linki do zewnętrznych witryn. Nie ponosimy odpowiedzialności za praktyki dotyczące prywatności stosowane przez te strony. Zachęcamy do zapoznania się z politykami prywatności każdej odwiedzanej witryny zewnętrznej.</p>

          <h3 className="text-xl font-black text-zinc-800 mt-8">7. Zmiany w polityce prywatności</h3>
          <p>Zastrzegamy sobie prawo do aktualizacji niniejszej Polityki prywatności w dowolnym czasie. Zmiany będą publikowane na tej stronie wraz z datą ich wejścia w życie. Zalecamy regularne sprawdzanie treści polityki, aby być na bieżąco z tym, jak chronimy Twoje dane.</p>

          <h3 className="text-xl font-black text-zinc-800 mt-8">8. Kontakt</h3>
          <p>W przypadku pytań lub wątpliwości dotyczących niniejszej Polityki prywatności, prosimy o kontakt:</p>
          <p><strong>E-mail: <a href="mailto:gryzadarmoonline@gmail.com" className="text-brand-blue hover:underline">gryzadarmoonline@gmail.com</a></strong></p>

          <p className="pt-4 border-t border-zinc-100 italic">
            Korzystając z naszej strony, wyrażasz zgodę na warunki określone w niniejszej Polityce prywatności.
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function DMCAContent() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'DMCA - Zgłoszenie naruszenia - GryZaDarmo';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Procedura zgłaszania naruszeń praw autorskich (DMCA) w serwisie GryZaDarmo.');
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-zinc-100 shadow-xl max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-3 bg-zinc-100 hover:bg-brand-yellow text-zinc-600 hover:text-zinc-900 rounded-2xl transition-all shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-black text-zinc-900 font-display">Zgłoszenie naruszenia DMCA</h2>
        </div>

        <div className="prose prose-zinc max-w-none space-y-6 text-zinc-600 font-medium text-lg leading-relaxed">
          <p>
            Jeśli uważasz, że na Stronie doszło do naruszenia praw autorskich, skorzystaj z poniższej procedury, aby nas o tym powiadomić. Po otrzymaniu zgłoszenia niezwłocznie podejmiemy działania w celu usunięcia materiałów naruszających prawa. Wszystkie zgłoszenia naruszeń praw autorskich powinny być sporządzone na piśmie i kierowane na adres: <a href="mailto:gryzadarmoonline@gmail.com" className="text-brand-blue hover:underline">gryzadarmoonline@gmail.com</a>
          </p>

          <p className="font-black text-zinc-800">Twoje zgłoszenie musi zawierać następujące informacje:</p>

          <ul className="list-disc pl-6 space-y-4">
            <li>Twój podpis fizyczny lub elektroniczny (jako właściciela wyłącznych praw, które rzekomo zostały naruszone, lub osoby upoważnionej do działania w imieniu takiego właściciela).</li>
            <li>Identyfikację utworu chronionego prawem autorskim, który miał zostać naruszony, lub – jeśli jedno zgłoszenie dotyczy wielu utworów znajdujących się w jednym serwisie – reprezentatywną listę takich utworów.</li>
            <li>Identyfikację materiału, który rzekomo narusza prawa autorskie lub stanowi przedmiot naruszenia, oraz który ma zostać usunięty lub do którego dostęp ma zostać zablokowany, a także informacje wystarczające do zlokalizowania tego materiału.</li>
            <li>Informacje umożliwiające kontakt z Tobą, takie jak adres, numer telefonu oraz – jeśli jest dostępny – adres e-mail.</li>
            <li>Oświadczenie, że w dobrej wierze uważasz, iż wykorzystanie materiału w sposób, którego dotyczy zgłoszenie, nie jest autoryzowane przez właściciela praw autorskich, jego przedstawiciela ani przez prawo.</li>
            <li>Oświadczenie, że informacje zawarte w zgłoszeniu są prawdziwe oraz że – pod rygorem odpowiedzialności za składanie fałszywych zeznań – jesteś właścicielem wyłącznych praw, które rzekomo zostały naruszone, lub jesteś upoważniony do działania w imieniu takiego właściciela.</li>
          </ul>

          <p className="pt-4 border-t border-zinc-100 italic">
            Po otrzymaniu zgłoszenia podejmiemy działania w celu jak najszybszego usunięcia wskazanych treści.
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-zinc-800 font-sans selection:bg-brand-yellow/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b-4 border-zinc-100 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-3 bg-brand-pink rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-brand-pink/20">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 font-display">
              GryZaDarmo
            </h1>
          </Link>

          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Szukaj ulubionej gry..."
              className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Witaj,</p>
                  <p className="text-sm font-bold text-zinc-800">{user.displayName}</p>
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-3 bg-zinc-100 hover:bg-brand-pink hover:text-white text-zinc-600 rounded-2xl transition-all shadow-sm group"
                  title="Wyloguj się"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-blue/20"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">ZALOGUJ SIĘ</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Category Navigation */}
        <div className="border-t border-zinc-100 bg-white">
          <div className="container mx-auto px-4 flex items-center py-3">
            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2">
              <Link 
                to="/"
                className={`px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
                  pathname === '/' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'hover:bg-zinc-100 text-zinc-600'
                }`}
              >
                Wszystkie
              </Link>
              {CATEGORIES.slice(0, 6).map(cat => {
                const isActive = pathname === `/kategoria/${cat.id}`;
                return (
                  <Link
                    key={cat.id}
                    to={`/kategoria/${cat.id}`}
                    className={`px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
                      isActive 
                        ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                        : 'hover:bg-brand-blue/10 hover:text-brand-blue text-zinc-600'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
            
            {/* Dropdown for more categories */}
            <div className="relative ml-2">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
                  isDropdownOpen ? 'bg-zinc-100 text-brand-blue' : 'hover:bg-zinc-100 text-zinc-600'
                }`}
              >
                Więcej <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white border-2 border-zinc-100 rounded-2xl shadow-2xl z-50 py-2 grid grid-cols-1 overflow-hidden"
                    >
                      <div className="px-4 py-2 text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">
                        Wszystkie kategorie
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {CATEGORIES.map(cat => {
                          const isActive = pathname === `/kategoria/${cat.id}`;
                          return (
                            <Link
                              key={cat.id}
                              to={`/kategoria/${cat.id}`}
                              onClick={() => setIsDropdownOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all ${
                                isActive 
                                  ? 'bg-brand-blue/10 text-brand-blue' 
                                  : 'hover:bg-zinc-50 text-zinc-600'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-brand-blue' : 'bg-zinc-200'}`} />
                              {cat.name}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<GameContent onLoginRequired={() => setIsLoginModalOpen(true)} />} />
        <Route path="/kategoria/:categoryId" element={<GameContent onLoginRequired={() => setIsLoginModalOpen(true)} />} />
        <Route path="/gry-za-darmo/:slug" element={<GameContent onLoginRequired={() => setIsLoginModalOpen(true)} />} />
        <Route path="/dmca" element={<DMCAContent />} />
        <Route path="/polityka-prywatnosci" element={<PrivacyPolicyContent />} />
        <Route path="/regulamin" element={<TermsOfServiceContent />} />
      </Routes>

      {/* Footer */}
      <footer className="border-t-4 border-zinc-100 py-16 mt-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green rounded-xl">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-xl text-zinc-800 font-display">GryZaDarmo</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-zinc-500">
              <Link to="/polityka-prywatnosci" className="hover:text-brand-blue transition-colors">Polityka Prywatności</Link>
              <Link to="/regulamin" className="hover:text-brand-blue transition-colors">Regulamin</Link>
              <Link to="/dmca" className="hover:text-brand-blue transition-colors">DMCA</Link>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-400 font-medium">
              © {new Date().getFullYear()} GryZaDarmo. Najlepsze gry dla dzieci online! 🎈
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">🎮</div>
              <div className="w-8 h-8 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink">⭐</div>
              <div className="w-8 h-8 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">✨</div>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}

function LoginModal({ isOpen, onClose }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { login, signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignup) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-zinc-800 font-display">
                  {isSignup ? 'Stwórz konto' : 'Witaj ponownie'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-brand-pink/10 border-2 border-brand-pink/20 rounded-2xl text-brand-pink text-sm font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 uppercase ml-2">Nazwa użytkownika</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-blue transition-all font-bold"
                        placeholder="Twoja nazwa"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase ml-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-blue transition-all font-bold"
                      placeholder="email@przyklad.pl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase ml-2">Hasło</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-blue transition-all font-bold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-blue/20 mt-4"
                >
                  {isSignup ? 'ZAREJESTRUJ SIĘ' : 'ZALOGUJ SIĘ'}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-zinc-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-zinc-400 font-bold uppercase">lub</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full py-4 bg-white border-2 border-zinc-100 text-zinc-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Kontynuuj z Google
              </button>

              <p className="mt-8 text-center text-sm font-bold text-zinc-500">
                {isSignup ? 'Masz już konto?' : 'Nie masz konta?'}
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="ml-2 text-brand-blue hover:underline"
                >
                  {isSignup ? 'Zaloguj się' : 'Zarejestruj się'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
