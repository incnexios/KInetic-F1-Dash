import React, { useState } from 'react';
import { Tv } from 'lucide-react';
import { cn } from '../lib/utils';

export function StreamsWidget() {
    const [quality, setQuality] = useState<'SD' | 'HD'>('SD');

    const urls = {
        SD: 'https://streamcrichd.com/update/skyf1.php',
        HD: 'https://embedsports.me/fia-f1/sky-sports-f1-sky-f1-stream-1'
    };

    return (
        <div className="flex flex-col h-full bg-black overflow-hidden relative group">
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-white/80 font-bold text-xs uppercase tracking-widest px-2 py-1 bg-black/40 rounded backdrop-blur pointer-events-none">
                    <Tv size={14} />
                    Live Broadcast
                </div>
                <div className="flex gap-1 bg-black/40 p-1 rounded backdrop-blur">
                    <button 
                        className={cn("px-3 py-1 text-[10px] font-bold rounded transition-colors", quality === 'SD' ? "bg-red-600 text-white" : "text-white/50 hover:bg-white/10")}
                        onClick={() => setQuality('SD')}
                    >
                        SD
                    </button>
                    <button 
                        className={cn("px-3 py-1 text-[10px] font-bold rounded transition-colors", quality === 'HD' ? "bg-red-600 text-white" : "text-white/50 hover:bg-white/10")}
                        onClick={() => setQuality('HD')}
                    >
                        HD
                    </button>
                </div>
            </div>
            
            <div className="flex-1 w-full h-full bg-black flex items-center justify-center">
                <iframe 
                    src={urls[quality]} 
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="encrypted-media; autoplay; fullscreen"
                />
            </div>
        </div>
    );
}
