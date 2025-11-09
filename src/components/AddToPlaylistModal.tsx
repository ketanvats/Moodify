// src/components/AddToPlaylistModal.tsx
import React from 'react';
import type { Playlist, Song } from '../types';
import { XMarkIcon, PlusIcon, ForwardIcon, QueueListIcon } from '@heroicons/react/24/solid';

interface AddToPlaylistModalProps {
  song: Song;
  playlists: Playlist[];
  onClose: () => void;
  onAddToPlaylist: (playlistName: string, song: Song) => void;
  onCreateAndAdd: (song: Song) => void;
  onPlayNext: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ song, playlists, onClose, onAddToPlaylist, onCreateAndAdd, onPlayNext, onAddToQueue }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fadeInScale" onClick={onClose}>
      <div className="bg-black/40 border border-white/10 rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white p-6 pb-0">Add to...</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white m-4">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="px-4 pb-2 border-b border-white/10 space-y-1">
          <button
            onClick={() => onPlayNext(song)}
            className="w-full flex items-center gap-3 text-left px-3 py-2 text-gray-200 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ForwardIcon className="h-5 w-5" />
            <span>Play Next</span>
          </button>
          <button
            onClick={() => onAddToQueue(song)}
            className="w-full flex items-center gap-3 text-left px-3 py-2 text-gray-200 hover:bg-white/10 rounded-lg transition-colors"
          >
            <QueueListIcon className="h-5 w-5" />
            <span>Add to Queue</span>
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
          <div
            onClick={() => onCreateAndAdd(song)}
            className="p-3 rounded-lg hover:bg-white/10 cursor-pointer text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create New Playlist</span>
          </div>

          {playlists.length > 0 && <hr className="border-white/10 my-2" />}

          {playlists.map(playlist => (
            <div
              key={playlist.name}
              onClick={() => onAddToPlaylist(playlist.name, song)}
              className="p-3 rounded-lg hover:bg-white/10 cursor-pointer text-gray-200 transition-colors"
            >
              {playlist.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;