// src/pages/Spotify.tsx
import { useState, useEffect } from 'react';
import SpotifyPlayer from '../components/SpotifyPlayer';
import { PlayIcon } from '@heroicons/react/24/solid';

interface Track {
  uri: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
}

const Spotify = () => {
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [playerState, setPlayerState] = useState<any>(null);

  useEffect(() => {
    // Fetch the token from our backend
    fetch('https://localhost:3001/api/spotify-token')
      .then(res => res.json())
      .then(data => {
        if (data.accessToken) {
          setSpotifyToken(data.accessToken);
        }
      });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !spotifyToken) return;

    const response = await fetch(`https://localhost:3001/api/spotify-search?query=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    setSearchResults(data);
  };

  const playTrack = async (trackUri: string) => {
    const deviceId = localStorage.getItem('spotify_device_id');
    if (!deviceId || !spotifyToken) {
      alert('Spotify player is not ready. Please ensure you have a premium account and the player is active.');
      return;
    }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [trackUri] }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${spotifyToken}`,
      },
    });
  };

  if (!spotifyToken) {
    return (
      <div className="p-4 sm:p-0 text-center">
        <h1 className="text-4xl font-bold mb-4">Connect to Spotify</h1>
        <p className="mb-8 text-gray-400">Log in to play music and search the Spotify library.</p>
        <a
          href="https://localhost:3001/auth/spotify"
          className="bg-green-500 text-white font-semibold py-3 px-6 rounded-full hover:bg-green-600 transition-colors text-lg"
        >
          Login with Spotify
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-0">
      <SpotifyPlayer token={spotifyToken} onPlayerStateChanged={setPlayerState} />

      <h1 className="text-4xl font-bold mb-8">Search Spotify</h1>

      <form onSubmit={handleSearch} className="flex gap-4 mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for artists or tracks..."
          className="flex-grow bg-black/20 backdrop-blur-md text-white rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 border border-white/10"
        />
        <button type="submit" className="bg-green-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-green-600 transition-colors">
          Search
        </button>
      </form>

      {/* Search Results */}
      <div className="space-y-2">
        {searchResults.map(track => (
          <div
            key={track.uri}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/50 cursor-pointer"
            onClick={() => playTrack(track.uri)}
          >
            <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt={track.name} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
            <div className="flex-grow text-left overflow-hidden">
              <p className="font-semibold truncate">{track.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{track.artists.map(artist => artist.name).join(', ')}</p>
            </div>
            <PlayIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* You can display current player state for debugging */}
      {playerState && (
        <div className="fixed bottom-28 left-4 bg-gray-800 p-4 rounded-lg text-xs text-white">
          <p>Now Playing: {playerState.track_window.current_track.name}</p>
        </div>
      )}
    </div>
  );
};

export default Spotify;