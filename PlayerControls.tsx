// src/components/PlayerControls.tsx
import React, { useState } from 'react';
import type { Song } from '../types';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  ArrowsPointingOutIcon, // Correct icon for maximize
  ArrowsPointingInIcon, // Correct icon for minimize
  SpeakerWaveIcon, // For volume control
  QueueListIcon, // For Lyrics
  PlusIcon, // For Add to Playlist
} from '@heroicons/react/24/solid';

interface PlayerControlsProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  currentTime: number; // in seconds
  duration: number; // in seconds
  onSeek: (time: number) => void;
  playerBackgroundStyle: React.CSSProperties; // Dynamic background style
  onToggleLyrics: () => void;
  isLyricsViewOpen: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onAddToPlaylistClick: (song: Song) => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentSong || duration === 0) return;
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const width = progressBar.getBoundingClientRect().width;
    const seekTime = (clickX / width) * duration;
    onSeek(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    onVolumeChange(newVolume);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (!currentSong) {
    return null; // Don't render controls if no song is playing
  }

  return (
    <footer
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        isFullScreen ? 'inset-0 flex flex-col justify-center items-center' : 'bottom-4 left-4 right-4 flex items-center justify-between rounded-xl p-3 shadow-2xl'
      } ${Object.keys(playerBackgroundStyle).length === 0 ? 'bg-gray-800 dark:bg-gray-900' : ''}`}
      style={playerBackgroundStyle}
    >
      {/* Fullscreen Toggle Button & Volume - Positioned differently based on mode */}
      <div className={isFullScreen ? 'absolute top-4 right-4 flex items-center space-x-2' : 'w-1/3 flex justify-end items-center space-x-1'}>
        {/* Volume Control for Compact Mode */}
        {!isFullScreen && (
          <div className="flex items-center space-x-2 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full p-2 px-3">
            <SpeakerWaveIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-black/20 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
            />
          </div>
        )} 
        <div className="flex items-center bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full p-1">
        <button onClick={onToggleLyrics} className={`transition-colors p-2 rounded-full ${isLyricsViewOpen ? 'text-blue-500 dark:text-blue-400 bg-black/10 dark:bg-white/10' : 'text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10'}`}>
          <QueueListIcon className="h-6 w-6" />
        </button>
        <button onClick={toggleFullScreen} className="text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors p-2 rounded-full">
          {isFullScreen ? (
            <ArrowsPointingInIcon className="h-6 w-6" />
          ) : (
            <ArrowsPointingOutIcon className="h-6 w-6" />
          )}
        </button>
        </div>
      </div>

      {isFullScreen ? (
        // Fullscreen Layout
        <>
          {/* Album Art */}
          <div className="flex-grow flex items-center justify-center mb-8">
            <img
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              className="rounded-2xl shadow-2xl object-cover w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
            />
          </div>

          {/* Song Info */}
          <div className="text-center mb-12">
            <h3 className="text-white font-bold text-3xl md:text-4xl lg:text-5xl mb-1">
              {currentSong.title}
            </h3>
            <p className="text-gray-400 text-lg md:text-xl lg:text-2xl">
              {currentSong.artist}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-2xl mb-8">
            <div
              className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleProgressBarClick}
            >
              <div
                className="absolute h-full bg-white rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <div
                className="absolute w-4 h-4 bg-white rounded-full -mt-1 transform transition-transform group-hover:scale-110"
                style={{ left: `calc(${progressPercentage}% - 8px)` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2">
                <span className="text-white/70 text-xs">{formatTime(currentTime)}</span>
                <span className="text-white/70 text-xs">{formatTime(duration)}</span>
              </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between w-full max-w-3xl">
            <div className="flex items-center bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full p-1">
              <button onClick={() => currentSong && onAddToPlaylistClick(currentSong)} className="text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors p-2 rounded-full" title="Add to Playlist">
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full p-2">
              <button onClick={onPlayPrevious} className="text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors p-2 rounded-full">
                <BackwardIcon className="h-8 w-8" />
              </button>
              <button onClick={onTogglePlayPause} className="text-black bg-white hover:scale-105 rounded-full p-3 transition-transform shadow-lg dark:shadow-black/50">
                {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
              </button>
              <button onClick={onPlayNext} className="text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors p-2 rounded-full">
                <ForwardIcon className="h-8 w-8" />
              </button>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full p-2 px-3 w-24 sm:w-32 md:w-48">
              <SpeakerWaveIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="w-24 h-1 bg-black/20 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white" />
            </div>
          </div>
        </>
      ) : (
        // Compact Layout (original)
        <>
          {/* Song Info & Progress Bar (Left & Center) */}
          <div className="flex items-center flex-grow mr-4">
            <img
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              className="h-12 w-12 rounded-2xl object-cover shadow-md mr-3"
            />
            <div className="flex-grow">
              <div>
                <h3 className="text-white font-semibold text-sm truncate">{currentSong.title}</h3>
                <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
              </div>
              {/* Progress Bar */}
              <div className="flex items-center w-full mt-1">
                <div
                  className="relative flex-grow h-1 bg-white/20 rounded-full cursor-pointer group"
                  onClick={handleProgressBarClick}
                >
                  <div
                    className="absolute h-full bg-white rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                  <div
                    className="absolute w-2.5 h-2.5 bg-white rounded-full -mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progressPercentage}% - 5px)` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls (Right) */}
          <div className="flex items-center justify-center space-x-2 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full p-2">
            <button onClick={onPlayPrevious} className="text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors p-2 rounded-full">
              <BackwardIcon className="h-6 w-6" />
            </button>
            <button onClick={onTogglePlayPause} className="text-black bg-white hover:scale-105 rounded-full p-3 transition-transform shadow-md dark:shadow-black/50">
              {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
            </button>
            <button onClick={onPlayNext} className="text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors p-2 rounded-full">
              <ForwardIcon className="h-6 w-6" />
            </button>
          </div>
        </>
      )}
    </footer>
  );
};

export default PlayerControls;