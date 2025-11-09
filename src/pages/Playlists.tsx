import { useOutletContext, Link } from 'react-router-dom';
import type { Playlist } from '../types';
import PlaylistCard from '../components/PlaylistCard';

interface OutletContextType {
  savedPlaylists: Playlist[];
  handleCreatePlaylist: () => void;
}

const Playlists = () => {
  const { savedPlaylists, handleCreatePlaylist } = useOutletContext<OutletContextType>();

  return (
    <div className="p-4 sm:p-0">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Playlists</h1>
        <button
          onClick={handleCreatePlaylist}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-600 transition-colors"
        >
          Create Playlist
        </button>
      </div>

      {savedPlaylists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {savedPlaylists.map((playlist) => (
            <Link to={`/playlist/${encodeURIComponent(playlist.name)}`} key={playlist.name}>
              <PlaylistCard playlist={playlist} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">You haven't created any playlists yet.</p>
      )}
    </div>
  );
};

export default Playlists;