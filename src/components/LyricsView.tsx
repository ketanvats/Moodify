// src/components/LyricsView.tsx
import React, { useMemo, useEffect, useRef, useState } from 'react';
import type { Song } from '../types';
import { XMarkIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export interface LyricLine {
  time: number;
  text: string;
}

interface LyricsViewProps {
  currentSong: Song;
  lyrics: LyricLine[];
  currentTime: number;
  onClose: () => void;
  playerBackgroundStyle: React.CSSProperties;
  onSeek: (time: number) => void;
  isSearchingLyrics: boolean;
  onManualLyricSearch: (trackName: string, artistName: string) => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({
  currentSong,
  lyrics,
  currentTime,
  onClose,
  playerBackgroundStyle,
  onSeek,
  isSearchingLyrics,
  onManualLyricSearch,
}) => {
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const [manualTrackName, setManualTrackName] = useState(currentSong.title);
  const [manualArtistName, setManualArtistName] = useState(currentSong.artist);

  // When the song changes, update the manual search fields
  useEffect(() => {
    setManualTrackName(currentSong.title);
    setManualArtistName(currentSong.artist);
  }, [currentSong]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onManualLyricSearch(manualTrackName, manualArtistName);
  };

  const activeLineIndex = useMemo(() => {
    // Find the last lyric line whose time is less than or equal to the current time
    if (!lyrics || lyrics.length === 0) return -1;

    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (lyrics[i].time <= currentTime) {
        return i;
      }
    }
    return -1; // No line is active yet (before the first lyric)
  }, [currentTime, lyrics]);

  useEffect(() => {
    // Scroll the active line into view
    activeLineRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeLineIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center backdrop-blur-xl overflow-y-auto"
      style={Object.keys(playerBackgroundStyle).length > 0 ? playerBackgroundStyle : { backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      {/* Floating Header */}
      <div className="sticky top-0 w-full text-center p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>

        <h2 className="text-3xl font-bold text-white">{currentSong.title}</h2>
        <p className="text-lg text-white/80">{currentSong.artist}</p>
      </div>

      {/* Scrollable Lyrics Content */}
      <div className="w-full max-w-2xl text-center px-8 pb-8">
        {lyrics.length > 0 ? (
          lyrics.map((line, index) => (
            <p
              key={index}
              ref={index === activeLineIndex ? activeLineRef : null}
              onClick={() => onSeek(line.time)}
              className={`py-4 text-3xl font-semibold transition-all duration-300 cursor-pointer ${
                index === activeLineIndex
                  ? 'text-white scale-105'
                  : 'text-white/50'
              }`}
            >
              {line.text}
            </p>
          ))
        ) : (
          isSearchingLyrics ? (
            <div className="flex flex-col items-center justify-center text-center text-white/70">
              <ArrowPathIcon className="h-12 w-12 animate-spin mb-4" />
              <p className="text-2xl font-semibold">Searching for lyrics...</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white/50 text-2xl font-semibold mb-8">Lyrics not available.</p>
              <p className="text-white/70 text-lg mb-4">Try searching manually:</p>
              <form onSubmit={handleManualSearch} className="space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={manualTrackName}
                  onChange={(e) => setManualTrackName(e.target.value)}
                  placeholder="Song Title"
                  className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  value={manualArtistName}
                  onChange={(e) => setManualArtistName(e.target.value)}
                  placeholder="Artist Name"
                  className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Search Lyrics
                </button>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LyricsView;
