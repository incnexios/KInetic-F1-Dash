import React from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { AlertTriangle, CheckCircle, Info, Octagon, Zap } from 'lucide-react';

export function RaceStatusPanel() {
    const rs = useKineticStore(state => state.raceState);
    const sessionType = rs.SessionInfo?.Type || 'UNKNOWN';
    const status = rs.TrackStatus?.Status || '1'; 

    const statusMap: Record<string, { label: string, color: string }> = {
        '1': { label: 'TRACK CLEAR', color: 'text-emerald-500' },
        '2': { label: 'YELLOW FLAG', color: 'text-yellow-500' },
        '3': { label: 'Unused', color: 'text-white/50' },
        '4': { label: 'SAFETY CAR', color: 'text-orange-500' },
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
                   <div className="p-3 border-b border-white/10 flex items-center gap-2">
                     <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Race Control</p>
                   </div>
                   <div className="flex-1 p-3 flex flex-col gap-3 font-mono text-[10px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                       {rs.RaceControlMessages?.Messages?.slice().reverse().slice(0, 50).map((m: any, i: number) => {
                           const msg = m.Message?.toUpperCase() || '';
                           const isYellow = msg.includes('YELLOW') || msg.includes('SC') || msg.includes('DEBRIS');
                           const isRed = msg.includes('RED FLAG') || msg.includes('STOPPING');
                           const isGood = msg.includes('GREEN') || msg.includes('CLEAR');
                           const isDRS = msg.includes('DRS');
                           
                           let Icon = Info;
                           if (isYellow) Icon = AlertTriangle;
                           if (isRed) Icon = Octagon;
                           if (isGood) Icon = CheckCircle;
                           if (isDRS) Icon = Zap;

                           const colorCls = isRed ? 'border-red-500 text-red-500' : isYellow ? 'border-yellow-500 text-yellow-500' : (isGood ? 'border-emerald-500 text-emerald-500' : (isDRS ? 'border-purple-500 text-purple-400' : 'border-blue-500 text-blue-500'));
                           const bgCls = isRed ? 'bg-red-500/10' : isYellow ? 'bg-yellow-500/10' : (isGood ? 'bg-emerald-500/10' : (isDRS ? 'bg-purple-500/10' : 'bg-blue-500/5'));

                           return (
                             <div key={i} className={`border border-white/5 rounded p-2 ${bgCls}`}>
                                 <div className={`flex items-center gap-2 mb-1 ${colorCls.split(' ')[1]}`}>
                                     <Icon size={12} />
                                     <span className="font-bold">
                                         {m.Utc ? new Date(m.Utc).toLocaleTimeString() : ''}
                                     </span>
                                 </div>
                                 <p className="opacity-90 uppercase leading-relaxed text-white">
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
