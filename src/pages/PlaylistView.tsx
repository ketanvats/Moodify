// src/pages/PlaylistView.tsx
import { useParams, useOutletContext, Link } from 'react-router-dom';
import type { Playlist, Song } from '../types';
import SongCard from '../components/SongCard';

interface OutletContextType {
  savedPlaylists: Playlist[];
  setPlaylist: (songs: Song[]) => void;
  handlePlaySong: (song: Song) => void;
  handleDownloadClick: (song: Song) => void;
  onAddToPlaylistClick: (song: Song) => void;
}

const PlaylistView = () => {
  const { playlistName } = useParams<{ playlistName: string }>();
  const { savedPlaylists, setPlaylist, handlePlaySong, handleDownloadClick, onAddToPlaylistClick } = useOutletContext<OutletContextType>();

  const playlist = savedPlaylists.find(p => p.name === decodeURIComponent(playlistName || ''));

  const playlistCoverUrl = playlist?.songs[0]?.thumbnailUrl;

  const handlePlayFromPlaylist = (songToPlay: Song) => {
    if (!playlist) return;
    setPlaylist(playlist.songs);
    handlePlaySong(songToPlay);
  };

  if (!playlist) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold">Playlist Not Found</h1>
        <p className="mt-4 text-gray-500">
          The playlist you're looking for doesn't exist.
          <Link to="/playlists" className="text-blue-500 hover:underline ml-2">Go back to My Playlists</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-0" data-aos="fade-in" data-aos-duration="1000">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
        {playlistCoverUrl && (
          <img
            src={playlistCoverUrl}
            alt={`${playlist.name} cover`}
            className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl object-cover"
          />
        )}
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold">{playlist.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{playlist.songs.length} songs</p>
        </div>
      </div>

      {playlist.songs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {playlist.songs.map(song => (
            <SongCard key={song.id} song={song} onPlay={() => handlePlayFromPlaylist(song)} onDownloadClick={handleDownloadClick} onAddToPlaylistClick={onAddToPlaylistClick} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">This playlist is empty. Add some songs!</p>
      )}
    </div>
  );
};

export default PlaylistView;