"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import useSound from "use-sound";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SOUND_FX = [
  { id: 'coin', name: 'Score / Coin', emoji: '🪙', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
  { id: 'airhorn', name: 'Airhorn', emoji: '📣', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_78419ebf4a.mp3' },
  { id: 'cheer', name: 'Crowd Cheer', emoji: '👏', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'powerup', name: 'Power Up', emoji: '⚡', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3' },
  { id: 'strike', name: 'Strike Out', emoji: '⚔️', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bbdec38914.mp3' },
  { id: 'bat', name: 'Big Hit', emoji: '💥', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c976939942.mp3' },
  { id: 'uhoh', name: 'Error / Out', emoji: '📉', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_5027f32997.mp3' },
  { id: 'buzzer', name: 'End Game', emoji: '🚨', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_024b4231b7.mp3' }
];

const SoundContext = createContext<{ 
  activeId: string | null; 
  setActiveId: (id: string | null) => void;
  playCount: number;
  incrementPlayCount: () => void;
} | undefined>(undefined);

/**
 * A dedicated Soundboard component for rapid-fire audio hits.
 * Features automatic interruption logic to prevent overlapping noise.
 */
export function Soundboard() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playCount, setPlayCount] = useState(0);

  return (
    <SoundContext.Provider value={{ 
      activeId, 
      setActiveId, 
      playCount, 
      incrementPlayCount: () => setPlayCount(p => p + 1) 
    }}>
      <Card className="bg-card/80 border-white/10 shadow-2xl overflow-hidden">
        <CardHeader className="py-3 border-b border-white/5 bg-white/5">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary fill-primary" /> Rapid Fire Soundboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SOUND_FX.map((fx) => (
              <SoundButton key={fx.id} fx={fx} />
            ))}
          </div>
        </CardContent>
      </Card>
    </SoundContext.Provider>
  );
}

function SoundButton({ fx }: { fx: typeof SOUND_FX[0] }) {
  const ctx = useContext(SoundContext);
  const [play, { stop }] = useSound(fx.url, {
    volume: 0.7,
    interrupt: true,
  });

  // Effect to stop this sound if another sound on the board is triggered
  useEffect(() => {
    if (ctx?.activeId !== fx.id && ctx?.playCount !== 0) {
      stop();
    }
  }, [ctx?.playCount, ctx?.activeId, fx.id, stop]);

  const handleClick = () => {
    ctx?.setActiveId(fx.id);
    ctx?.incrementPlayCount();
    play();
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="h-16 flex flex-col items-center justify-center gap-1 border-white/5 bg-black/20 hover:bg-primary/10 hover:border-primary/30 transition-all group"
    >
      <span className="text-xl group-hover:scale-110 transition-transform">{fx.emoji}</span>
      <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-primary text-center leading-tight px-1">
        {fx.name}
      </span>
    </Button>
  );
}