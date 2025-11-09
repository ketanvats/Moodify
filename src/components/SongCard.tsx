// src/components/SongCard.tsx
import React from 'react';
import type { Song } from '../types';
import { PlayIcon, ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/solid'; // A popular icon library

// Install heroicons: npm install @heroicons/react

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  onDownloadClick: (song: Song) => void;
  onAddToPlaylistClick: (song: Song) => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, onPlay, onDownloadClick, onAddToPlaylistClick }) => {
  return (
    <div className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 transition-shadow duration-300">
      {/* Thumbnail Image */}
      <img
        src={song.thumbnailUrl}
        alt={`${song.title} by ${song.artist}`}
        className="w-full h-auto object-cover aspect-square transition-transform duration-300 group-hover:scale-110"
      />

      {/* Play Button Overlay */}
      <div
        onClick={() => onPlay(song)}
        className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg">
          <PlayIcon className="h-8 w-8 text-black" />
        </div>
      </div>

      {/* Download button in the corner */}
      <div
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering play when clicking download
          onDownloadClick(song);
        }}
        className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50"
        title="Download"
      >
        <ArrowDownTrayIcon className="h-5 w-5 text-white" />
      </div>

      {/* Add to Playlist button in the corner */}
      <div
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering play
          onAddToPlaylistClick(song);
        }}
        className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50"
        title="Add to Playlist"
      >
        <PlusIcon className="h-5 w-5 text-white" />
      </div>

      {/* Song Information */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <h3 className="text-white font-semibold text-base truncate">{song.title}</h3>
        <p className="text-gray-300 text-sm truncate">{song.artist}</p>
      </div>
    </div>
  );
};

export default SongCard;
