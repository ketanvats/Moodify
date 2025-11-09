// src/App.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_BASE_URL } from './config'; // Make sure this import is correct
import type { Song, Playlist } from './types';
import PlayerControls from './components/PlayerControls'; // Import PlayerControls
import AddToPlaylistModal from './components/AddToPlaylistModal';
import YouTubePlayer from './components/YouTubePlayer';
import LyricsView, { type LyricLine } from './components/LyricsView';
import QueueView from './QueueView';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import AOS from 'aos';
import ColorThief from 'colorthief'; 
import { SunIcon, MoonIcon, SparklesIcon, ArrowRightOnRectangleIcon, HomeIcon, InformationCircleIcon, QueueListIcon, ClockIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';

// Helper function to parse YouTube's ISO 8601 duration format
const parseDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const finalMinutes = Math.floor(totalSeconds / 60);
  const finalSeconds = totalSeconds % 60;

  return `${finalMinutes}:${finalSeconds.toString().padStart(2, '0')}`;
};

// --- Lyrics Parsing Function ---
const parseSyncedLyrics = (lrc: string): LyricLine[] => {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  const lyricLines: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();
      if (text) lyricLines.push({ time, text });
    }
  }
  return lyricLines;
};

// --- Song Title Cleanup Function ---
const getCleanSongInfo = (song: Song): { artist: string; title: string } => {
  let artist = song.artist;
  let title = song.title;

  // Remove common video suffixes
  const junkRegex = /\s*(\(Official.*Video\)|\[Official.*Video\]|\(Official Audio\)|\[Official Audio\]|\(Lyrics? Video\)|\[Lyrics? Video\]|\(Music Video\)|(HD|4K|720p|1080p))\s*$/i;
  title = title.replace(junkRegex, '').trim();

  // Try to split "Artist - Title" format
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    // A simple check to see if the split is reasonable
    if (parts.length === 2 && parts[0].length < 40 && parts[1].length < 60) {
      artist = parts[0].trim();
      title = parts[1].trim();
    }
  }
  return { artist, title };
};

function App() {
  const [displayedSongs, setDisplayedSongs] = useState<Song[]>([]); // Songs currently shown (trending or search results)
  const [playlist, setPlaylist] = useState<Song[]>([]); // The actual playlist for playback
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [playerBgColor, setPlayerBgColor] = useState<string | null>(null); // For dynamic player background
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [trendingRegion, setTrendingRegion] = useState('IN');
  const [isLyricsViewOpen, setIsLyricsViewOpen] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [playerBgPalette, setPlayerBgPalette] = useState<[number, number, number][] | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [volume, setVolume] = useState(100); // Add volume state

  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
  const [isQueueViewOpen, setIsQueueViewOpen] = useState(false);
  const currentSong = currentSongIndex !== null ? playlist[currentSongIndex] : null;

  const playerRef = useRef<any | null>(null); // Ref to access YouTube player methods
  const navigate = useNavigate();
  const params = useParams(); // Get URL params
  const { user, isAuthenticated, isLoading, login, logout, setLoading } = useAuth(); // isLoading is now managed by AuthContext

  // Initialize AOS (Animate on Scroll)
  useEffect(() => {
    AOS.init({
      duration: 700, // Animation duration
      once: true,    // Animate elements only once
    });
  }, []);

  // --- Check for active session on initial app load ---
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          login(userData); // This will update context and localStorage
        } else {
          // If session is invalid/expired on backend, log out on frontend
          logout();
        }
      } catch (error) {
        console.error("Session check failed:", error);
        logout(); // Log out on network error too
      } finally {
        setLoading(false); // Set loading to false after check completes
      }
    };

    checkUserSession();
  }, [login, logout, setLoading]); // Add logout to dependency array

  // --- Load user data from backend on login ---
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUserData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/me/data`, { credentials: 'include' });
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          const data = await response.json();
          if (data.savedPlaylists) setSavedPlaylists(data.savedPlaylists);
          if (data.recentlyPlayed) setRecentlyPlayed(data.recentlyPlayed);
          if (data.searchHistory) setSearchHistory(data.searchHistory);
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      };

      fetchUserData();
    }
  }, [isAuthenticated, user]);

  // Function to fetch trending music
  const fetchTrendingMusic = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trending-music?regionCode=${trendingRegion}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // Expects { items: [], nextPageToken: '...' }
      const formattedSongs: Song[] = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        duration: parseDuration(item.contentDetails.duration),
      }));
      setDisplayedSongs(formattedSongs);
      setNextPageToken(data.nextPageToken ?? null);
    } catch (error) {
      console.error("Failed to fetch trending songs:", error);
    }
  }, [trendingRegion]);

  // --- Auto-detect region and fetch initial data ---
  useEffect(() => {
    // On initial mount, fetch trending music for the default region.
    fetchTrendingMusic();
  }, [fetchTrendingMusic]);

  // --- Dynamic Player Background ---
  useEffect(() => {
    if (currentSong?.thumbnailUrl) {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Essential for CORS if image is from different origin
      img.src = currentSong.thumbnailUrl;

      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          // Get a palette of 3 colors for the animated gradient
          const palette = colorThief.getPalette(img, 3);
          setPlayerBgPalette(palette ?? null);

          // Get a single dominant color for the non-animated lyrics view background
          const dominantColor = colorThief.getColor(img); // [R, G, B]
          setPlayerBgColor(`rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.2)`);
        } catch (e) {
          console.error("Failed to extract color from image:", e);
          setPlayerBgPalette(null);
          setPlayerBgColor(null); // Fallback to default if color extraction fails
        }
      };
      img.onerror = () => {
        setPlayerBgPalette(null);
        setPlayerBgColor(null); // Fallback on error
      };
    } else {
      setPlayerBgPalette(null);
      setPlayerBgColor(null); // Clear background if no song
    }
  }, [currentSong?.thumbnailUrl]);

  const handleTogglePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  }, [isPlaying]);

  const handlePlayPrevious = useCallback(() => {
    if (playlist.length > 0 && currentSongIndex !== null) {
      const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
      setCurrentSongIndex(prevIndex);
      setIsPlaying(true); // Ensure it plays automatically
    }
  }, [playlist, currentSongIndex]);

  const playNextTrack = useCallback(() => {
    if (playlist.length > 0 && currentSongIndex !== null) {
      const nextIndex = (currentSongIndex + 1) % playlist.length;
      setCurrentSongIndex(nextIndex);
      setIsPlaying(true); // Ensure it plays automatically
    }
  }, [playlist, currentSongIndex]);

  // --- Media Session API for Background Playback ---
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentSong) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist,
          album: 'Moodify', // Album name isn't available, so using app name
          artwork: [
            { src: currentSong.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        });

        // Set action handlers for media keys
        navigator.mediaSession.setActionHandler('play', handleTogglePlayPause);
        navigator.mediaSession.setActionHandler('pause', handleTogglePlayPause);
        navigator.mediaSession.setActionHandler('previoustrack', handlePlayPrevious);
        navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);

      } else {
        // Clear metadata when no song is playing
        navigator.mediaSession.metadata = null;
      }
    }
  }, [currentSong, handleTogglePlayPause, handlePlayPrevious, playNextTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);
  // --- Fetch Lyrics ---
  useEffect(() => {
    if (currentSong) {
      const fetchLyrics = async () => {
        try {
          const { artist, title } = getCleanSongInfo(currentSong);
          const response = await fetch(`${API_BASE_URL}/api/lyrics?trackName=${encodeURIComponent(title)}&artistName=${encodeURIComponent(artist)}`);
          if (!response.ok) {
            setLyrics([]); // Clear lyrics if not found (404) or other error
            return;
          }
          const data = await response.json();
          if (data.syncedLyrics) {
            setLyrics(parseSyncedLyrics(data.syncedLyrics));
          } else {
            setLyrics([]);
          }
        } catch (error) {
          console.error("Failed to fetch lyrics:", error);
          setLyrics([]);
        }
      };
      fetchLyrics();
    }
  }, [currentSong]);

  // --- Search Functionality ---
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // If search is empty, just stay on the home page or show an alert
      return;
    }
    // Save search term to history
    setSearchHistory((prev: string[]) => {
      const newHistory = [searchTerm, ...prev.filter((item: string) => item.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 10); // Keep last 10
      
      // Save to backend
      fetch(`${API_BASE_URL}/api/me/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ searchHistory: newHistory }),
      });

      return newHistory;
    });

    navigate(`/search/${encodeURIComponent(searchTerm)}`);
    setIsSearchVisible(false); // Hide search bar on mobile after search
  };

  // Effect to run search when URL changes
  useEffect(() => {
    const searchQuery = params.searchTerm;
    if (!searchQuery) {
      fetchTrendingMusic(); // Fetch trending if not on a search page
    }
  }, [params.searchTerm, fetchTrendingMusic]);
  // --- AI Playlist Generation ---
  const handleGeneratePlaylist = useCallback(async () => {
    if (!searchTerm.trim()) {
      alert("Please describe a mood or activity in the search box to generate a playlist.");
      return;
    }

    setIsSearching(true); // Reuse the searching state for loading indicator
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-playlist-youtube?mood=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('Failed to generate playlist from AI');
      }
      const data = await response.json();
      const formattedSongs: Song[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        duration: "0:00",
      }));

      // Create and save the new playlist
      const newPlaylist: Playlist = { name: searchTerm, songs: formattedSongs };
      setSavedPlaylists((prev: Playlist[]) => {
        const updatedPlaylists = [newPlaylist, ...prev.filter((p: Playlist) => p.name.toLowerCase() !== newPlaylist.name.toLowerCase())];
        // Save to backend instead of localStorage
        fetch(`${API_BASE_URL}/api/me/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ savedPlaylists: updatedPlaylists }),
        });
        return updatedPlaylists;
      });
    } catch (error) {
      console.error("Failed to generate playlist:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm]);

  // --- Infinite Scroll Logic ---
  const handleFetchMore = useCallback(async () => {
    if (!nextPageToken || isFetchingMore) return;

    setIsFetchingMore(true);
    try {
      let url = '';
      if (searchTerm.trim()) {
        url = `${API_BASE_URL}/api/search-music?query=${encodeURIComponent(searchTerm)}&pageToken=${nextPageToken}`;
      } else {
        url = `${API_BASE_URL}/api/trending-music?regionCode=${trendingRegion}&pageToken=${nextPageToken}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch more songs');

      const data = await response.json();
      const newSongs: Song[] = data.items.map((item: any) => ({
        id: item.id.videoId || item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        duration: item.contentDetails ? parseDuration(item.contentDetails.duration) : "0:00",
      }));

      setDisplayedSongs((prevSongs: Song[]) => [...prevSongs, ...newSongs]);
      setNextPageToken(data.nextPageToken ?? null);
    } catch (error) {
      console.error("Failed to fetch more songs:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [nextPageToken, isFetchingMore, searchTerm, trendingRegion]);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user is near the bottom of the page
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 500) {
        handleFetchMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleFetchMore]);

  // --- Playback Functionality ---
  const handlePlaySong = (songToPlay: Song) => {
    // The calling component is responsible for setting the correct playlist first.
    // This function just finds the song in the now-current playlist.
    const newIndex = playlist.findIndex((s: Song) => s.id === songToPlay.id);

    setCurrentSongIndex(newIndex >= 0 ? newIndex : 0);
    setIsPlaying(true);
    // Update recently played list

    setRecentlyPlayed((prev: Song[]) => {
      const newRecentlyPlayed = [songToPlay, ...prev.filter((s: Song) => s.id !== songToPlay.id)].slice(0, 6); // Keep last 6
      // Save to backend
      fetch(`${API_BASE_URL}/api/me/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recentlyPlayed: newRecentlyPlayed }),
      });
      return newRecentlyPlayed;
    });

    // The YouTubePlayer will pick up the videoId from playlist[0].id
  };  

  const handleAddToQueue = (song: Song) => {
    if (playlist.length === 0 || currentSongIndex === null) {
      // If nothing is playing, just start playing this song.
      setPlaylist([song]);
      handlePlaySong(song);
    } else {
      // Add the song to the end of the queue.
      setPlaylist(prev => [...prev, song]);
    }
    setSongToAddToPlaylist(null); // Close modal if open
  };

  const handlePlayNext = (song: Song) => {
    if (playlist.length === 0 || currentSongIndex === null) {
      // If nothing is playing, just start playing this song.
      setPlaylist([song]);
      handlePlaySong(song);
    } else {
      setPlaylist(prev => {
        const newPlaylist = [...prev];
        newPlaylist.splice(currentSongIndex + 1, 0, song);
        return newPlaylist;
      });
    }
    setSongToAddToPlaylist(null); // Close modal if open
  };

  const handlePlayFromQueue = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const handleRemoveFromQueue = (indexToRemove: number) => {
    setPlaylist(prev => prev.filter((_, index) => index !== indexToRemove));
    // Adjust currentSongIndex if a song before it was removed
    if (currentSongIndex !== null && indexToRemove < currentSongIndex) {
      setCurrentSongIndex(prevIndex => prevIndex! - 1);
    } else if (currentSongIndex !== null && indexToRemove === currentSongIndex) {
      // If the current song is removed, play the next one or stop if it was the last.
      playNextTrack();
    }
  };
  const handlePlayerReady = useCallback((player: any) => {
    playerRef.current = player;
    // Initial duration might be 0, update it once player is ready
    if (player.getDuration) setDuration(player.getDuration());
  }, []);

  const handlePlayerStateChange = useCallback((state: number) => {
    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      playNextTrack(); // Auto-play next song
    }
  }, [playNextTrack]);

  const handlePlayerTimeUpdate = useCallback((time: number, totalDuration: number) => {
    setCurrentTime(time);
    if (totalDuration > 0) setDuration(totalDuration);
  }, []);

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };  

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const handleClearRecentlyPlayed = () => {
    setRecentlyPlayed([]);
    // Sync with backend
    fetch(`${API_BASE_URL}/api/me/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ recentlyPlayed: [] }),
    });
  };

  const toggleLyricsView = () => {
    setIsLyricsViewOpen(!isLyricsViewOpen);
  };

  const handleDownloadClick = (song: Song) => {
    alert(`Downloading songs directly from YouTube is against their Terms of Service.\n\nThis feature is for UI demonstration purposes only and is not functional.\n\nSong: ${song.title}`);
  };

  const handleCreatePlaylist = () => {
    const playlistName = prompt("Enter a name for your new playlist:");
    if (playlistName && playlistName.trim()) {
      // Check if playlist with the same name already exists
      if (savedPlaylists.some((p: Playlist) => p.name.toLowerCase() === playlistName.toLowerCase())) {
        alert("A playlist with this name already exists.");
        return;
      }
      const newPlaylist: Playlist = { name: playlistName.trim(), songs: [] };
      setSavedPlaylists((prev: Playlist[]) => {
        const updatedPlaylists = [newPlaylist, ...prev];
        // Save to backend
        fetch(`${API_BASE_URL}/api/me/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ savedPlaylists: updatedPlaylists }),
        });
        return updatedPlaylists;
      });
    }
  };

  const handleAddToPlaylist = (playlistName: string, song: Song) => {
    setSavedPlaylists((prev: Playlist[]) => {
      const updatedPlaylists = prev.map((p: Playlist) => p.name === playlistName ? { ...p, songs: [song, ...p.songs.filter((s: Song) => s.id !== song.id)] } : p);
      // Save to backend
      fetch(`${API_BASE_URL}/api/me/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ savedPlaylists: updatedPlaylists }),
      });
      return updatedPlaylists;
    });
    setSongToAddToPlaylist(null); // Close the modal
  };

  const handleCreateAndAddToPlaylist = (song: Song) => {
    const playlistName = prompt("Enter a name for your new playlist:");
    if (playlistName && playlistName.trim()) {
      if (savedPlaylists.some((p: Playlist) => p.name.toLowerCase() === playlistName.toLowerCase())) {
        alert("A playlist with this name already exists.");
        return;
      }
      const newPlaylist: Playlist = { name: playlistName.trim(), songs: [song] }; // Add song immediately
      setSavedPlaylists((prev: Playlist[]) => {
        const updatedPlaylists = [newPlaylist, ...prev];
        // Save to backend
        fetch(`${API_BASE_URL}/api/me/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ savedPlaylists: updatedPlaylists }),
        });
        return updatedPlaylists;
      });
      setSongToAddToPlaylist(null); // Close the modal
    }
  };

  const { theme, toggleTheme } = useTheme(); // Use theme context

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default anchor behavior
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      logout(); // Clear user from context
      // Reset local state
      setSavedPlaylists([]);
      setRecentlyPlayed([]);
      setSearchHistory([]);
      navigate('/'); // Navigate to home
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const playerBackgroundStyle = useMemo(() => { // Memoize player background style for performance
    if (!playerBgPalette || playerBgPalette.length < 2) {
      // Fallback to a single static color if no palette is available
      return playerBgColor ? { backgroundColor: playerBgColor } : {};
    }

    // Create a gradient from the palette with a higher opacity for vibrancy
    const colors = playerBgPalette.map((c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
    const gradient = `linear-gradient(60deg, ${[...colors, colors[0]].join(', ')})`;

    return {
      background: gradient,
      backgroundSize: '400% 400%',
      animation: 'fluidGradient 15s ease infinite',
    };
  }, [playerBgPalette, playerBgColor]);

  return (
    <>
      {/* Floating Header - always visible */}
      <div className="fixed top-4 left-4 sm:left-8 right-4 sm:right-8 z-40 flex justify-between items-center gap-4 bg-white/10 dark:bg-gray-700/50 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-lg">
        {/* Website Name */}
        <h1
          className="text-3xl sm:text-4xl font-serif italic font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text animate-gradient-xy [text-shadow:0_8px_15px_rgba(0,0,0,0.25)]"
        >
          Moodify
        </h1>

        {/* Right-side Controls */}
        <div className="flex items-center gap-4">
          {/* Search Icon for Mobile */}
          <button
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className="md:hidden text-gray-800 dark:text-white hover:bg-white/20 dark:hover:bg-gray-600/50 rounded-full p-2.5 transition-colors"
            title="Search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>          
          {/* Search and AI controls with history dropdown */}
          <div className={`
            ${isSearchVisible ? 'absolute top-20 left-4 right-4 flex items-center gap-2 bg-white/50 dark:bg-gray-800/80 p-3 rounded-xl shadow-lg' : 'hidden'}
            md:flex md:items-center md:gap-2 md:relative md:top-auto md:left-auto md:right-auto md:bg-transparent md:p-0 md:shadow-none
          `}>
            <input
              type="text"
              placeholder={isSearching ? "Searching..." : "Search or describe a mood..."}
              className="bg-transparent text-gray-800 dark:text-white rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48 lg:w-64 border border-gray-300 dark:border-gray-600"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)} // Delay to allow click on history item
              disabled={isSearching}
            />
            {isSearchFocused && searchHistory.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
                <ul className="max-h-60 overflow-y-auto">
                  {searchHistory.map((item: string, index: number) => (
                    <li
                      key={index}
                      className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onMouseDown={() => { // Use onMouseDown to fire before onBlur
                        setSearchTerm(item);
                        navigate(`/search/${encodeURIComponent(item)}`);
                      }}
                    >{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={handleSearch}
              className="text-gray-800 dark:text-white hover:bg-white/20 dark:hover:bg-gray-600/50 rounded-full p-2.5 transition-colors disabled:opacity-50"
              disabled={isSearching}
              title="Search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
            <button
              onClick={handleGeneratePlaylist}
              className="text-gray-800 dark:text-white bg-gradient-to-r from-purple-400 to-blue-500 hover:from-purple-500 hover:to-blue-600 rounded-full p-2.5 transition-all disabled:opacity-50"
              disabled={isSearching}
              title="Generate Playlist with AI"
            >
              <SparklesIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-gray-800 dark:text-white hover:bg-white/20 dark:hover:bg-gray-600/50 rounded-full p-2.5 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {/* Hamburger Menu Icon for Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-800 dark:text-white hover:bg-white/20 dark:hover:bg-gray-600/50 rounded-full p-2.5 transition-colors"
            title="Menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Desktop Auth Controls (Menu with Dropdown) */}
          <div className="hidden md:flex items-center gap-6 relative">
          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                <>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)}>
                    <img src={user.profilePic!} alt={user.name} className="h-10 w-10 rounded-full" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-black/30 dark:bg-black/50 backdrop-blur-xl rounded-2xl shadow-lg py-2 border border-white/10 top-full">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-sm text-gray-300">{user.email}</p>
                      </div>
                      <Link to="/" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10">
                        <HomeIcon className="h-5 w-5" /> Home
                      </Link>
                      <Link to="/playlists" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10">
                        <QueueListIcon className="h-5 w-5" /> My Playlists
                      </Link>
                      <Link to="/history" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10">
                        <ClockIcon className="h-5 w-5" /> History
                      </Link>
                      <Link to="/about" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10">
                        <InformationCircleIcon className="h-5 w-5" />
                        About
                      </Link>
                      <a href="#" onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-400 hover:bg-white/10">
                        <ArrowRightOnRectangleIcon className="h-5 w-5" /> 
                        Logout
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="text-gray-800 dark:text-white hover:bg-white/20 dark:hover:bg-gray-600/50 rounded-full p-2.5 transition-colors"
                    title="Menu"
                  >
                    <Bars3Icon className="h-5 w-5" />
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-black/30 dark:bg-black/50 backdrop-blur-xl rounded-2xl shadow-lg py-2 border border-white/10 top-full">
                       <Link to="/playlists" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10">
                        <QueueListIcon className="h-5 w-5" /> My Playlists
                      </Link>
                      <Link to="/history" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10">
                        <ClockIcon className="h-5 w-5" /> History
                      </Link>
                       <Link to="/about" className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10">
                        <InformationCircleIcon className="h-5 w-5" />
                        About
                      </Link>
                      <div className="px-4 py-2 border-t border-white/10 mt-2">
                        <a href={`${API_BASE_URL}/auth/google`} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-600 transition-colors w-full block text-center">
                          Login
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Popup */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-0 left-0 w-full h-full bg-black/70 backdrop-blur-md z-50 flex justify-end">
          <div className="bg-white dark:bg-gray-800 w-64 h-full shadow-lg p-4 flex flex-col">
            <>
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-2">
                <XMarkIcon className="h-6 w-6" />
              </button>
              <div className="mt-4 flex-grow">
                {!isLoading && (
                  <>
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 mb-4">
                        <img src={user.profilePic!} alt={user.name} className="h-12 w-12 rounded-full mb-2" />
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <HomeIcon className="h-5 w-5" /> Home
                      </Link>
                      <Link to="/playlists" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <QueueListIcon className="h-5 w-5" /> My Playlists
                      </Link>
                      <Link to="/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <ClockIcon className="h-5 w-5" /> History
                      </Link>
                      <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <InformationCircleIcon className="h-5 w-5" /> About
                      </Link>
                      <a href={`${API_BASE_URL}/auth/logout`} onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md mt-4">
                        <ArrowRightOnRectangleIcon className="h-5 w-5" /> Logout
                      </a>
                    </>
                  ) : (
                    <>
                      <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <InformationCircleIcon className="h-5 w-5" /> About
                      </Link>
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 mt-4">
                        <a href={`${API_BASE_URL}/auth/google`} onClick={() => setIsMobileMenuOpen(false)} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-600 transition-colors block text-center">
                          Login
                        </a>
                      </div>
                    </>
                  )}
                  </>
                )}
              </div>
            </>
          </div>
        </div>
      )}
      <main className="min-h-screen p-4 sm:p-8 pb-28 pt-32 sm:pt-28 text-gray-900 dark:text-white">
        <Outlet context={{ savedPlaylists, recentlyPlayed, displayedSongs, trendingRegion, handlePlaySong, handleDownloadClick, handleClearRecentlyPlayed, onAddToPlaylistClick: setSongToAddToPlaylist, setTrendingRegion, handleCreatePlaylist, setPlaylist }} />
      </main>

      {/* Render the YouTube player when a song is selected */}
      <YouTubePlayer
        videoId={currentSong?.id || null}
        onPlayerReady={handlePlayerReady}
        onPlayerStateChange={handlePlayerStateChange}
        onPlayerTimeUpdate={handlePlayerTimeUpdate}
        playerRefObject={playerRef} // Pass the ref to the player
      />

      {/* Music Player Controls */}
      <PlayerControls
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlayPause={handleTogglePlayPause}
        onPlayNext={playNextTrack}
        onPlayPrevious={handlePlayPrevious}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        playerBackgroundStyle={playerBackgroundStyle}
        onToggleLyrics={toggleLyricsView}
        isLyricsViewOpen={isLyricsViewOpen}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onToggleQueue={() => setIsQueueViewOpen(!isQueueViewOpen)}
        onAddToPlaylistClick={setSongToAddToPlaylist}
      />

      {/* Lyrics View Overlay */}
      {isLyricsViewOpen && currentSong && (
        <LyricsView
          currentSong={currentSong}
          lyrics={lyrics}
          currentTime={currentTime}
          onClose={toggleLyricsView}
          playerBackgroundStyle={playerBackgroundStyle}
          onSeek={handleSeek}
        />
      )}

      {/* Queue View Overlay */}
      {isQueueViewOpen && (
        <QueueView
          queue={playlist}
          currentSongIndex={currentSongIndex}
          onClose={() => setIsQueueViewOpen(false)}
          onPlayFromQueue={handlePlayFromQueue}
          onRemoveFromQueue={handleRemoveFromQueue}
        />
      )}
      {/* Add to Playlist Modal */}
      {songToAddToPlaylist && (
        <AddToPlaylistModal
          song={songToAddToPlaylist!}
          playlists={savedPlaylists}
          onClose={() => setSongToAddToPlaylist(null)}
          onAddToPlaylist={handleAddToPlaylist}
          onCreateAndAdd={handleCreateAndAddToPlaylist}
          onAddToQueue={handleAddToQueue}
          onPlayNext={handlePlayNext}
        />
      )}
    </>
  );
}

export default App;
