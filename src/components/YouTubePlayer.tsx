// src/components/YouTubePlayer.tsx
import React, { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string | null;
  // Optional callbacks for player events
  onPlayerReady?: (player: any) => void;
  onPlayerStateChange?: (state: number) => void; // YT.PlayerState constants
  onPlayerError?: (event: any) => void;
  onPlayerTimeUpdate?: (currentTime: number, duration: number) => void;
  // Ref to expose player controls
  playerRefObject?: React.MutableRefObject<any | null>;
}

// Declare the YT global object for TypeScript
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined; // Make it optional
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onPlayerReady,
  onPlayerStateChange,
  onPlayerError,
  onPlayerTimeUpdate,
  playerRefObject, // Add playerRefObject to the destructured props
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any | null>(null); // Use ref to persist player instance
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    // This effect ensures the YT API is loaded and ready.
    // It sets up the global callback if not already done.
    if (window.YT && window.YT.Player) {
      // API is already loaded
      setIsApiReady(true);
    } else {
      // API is not loaded, set up the global callback
      // Ensure we don't overwrite an existing callback if another component
      // or script has already set it.
      const originalOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (originalOnReady) {
          originalOnReady(); // Call any previously defined callback
        }
        setIsApiReady(true);
      };
    }

    // Cleanup: For a global function, cleanup is tricky. For a single player, it's often fine.
    // For multiple players, a more sophisticated global state management is needed.
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // This effect handles player creation and video loading
    if (isApiReady && playerRef.current) {
      if (videoId) {
        if (!playerInstance.current) {
          // Create player if it doesn't exist
          playerInstance.current = new window.YT.Player(playerRef.current, {
            height: '0',
            width: '0',
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
            },
            events: {
              onReady: (event: any) => {
                playerInstance.current = event.target; // Store the player instance
                onPlayerReady?.(playerInstance.current);
                event.target.playVideo();
              },
              onStateChange: (event: any) => {
                onPlayerStateChange?.(event.data);
                // Start polling for time updates when playing
                if (event.data === window.YT.PlayerState.PLAYING) {
                  const interval = setInterval(() => {
                    if (playerInstance.current) {
                      onPlayerTimeUpdate?.(playerInstance.current.getCurrentTime(), playerInstance.current.getDuration());
                    }
                  }, 1000); // Update every second
                  playerInstance.current._timeUpdateInterval = interval;
                } else {
                  clearInterval(playerInstance.current?._timeUpdateInterval);
                }
              },
              onError: (event: any) => {
                onPlayerError?.(event);
                console.error('YouTube Player Error:', event.data);
              },
            },
          });
        } else {
          // Player exists, load new video if different
          if (playerInstance.current.getVideoData().video_id !== videoId) {
            clearInterval(playerInstance.current?._timeUpdateInterval); // Clear old interval
            playerInstance.current.loadVideoById(videoId);
          } else {
            // If same video, ensure it's playing
            playerInstance.current.playVideo();
          }
        }
        // Expose player instance via ref if provided
        if (playerRefObject) {
          playerRefObject.current = playerInstance.current;
        }

      } else {
        // If videoId becomes null, pause the current video
        if (playerInstance.current) {
          playerInstance.current.pauseVideo();
        }
      }
    }

    return () => {
      if (playerInstance.current) {
        clearInterval(playerInstance.current._timeUpdateInterval); // Clear interval on unmount
        playerInstance.current.destroy();
        playerInstance.current = null; // Clear ref
      }
    };
  }, [videoId, isApiReady, onPlayerReady, onPlayerStateChange, onPlayerError, onPlayerTimeUpdate]);

  return <div id="youtube-player-container" ref={playerRef}></div>;
};

export default YouTubePlayer;
