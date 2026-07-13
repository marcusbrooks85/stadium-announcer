"use client";

import React, { useState, useRef } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SOUND_FX = [
  { id: 'powerup', name: 'DBZ AURA', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/saiyan.mp3' },
  { id: 'mariocoin', name: 'MARIO COIN', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/mario_coin_sound.mp3' },
  { id: 'wow', name: 'ANIME WOW', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3' },
  { id: 'amongus', name: 'ROLE REVEAL', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/among-us-role-reveal-sound.mp3' },
  { id: 'mariostar', name: 'MARIO STAR', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/super-mario-bros-nes-music-star-theme-cut-mp3.mp3' },
  { id: 'gokudrip', name: 'GOKU DRIP', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/drip-goku-meme-song-original-dragon-ball-super-music-clash-of-gods-in-description.mp3' },
  { id: 'badbone', name: 'BAD TO BONE', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/bad-to-the-bone-meme.mp3' },
  { id: 'airhorn', name: 'DJ AIRHORN', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/dj-airhorn-sound-effect-kingbeatz_1.mp3' },
  { id: 'vineboom', name: 'VINE BOOM', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/vine-boom-sound-effect-full.mp3' },
  { id: 'sonic', name: 'SONIC BOOM', emoji: '🔊', url: 'https://www.myinstants.com/media/sounds/sonicboom.mp3' }
];

/**
 * A high-performance Soundboard component.
 * Features a zero-overlap engine that interrupts previous tracks for rapid-fire use.
 */
export function Soundboard() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (id: string, url: string) => {
    // Interrupt logic: immediately stop any currently playing track
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
    }

    // Initialize new audio instance for the selected track
    const audio = new Audio(url);
    activeAudioRef.current = audio;
    setPlayingId(id);

    audio.play().catch((e) => {
      console.warn("Audio playback restricted or blocked by CORS:", e);
      setPlayingId(null);
    });

    // Reset playing state when the clip finishes
    audio.onended = () => {
      setPlayingId((prev) => (prev === id ? null : prev));
    };
  };

  return (
    <Card className="bg-card/80 border-white/10 shadow-2xl overflow-hidden">
      <CardHeader className="py-3 border-b border-white/5 bg-white/5">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <Zap className="h-3 w-3 text-primary fill-primary" /> Rapid Fire Soundboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {SOUND_FX.map((fx) => (
            <Button
              key={fx.id}
              variant="outline"
              onClick={() => playSound(fx.id, fx.url)}
              className={`h-20 flex flex-col items-center justify-center gap-1 border-white/5 bg-black/20 hover:bg-primary/10 hover:border-primary/30 transition-all group ${
                playingId === fx.id ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20" : ""
              }`}
            >
              <span className={`text-xl group-hover:scale-110 transition-transform ${playingId === fx.id ? "scale-110 animate-bounce" : ""}`}>
                {fx.emoji}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-primary text-center leading-tight px-1 ${
                playingId === fx.id ? "text-primary" : ""
              }`}>
                {fx.name}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}