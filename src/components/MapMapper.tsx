import React, { useMemo, useEffect, useState } from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { motion } from 'motion/react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { GH_RAW, CIRCUIT_MAP } from '../constants/circuits';
import { LocateFixed, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';


export function MapMapper({ selectedDriver }: { selectedDriver: string | null }) {
  const driversMap = useKineticStore((state) => state.driversMap);
  const rs = useKineticStore(state => state.raceState);
  const [trackPath, setTrackPath] = useState<{x: number, y: number}[]>([]);
  const connected = useKineticStore(state => state.connected);
  
  // Fetch initial track layout from OpenF1
  useEffect(() => {
     let isMounted = true;
     const fetchTrack = async () => {
         try {
             // Fetch a completed lap to get a clean layout
             const lapRes = await fetch('https://api.openf1.org/v1/laps?session_key=latest&driver_number=1');
             if (!lapRes.ok) return;
             const lapsData = await lapRes.json();
             if (!lapsData || lapsData.length < 2) return;
             
             // Find a good complete lap
             const lap = lapsData.find((l: any) => l.lap_duration && l.lap_duration > 60) || lapsData[1];
             if (!lap || !lap.date_start || !lap.lap_duration) return;

             const startDate = new Date(lap.date_start);
             const endDate = new Date(startDate.getTime() + lap.lap_duration * 1000);

             const res = await fetch(`https://api.openf1.org/v1/location?session_key=latest&driver_number=1&date>=${startDate.toISOString()}&date<=${endDate.toISOString()}`);
             if (!res.ok) return;
             const data = await res.json();
             if (data && data.length > 0 && isMounted) {
                 const newPath: {x: number, y: number}[] = [];
                 for (let i = 0; i < data.length; i += 2) { // Less subsampling for smoother curve
                     if (data[i].x !== 0 && data[i].y !== 0) {
                         newPath.push({ x: data[i].x, y: data[i].y });
                     }
                 }
                 setTrackPath(newPath);
             }
         } catch (e) {
             console.error("Failed to load track from OpenF1:", e);
         }
     };
     fetchTrack();
     return () => { isMounted = false; };
  }, []);

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

     // Use driver positions ONLY if track path is completely missing
     if (trackPath.length < 5) {
         Object.values(driversMap).forEach(d => {
             const { x, y } = d.positionData;
             if (typeof x === 'number' && typeof y === 'number' && Math.abs(x) > 0.1 && Math.abs(y) > 0.1 && Math.abs(x) < 50000 && Math.abs(y) < 50000) { 
                 hasData = true;
                 if (x < minX) minX = x;
                 if (x > maxX) maxX = x;
                 if (y < minY) minY = y;
                 if (y > maxY) maxY = y;
             }
         });
     }
     
     if (!hasData || minX === Infinity) {
         return { minX: -5000, minY: -5000, spanX: 10000, spanY: 10000, hasData: false };
     }

     const paddingX = Math.abs(maxX - minX) * 0.05;
     const paddingY = Math.abs(maxY - minY) * 0.05;
     
     let startMinX = minX - (paddingX || 500);
     let startMinY = minY - (paddingY || 500);
     let sx = Math.abs(maxX - minX) + (paddingX || 500) * 2;
     let sy = Math.abs(maxY - minY) + (paddingY || 500) * 2;

     console.log("Calculated Bounds: ", { startMinX, startMinY, sx, sy, minX, maxX, minY, maxY, trackPoints: trackPath.length });

     return { minX: startMinX, minY: startMinY, spanX: sx || 5000, spanY: sy || 5000, hasData };
  }, [driversMap, trackPath]);

  const trackStatus = rs.TrackStatus?.Status || '1';
  let trackBorder = 'border-white/10';
  let trackBanner = '';
  let trackBg = 'bg-[#0b0c10]';
  if (trackStatus === '2') { trackBorder = 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] z-20 relative'; trackBanner = 'YELLOW FLAG'; trackBg = 'bg-yellow-950/20'; }
  else if (trackStatus === '4') { trackBorder = 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] z-20 relative'; trackBanner = 'SAFETY CAR'; trackBg = 'bg-yellow-950/20'; }
  else if (trackStatus === '5') { trackBorder = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] z-20 relative'; trackBanner = 'RED FLAG'; trackBg = 'bg-red-950/20'; }
  else if (trackStatus === '6') { trackBorder = 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] z-20 relative'; trackBanner = 'VIRTUAL SAFETY CAR'; trackBg = 'bg-yellow-950/20'; }

  return (
    <div className={`flex flex-col h-full w-full bg-[#181a20] rounded-lg overflow-hidden border ${trackBorder} transition-all duration-1000`}>
        <div className="p-2 border-b border-white/10 flex justify-between items-center bg-white/5 font-bold uppercase tracking-widest text-[#e10600] z-20 text-[11px] shrink-0">
            <span className="flex items-center gap-3">
               TRACK MAP
               {trackBanner && <span className="px-2 py-0.5 rounded bg-white/10 text-white animate-pulse">{trackBanner}</span>}
            </span>
            <div className="flex gap-2 items-center">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-white/50 text-[9px] font-mono">{connected ? 'LIVE GPS' : 'OFFLINE'}</span>
            </div>
        </div>
        <div className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 ${trackBg}`}>
            {(!hasData || trackPath.length < 100) && svgSlug && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 p-8 opacity-40 mix-blend-screen">
                     <img 
                        src={`${GH_RAW}${svgSlug}.svg`} 
                        alt="Circuit Layout" 
                        className="w-full h-full object-contain filter invert"
                     />
                 </div>
            )}
            {(!hasData || trackPath.length < 100) && (
                 <div className="absolute inset-x-0 bottom-10 flex flex-col items-center justify-center text-white/50 text-xs font-mono tracking-widest z-20 pointer-events-none">
                      <div>WAITING FOR GPS TARGETS TO BUILD TRACK</div>
                      <div className="text-[9px] mt-1 text-white/30">Sector boundaries are estimates based on timing data</div>
                 </div>
            )}
            {hasData && (
                 <TransformWrapper
                     initialScale={1}
                     minScale={0.1}
                     maxScale={15}
                     centerOnInit={true}
                     limitToBounds={false}
                     wheel={{ step: 0.1 }}
                     panning={{ velocityDisabled: true }}
                 >
                    {({ zoomIn, zoomOut, resetTransform, centerView, zoomToElement }) => (
                        <>
                            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                                <button onClick={() => { 
                                    if (selectedDriver) {
                                        const el = document.getElementById(`driver-${selectedDriver}`);
                                        if (el && zoomToElement) zoomToElement(el, 3, 300, "easeOut");
                                    } else if(centerView) {
                                        centerView(1, 300, "easeOut"); 
                                    } else {
                                        resetTransform(); 
                                    }
                                }} className="bg-black/50 hover:bg-black/80 backdrop-blur border border-white/10 text-white p-2 rounded-xl shadow-xl transition-colors" title="Focus Selected Driver">
                                    <LocateFixed size={20} />
                                </button>
                                <button onClick={() => zoomIn()} className="bg-black/50 hover:bg-black/80 backdrop-blur border border-white/10 text-white p-2 rounded-xl shadow-xl transition-colors">
                                    <ZoomIn size={20} />
                                </button>
                                <button onClick={() => zoomOut()} className="bg-black/50 hover:bg-black/80 backdrop-blur border border-white/10 text-white p-2 rounded-xl shadow-xl transition-colors">
                                    <ZoomOut size={20} />
                                </button>
                            </div>
                            <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
                                <button onClick={() => resetTransform()} className="bg-black/50 hover:bg-black/80 backdrop-blur border border-white/10 text-white p-2 rounded-xl shadow-xl transition-colors flex items-center justify-center">
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                            <TransformComponent wrapperClass="w-full h-full z-10" contentClass="w-full h-full">
                                <svg 
                                    viewBox={`${minX} ${minY} ${spanX} ${spanY}`} 
                                    className="w-full h-full opacity-90 cursor-grab active:cursor-grabbing block"
                                    style={{ transform: 'scaleY(-1)' }} // Invert Y axis as F1 telemetry uses y-up instead of SVG y-down
                                    preserveAspectRatio="meet"
                                >
                                    {/* Draw Track Path dynamically from historic points */}
                                    <defs>
                                        <pattern id="checkerboard" width="0.3" height="0.3" patternUnits="objectBoundingBox">
                                            <rect width="0.15" height="0.15" fill="#fff"/>
                                            <rect x="0.15" y="0" width="0.15" height="0.15" fill="#000"/>
                                            <rect x="0" y="0.15" width="0.15" height="0.15" fill="#000"/>
                                            <rect x="0.15" y="0.15" width="0.15" height="0.15" fill="#fff"/>
                                        </pattern>
                                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.8"/>
                                        </filter>
                                    </defs>
                                    {trackPath.length > 0 && (
                                    <g>
                                        {/* Glowing outline effect */}  
                                        <path
                                            d={`M ${trackPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                                            fill="none"
                                            stroke="rgba(255, 255, 255, 0.15)"
                                            strokeWidth={Math.max(spanX, spanY) * 0.012}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {/* Main track core */}
                                        <path
                                            d={`M ${trackPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                                            fill="none"
                                            stroke="rgba(255, 255, 255, 0.8)"
                                            strokeWidth={Math.max(spanX, spanY) * 0.005}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        
                                        {/* Finish Line approximation (Start of the lap points) */}
                                        {trackPath.length > 10 && (
                                            <g transform={`translate(${trackPath[0].x}, ${trackPath[0].y})`}>
                                                <circle cx={0} cy={0} r={Math.max(spanX, spanY) * 0.012} fill="#000" stroke="#fff" strokeWidth={Math.max(spanX, spanY) * 0.002} />
                                                <circle cx={0} cy={0} r={Math.max(spanX, spanY) * 0.012} fill="url(#checkerboard)" />
                                            </g>
                                        )}
                                    </g>
                                    )}
                    
                                    {/* Draw Cars */}
                                    {Object.values(driversMap)
                                        .filter(drv => drv.racingNumber !== "0" && !(drv.positionData.x === 0 && drv.positionData.y === 0))
                                        .sort((a, b) => {
                                            if (a.racingNumber === selectedDriver) return 1;
                                            if (b.racingNumber === selectedDriver) return -1;
                                            return 0;
                                        })
                                        .map(drv => {
                                        const isSelected = selectedDriver === drv.racingNumber;
                                        const isHidden = drv.retired;
                                        if (isHidden) return null;
                                        const isFaded = drv.inPit || drv.stopped || drv.positionData.status === 'OffTrack';
                                        
                                        const displayLabel = drv.tla || drv.racingNumber;
                                        const mSpan = Math.max(spanX, spanY);

                                        return (
                                            <motion.g 
                                                id={`driver-${drv.racingNumber}`}
                                                key={drv.racingNumber}
                                                animate={{ x: drv.positionData.x, y: drv.positionData.y }}
                                                transition={{ type: 'tween', duration: 0.1, ease: 'linear' }}
                                                style={{ opacity: isFaded ? 0.3 : 1 }}
                                            >
                                                <circle 
                                                    r={mSpan * (isSelected ? 0.025 : 0.015)} 
                                                    fill={`#${drv.teamColour || 'ffffff'}`} 
                                                    stroke={isSelected ? '#fff' : '#000'}
                                                    strokeWidth={mSpan * 0.005}
                                                    className={isSelected ? 'shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]' : ''}
                                                />
                                                <g transform={`translate(${mSpan * 0.02}, ${mSpan * -0.02}) scale(1, -1)`}>
                                                    <rect 
                                                        x={0} 
                                                        y={mSpan * -0.035} 
                                                        width={mSpan * 0.09} 
                                                        height={mSpan * 0.04} 
                                                        rx={mSpan * 0.01} 
                                                        fill="rgba(255,255,255,0.95)"
                                                        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
                                                    />
                                                    <text 
                                                        x={mSpan * 0.045} 
                                                        y={mSpan * -0.008} 
                                                        fill="#000" 
                                                        fontSize={mSpan * 0.023}
                                                        fontWeight="800"
                                                        fontFamily="Inter, sans-serif"
                                                        textAnchor="middle"
                                                    >
                                                        {displayLabel}
                                                    </text>
                                                </g>
                                                {isSelected && (
                                                <circle 
                                                    r={mSpan * 0.04}
                                                    fill="none"
                                                    stroke="#fff"
                                                    strokeWidth={mSpan * 0.003}
                                                    strokeDasharray={`${mSpan * 0.015}`}
                                                    className="animate-spin"
                                                />
                                                )}
                                                <text 
                                                    x={mSpan * 0.035}
                                                    y={mSpan * 0.015} /* Move below pill slightly */
                                                    fill="#fff"
                                                    fontSize={mSpan * 0.02}
                                                    fontWeight="bold"
                                                    fontFamily="Inter, sans-serif"
                                                    style={{ transform: 'scaleY(-1)' }} // Fix text inversion
                                                    opacity={0.8}
                                                >
                                                    {drv.racingNumber}
                                                </text>
                                            </motion.g>
                                        );
                                    })}
                                </svg>
                            </TransformComponent>
                        </>
                    )}
                 </TransformWrapper>
            )}
        </div>
    </div>
  );
}

