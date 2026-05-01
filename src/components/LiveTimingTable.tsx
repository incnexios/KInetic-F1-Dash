import React from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { cn } from '../lib/utils';
import { DRIVER_DATA } from '../constants/driverData';

export function LiveTimingTable({ selectedDriver, onSelectDriver }: { selectedDriver: string | null, onSelectDriver: (d: string) => void }) {
    const rs = useKineticStore(state => state.raceState);
    const sessionType = rs.SessionInfo?.Type || 'Race';

    const timingData = rs.TimingData?.Lines || {};
    const timingStats = rs.TimingStats?.Lines || {};
    const driverMap = rs.DriverList || {};

    const drivers = Object.keys(timingData).map(num => ({
        number: num,
        timing: timingData[num],
        stats: timingStats[num] || {},
        info: driverMap[num] || {}
    })).sort((a, b) => {
        const posA = Number(a.timing.Position || 999);
        const posB = Number(b.timing.Position || 999);
        return posA - posB;
    });

    if (drivers.length === 0) {
        return <div className="p-4 opacity-50 flex items-center justify-center h-full">WAITING FOR TIMING DATA</div>;
    }

    const overallBestLap = rs.TimingStats?.SessionRecord?.LapTime;
    const overallBestSectors = rs.TimingStats?.SessionRecord?.Sectors || [];

    const isPurple = (value: string | undefined, index: number = -1) => {
        if (!value || value === '-') return false;
        if (index === -1) {
             return value === overallBestLap;
        }
        return value === overallBestSectors[index]?.Value;
    };

    const getDriverConfig = (num: string, tla: string) => {
      const fromData = DRIVER_DATA.find(d => d.driver_season.driver_number.toString() === num || d.driver_season.driver.code === tla);
      return fromData?.driver_season;
    };

    return (
        <div className="flex flex-col h-full bg-[#181a20] text-[11px] font-mono">
             <div className="bg-[#24272e] flex px-3 py-2 text-white/60 uppercase font-bold sticky top-0 z-10 border-b border-white/5 shadow-md items-center text-[10px]">
                 <div className="w-6">POS</div>
                 <div className="w-4"></div>
                 <div className="w-14">DRIVER</div>
                 <div className="w-16 mx-2 text-center">TYRES</div>
                 <div className="w-12 text-center">S1</div>
                 <div className="w-12 text-center">S2</div>
                 <div className="w-12 text-center">S3</div>
                 <div className="flex-1 text-right">LAST LAP</div>
                 <div className="flex-1 text-right">BEST LAP</div>
                 <div className="w-16 text-right">GAP</div>
                 <div className="w-16 text-right">INT</div>
                 <div className="w-8 text-center ml-2">PITS</div>
             </div>
             <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                 {drivers.map(d => {
                     const isSelected = selectedDriver === d.number;
                     const isOut = d.timing.Stopped || d.timing.Retired || d.timing.InPit;
                     
                     let tyreData = rs.TyreStintSeries && rs.TyreStintSeries[d.number] && rs.TyreStintSeries[d.number].Stints;
                     
                     // Helper for drawing stints visually like the leaderboard
                     const renderStints = () => {
                         const mockStints = (tyreData && tyreData.length > 0) ? tyreData.map((t: any) => t.Compound) : ['M'];
                         return (
                             <div className="flex gap-1 w-full justify-center">
                                 {mockStints.map((c: string, idx: number) => {
                                      let tCls = 'bg-white/20';
                                      if (c.includes('SOFT') || c === 'S') tCls = 'bg-red-500';
                                      if (c.includes('MEDIUM') || c === 'M') tCls = 'bg-yellow-400';
                                      if (c.includes('HARD') || c === 'H') tCls = 'bg-blue-400';
                                      if (c.includes('INTERMEDIATE') || c === 'I') tCls = 'bg-green-500';
                                      if (c.includes('WET') || c === 'W') tCls = 'bg-blue-600';
                                      return <div key={idx} className={cn("w-3 h-1.5 rounded-sm", tCls)}></div>;
                                 })}
                             </div>
                         );
                     }

                     const config = getDriverConfig(d.number, d.info.Tla || d.info.LastName?.slice(0, 3));
                     const teamColor = config?.constructor.color_rgb ? `rgb(${config.constructor.color_rgb})` : `#${d.info.TeamColour || 'ffffff'}`;
                     
                     // Fallback check if it's overall best
                     const bestLapVal = d.timing.BestLapTime?.Value || '-';
                     const lastLapVal = d.timing.LastLapTime?.Value || '-';
                     const pbLap = d.stats?.PersonalBestLapTime?.Value;
                     
                     const isAbsoluteFastest = bestLapVal !== '-' && bestLapVal === overallBestLap;
                     const isPersonalFastest = lastLapVal !== '-' && lastLapVal === pbLap && !isAbsoluteFastest;

                     const getSectorColor = (val: string | undefined, idx: number) => {
                         if (!val || val === '-') return 'text-white/50';
                         if (isPurple(val, idx)) return 'text-fuchsia-500 font-black'; // Purple
                         // Try check if personal best sector 
                         if (d.stats?.Sectors && d.stats.Sectors[idx] && d.stats.Sectors[idx].Value === val) return 'text-emerald-400 font-bold'; // Green (PB)
                         return 'text-yellow-400 font-bold'; // Yellow (slower)
                     };

                     return (
                         <div 
                             key={d.number} 
                             onClick={() => onSelectDriver(d.number)}
                             className={`flex px-3 py-1.5 border-b border-white/5 items-center cursor-pointer hover:bg-white/5 transition-colors relative ${isSelected ? 'bg-white/10' : ''}`}
                         >
                             <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: teamColor }}></div>
                             <div className="w-6 font-bold pl-1">{d.timing.Position}</div>
                             <div className="w-4 opacity-50 text-[9px]">{d.number}</div>
                             <div className="w-14 font-sans font-bold uppercase truncate pr-2">{d.info.Tla || d.info.LastName?.slice(0, 3)}</div>
                             <div className="w-16 mx-2 flex items-center justify-center">
                                 {renderStints()}
                             </div>
                             
                             <div className={cn("w-12 text-center font-mono opacity-90", getSectorColor(d.timing.Sectors?.['0']?.Value, 0))}>{d.timing.Sectors?.['0']?.Value || ''}</div>
                             <div className={cn("w-12 text-center font-mono opacity-90", getSectorColor(d.timing.Sectors?.['1']?.Value, 1))}>{d.timing.Sectors?.['1']?.Value || ''}</div>
                             <div className={cn("w-12 text-center font-mono opacity-90", getSectorColor(d.timing.Sectors?.['2']?.Value, 2))}>{d.timing.Sectors?.['2']?.Value || ''}</div>

                             <div className={cn("flex-1 text-right", isAbsoluteFastest ? 'text-fuchsia-500 font-black' : (isPersonalFastest ? 'text-emerald-400 font-bold' : 'text-slate-200'))}>{lastLapVal}</div>
                             <div className={cn("flex-1 text-right", isAbsoluteFastest ? 'text-fuchsia-500 font-black' : 'text-slate-300 font-bold')}>{bestLapVal}</div>
                             
                             <div className="w-16 text-right opacity-70">{isOut ? <span className="text-red-500 italic">OUT</span> : d.timing.InPit ? <span className="text-blue-400 italic">PIT</span> : (d.timing.GapToLeader || '-')}</div>
                             <div className="w-16 text-right opacity-70">{isOut ? '' : (d.timing.IntervalToPositionAhead?.Value || '-')}</div>
                             <div className="w-8 text-center ml-2 opacity-50">{d.timing.NumberOfPitStops || 0}</div>
                         </div>
                     );
                 })}
             </div>
        </div>
    );
}
