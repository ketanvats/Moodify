// src/components/SpotifyPlaylistCard.tsx
import React from 'react';

interface SpotifyPlaylist {
  name: string;
  description: string;
  images: { url: string }[];
  external_urls: { spotify: string };
}

interface SpotifyPlaylistCardProps {
  playlist: SpotifyPlaylist;
}

const SpotifyPlaylistCard: React.FC<SpotifyPlaylistCardProps> = ({ playlist }) => {
  const imageUrl = playlist.images?.[0]?.url;

  return (
    <a href={playlist.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="group">
      {imageUrl && <img src={imageUrl} alt={playlist.name} className="w-full h-auto object-cover aspect-square rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300" />}
      <h3 className="text-gray-900 dark:text-white font-semibold text-base truncate mt-2">{playlist.name}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{playlist.description.replace(/<[^>]*>?/gm, '')}</p>
    </a>
  );
};

export default SpotifyPlaylistCard;