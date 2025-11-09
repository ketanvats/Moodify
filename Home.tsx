// src/pages/Home.tsx
import { useOutletContext } from 'react-router-dom';
import type { Song } from '../types';
import SongCard from '../components/SongCard';

interface OutletContextType {
  recentlyPlayed: Song[];
  displayedSongs: Song[];
  trendingRegion: string;
  setPlaylist: (songs: Song[]) => void;
  handlePlaySong: (song: Song) => void;
  handleDownloadClick: (song: Song) => void;
  handleClearRecentlyPlayed: () => void;
  onAddToPlaylistClick: (song: Song) => void;
  setTrendingRegion: (region: string) => void;
}

const regions = [
  { code: 'US', name: 'USA' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'Great Britain' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'RU', name: 'Russia' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
];

const Home: React.FC = () => {
  const {
    recentlyPlayed,
    displayedSongs,
    trendingRegion,
    setPlaylist,
    handlePlaySong,
    handleDownloadClick,
    handleClearRecentlyPlayed,
    onAddToPlaylistClick,
    setTrendingRegion,
  } = useOutletContext<OutletContextType>();

  const handlePlayFromRecents = (songToPlay: Song) => {
    // First, set the 'Recently Played' list as the active playlist
    setPlaylist(recentlyPlayed);
    // Then, call the main play handler
    handlePlaySong(songToPlay);
  };

  const handlePlayFromTrending = (songToPlay: Song) => {
    // Set the trending songs as the active playlist
    setPlaylist(displayedSongs);
    handlePlaySong(songToPlay);
  };

  return (
    <>
      {/* Combined Recently Played & Trending Section */}
      <section data-aos="fade-up" className="mb-12 p-4 sm:p-6 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10 shadow-lg shadow-black/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
          {/* Part 1: Recently Played */}
          {recentlyPlayed.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Recently Played</h2>
                <button onClick={handleClearRecentlyPlayed} className="text-sm text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Clear</button>
              </div>
              <div className="h-80 md:h-72 overflow-y-auto space-y-2 pr-2">
                {recentlyPlayed.map((song) => (
                  <div
                    key={`recent-${song.id}`}
                    onClick={() => handlePlayFromRecents(song)}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/80 cursor-pointer transition-colors"
                  >
                    <img src={song.thumbnailUrl} alt={song.title} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                    <div className="text-left overflow-hidden">
                      <p className="font-semibold truncate">{song.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{song.artist.replace(' - Topic', '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Part 2: Top Trending */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Top Trending</h2>
              <select value={trendingRegion} onChange={(e) => setTrendingRegion(e.target.value)} className="bg-black/30 backdrop-blur-xl text-white rounded-full py-1 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm border border-white/20 appearance-none">
                {regions.map(region => (
                  <option key={region.code} value={region.code}>{region.name}</option>
                ))}
              </select>
            </div>
            <div className="h-80 md:h-72 overflow-y-auto space-y-2 pr-2">
              {displayedSongs.slice(0, 10).map((song) => (
                <div key={`trending-${song.id}`} onClick={() => handlePlayFromTrending(song)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/80 cursor-pointer transition-colors">
                  <img src={song.thumbnailUrl} alt={song.title} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                  <div className="text-left overflow-hidden">
                    <p className="font-semibold truncate">{song.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{song.artist.replace(' - Topic', '')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* More to Discover Section */}
      <section data-aos="fade-up" data-aos-delay="200">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">More to Discover</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-6">
          {displayedSongs.slice(6).map((song) => (<SongCard key={`discover-${song.id}`} song={song} onPlay={handlePlaySong} onDownloadClick={handleDownloadClick} onAddToPlaylistClick={onAddToPlaylistClick} />))}
        </div>
      </section>
    </>
  );
};

export default Home;