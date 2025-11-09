// src/pages/SearchResults.tsx
import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import type { Song } from './src/types';
import SongCard from './src/components/SongCard';

interface OutletContextType {
  handlePlaySong: (song: Song) => void;
  setPlaylist: (songs: Song[]) => void;
  handleDownloadClick: (song: Song) => void;
  onAddToPlaylistClick: (song: Song) => void;
}

const SearchResults = () => {
  const { query } = useParams<{ query: string }>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { handlePlaySong, setPlaylist, handleDownloadClick, onAddToPlaylistClick } = useOutletContext<OutletContextType>();

  const handlePlayFromSearch = (songToPlay: Song) => {
    // First, set the search results as the active playlist
    setPlaylist(songs);
    // Then, call the main play handler
    handlePlaySong(songToPlay);
  };

  useEffect(() => {
    if (!query) return;

    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://moodify-backend-cddtbhbbbchnhxhn.southeastasia-01.azurewebsites.net?query=${encodeURIComponent(query)}`, {
          // IMPORTANT: Include credentials (cookies) for authenticated requests
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const formattedSongs: Song[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          duration: "0:00",
        }));
        setSongs(formattedSongs);
      } catch (error) {
        console.error("Failed to search for songs:", error);
        setSongs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="p-4 sm:p-0" data-aos="fade-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Search Results for "{decodeURIComponent(query || '')}"</h1>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading search results...</p>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-6">
          {songs.map(song => (
            <SongCard key={song.id} song={song} onPlay={handlePlayFromSearch} onDownloadClick={handleDownloadClick} onAddToPlaylistClick={onAddToPlaylistClick} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No results found for "{decodeURIComponent(query || '')}".</p>
      )}
    </div>
  );
};


export default SearchResults;
