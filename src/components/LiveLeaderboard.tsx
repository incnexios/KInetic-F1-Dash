import React from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { cn } from '../lib/utils';
import { DRIVER_DATA, getDriverNumberUrl } from '../constants/driverData';

export function LiveLeaderboard({ selectedDriver, onSelectDriver }: { selectedDriver: string | null, onSelectDriver: (num: string) => void }) {
  const driversMap = useKineticStore((state) => state.driversMap);
  const rs = useKineticStore((state) => state.raceState);
  
  const sortedDrivers = Object.values(driversMap)
      .filter(drv => drv.tla && drv.racingNumber && drv.racingNumber !== "0" && drv.racingNumber !== "" && drv.position && drv.position !== "0")
      .sort((a, b) => {
      let rA = parseInt(a.position || "99", 10);
      let rB = parseInt(b.position || "99", 10);
      return (a.retired || a.stopped) && !(b.retired || b.stopped) ? 1 : !(a.retired || a.stopped) && (b.retired || b.stopped) ? -1 : rA - rB;
  });

  const getDriverConfig = (num: string, tla: string) => {
    const fromData = DRIVER_DATA.find(d => d.driver_season.driver_number.toString() === num || d.driver_season.driver.code === tla);
    return fromData?.driver_season;
  };

  const renderTyre = (c: string) => {
      if (!c) return null;
      let letter = c[0].toUpperCase();
      let bgColor = 'bg-white/20 text-white';
      let outlineColor = '';
      
      if (c.includes('SOFT') || c === 'S') { bgColor = 'bg-red-500 text-white'; letter = 'S'; }
      else if (c.includes('MEDIUM') || c === 'M') { bgColor = 'bg-[#f7d627] text-black'; letter = 'M'; }
      else if (c.includes('HARD') || c === 'H') { bgColor = 'bg-white text-black'; outlineColor = 'border border-black/20'; letter = 'H'; }
      else if (c.includes('INTERMEDIATE') || c === 'I') { bgColor = 'bg-green-500 text-white'; letter = 'I'; }
      else if (c.includes('WET') || c === 'W') { bgColor = 'bg-blue-600 text-white'; letter = 'W'; }

      return <span className={cn("w-4 h-4 rounded-[3px] flex items-center justify-center text-[10px] font-bold font-mono", bgColor, outlineColor)}>{letter}</span>;
  };

  const timingData = rs.TimingData?.Lines || {};

  return (
    <div className="flex flex-col h-full w-full bg-[#15151e] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
           <div className="flex flex-col p-1 gap-0.5">
              {sortedDrivers.map(drv => {
                  const isSelected = selectedDriver === drv.racingNumber;
                  const config = getDriverConfig(drv.racingNumber, drv.tla);
                  const teamColor = config?.constructor.color_rgb ? `rgb(${config.constructor.color_rgb})` : `#${drv.teamColour || 'ffffff'}`;
                  
                  const timingAppData = rs.TimingAppData?.Lines?.[drv.racingNumber]?.Stints || [];
                  const tyreDataList = rs.TyreStintSeries?.[drv.racingNumber]?.Stints || timingAppData;
                  const currentTyre = tyreDataList.length > 0 ? (tyreDataList[tyreDataList.length - 1].Compound || tyreDataList[tyreDataList.length - 1].TyreCompound || 'U') : 'U';
                  
                  const timing = timingData[drv.racingNumber] || {};
                  
                  let gapStr = '';
                  if (drv.position === "1") {
                      gapStr = 'Interval';
                  } else {
                      if (timing.GapToLeader) {
                          gapStr = timing.GapToLeader;
                      } else if (timing.Stats && Array.isArray(timing.Stats)) {
                          for (let i = timing.Stats.length - 1; i >= 0; i--) {
                              if (timing.Stats[i] && timing.Stats[i].TimeDiffToFastest) {
                                  gapStr = timing.Stats[i].TimeDiffToFastest;
                                  break;
                              }
                          }
                      } else if (timing.IntervalToPositionAhead && timing.IntervalToPositionAhead.Value) {
                          gapStr = `+${timing.IntervalToPositionAhead.Value}`;
                      }
                  }

                  let positionBg = drv.position === "1" ? "bg-[#e10600] text-white font-bold" : "text-white font-normal";

                  return (
                      <div 
                         key={drv.racingNumber}
                         onClick={() => onSelectDriver(drv.racingNumber)}
                         className={cn(
                            "flex items-center h-8 sm:h-9 cursor-pointer transition-colors bg-[#111115] mb-[2px]",
                            isSelected ? "bg-white/10" : "hover:bg-white/5"
                         )}
                      >
                         <div className={cn("flex items-center justify-center w-8 sm:w-10 shrink-0 h-full font-mono text-sm sm:text-base", positionBg)}>
                            {drv.position}
                         </div>
                         
                         <div className="flex items-center justify-center w-8 sm:w-10 shrink-0 opacity-90 mix-blend-screen scale-110">
                            {config?.constructor.constructor_normalized_logo_url && (
                                <img src={config.constructor.constructor_normalized_logo_url} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" alt="" />
                            )}
                         </div>
                         
                         <div className="w-12 sm:w-14 flex items-center shrink-0">
                            <span className="font-bold text-sm sm:text-base lg:text-lg tracking-tighter text-white uppercase">{drv.tla}</span>
                         </div>
                         
                         <div className="flex-1 flex items-center justify-end px-2 pr-2 sm:pr-4 min-w-0">
                            <span className="font-mono text-xs sm:text-sm lg:text-base text-white font-normal tracking-tight truncate">{gapStr}</span>
                         </div>

                         <div className="w-6 sm:w-8 flex items-center justify-center shrink-0 border-l border-white/5 h-5 sm:h-6">
                            {renderTyre(currentTyre)}
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
