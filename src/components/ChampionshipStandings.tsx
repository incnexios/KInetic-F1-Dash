import React, { useEffect, useState } from 'react';

export function ChampionshipStandings() {
    const [standings, setStandings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings.json')
            .then(res => res.json())
            .then(data => {
                const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
                setStandings(list);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="p-4 opacity-50 flex items-center justify-center h-full text-xs font-mono">LOADING STANDINGS...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#181a20] font-mono text-[11px]">
            <div className="p-2 border-b border-white/10 flex justify-between items-center bg-white/5 font-bold uppercase tracking-widest text-[#e10600]">
                Championship Standings
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-2">
                <div className="flex px-2 py-1 text-white/50 border-b border-white/5 mb-1 font-bold">
                    <div className="w-8">POS</div>
                    <div className="flex-1">DRIVER</div>
                    <div className="w-16 text-right">POINTS</div>
                    <div className="w-12 text-center">WINS</div>
                </div>
                {standings.map((s: any) => (
                    <div key={s.Driver.driverId} className="flex px-2 py-1.5 hover:bg-white/5 border-b border-white/5 transition-colors items-center">
                        <div className="w-8 font-bold">{s.position}</div>
                        <div className="flex-1 truncate uppercase">{s.Driver.givenName} <span className="font-bold text-white">{s.Driver.familyName}</span></div>
                        <div className="w-16 text-right font-bold text-emerald-400">{s.points}</div>
                        <div className="w-12 text-center opacity-50">{s.wins}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
