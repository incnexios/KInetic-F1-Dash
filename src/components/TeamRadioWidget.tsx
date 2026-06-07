import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { useKineticStore } from '../services/KineticEngine';
import { Volume2 } from 'lucide-react';
import { ALL_TEAMS } from '../constants/circuits';

export function TeamRadioWidget({ id }: { id: string }) {
    const radioCaptures = useKineticStore(state => state.raceState.TeamRadio?.Captures || []);
    const driversMap = useKineticStore(state => state.driversMap);
    const sessionPath = useKineticStore(state => state.raceState.SessionInfo?.Path || '2026/2026-06-07_Monaco_Grand_Prix/2026-06-06_Practice_3/');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [radioCaptures]);

    const reversedCaptures = [...radioCaptures].reverse();

    return (
        <div className="flex flex-col h-full bg-[#15151e] border border-white/5 rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40 shrink-0">
                <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-white/50" />
                    <span className="font-bold text-xs uppercase tracking-widest text-white/80">Team Radio</span>
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {reversedCaptures.length === 0 ? (
                    <div className="text-white/30 text-xs text-center mt-5 font-mono">NO RADIO MESSAGES</div>
                ) : (
                    reversedCaptures.map((cap, i) => {
                        const drv = driversMap[cap.RacingNumber];
                        const colorHash = drv?.teamColour || '808080';
                        const timeStr = cap.Utc ? new Date(cap.Utc).toLocaleTimeString([], { hour12: false }) : '';
                        
                        return (
                            <div key={i} className="flex flex-col bg-white/5 border border-white/5 rounded-sm overflow-hidden shrink-0">
                                <div className="flex items-center px-3 py-1.5 gap-3 bg-black/20" style={{ borderLeft: `3px solid #${colorHash}` }}>
                                    <span className="font-bold font-mono text-sm uppercase">{drv?.tla || cap.RacingNumber}</span>
                                    <span className="text-xs text-white/40 font-mono ml-auto">{timeStr}</span>
                                </div>
                                <div className="p-3">
                                   <audio src={`https://livetiming.formula1.com/static/${sessionPath}${sessionPath.endsWith('/') ? '' : '/'}${cap.Path}`} controls preload="metadata" className="w-full h-8 grayscale opacity-80" />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
