// src/components/SpotifyPlayer.tsx
import { useState, useEffect } from 'react';

interface SpotifyPlayerProps {
  token: string;
  onPlayerStateChanged: (state: any) => void;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ token, onPlayerStateChanged }) => {
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    const setupPlayer = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Moodify Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
        volume: 0.5,
      });

      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify Player is ready with device_id', device_id);
        // You can store this device_id to play tracks on it
        localStorage.setItem('spotify_device_id', device_id);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        onPlayerStateChanged(state);
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    if (window.Spotify) {
      setupPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = setupPlayer;
    }

    return () => {
      player?.disconnect();
    };
  }, [token, onPlayerStateChanged]);

  return null; // This component does not render anything visible
};

export default SpotifyPlayer;