import React from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { CloudRain, Wind, Thermometer, Droplets } from 'lucide-react';

export function WeatherConditions() {
    const rs = useKineticStore(state => state.raceState);
    const weather = rs.WeatherData || {};

    // Use latest weather entry if available
    const latest = weather?.Length ? weather[weather.Length - 1] : weather;

    const airTemp = latest?.AirTemp || '25.0';
    const trackTemp = latest?.TrackTemp || '32.0';
    const humidity = latest?.Humidity || '45';
    const windSpeed = latest?.WindSpeed || '2.5';
    const windDir = latest?.WindDirection || '0';
    const rainfall = latest?.Rainfall || '0';

    return (
        <div className="flex flex-col h-full bg-[#181a20] text-[11px] font-mono">
            <div className="p-2 border-b border-white/10 flex justify-between items-center bg-white/5 font-bold uppercase tracking-widest text-[#e10600]">
                Live Weather
            </div>
            <div className="flex-1 p-3 flex flex-col gap-4 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent justify-center">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2">
                        <Thermometer className="text-orange-500" size={24} />
                        <div className="text-center">
                            <div className="text-[10px] text-white/50 mb-1">AIR TEMP</div>
                            <div className="text-xl font-bold">{airTemp}°C</div>
                        </div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2">
                        <div className="flex bg-[#e10600] text-white px-2 py-0.5 rounded text-[10px] items-center justify-center font-bold">TRACK</div>
                        <div className="text-center">
                            <div className="text-[10px] text-white/50 mb-1">SURFACE TEMP</div>
                            <div className="text-xl font-bold">{trackTemp}°C</div>
                        </div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2">
                        <Droplets className="text-blue-400" size={24} />
                        <div className="text-center">
                            <div className="text-[10px] text-white/50 mb-1">HUMIDITY</div>
                            <div className="text-xl font-bold">{humidity}%</div>
                        </div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                        <Wind className="text-slate-300" size={24} style={{ transform: `rotate(${windDir}deg)` }} />
                        <div className="text-center">
                            <div className="text-[10px] text-white/50 mb-1">WIND</div>
                            <div className="text-xl font-bold">{windSpeed} <span className="text-xs">m/s</span></div>
                        </div>
                    </div>
                </div>
                {rainfall === '1' && (
                     <div className="bg-blue-500/20 border border-blue-500/50 text-blue-400 p-2 rounded flex items-center justify-center gap-2 font-bold uppercase animate-pulse">
                         <CloudRain size={16} /> Rain Detected
                     </div>
                )}
            </div>
        </div>
    );
}
