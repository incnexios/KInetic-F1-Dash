import { create } from 'zustand';
import pako from 'pako';

export interface DriverTelemetry {
  rpm: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

export interface DriverPosition {
  x: number;
  y: number;
  z: number;
  status?: string;
}

export interface DriverState {
  racingNumber: string;
  tla: string;
  fullName: string;
  teamName: string;
  teamColour: string;
  position: string;
  gapToLeader: string;
  gapToAhead: string;
  lastLapTime: any;
  bestLapTime: any;
  inPit: boolean;
  retired: boolean;
  stopped: boolean;
  telemetry: DriverTelemetry;
  positionData: DriverPosition;
  isQualifying: boolean;
  isKnockedOut: boolean;
  isCutoff: boolean;
  qualiGap: string;
  qualiInterval: string;
  qualifyingTime: any;
}

export interface RaceState {
  SessionInfo: any;
  SessionData: any;
  TimingData: any;
  TimingStats: any;
  TimingAppData: any;
  CarData: any;
  Position: any;
  DriverList: Record<string, any>;
  ExtrapolatedClock: any;
  RaceControlMessages: { Messages: any[] };
  TrackStatus: any;
  TyreStintSeries: any;
  WeatherData: any;
  TeamRadio: { Captures: any[] };
  ReferenceTrack?: {x: number, y: number}[];
}

export interface KineticStore {
  connected: boolean;
  tvSyncDelay: number;
  raceState: RaceState;
  driversMap: Record<string, DriverState>;
  
  setConnected: (status: boolean) => void;
  setTvSyncDelay: (seconds: number) => void;
  setInitialState: (state: Partial<RaceState>) => void;
  applyFeedUpdate: (key: string, data: any) => void;
}

function createEmptyRaceState(): RaceState {
  return {
    SessionInfo: null,
    SessionData: null,
    TimingData: { Lines: {}, SessionPart: 0 },
    TimingStats: { Lines: {} },
    TimingAppData: { Lines: {} },
    CarData: null,
    Position: null,
    DriverList: {},
    ExtrapolatedClock: null,
    RaceControlMessages: { Messages: [] },
    TrackStatus: null,
    TyreStintSeries: null,
    WeatherData: null,
    TeamRadio: { Captures: [] },
  };
}

function deepMerge(target: any, source: any): any {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return source;
  if (Array.isArray(target) && Array.isArray(source)) {
     return source;
  }
  const output = { ...target };
  Object.keys(source).forEach(key => {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  });
  return output;
}

export const useKineticStore = create<KineticStore>((set, get) => ({
  connected: false,
  tvSyncDelay: 0,
  raceState: createEmptyRaceState(),
  driversMap: {},

  setConnected: (status) => set({ connected: status }),
  setTvSyncDelay: (delay) => set({ tvSyncDelay: delay }),
  
  setInitialState: (state) => {
    set((prev) => {
      const merged = deepMerge(prev.raceState, state);
      return { raceState: merged, driversMap: computeDriversMap(merged) };
    });
  },

  applyFeedUpdate: (key, data) => {
    set((prev) => {
      const rs = { ...prev.raceState } as any;
      switch (key) {
        case '_reset_TimingData':
        case '_reset_DriverList':
        case '_reset_SessionInfo':
        case '_reset_TrackStatus':
        case '_reset_RaceControlMessages':
          const actualKey = key.replace('_reset_', '');
          rs[actualKey] = data;
          break;
        case 'Heartbeat':
        case 'ExtrapolatedClock':
        case 'TrackStatus':
        case 'SessionInfo':
          if (rs[key] && data) rs[key] = deepMerge(rs[key], data);
          else if (data) rs[key] = data;
          break;
        case 'TimingData':
        case 'TimingStats':
        case 'TimingAppData':
          if (data && data.Lines) {
            if (!rs[key]) rs[key] = { Lines: {} };
            if (!rs[key].Lines) rs[key].Lines = {};
            Object.keys(data.Lines).forEach(dk => {
                rs[key].Lines[dk] = deepMerge(rs[key].Lines[dk] || {}, data.Lines[dk]);
            });
            if (data.SessionPart !== undefined && key === 'TimingData') {
                rs[key].SessionPart = data.SessionPart;
            }
          }
          break;
        case 'DriverList':
          rs[key] = deepMerge(rs[key] || {}, data);
          break;
        case 'RaceControlMessages':
          if (data.Messages) {
             if (Array.isArray(data.Messages)) {
                 rs[key].Messages.push(...data.Messages);
             } else {
                 Object.values(data.Messages).forEach(m => rs[key].Messages.push(m));
             }
             handleRaceControlPush(data.Messages);
          }
          break;
        case 'TeamRadio':
          if (data.Captures) {
             if (Array.isArray(data.Captures)) {
                 rs[key].Captures.push(...data.Captures);
             } else {
                 Object.values(data.Captures).forEach(m => rs[key].Captures.push(m));
             }
          }
          break;
        case 'CarData':
          rs.CarData = data;
          parseTelemetry(data, prev.driversMap);
          break;
        case 'Position':
          rs.Position = data;
          parsePosition(data, prev.driversMap);
          break;
        default:
          if (rs[key] !== undefined && typeof rs[key] === 'object' && typeof data === 'object') {
             rs[key] = deepMerge(rs[key], data);
          } else {
             rs[key] = data;
          }
      }
      const newDrivers = computeDriversMap(rs, prev.driversMap);
      return { raceState: rs, driversMap: newDrivers };
    });
  }
}));

function computeDriversMap(raceState: RaceState, currentMap: Record<string, DriverState> = {}): Record<string, DriverState> {
  const drivers: Record<string, DriverState> = { ...currentMap };
  const driverList = raceState.DriverList || {};
  const timingLines = raceState.TimingData?.Lines || {};

  const baseKeys = new Set([...Object.keys(driverList), ...Object.keys(timingLines)]);

  baseKeys.forEach((num) => {
    const dList = driverList[num];
    const tLine = timingLines[num];
    
    if (!drivers[num]) {
      drivers[num] = {
        racingNumber: num,
        tla: dList?.Tla || '',
        fullName: dList?.FullName || '',
        teamName: dList?.TeamName || '',
        teamColour: dList?.TeamColour || '808080',
        position: '0',
        gapToLeader: '',
        gapToAhead: '',
        lastLapTime: null,
        bestLapTime: null,
        inPit: false,
        retired: false,
        stopped: false,
        telemetry: { rpm: 0, speed: 0, gear: 0, throttle: 0, brake: 0, drs: 0 },
        positionData: { x: 0, y: 0, z: 0 },
        isQualifying: raceState.SessionInfo?.Type === 'Qualifying',
        isKnockedOut: false,
        isCutoff: false,
        qualiGap: '',
        qualiInterval: '',
        qualifyingTime: null
      };
    }

    const d = drivers[num];
    if (dList) {
        d.tla = dList.Tla || d.tla;
        d.fullName = dList.FullName || d.fullName;
        d.teamName = dList.TeamName || d.teamName;
        d.teamColour = dList.TeamColour || d.teamColour;
    }
    if (tLine) {
        d.position = tLine.Position || d.position;
        d.gapToLeader = tLine.GapToLeader || d.gapToLeader;
        d.gapToAhead = tLine.IntervalToPositionAhead?.Value || d.gapToAhead;
        d.inPit = tLine.InPit !== undefined ? tLine.InPit : d.inPit;
        d.retired = tLine.Retired !== undefined ? tLine.Retired : d.retired;
        d.stopped = tLine.Stopped !== undefined ? tLine.Stopped : d.stopped;
        d.lastLapTime = tLine.LastLapTime || d.lastLapTime;
        d.bestLapTime = tLine.BestLapTime || d.bestLapTime;
    }
  });

  return drivers;
}

function parseTelemetry(data: any, driversMap: Record<string, DriverState>) {
   let entriesList = data?.Entries;
   
   if (Array.isArray(entriesList) && entriesList.length > 0) {
       const latest = entriesList[entriesList.length - 1];
       if (latest && latest.Cars) {
           Object.keys(latest.Cars).forEach(num => {
               if (driversMap[num] && latest.Cars[num].Channels) {
                   const ch = latest.Cars[num].Channels;
                   const drv = driversMap[num];
                   drv.telemetry = {
                       ...drv.telemetry,
                       rpm: ch[0] ?? drv.telemetry.rpm,
                       speed: ch[2] ?? drv.telemetry.speed,
                       gear: ch[3] ?? drv.telemetry.gear,
                       throttle: ch[4] ?? drv.telemetry.throttle,
                       brake: ch[5] ? 100 : 0,
                       drs: ch[45] ?? drv.telemetry.drs
                   };
               }
           });
       }
   }
}

function parsePosition(data: any, driversMap: Record<string, DriverState>) {
    let positionList = data?.Position;
    
    if (!positionList && Array.isArray(data)) {
         positionList = data;
    } else if (!positionList && data?.Entries) {
         positionList = data.Entries;
    }

    if (Array.isArray(positionList) && positionList.length > 0) {
        const latest = positionList[positionList.length - 1];
        if (latest && latest.Entries) {
            Object.keys(latest.Entries).forEach(num => {
                if (driversMap[num]) {
                    const pos = latest.Entries[num];
                    const drv = driversMap[num];
                    drv.positionData = {
                        ...drv.positionData,
                        x: pos.X ?? drv.positionData.x,
                        y: pos.Y ?? drv.positionData.y,
                        z: pos.Z ?? drv.positionData.z,
                        status: pos.Status ?? drv.positionData.status
                    };
                }
            });
        }
    }
}

function handleRaceControlPush(messages: any[]) {
    if (!('Notification' in window)) return;
    messages.forEach(msg => {
       const text = msg.Message || '';
       if (text.includes('YELLOW FLAG') || text.includes('RED FLAG')) {
           showNotification('Race Control: Hazard', text);
       } else if (text.includes('DRS ENABLED')) {
           showNotification('Race Control: DRS', 'DRS has been enabled');
       } else if (text.includes('PIT EXIT OPEN')) {
           showNotification('Race Control', 'Pit exit is now open');
       }
    });
}

function showNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
            if (p === 'granted') {
                 new Notification(title, { body });
            }
        });
    }
}

export class KineticEngine {
    private ws: WebSocket | null = null;
    private sse: EventSource | null = null;
    private telTimer: any = null;
    private queue: { timestamp: number, key: string, data: any }[] = [];
    private intervalId: any = null;
    private reconnectAttempts = 0;
    private reconnectTimeout: any = null;
    readonly URI = 'wss://proxy.cloudflare-eggshell171.workers.dev';

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.ws = new WebSocket(this.URI);

        this.ws.onopen = () => {
            console.log('KineticEngine: Connected');
            useKineticStore.getState().setConnected(true);
            this.reconnectAttempts = 0;

            this.ws?.send(JSON.stringify({protocol:'json',version:1}) + '\x1e');
            this.ws?.send(JSON.stringify({
                type:1,
                target:'Subscribe',
                arguments:[[
                    'Heartbeat', 'SessionInfo', 'SessionData',
                    'TrackStatus', 'DriverList', 'RaceControlMessages',
                    'LapCount', 'TimingData', 'TimingStats',
                    'TimingAppData', 'WeatherData', 'ExtrapolatedClock',
                    'TeamRadio', 'DriverTracker'
                ]],
                invocationId:'1'
            }) + '\x1e');

            // Removed CarData.z and Position.z subscription

            if (this.intervalId === null) {
                this.intervalId = setInterval(() => this.processQueue(), 50);
            }
            
            // Connect to F1 Insights proxy for map and telemetry
            this.connectF1Insights();
        };

        this.ws.onmessage = ({data}) => {
            for (const frame of data.split('\x1e').filter(Boolean)) {
                try {
                    const msg = JSON.parse(frame);
                    if (msg.type === 3 && msg.result) {
                        const state = useKineticStore.getState().raceState;
                        const newState = { ...state };
                        Object.keys(msg.result).forEach(key => {
                             newState[key as keyof RaceState] = msg.result[key];
                        });
                        useKineticStore.getState().setInitialState(newState);
                    } else if (msg.type === 1 && msg.target === 'feed') {
                        let [topic, payload] = msg.arguments;
                        if (topic && topic.endsWith('.z')) {
                            payload = this.decompress(payload);
                            topic = topic.replace('.z', '');
                        }
                        this.enqueueMessage(topic, payload);
                    }
                } catch (err) {
                    // error parsing, ignore
                }
            }
        };

        this.ws.onclose = () => {
            console.log('KineticEngine: Disconnected');
            useKineticStore.getState().setConnected(false);
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            
            this.disconnectF1Insights();
            
            if (this.reconnectAttempts < 5) {
                this.reconnectAttempts += 1;
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max 30s as per instructions
                this.reconnectTimeout = setTimeout(() => this.connect(), delay);
            }
        };
        
        this.ws.onerror = () => {
           // handled by onclose
        };
    }

    private connectF1Insights() {
        if (this.sse) this.sse.close();
        
        this.sse = new EventSource('/api/f1insights/stream');
        
        this.sse.onmessage = (e) => {
            if (!e.data || e.data.startsWith(':')) return;
            try {
                const data = JSON.parse(e.data);
                
                if (data.positions) {
                    const store = useKineticStore.getState();
                    
                    if (data.positions.referenceTrack && data.positions.referenceTrack.length > 0) {
                         const track = data.positions.referenceTrack.map((p: any) => ({ x: p.x, y: p.y }));
                         useKineticStore.setState((prev) => ({
                             raceState: { ...prev.raceState, ReferenceTrack: track }
                         } as any));
                    }
                    
                    if (data.positions.positions) {
                         useKineticStore.setState((prev) => {
                             const newDrivers = { ...prev.driversMap };
                             data.positions.positions.forEach((p: any) => {
                                 if (newDrivers[p.driverNumber]) {
                                     newDrivers[p.driverNumber] = {
                                         ...newDrivers[p.driverNumber],
                                         positionData: { x: p.x, y: p.y, z: p.z || 0 },
                                         inPit: p.inPit
                                     };
                                 }
                             });
                             return { driversMap: newDrivers };
                         });
                    }
                }
            } catch (err) {
                console.warn('KineticEngine SSE Parse Error:', err);
            }
        };
        
        this.telTimer = setInterval(() => this.fetchTelemetry(), 1000);
    }
    
    private async fetchTelemetry() {
        const driversMap = useKineticStore.getState().driversMap;
        const drivers = Object.keys(driversMap);
        if (drivers.length === 0) return;
        
        try {
            const res = await fetch(`/api/f1insights/telemetry?drivers=${drivers.join(',')}`);
            if (!res.ok) return;
            const data = await res.json();
            
            useKineticStore.setState((prev) => {
                const newDrivers = { ...prev.driversMap };
                Object.keys(data).forEach((num) => {
                     const cd = data[num];
                     if (newDrivers[num] && cd) {
                         newDrivers[num] = {
                             ...newDrivers[num],
                             telemetry: {
                                 rpm: cd.rpm ?? newDrivers[num].telemetry.rpm,
                                 speed: cd.speed ?? newDrivers[num].telemetry.speed,
                                 gear: cd.gear ?? newDrivers[num].telemetry.gear,
                                 throttle: cd.throttle ?? newDrivers[num].telemetry.throttle,
                                 brake: cd.brake ?? newDrivers[num].telemetry.brake,
                                 drs: cd.drs ?? newDrivers[num].telemetry.drs
                             }
                         };
                     }
                });
                return { driversMap: newDrivers };
            });
        } catch (err) {
            // ignore
        }
    }

    private disconnectF1Insights() {
        if (this.sse) {
            this.sse.close();
            this.sse = null;
        }
        if (this.telTimer) {
            clearInterval(this.telTimer);
            this.telTimer = null;
        }
    }

    private decompress(b64: string) {
        const bin = atob(b64);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        try {
            return JSON.parse(new TextDecoder().decode(pako.inflateRaw(bytes)));
        } catch {
            return JSON.parse(new TextDecoder().decode(pako.inflate(bytes)));
        }
    }

    private enqueueMessage(key: string, data: any) {
        this.queue.push({ timestamp: Date.now(), key, data });
    }

    private processQueue() {
        const store = useKineticStore.getState();
        const syncDelayMs = store.tvSyncDelay * 1000;
        const now = Date.now();

        while (this.queue.length > 0 && (now - this.queue[0].timestamp) >= syncDelayMs) {
            const item = this.queue.shift();
            if (item) {
                store.applyFeedUpdate(item.key, item.data);
            }
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.disconnectF1Insights();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}

export const kineticEngine = new KineticEngine();
