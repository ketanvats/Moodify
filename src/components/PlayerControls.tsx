// src/components/PlayerControls.tsx
import React, { useState } from 'react';
import type { Song } from '../types';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ListBulletIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/solid';

// Helper to format time from seconds to M:SS
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface PlayerControlsProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  playerBackgroundStyle: React.CSSProperties;
  onToggleLyrics: () => void;
  isLyricsViewOpen: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onAddToPlaylistClick: (song: Song) => void;
  onToggleQueue: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentSong,
  isPlaying,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  currentTime,
  duration,
  onSeek,
  playerBackgroundStyle,
  onToggleLyrics,
  isLyricsViewOpen,
  volume,
  onVolumeChange,
  onAddToPlaylistClick,
  onToggleQueue,
}) => {
  if (!currentSong) {
    return null; // Don't render anything if no song is playing
  }

  const [isFullScreen, setIsFullScreen] = useState(false);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const width = progressBar.getBoundingClientRect().width;
    const seekTime = (clickX / width) * duration;
    onSeek(seekTime);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // The main container for the player. It changes its classes based on the isFullScreen state.
  const playerContainerClasses = `fixed z-50 transition-all duration-300 ease-in-out text-white ${
    isFullScreen
      ? 'inset-0 flex flex-col justify-center items-center p-4 md:p-8' // Fullscreen styles
      : 'bottom-4 left-4 right-4 flex items-center justify-between rounded-xl p-3 shadow-2xl' // Compact styles
  }`;

  return (
    <footer className={playerContainerClasses} style={playerBackgroundStyle}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xl rounded-xl"></div>

      {/* === FULLSCREEN LAYOUT === */}
      {isFullScreen ? (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          {/* Album Art */}
          <div className="flex-grow flex items-center justify-center">
            <img
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              className="rounded-2xl shadow-2xl shadow-black/60 object-cover w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 animate-float"
            />
          </div>

          {/* Song Info, Progress, and Controls */}
          <div className="w-full max-w-2xl px-4">
            {/* Song Info */}
            <div className="text-center mb-6">
              <h3 className="font-bold text-3xl md:text-4xl mb-1 truncate">{currentSong.title}</h3>
              <p className="text-gray-300 text-lg md:text-xl truncate">{currentSong.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full mb-4">
              <div className="relative h-2 bg-white/20 rounded-full cursor-pointer group" onClick={handleProgressBarClick}>
                <div className="absolute h-full bg-white rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                <div className="absolute w-4 h-4 bg-white rounded-full -mt-1 transform transition-transform group-hover:scale-110" style={{ left: `calc(${progressPercentage}% - 8px)` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button onClick={onPlayPrevious} className="text-white/80 hover:text-white transition-all active:scale-90"><BackwardIcon className="h-8 w-8" /></button>
              <button onClick={onTogglePlayPause} className="bg-white text-black rounded-full p-4 hover:scale-105 active:scale-100 transition-transform shadow-lg">
                {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
              </button>
              <button onClick={onPlayNext} className="text-white/80 hover:text-white transition-all active:scale-90"><ForwardIcon className="h-8 w-8" /></button>
            </div>
          </div>

          {/* Top-right controls & Volume in Fullscreen */}
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 group">
              <button onClick={() => onVolumeChange(volume > 0 ? 0 : 100)} className="transition-transform active:scale-90">
                {volume === 0 ? <SpeakerXMarkIcon className="h-6 w-6" /> : <SpeakerWaveIcon className="h-6 w-6" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-0 group-hover:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white transition-all duration-300"
              />
            </div>

            <button onClick={onToggleLyrics} title="Toggle Lyrics" className={`p-2 rounded-full transition-all active:scale-90 ${isLyricsViewOpen ? 'bg-white/25' : 'hover:bg-white/10'}`}><MicrophoneIcon className="h-6 w-6" /></button>
            <button onClick={toggleFullScreen} title="Exit Fullscreen" className="p-2 rounded-full hover:bg-white/10 transition-all active:scale-90"><ArrowsPointingInIcon className="h-6 w-6" /></button>
          </div>
        </div>
      ) : (
        /* === COMPACT LAYOUT === */
        <div className="relative z-10 flex items-center w-full">
          {/* Left Side: Song Info */}
          <div className="flex items-center gap-3 w-1/3 min-w-0">
            <img src={currentSong.thumbnailUrl} alt={currentSong.title} className="h-12 w-12 rounded-lg object-cover shadow-xl shadow-black/60" />
            <div className="hidden sm:block min-w-0">
              <p className="font-semibold truncate">{currentSong.title}</p>
              <p className="text-sm text-gray-300 truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex-grow flex items-center justify-center gap-4">
            <button onClick={onPlayPrevious} className="hidden sm:block text-white/80 hover:text-white transition-all active:scale-90"><BackwardIcon className="h-6 w-6" /></button>
            <button onClick={onTogglePlayPause} className="bg-white text-black rounded-full p-2.5 hover:scale-105 active:scale-100 transition-transform shadow-md">
              {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
            </button>
            <button onClick={onPlayNext} className="hidden sm:block text-white/80 hover:text-white transition-all active:scale-90"><ForwardIcon className="h-6 w-6" /></button>
          </div>

          {/* Right Side: Actions & Volume */}
          <div className="flex items-center justify-end gap-2 w-1/3">
            <button onClick={() => onAddToPlaylistClick(currentSong)} title="Add to playlist" className="hidden md:block p-2 rounded-full hover:bg-white/10 transition-all active:scale-90">
              <PlusIcon className="h-5 w-5" />
            </button>
            <button onClick={onToggleLyrics} title="Toggle Lyrics" className={`hidden md:block p-2 rounded-full transition-all active:scale-90 ${isLyricsViewOpen ? 'bg-white/25' : 'hover:bg-white/10'}`}>
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            <button onClick={onToggleQueue} title="Queue" className="hidden md:block p-2 rounded-full hover:bg-white/10 transition-all active:scale-90">
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button onClick={toggleFullScreen} title="Enter Fullscreen" className="p-2 rounded-full hover:bg-white/10 transition-all active:scale-90">
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default PlayerControls;
