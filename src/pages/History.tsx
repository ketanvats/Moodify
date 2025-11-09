import { useState, useEffect } from 'react';
import type { Song } from '../types';
import { Link } from 'react-router-dom';

const History = () => {
  const [history, setHistory] = useState<Song[]>([]);

  useEffect(() => {
    const savedSongs = localStorage.getItem('recentlyPlayed');
    if (savedSongs) {
      setHistory(JSON.parse(savedSongs));
    }
  }, []);

  return (
    <div className="p-4 sm:p-0">
      <h1 className="text-4xl font-bold mb-8">Listening History</h1>
      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map(song => (
            <div key={song.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/50">
              <img src={song.thumbnailUrl} alt={song.title} className="h-12 w-12 rounded-md object-cover" />
              <div>
                <p className="font-semibold">{song.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Your listening history is empty. <Link to="/" className="text-blue-500 hover:underline">Go discover some music!</Link></p>
      )}
    </div>
  );
};

export default History;