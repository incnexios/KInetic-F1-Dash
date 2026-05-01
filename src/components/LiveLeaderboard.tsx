import React from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { cn } from '../lib/utils';
import { DRIVER_DATA } from '../constants/driverData';

export function LiveLeaderboard({ selectedDriver, onSelectDriver }: { selectedDriver: string | null, onSelectDriver: (num: string) => void }) {
  const driversMap = useKineticStore((state) => state.driversMap);
  const rs = useKineticStore((state) => state.raceState);
  
  const sortedDrivers = Object.values(driversMap).sort((a, b) => {
      let rA = parseInt(a.position || "99", 10);
      let rB = parseInt(b.position || "99", 10);
      return (a.retired || a.stopped) && !(b.retired || b.stopped) ? 1 : !(a.retired || a.stopped) && (b.retired || b.stopped) ? -1 : rA - rB;
  });

  const getDriverConfig = (num: string, tla: string) => {
    const fromData = DRIVER_DATA.find(d => d.driver_season.driver_number.toString() === num || d.driver_season.driver.code === tla);
    return fromData?.driver_season;
  };

  const getTyreColor = (c: string) => {
      if (!c) return 'bg-white/20';
      if (c.includes('SOFT') || c === 'S') return 'bg-red-500';
      if (c.includes('MEDIUM') || c === 'M') return 'bg-yellow-400';
      if (c.includes('HARD') || c === 'H') return 'bg-blue-400';
      if (c.includes('INTERMEDIATE') || c === 'I') return 'bg-green-500';
      if (c.includes('WET') || c === 'W') return 'bg-blue-600';
      return 'bg-white/50';
  };

  const timingData = rs.TimingData?.Lines || {};
  const timingStats = rs.TimingStats?.Lines || {};
  const overallBestLap = rs.TimingStats?.SessionRecord?.LapTime;
  const overallBestSectors = rs.TimingStats?.SessionRecord?.Sectors || [];

  const isPurple = (value: string | undefined, index: number = -1) => {
      if (!value || value === '-') return false;
      if (index === -1) {
           return value === overallBestLap;
      }
      return value === overallBestSectors[index]?.Value;
  };

  const getSectorColor = (val: string | undefined, idx: number, stats: any) => {
      if (!val || val === '-') return 'text-white/50 bg-white/5';
      if (isPurple(val, idx)) return 'text-white bg-purple-500 border-purple-500';
      if (stats?.Sectors && stats.Sectors[idx] && stats.Sectors[idx].Value === val) return 'text-white bg-emerald-500 border-emerald-500';
      return 'text-white bg-yellow-500 border-yellow-500';
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#181a20] overflow-hidden">
      <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest opacity-70">Leaderboard</span>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
           <div className="flex flex-col">
              {sortedDrivers.map(drv => {
                  const isSelected = selectedDriver === drv.racingNumber;
                  const config = getDriverConfig(drv.racingNumber, drv.tla);
                  const teamColor = config?.constructor.color_rgb ? `rgb(${config.constructor.color_rgb})` : `#${drv.teamColour || 'ffffff'}`;
                  
                  const tyreDataList = rs.TyreStintSeries?.[drv.racingNumber]?.Stints || [];
                  const mockStints = tyreDataList.length > 0 ? tyreDataList.map((t: any) => t.Compound) : ['M'];
                  
                  const timing = timingData[drv.racingNumber] || {};
                  const stats = timingStats[drv.racingNumber] || {};
                  
                  const bestLapVal = timing.BestLapTime?.Value || '-';
                  const lastLapVal = timing.LastLapTime?.Value || '-';
                  const pbLap = stats?.PersonalBestLapTime?.Value;
                  
                  const isAbsoluteFastest = bestLapVal !== '-' && bestLapVal === overallBestLap;
                  const isPersonalFastest = lastLapVal !== '-' && lastLapVal === pbLap && !isAbsoluteFastest;
                  
                  const s1 = timing.Sectors?.['0']?.Value || '';
                  const s2 = timing.Sectors?.['1']?.Value || '';
                  const s3 = timing.Sectors?.['2']?.Value || '';

                  return (
                      <div 
                         key={drv.racingNumber}
                         onClick={() => onSelectDriver(drv.racingNumber)}
                         className={cn(
                            "flex items-stretch border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 flex-col",
                            isSelected && "bg-white/10"
                         )}
                      >
                         {/* Top Row: Info */}
                         <div className="flex items-center">
                             <div className="flex flex-col items-center justify-center w-8 shrink-0">
                                <span className="font-bold text-base leading-none">{drv.position}</span>
                             </div>
                             
                             <div className="flex shrink-0 items-center justify-center py-1">
                                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: teamColor }}></div>
                             </div>
                             
                             <div className="flex-1 min-w-0 flex flex-col justify-center py-1 pl-2 pr-2">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      {config?.constructor.constructor_normalized_logo_url && (
                                          <img src={config.constructor.constructor_normalized_logo_url} className="h-3 w-auto opacity-80" alt="" />
                                      )}
                                      <span className="font-bold text-base tracking-tight uppercase text-white truncate">{drv.tla}</span>
                                   </div>
                                   <div className="flex gap-0.5 shrink-0 ml-2">
                                       {mockStints.map((stint: string, i: number) => (
                                           <div key={i} className={cn("w-2.5 h-1.5 rounded-[1px]", getTyreColor(stint))}></div>
                                       ))}
                                   </div>
                                </div>
                             </div>
                         </div>
                         
                         {/* Bottom Row: Detailed Times */}
                         <div className="flex text-[9px] font-mono justify-between px-2 pb-1.5 pt-0.5 bg-black/10">
                            {/* Sectors */}
                            <div className="flex gap-1 items-center">
                               {s1 && <span className={cn("px-1 min-w-[20px] text-center rounded-[2px] border border-transparent", getSectorColor(s1, 0, stats))}>{s1.replace(/\\..*/, '')}</span>}
                               {s2 && <span className={cn("px-1 min-w-[20px] text-center rounded-[2px] border border-transparent", getSectorColor(s2, 1, stats))}>{s2.replace(/\\..*/, '')}</span>}
                               {s3 && <span className={cn("px-1 min-w-[20px] text-center rounded-[2px] border border-transparent", getSectorColor(s3, 2, stats))}>{s3.replace(/\\..*/, '')}</span>}
                            </div>
                            
                            {/* Times */}
                            <div className="flex items-center gap-2 text-right">
                               <div className="flex flex-col">
                                  <span className={cn(
                                     "font-bold leading-tight",
                                     isAbsoluteFastest ? 'text-purple-400' : (isPersonalFastest ? 'text-emerald-400' : 'text-slate-300')
                                  )}>
                                     {lastLapVal}
                                  </span>
                                  <span className="text-[8px] opacity-50 shrink-0 leading-[8px]">{timing.GapToLeader || 'LEADER'}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                  );
              })}
              {sortedDrivers.length === 0 && (
                  <div className="text-xs font-mono opacity-50 text-center py-10">WAITING FOR TIMING DATA</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
