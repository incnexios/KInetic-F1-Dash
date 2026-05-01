import React, { useMemo, useEffect, useState } from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { motion } from 'motion/react';
import { GH_RAW, CIRCUIT_MAP } from '../constants/circuits';

export function MapMapper({ selectedDriver }: { selectedDriver: string | null }) {
  const driversMap = useKineticStore((state) => state.driversMap);
  const rs = useKineticStore(state => state.raceState);
  const [trackPath, setTrackPath] = useState<{x: number, y: number}[]>([]);
  const connected = useKineticStore(state => state.connected);
  
  // Accumulate points to draw the track layout
  useEffect(() => {
      const newPoints: {x: number, y: number}[] = [];
      Object.values(driversMap).forEach(d => {
         if (d.positionData.x !== 0 && d.positionData.y !== 0 && !d.inPit) {
             newPoints.push({ x: d.positionData.x, y: d.positionData.y });
         }
      });
      if (newPoints.length > 0) {
          setTrackPath(prev => {
              const next = [...prev, ...newPoints];
              if (next.length > 8000) return next.slice(next.length - 8000); // Prevent memory leak
              return next;
          });
      }
  }, [driversMap]);

  // Determine circuit SVG slug
  const svgSlug = useMemo(() => {
     const meetingName = rs.SessionInfo?.Meeting?.Name?.toLowerCase() || '';
     const location = rs.SessionInfo?.Meeting?.Location?.toLowerCase() || '';
     let found = '';
     Object.keys(CIRCUIT_MAP).forEach(k => {
         if (meetingName.includes(k) || location.includes(k)) {
             found = CIRCUIT_MAP[k];
         }
     });
     return found;
  }, [rs.SessionInfo]);

  // Calculate bounding box for the current visible cars AND the track path
  const { minX, minY, spanX, spanY, hasData } = useMemo(() => {
     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
     let hasData = false;
     
     // Include track path in bounds
     trackPath.forEach(p => {
         hasData = true;
         if (p.x < minX) minX = p.x;
         if (p.x > maxX) maxX = p.x;
         if (p.y < minY) minY = p.y;
         if (p.y > maxY) maxY = p.y;
     });

     Object.values(driversMap).forEach(d => {
         const { x, y } = d.positionData;
         if (x !== 0 && y !== 0) { 
             hasData = true;
             if (x < minX) minX = x;
             if (x > maxX) maxX = x;
             if (y < minY) minY = y;
             if (y > maxY) maxY = y;
         }
     });
     
     if (!hasData || minX === Infinity) {
         return { minX: -5000, minY: -5000, spanX: 10000, spanY: 10000, hasData: false };
     }

     const paddingX = Math.abs(maxX - minX) * 0.1;
     const paddingY = Math.abs(maxY - minY) * 0.1;
     minX -= paddingX || 2000;
     minY -= paddingY || 2000;
     maxX += paddingX || 2000;
     maxY += paddingY || 2000;
     
     let sx = Math.abs(maxX - minX);
     let sy = Math.abs(maxY - minY);
     const mSpan = Math.max(sx, sy);
     
     minX -= (mSpan - sx) / 2;
     minY -= (mSpan - sy) / 2;

     return { minX, minY, spanX: mSpan, spanY: mSpan, hasData };
  }, [driversMap, trackPath]);

  return (
    <div className="flex flex-col h-full w-full bg-[#181a20]">
        <div className="p-2 border-b border-white/10 flex justify-between items-center bg-white/5 font-bold uppercase tracking-widest text-[#e10600] z-10 text-[11px] shrink-0">
            Track Map
            <div className="flex gap-2 items-center">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-white/50 text-[9px] font-mono">{connected ? 'LIVE GPS' : 'OFFLINE'}</span>
            </div>
        </div>
        <div className="flex-1 relative overflow-hidden bg-[#0b0c10] flex items-center justify-center p-4">
            {!hasData && svgSlug && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-8">
                     <img 
                        src={`${GH_RAW}${svgSlug}.svg`} 
                        alt="Circuit Layout" 
                        className="w-full h-full object-contain opacity-20 filter invert"
                     />
                 </div>
            )}
            {!hasData && (
                 <div className="absolute inset-x-0 bottom-10 flex items-center justify-center text-white/30 text-xs font-mono tracking-widest z-20 pointer-events-none">
                      WAITING FOR GPS TARGETS TO BUILD TRACK
                 </div>
            )}
            {hasData && (
                 <svg 
                    viewBox={`${minX} ${minY} ${spanX} ${spanY}`} 
                    className="w-full h-full opacity-80"
                    style={{ transform: 'scaleY(-1)' }} // Invert Y axis as F1 telemetry uses y-up instead of SVG y-down
                 >
                     {/* Draw Track Path dynamically from historic points */}
                     {trackPath.length > 0 && (
                         <path
                             d={`M ${trackPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                             fill="none"
                             stroke="rgba(255,255,255,0.15)"
                             strokeWidth={spanX * 0.008}
                             strokeLinecap="round"
                             strokeLinejoin="round"
                         />
                     )}
     
                     {/* Draw Cars */}
                     {Object.values(driversMap).map(drv => {
                         if (drv.positionData.x === 0 && drv.positionData.y === 0) return null;
                         if (drv.inPit || drv.stopped || drv.retired) return null;
                         const isSelected = selectedDriver === drv.racingNumber;
                         return (
                             <motion.g 
                                key={drv.racingNumber}
                                animate={{ x: drv.positionData.x, y: drv.positionData.y }}
                                transition={{ type: 'tween', duration: 0.1, ease: 'linear' }}
                             >
                                <circle 
                                   r={spanX * (isSelected ? 0.025 : 0.015)} 
                                   fill={`#${drv.teamColour || 'ffffff'}`} 
                                   stroke={isSelected ? '#fff' : '#000'}
                                   strokeWidth={spanX * 0.005}
                                />
                                {isSelected && (
                                  <circle 
                                     r={spanX * 0.04}
                                     fill="none"
                                     stroke="#fff"
                                     strokeWidth={spanX * 0.003}
                                     strokeDasharray={`${spanX * 0.015}`}
                                  />
                                )}
                                <text 
                                   x={spanX * 0.025}
                                   y={Math.abs(spanY) * 0.01}
                                   fill="#fff"
                                   fontSize={spanX * 0.035}
                                   fontWeight="bold"
                                   fontFamily="Inter, sans-serif"
                                   style={{ transform: 'scaleY(-1)' }} // Fix text inversion
                                >
                                   {drv.racingNumber}
                                </text>
                             </motion.g>
                         );
                     })}
                 </svg>
            )}
        </div>
    </div>
  );
}
