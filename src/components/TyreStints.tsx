import React from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { DRIVER_DATA } from '../constants/driverData';
import { cn } from '../lib/utils';

export function TyreStints({ selectedDriver, onSelectDriver }: { selectedDriver: string | null, onSelectDriver: (d: string) => void }) {
    const rs = useKineticStore(state => state.raceState);
    const driversMap = useKineticStore(state => state.driversMap);
    
    const sortedDrivers = Object.values(driversMap)
        .filter(drv => drv.tla && drv.racingNumber !== "0" && drv.racingNumber !== undefined && drv.position && drv.position !== "0")
        .sort((a, b) => {
           const rA = parseInt(a.position || "99", 10);
           const rB = parseInt(b.position || "99", 10);
           return (a.retired || a.stopped) && !(b.retired || b.stopped) ? 1 : !(a.retired || a.stopped) && (b.retired || b.stopped) ? -1 : rA - rB;
        });

    const getDriverConfig = (num: string, tla: string) => {
        const fromData = DRIVER_DATA.find(d => d.driver_season.driver_number.toString() === num || d.driver_season.driver.code === tla);
        return fromData?.driver_season;
    };

    const tyreDataSeries = rs.TyreStintSeries || {};
    const timingAppData = rs.TimingAppData?.Lines || {};
    const timingData = rs.TimingData?.Lines || {};

    const getTyreColor = (c: string) => {
        if (!c) return { bg: 'bg-white/20', text: 'text-white' };
        if (c.includes('SOFT') || c === 'S') return { bg: 'bg-red-500', text: 'text-white', abbr: 'S' };
        if (c.includes('MEDIUM') || c === 'M') return { bg: 'bg-yellow-400', text: 'text-black', abbr: 'M' };
        if (c.includes('HARD') || c === 'H') return { bg: 'bg-white', text: 'text-black', abbr: 'H' };
        if (c.includes('INTERMEDIATE') || c === 'I') return { bg: 'bg-green-500', text: 'text-white', abbr: 'I' };
        if (c.includes('WET') || c === 'W') return { bg: 'bg-blue-600', text: 'text-white', abbr: 'W' };
        return { bg: 'bg-white/50', text: 'text-black', abbr: '?' };
    };

    return (
        <div className="flex flex-col h-full bg-[#0b0c10] overflow-hidden text-xs">
            <div className="bg-[#181a20] flex px-3 py-2 text-white/50 uppercase font-bold sticky top-0 z-10 border-b border-white/5 text-[10px]">
                 <div className="w-8 shrink-0">POS.</div>
                 <div className="w-20 shrink-0">DRIVER</div>
                 <div className="w-8 shrink-0 text-center">+/-</div>
                 <div className="w-8 shrink-0 text-center">LAPS</div>
                 <div className="w-12 shrink-0 text-center">PIT</div>
                 <div className="w-12 shrink-0 text-center">TYRE</div>
                 <div className="flex-1 min-w-0 pl-2">STINT HISTORY</div>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
               <div className="flex flex-col">
                  {sortedDrivers.map((drv) => {
                      const isSelected = selectedDriver === drv.racingNumber;
                      const config = getDriverConfig(drv.racingNumber, drv.tla);
                      const isOut = drv.stopped || drv.retired;
                      const inPit = drv.inPit;
                      const timing = timingData[drv.racingNumber] || {};
                      
                      const stints = tyreDataSeries[drv.racingNumber]?.Stints || timingAppData[drv.racingNumber]?.Stints || [];
                      const currentStint = stints.length > 0 ? stints[stints.length - 1] : null;
                      const currentTyre = currentStint ? (currentStint.Compound || currentStint.TyreCompound) : '';
                      const currentTyreAge = (currentStint?.TotalLaps) || 0; 
                      
                      const tc = getTyreColor(currentTyre);

                      // Calculate max laps for relative sizing safely avoiding NaN
                      const lapsArray = sortedDrivers.map(d => parseInt(timingData[d.racingNumber]?.NumberOfLaps || "0", 10)).filter(n => !isNaN(n));
                      const maxLaps = Math.max(1, ...lapsArray);

                      return (
                          <div 
                             key={drv.racingNumber}
                             onClick={() => onSelectDriver(drv.racingNumber)}
                             className={cn(
                                "flex items-center px-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors relative",
                                isSelected && "bg-white/10"
                             )}
                          >
                              <div className="w-8 shrink-0 font-bold text-sm">{drv.position}</div>
                              <div className="w-20 shrink-0 flex items-center gap-1.5">
                                 {config?.constructor.constructor_normalized_logo_url && (
                                     <img src={config.constructor.constructor_normalized_logo_url} className="h-3 w-auto opacity-90" alt="" />
                                 )}
                                 <span className="font-bold text-sm tracking-tight text-white truncate">{drv.tla}</span>
                              </div>
                              <div className="w-8 shrink-0 text-center text-white/40 font-mono text-[10px]">
                                 — 
                              </div>
                              <div className="w-8 shrink-0 text-center text-white/80 font-mono">
                                 {timing.NumberOfLaps || '0'}
                              </div>
                              <div className="w-12 shrink-0 flex items-center justify-center">
                                 {inPit && <span className="bg-blue-600/30 text-blue-400 border border-blue-600/50 rounded px-1.5 py-0.5 text-[9px] font-bold">IN PIT</span>}
                                 {isOut && <span className="bg-red-600/30 text-red-500 border border-red-600/50 rounded px-1.5 py-0.5 text-[9px] font-bold italic">OUT</span>}
                              </div>
                              <div className="w-12 shrink-0 flex items-center justify-center gap-1">
                                 {currentTyre && (
                                     <>
                                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]", tc.bg, tc.text)}>
                                           {tc.abbr}
                                        </div>
                                        <div className="text-[10px] font-bold text-white/50">{currentTyreAge}</div>
                                     </>
                                 )}
                              </div>
                              
                              {/* Stint History Bar */}
                              <div className="flex-1 min-w-0 pl-2 flex items-center gap-0.5 h-6">
                                 {stints.map((stint: any, idx: number) => {
                                     const compound = stint.Compound || stint.TyreCompound;
                                     const sColor = getTyreColor(compound);
                                     const laps = parseInt(stint.TotalLaps || "0", 10);
                                     if (laps <= 0) return null;
                                     const wPct = Math.max(2, (laps / maxLaps) * 100);
                                     
                                     // Optional texture for "Used" tyre. In F1 data, New="false" indicates used tyre.
                                     const isUsed = stint.New === "false" || stint.New === false;

                                     return (
                                        <div 
                                           key={idx} 
                                           className={cn("h-full rounded-[2px] flex items-center justify-between px-1.5 overflow-hidden transition-all relative", sColor.bg)}
                                           style={{ width: `${wPct}%` }}
                                        >
                                           {wPct > 10 && (
                                               <span className={cn("font-bold text-[9px] tracking-tighter truncate z-10", sColor.text)}>
                                                  {compound?.slice(0,3)}
                                               </span>
                                           )}
                                           {wPct > 15 && laps > 0 && (
                                               <span className={cn("font-bold text-[8px] opacity-80 whitespace-nowrap z-10", sColor.text)}>
                                                  {laps} laps
                                               </span>
                                           )}
                                           {isUsed && (
                                              <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#000_2px,#000_4px)] pointer-events-none"></div>
                                           )}
                                        </div>
                                     );
                                 })}
                              </div>
                          </div>
                      );
                  })}
               </div>
            </div>

        </div>
    );
}
