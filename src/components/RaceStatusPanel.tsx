import React from 'react';
import { useKineticStore } from '../services/KineticEngine';

export function RaceStatusPanel() {
    const rs = useKineticStore(state => state.raceState);
    const sessionType = rs.SessionInfo?.Type || 'UNKNOWN';
    const status = rs.TrackStatus?.Status || '1'; 

    const statusMap: Record<string, { label: string, color: string }> = {
        '1': { label: 'TRACK CLEAR', color: 'text-emerald-500' },
        '2': { label: 'YELLOW FLAG', color: 'text-yellow-500' },
        '3': { label: 'Unused', color: 'text-white/50' },
        '4': { label: 'SC DEPLOYED', color: 'text-yellow-500' },
        '5': { label: 'RED FLAG', color: 'text-red-500' },
        '6': { label: 'VSC DEPLOYED', color: 'text-yellow-500' },
        '7': { label: 'VSC ENDING', color: 'text-yellow-500' },
    };

    const currentStatus = statusMap[status] || statusMap['1'];

    return (
        <div className="flex flex-col h-full bg-[#181a20]">
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Session Status</span>
            </div>
            <div className="p-4 h-full overflow-hidden flex flex-col gap-4 font-mono">
                <div>
                   <div className="text-[10px] uppercase opacity-50 mb-1">Session</div>
                   <div className="text-xl font-bold uppercase text-slate-100">{sessionType}</div>
                </div>
                <div>
                   <div className="text-[10px] uppercase opacity-50 mb-1">Track Status</div>
                   <div className={`text-2xl font-black ${currentStatus.color}`}>{currentStatus.label}</div>
                </div>
                
                <div className="flex-1 bg-black/40 border border-white/10 rounded-lg flex flex-col overflow-hidden mt-2">
                   <div className="p-3 border-b border-white/10">
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Race Control</span>
                   </div>
                   <div className="flex-1 p-3 flex flex-col gap-3 font-mono text-[10px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                       {rs.RaceControlMessages?.Messages?.slice().reverse().slice(0, 20).map((m: any, i: number) => {
                           const isWarning = m.Message?.includes('YELLOW') || m.Message?.includes('SC') || m.Message?.includes('FLAG') || m.Message?.includes('CLEAR');
                           const isGood = m.Message?.includes('GREEN') || m.Message?.includes('DRS');
                           const colorCls = isWarning ? 'border-yellow-500' : (isGood ? 'border-emerald-500' : 'border-blue-500');
                           const textCls = isWarning ? 'text-yellow-500' : (isGood ? 'text-emerald-500' : 'text-blue-500');

                           return (
                             <div key={i} className={`border-l-2 ${colorCls} pl-3 py-1`}>
                                 <span className={`${textCls} block mb-1`}>
                                     {m.Utc ? new Date(m.Utc).toLocaleTimeString() : ''}
                                 </span>
                                 <p className="opacity-80 uppercase leading-relaxed">
                                     {m.Message}
                                 </p>
                             </div>
                           );
                       })}
                       {(!rs.RaceControlMessages?.Messages || rs.RaceControlMessages.Messages.length === 0) && (
                           <span className="opacity-50">NO MESSAGES</span>
                       )}
                   </div>
                </div>
            </div>
        </div>
    )
}
