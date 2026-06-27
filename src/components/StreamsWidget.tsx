import React, { useState } from 'react';
import { Tv } from 'lucide-react';
import { cn } from '../lib/utils';

export function StreamsWidget() {
    const [quality, setQuality] = useState<'SD' | 'HD'>('SD');

    const urls = {
        SD: 'https://www.youtube.com/live/rlJ9XyaOv0w?si=NPY3i3Ll2P35MMmH',
        HD: 'https://embedsports.me/fia-f1/sky-sports-f1-sky-f1-stream-1',
        HD1: 'https://gooz.aapmains.net/new-stream-embed/52517?ad=111',
        HD2: 'https://videocdn-4726.website/shopping2/?channel_id=sky_sport_f1_uk'
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
                                        <button 
                        className={cn("px-3 py-1 text-[10px] font-bold rounded transition-colors", quality === 'HD1' ? "bg-red-600 text-white" : "text-white/50 hover:bg-white/10")}
                        onClick={() => setQuality('HD1')}
                    >
                        HD1
                    </button>
                                        <button 
                        className={cn("px-3 py-1 text-[10px] font-bold rounded transition-colors", quality === 'HD2' ? "bg-red-600 text-white" : "text-white/50 hover:bg-white/10")}
                        onClick={() => setQuality('HD2')}
                    >
                        HD2
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
