import React, { useEffect, useState } from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import pako from 'pako';

export function TelemetryOverlay({ selectedDriver }: { selectedDriver?: string | null; onSelectDriver?: (d: string) => void }) {
  const driverNumber = selectedDriver || '';
  const driver = useKineticStore((state) => state.driversMap[driverNumber]);

  const [liveTelemetry, setLiveTelemetry] = useState<{
    throttle: number;
    brake: number;
    rpm: number;
    speed: number;
    gear: number;
    drs: number;
  } | null>(null);

  useEffect(() => {
    if (!driverNumber) return;

    let ws: WebSocket;
    
    const connect = () => {
      ws = new WebSocket('wss://api.pitwall.me/ws');
      ws.binaryType = 'arraybuffer';
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ protocol: 'json', version: 1 }) + '\x1e');
        
        ws.send(JSON.stringify({
          type: 1,
          target: "Subscribe",
          arguments: [["CarData.z"]],
          invocationId: "1"
        }) + '\x1e');
      };
      
      ws.onmessage = (e) => {
        try {
          const raw = new Uint8Array(e.data);
          const decompressed = pako.inflate(raw, { to: 'string' });
          const frames = decompressed.split('\x1e');
          
          for (const frame of frames) {
            if (!frame) continue;
            const data = JSON.parse(frame);
            
            // Handle snapshot
            if (data.R && data.R['CarData.z']) {
               const decoded = decodeCarData(data.R['CarData.z']);
               if (decoded?.Entries && decoded.Entries[0]?.Cars && decoded.Entries[0].Cars[driverNumber]) {
                  setLiveTelemetry(mapTelemetry(decoded.Entries[0].Cars[driverNumber].Channels));
               }
            }
            
            // Handle incremental updates
            if (data.M) {
               for (const msg of data.M) {
                   if (msg.M === 'feed' && msg.A && msg.A[0] === 'CarData.z') {
                       const decoded = decodeCarData(msg.A[1]);
                       if (decoded?.Entries && decoded.Entries[0]?.Cars && decoded.Entries[0].Cars[driverNumber]) {
                          setLiveTelemetry(mapTelemetry(decoded.Entries[0].Cars[driverNumber].Channels));
                       }
                   }
               }
            }
          }
        } catch(err) {
            // ignore parsing errors
        }
      };
    };
    
    connect();
    
    return () => {
       if (ws) ws.close();
    };
  }, [driverNumber]);

  function decodeCarData(b64: string) {
     try {
       const bin = atob(b64);
       const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
       return JSON.parse(pako.inflateRaw(bytes, { to: 'string' }));
     } catch(e) {
       return null;
     }
  }

  function mapTelemetry(channels: Record<string, number>) {
      // Channel map for car telemetry: "0"=RPM, "2"=Speed, "3"=Gear, "4"=Throttle, "5"=Brake, "45"=DRS.
      return {
         rpm: channels["0"] ?? 0,
         speed: channels["2"] ?? 0,
         gear: channels["3"] ?? 0,
         throttle: channels["4"] ?? 0,
         brake: channels["5"] ?? 0,
         drs: channels["45"] ?? 0,
      };
  }

  if (!driver) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-black border border-white/20 p-4">
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 flex flex-col items-center justify-center text-center h-full">WAITING FOR TELEMETRY DATA<br/>SELECT A DRIVER FROM LEADERBOARD</p>
      </div>
    );
  }

  const t = liveTelemetry || driver.telemetry;

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
