import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKineticStore } from '../services/KineticEngine';

export function CustomChart({ selectedDriver }: { selectedDriver: string | null }) {
    const rs = useKineticStore(state => state.raceState);
    const sessionHistory = rs.SessionData?.StatusSeries || [];
    
    // As we may not have historical lap data ready without heavy API caching, 
    // we'll mock a simple trend based on current session progression if no history is provided,
    // or use actual if we have it in state.
    
    // For now, let's create a placeholder structure that would read from lap times.
    const data = useMemo(() => {
        // This is a placeholder for real historical lap time array
        // We'll generate some dummy data for the selected driver to show the chart component works
        if (!selectedDriver) return [];
        
        const mockData = [];
        let baseTime = 90; // seconds
        for (let i = 1; i <= 20; i++) {
            mockData.push({
                lap: i,
                time: baseTime + Math.random() * 2 - 1,
                tyreAge: i % 15,
            });
            baseTime -= 0.1; // track evolution
        }
        return mockData;
    }, [selectedDriver]);

    if (!selectedDriver) {
        return <div className="p-4 opacity-50 flex items-center justify-center h-full text-center text-xs">SELECT A DRIVER TO VIEW CHART</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#181a20] p-2">
            <div className="text-[10px] uppercase opacity-50 font-bold mb-2 tracking-widest px-2">Lap Time Trend - {selectedDriver}</div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line type="monotone" dataKey="time" stroke="#e10600" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive={false} />
                        <CartesianGrid stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                        <XAxis dataKey="lap" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(1)} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#888', marginBottom: '4px' }}
                            formatter={(value: number) => [`${value.toFixed(3)}s`, 'Lap Time']}
                            labelFormatter={(label) => `Lap ${label}`}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
