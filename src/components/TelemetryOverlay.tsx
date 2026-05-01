import React from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function TelemetryOverlay({ selectedDriver }: { selectedDriver?: string | null; onSelectDriver?: (d: string) => void }) {
  const driverNumber = selectedDriver || '';
  const driver = useKineticStore((state) => state.driversMap[driverNumber]);

  if (!driver) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-black border border-white/20 p-4">
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 flex flex-col items-center justify-center text-center h-full">WAITING FOR TELEMETRY DATA<br/>SELECT A DRIVER FROM LEADERBOARD</p>
      </div>
    );
  }

  const t = driver.telemetry;

  return (
    <div className="h-full w-full bg-black border border-white/20 p-4 flex gap-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: "repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 11px)" }}></div>
      
      {/* Gear & Speed */}
      <div className="flex flex-col items-center justify-center border-r border-white/10 pr-6 relative z-10 w-1/4 shrink-0">
        <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-1">{driver.tla} GEAR</span>
        <span className="text-7xl font-black italic text-red-500 leading-none drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">{t.gear > 0 ? t.gear : (t.gear === 0 ? 'N' : 'R')}</span>
        <span className="text-2xl font-mono font-bold mt-2">{t.speed || 0} <span className="text-xs opacity-50">KM/H</span></span>
      </div>

      {/* Inputs Visualization */}
      <div className="flex-1 flex flex-col justify-center gap-4 relative z-10">
        <div className="flex items-center gap-3">
           <span className="w-16 text-[9px] uppercase font-bold tracking-widest opacity-70">Throttle</span>
           <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
             <motion.div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" animate={{ width: `${t.throttle || 0}%` }} transition={{ type: 'spring', bounce: 0 }} />
           </div>
           <span className="w-10 text-[10px] font-mono font-bold text-right text-emerald-400">{Math.round(t.throttle || 0)}%</span>
        </div>
        
        <div className="flex items-center gap-3">
           <span className="w-16 text-[9px] uppercase font-bold tracking-widest opacity-70">Brake</span>
           <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
             <motion.div className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" animate={{ width: `${t.brake || 0}%` }} transition={{ type: 'spring', bounce: 0 }} />
           </div>
           <span className="w-10 text-[10px] font-mono font-bold text-right text-red-500">{Math.round(t.brake || 0)}%</span>
        </div>
        
        <div className="flex items-center gap-3">
           <span className="w-16 text-[9px] uppercase font-bold tracking-widest opacity-70">RPM</span>
           <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
             <motion.div className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500" animate={{ width: `${Math.min(((t.rpm || 0) / 15000) * 100, 100)}%` }} transition={{ type: 'spring', bounce: 0 }} />
           </div>
           <span className="w-10 text-[10px] font-mono font-bold text-right text-white/70">{t.rpm || 0}</span>
        </div>
      </div>

      {/* DRS Status */}
      <div className="w-16 shrink-0 flex flex-col justify-center gap-2 py-2 relative z-10">
        <div className={cn(
           "font-black text-center py-1 text-xs rounded transition-colors drop-shadow-sm", 
           t.drs > 8 ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-800 border border-white/10 text-white/40"
        )}>
           DRS
        </div>
        <div className={cn(
           "font-black text-center py-1 text-xs rounded transition-colors bg-zinc-800 border border-white/10 text-white/40"
        )}>
           OT
        </div>
        <span className="text-[9px] font-bold text-center uppercase opacity-50 tracking-white mt-1">E-Boost</span>
      </div>
    </div>
  );
}
