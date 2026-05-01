import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Check, LayoutGrid, Plus, X } from 'lucide-react';

import { kineticEngine, useKineticStore } from './services/KineticEngine';
import { WidgetRegistry } from './WidgetRegistry';

// @ts-ignore
const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);

const initialLayouts = {
  lg: [
    { i: 'leaderboard', x: 0, y: 0, w: 2, h: 22, minW: 2, minH: 5 },
    { i: 'timing', x: 2, y: 0, w: 8, h: 14, minW: 6, minH: 5 },
    { i: 'map', x: 2, y: 14, w: 4, h: 8, minW: 3, minH: 4 },
    { i: 'telemetry', x: 6, y: 14, w: 4, h: 8, minW: 3, minH: 4 },
    { i: 'status', x: 10, y: 0, w: 2, h: 22, minW: 2, minH: 4 },
  ],
};

const initialWidgets = [
  { id: 'leaderboard', type: 'LiveLeaderboard' },
  { id: 'timing', type: 'LiveTimingTable' },
  { id: 'telemetry', type: 'TelemetryOverlay' },
  { id: 'map', type: 'TrackMap' },
  { id: 'status', type: 'RaceStatus' },
];

export default function App() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<any>(initialLayouts);
  const [widgets, setWidgets] = useState<any[]>(initialWidgets);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const connected = useKineticStore(state => state.connected);
  const rs = useKineticStore(state => state.raceState);

  useEffect(() => {
    kineticEngine.connect();
    return () => kineticEngine.disconnect();
  }, []);

  const handleLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    const newLg = layouts.lg?.filter((l: any) => l.i !== id) || [];
    setLayouts({ ...layouts, lg: newLg });
  };

  const addWidget = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const newWidget = { id, type };
    setWidgets([...widgets, newWidget]);
    const newLg = [...(layouts.lg || []), { i: id, x: 0, y: Infinity, w: 3, h: 4, minW: 2, minH: 3 }];
    setLayouts({ ...layouts, lg: newLg });
    setShowAddWidget(false);
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans overflow-hidden flex flex-col bg-[#0b0c10]">
       <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20 shadow-md">
         <div className="flex items-center gap-4">
           <div className="bg-[#e10600] text-white font-black px-3 py-1 text-xl italic tracking-tighter rounded-sm shadow-[0_0_15px_rgba(225,6,0,0.5)]">KINETIC</div>
           <div className="h-6 w-[1px] bg-white/20"></div>
           <div className="flex flex-col">
             <span className="text-[10px] uppercase tracking-widest text-[#e10600] font-bold leading-none mb-1">Live Pitwall</span>
             <span className="font-bold text-sm tracking-tight">{rs.SessionInfo?.Meeting?.Name || 'Grand Prix Session'}</span>
           </div>
         </div>
         
         <div className="flex items-center gap-4">
            {editMode && (
                <div className="relative">
                    <button 
                        onClick={() => setShowAddWidget(!showAddWidget)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    >
                        <Plus size={14} /> ADD WIDGET
                    </button>
                    {showAddWidget && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-white/10 p-2 rounded shadow-2xl flex flex-col gap-1 max-h-96 overflow-auto z-50">
                            <div className="text-xs font-black uppercase text-white/50 px-2 py-1 mb-1">Available Widgets</div>
                            {Object.keys(WidgetRegistry).map(key => (
                                <button key={key} onClick={() => addWidget(key)} className="text-left px-3 py-2 text-sm font-medium hover:bg-white/10 rounded transition-colors text-slate-300 hover:text-white">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <button 
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border text-xs font-bold uppercase tracking-widest ${editMode ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
                {editMode ? <><Check size={14} /> DONE LAYOUT</> : <><LayoutGrid size={14} /> EDIT LAYOUT</>}
            </button>
            <div className={`border px-4 py-2 rounded flex items-center gap-3 ${connected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
               <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-red-500'}`}></div>
               <span className={`text-xs font-bold tracking-widest uppercase ${connected ? 'text-emerald-500' : 'text-red-500'}`}>{connected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
         </div>
       </header>

       <div className="flex-1 p-2 relative overflow-auto overflow-x-hidden bg-[#0f1115]">
         <ResponsiveGridLayoutWithWidth
            className="layout" 
            layouts={layouts} 
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={40}
            draggableHandle=".drag-handle"
            isDraggable={editMode}
            isResizable={editMode}
            margin={[12, 12]}
            containerPadding={[12, 12]}
         >
             {widgets.map(widget => {
                 const WidgetComponent = WidgetRegistry[widget.type as keyof typeof WidgetRegistry];
                 return (
                     <div key={widget.id} className={`flex flex-col h-full bg-[#181a20] rounded-xl relative transition-all shadow-lg ${editMode ? 'ring-2 ring-indigo-500/50 overflow-visible' : 'border border-white/5 overflow-hidden'}`}>
                         {editMode && (
                             <>
                                <div className="drag-handle absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1 rounded text-[10px] font-bold cursor-move z-50 shadow-lg uppercase tracking-widest flex items-center gap-1">
                                    <LayoutGrid size={12} /> MOVE
                                </div>
                                <button onClick={() => removeWidget(widget.id)} className="absolute -top-3 -right-2 bg-red-500 hover:bg-red-400 text-white p-1 rounded-full text-xs cursor-pointer z-50 shadow-lg transition-colors">
                                    <X size={14} />
                                </button>
                             </>
                         )}
                         <div className="flex-1 h-full w-full relative overflow-hidden flex flex-col">
                            {WidgetComponent ? (
                                <WidgetComponent selectedDriver={selectedDriver} onSelectDriver={setSelectedDriver} />
                            ) : (
                                <div className="p-4 text-white/50 flex items-center justify-center h-full">Unknown Widget Type</div>
                            )}
                         </div>
                     </div>
                 );
             })}
         </ResponsiveGridLayoutWithWidth>
       </div>
    </div>
  );
}


