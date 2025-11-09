// src/types/index.ts
export interface Song {
  id: string;
  title: string;
  artist: string; // In YouTube, this is the channelTitle
  thumbnailUrl: string;
  duration: string; // e.g., "3:45"
}

export interface Playlist {
  name: string;
  songs: Song[];
}