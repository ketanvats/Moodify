// src/QueueView.tsx
import type { Song } from './types';
import { XMarkIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';

interface QueueViewProps {
  queue: Song[];
  currentSongIndex: number | null;
  onClose: () => void;
  onPlayFromQueue: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
}

const QueueView: React.FC<QueueViewProps> = ({ queue, currentSongIndex, onClose, onPlayFromQueue, onRemoveFromQueue }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end animate-fadeInScale" onClick={onClose}>
      <div className="bg-black/20 border-l border-white/10 w-full max-w-md h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Up Next</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {queue.length > 0 ? (
          <ul className="overflow-y-auto flex-grow p-4 space-y-3">
            {queue.map((song, index) => (
              <li
                key={`${song.id}-${index}`}
                className={`flex items-center gap-4 p-3 rounded-xl group transition-all duration-200 border ${index === currentSongIndex ? 'bg-white/20 border-white/30 scale-105' : 'bg-white/10 border-transparent hover:bg-white/20'}`}
              >
                <img src={song.thumbnailUrl} alt={song.title} className="h-12 w-12 rounded-md object-cover flex-shrink-0 shadow-lg shadow-black/50" />
                <div className="flex-grow text-left overflow-hidden cursor-pointer" onClick={() => onPlayFromQueue(index)}>
                  <p className={`font-semibold truncate text-white`}>{song.title}</p>
                  <p className="text-sm text-gray-300 truncate">{song.artist}</p>
                </div>
                <button
                  onClick={() => onRemoveFromQueue(index)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  title="Remove from queue"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-500 dark:text-gray-400">
            <MusicalNoteIcon className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-semibold">Queue is empty</h3>
            <p>Songs you add to the queue will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueView;