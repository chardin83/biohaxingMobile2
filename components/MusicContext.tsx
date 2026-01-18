import { Audio } from 'expo-av';
import React, { createContext, useContext, useRef } from 'react';

const MusicContext = createContext<{ play: () => Promise<void>; stop: () => Promise<void> } | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const sound = useRef<Audio.Sound | null>(null);

  const play = async () => {
    // Om ljudet redan finns, ladda om det från början
    if (sound.current) {
      await sound.current.stopAsync();
      await sound.current.setPositionAsync(0);
      await sound.current.playAsync();
    } else {
      const { sound: playback } = await Audio.Sound.createAsync(
        require('../assets/audio/cinematic-sci-fi-trailer-music-414667.mp3'),
        { isLooping: false, volume: 0.5 }
      );
      sound.current = playback;
      await playback.playAsync();
      // När ljudet spelats klart, nollställ referensen
      playback.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.current = null;
        }
      });
    }
  };

  const stop = async () => {
    if (sound.current) {
      try {
        await sound.current.stopAsync();
      } catch (e) {}
      try {
        await sound.current.unloadAsync();
      } catch (e) {}
      sound.current = null;
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