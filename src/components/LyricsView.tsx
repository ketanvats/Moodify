// src/components/LyricsView.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import type { Song } from '../types';
import { XMarkIcon } from '@heroicons/react/24/solid';

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
}

const LyricsView: React.FC<LyricsViewProps> = ({
  currentSong,
  lyrics,
  currentTime,
  onClose,
  playerBackgroundStyle,
  onSeek,
}) => {
  const activeLineRef = useRef<HTMLParagraphElement>(null);

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
          <p className="text-white/50 text-3xl font-semibold">Lyrics not available for this song.</p>
        )}
      </div>
    </div>
  );
};

export default LyricsView;