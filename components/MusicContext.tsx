import { Audio } from 'expo-av';
import React, { createContext, useContext, useRef } from 'react';

const MusicContext = createContext<{ play: () => Promise<void>; stop: () => Promise<void> } | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const sound = useRef<Audio.Sound | null>(null);

  const play = async () => {
    if (!sound.current) {
      const { sound: playback } = await Audio.Sound.createAsync(
        require('../assets/audio/cinematic-sci-fi-trailer-music-414667.mp3'),
        { isLooping: false, volume: 0.5 } // <-- Ändra här!
      );
      sound.current = playback;
      await playback.playAsync();
    } else {
      await sound.current.playAsync();
    }
  };

  const stop = async () => {
    if (sound.current) {
      console.log('Stopping and unloading sound');
      try {
        await sound.current.stopAsync();
      } catch (e) {
        // Ignorera om redan stoppad
      }
      try {
        await sound.current.unloadAsync();
      } catch (e) {
        // Ignorera om redan unloadad
      }
      sound.current = null;
    } else {
      console.log('No sound to stop');
    }
  };

  return (
    <MusicContext.Provider value={{ play, stop }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}