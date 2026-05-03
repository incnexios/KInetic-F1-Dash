import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Check, LayoutGrid, Plus, X } from 'lucide-react';
import { cn } from './lib/utils';

import { kineticEngine, useKineticStore } from './services/KineticEngine';
import { WidgetRegistry } from './WidgetRegistry';

// @ts-ignore
const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);

const initialLayouts = {
  lg: [
    { i: 'leaderboard', x: 0, y: 0, w: 3, h: 24, minW: 2, minH: 5 },
    { i: 'streams', x: 3, y: 0, w: 7, h: 14, minW: 3, minH: 6 },
    { i: 'status', x: 10, y: 0, w: 2, h: 14, minW: 2, minH: 4 },
    { i: 'timing', x: 3, y: 14, w: 9, h: 10, minW: 6, minH: 5 },
    { i: 'map', x: 0, y: 24, w: 4, h: 8, minW: 3, minH: 4 },
    { i: 'telemetry', x: 4, y: 24, w: 4, h: 8, minW: 3, minH: 4 },
    { i: 'tyres', x: 8, y: 24, w: 4, h: 8, minW: 2, minH: 4 },
  ],
};

const initialWidgets = [
  { id: 'leaderboard', type: 'LiveLeaderboard' },
  { id: 'streams', type: 'StreamsWidget' },
  { id: 'status', type: 'RaceStatus' },
  { id: 'timing', type: 'LiveTimingTable' },
  { id: 'map', type: 'TrackMap' },
  { id: 'telemetry', type: 'TelemetryOverlay' },
  { id: 'tyres', type: 'TyreStints' },
];

const LOCAL_STORAGE_KEY = 'f1_pitwall_layout_v3';
const LOCAL_STORAGE_WIDGETS_KEY = 'f1_pitwall_widgets_v3';

export default function App() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && parsed.lg) {
          if (!parsed.lg.some((l: any) => l.i === 'streams')) {
              parsed.lg.push({ i: 'streams', x: 0, y: Infinity, w: 4, h: 10, minW: 3, minH: 6 });
          }
          return parsed;
      }
      return initialLayouts;
    } catch {
      return initialLayouts;
    }
  });
  const [widgets, setWidgets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_WIDGETS_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed) {
        // Auto-add new streams widget to existing save if missing
        if (!parsed.some((w: any) => w.type === 'StreamsWidget')) {
            return [...parsed, { id: 'streams', type: 'StreamsWidget' }];
        }
        return parsed;
      }
      return initialWidgets;
    } catch {
      return initialWidgets;
    }
  });
  const [showAddWidget, setShowAddWidget] = useState(false);
  const connected = useKineticStore(state => state.connected);
  const rs = useKineticStore(state => state.raceState);

  useEffect(() => {
    kineticEngine.connect();
    return () => kineticEngine.disconnect();
  }, []);

  const saveLayouts = (newLayouts: any) => {
    setLayouts(newLayouts);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLayouts));
  };

  const saveWidgets = (newWidgets: any[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(LOCAL_STORAGE_WIDGETS_KEY, JSON.stringify(newWidgets));
  };

  const handleLayoutChange = (layout: any, allLayouts: any) => {
    saveLayouts(allLayouts);
  };

  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
    const newLg = layouts.lg?.filter((l: any) => l.i !== id) || [];
    saveLayouts({ ...layouts, lg: newLg });
  };

  const addWidget = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const newWidget = { id, type };
    saveWidgets([...widgets, newWidget]);
    const newLg = [...(layouts.lg || []), { i: id, x: 0, y: Infinity, w: 3, h: 4, minW: 2, minH: 3 }];
    saveLayouts({ ...layouts, lg: newLg });
    setShowAddWidget(false);
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans overflow-hidden flex flex-col bg-[#0b0c10]">
       <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20 shadow-md">
         <div className="flex items-center gap-4">
           <div className="bg-[#e10600] text-white font-black px-3 py-1 text-xl italic tracking-tighter rounded-sm shadow-[0_0_15px_rgba(225,6,0,0.5)]">KINETIC</div>
           <div className="h-6 w-[1px] bg-white/20"></div>
           <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] uppercase tracking-widest text-[#e10600] font-bold leading-none">Live Pitwall</span>
                 {rs.SessionInfo?.Type && (
                     <span className="text-[9px] uppercase tracking-widest bg-white/10 text-white px-1.5 py-0.5 rounded-sm font-bold leading-none">
                         {rs.SessionInfo.Type}
                     </span>
                 )}
             </div>
             <span className="font-bold text-sm tracking-tight">{rs.SessionInfo?.Meeting?.Name || 'Grand Prix Session'}</span>
           </div>
         </div>
         
         {/* Center: Track Status */}
         <div className="hidden md:flex flex-1 justify-center">
            {rs.TrackStatus?.Status && (
                <div className={cn(
                    "px-4 py-1.5 rounded-sm border flex items-center gap-2 font-bold uppercase tracking-widest text-xs shadow-lg transition-colors",
                    rs.TrackStatus.Status === '1' ? "bg-green-500/20 border-green-500/50 text-green-400" :
                    rs.TrackStatus.Status === '2' ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" :
                    rs.TrackStatus.Status === '4' ? "bg-orange-500/20 border-orange-500/50 text-orange-400" :
                    rs.TrackStatus.Status === '5' ? "bg-red-500/20 border-red-500/50 text-red-500" :
                    rs.TrackStatus.Status === '6' || rs.TrackStatus.Status === '7' ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" :
                    "bg-white/10 border-white/20 text-white"
                )}>
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        rs.TrackStatus.Status === '1' ? "bg-green-500" :
                        rs.TrackStatus.Status === '2' ? "bg-yellow-500" :
                        rs.TrackStatus.Status === '4' ? "bg-orange-500" :
                        rs.TrackStatus.Status === '5' ? "bg-red-500" :
                        rs.TrackStatus.Status === '6' || rs.TrackStatus.Status === '7' ? "bg-yellow-500" :
                        "bg-white"
                    )}></div>
                    {rs.TrackStatus.Status === '1' ? 'TRACK CLEAR' :
                     rs.TrackStatus.Status === '2' ? 'YELLOW FLAG' :
                     rs.TrackStatus.Status === '4' ? 'SAFETY CAR' :
                     rs.TrackStatus.Status === '5' ? 'RED FLAG' :
                     rs.TrackStatus.Status === '6' ? 'VSC DEPLOYED' :
                     rs.TrackStatus.Status === '7' ? 'VSC ENDING' :
                     'UNKNOWN STATUS'}
                </div>
            )}
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


