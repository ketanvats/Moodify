// src/components/PlaylistCard.tsx
import React from 'react';
import type { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  // Get the first 4 song thumbnails, or use placeholders if fewer than 4
  const thumbnails = playlist.songs.slice(0, 4).map(song => song.thumbnailUrl);
  while (thumbnails.length < 4) {
    thumbnails.push(''); // Push empty strings for placeholders
  }

  return (
    <div className="group relative cursor-pointer">
      <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden aspect-square shadow-lg shadow-black/30 group-hover:shadow-2xl group-hover:shadow-black/40 transition-shadow duration-300">
        {thumbnails.map((url, index) => (
          <div key={index} className="bg-gray-200 dark:bg-gray-800">
            {url && <img src={url} alt="" className="w-full h-full object-cover" />}
          </div>
        ))}
      </div>
      <h3 className="text-gray-900 dark:text-white font-semibold text-base truncate mt-2">{playlist.name}</h3>
    </div>
  );
};

export default PlaylistCard;