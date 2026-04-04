/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Gamepad2, Search, X, Maximize2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import gamesData from './data/games.json';

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
  return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&h=${height}&fit=cover&output=webp&default=https%3A%2F%2Floremflickr.com%2F${width}%2F${height}%2Fgame%2C${encodeURIComponent(title)}`;
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
            {searchQuery === '' && (
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
                  <p className="text-sm text-zinc-500 font-medium">Grasz teraz w {selectedGame.title} 🎮</p>
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

function TermsOfServiceContent() {
  const navigate = useNavigate();
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
  const [searchQuery, setSearchQuery] = useState('');

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
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<GameContent />} />
        <Route path="/gry-za-darmo/:slug" element={<GameContent />} />
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
    </div>
  );
}
