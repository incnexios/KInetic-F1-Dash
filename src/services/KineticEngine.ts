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
  CarDataZ: any;
  PositionZ: any;
  DriverList: Record<string, any>;
  ExtrapolatedClock: any;
  RaceControlMessages: { Messages: any[] };
  TrackStatus: any;
  TyreStintSeries: any;
  WeatherData: any;
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
    CarDataZ: null,
    PositionZ: null,
    DriverList: {},
    ExtrapolatedClock: null,
    RaceControlMessages: { Messages: [] },
    TrackStatus: null,
    TyreStintSeries: null,
    WeatherData: null,
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
        case 'CarData.z':
          rs.CarDataZ = data;
          parseTelemetry(data, prev.driversMap);
          break;
        case 'Position.z':
          rs.PositionZ = data;
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

function parseZData(base64Str: string) {
    try {
        const strData = atob(base64Str);
        const charData = strData.split('').map((x) => x.charCodeAt(0));
        const binData = new Uint8Array(charData);
        const data = pako.inflateRaw(binData, { to: 'string' });
        return JSON.parse(data);
    } catch(e) {
        return null;
    }
}

function parseTelemetry(base64: string, driversMap: Record<string, DriverState>) {
   const decoded = parseZData(base64);
   if (decoded && decoded.Entries && decoded.Entries.length > 0) {
       const latest = decoded.Entries[decoded.Entries.length - 1];
       if (latest && latest.Cars) {
           Object.keys(latest.Cars).forEach(num => {
               if (driversMap[num] && latest.Cars[num].Channels) {
                   const ch = latest.Cars[num].Channels;
                   const drv = driversMap[num];
                   drv.telemetry.rpm = ch[0] ?? drv.telemetry.rpm;
                   drv.telemetry.speed = ch[2] ?? drv.telemetry.speed;
                   drv.telemetry.gear = ch[3] ?? drv.telemetry.gear;
                   drv.telemetry.throttle = ch[4] ?? drv.telemetry.throttle;
                   drv.telemetry.brake = ch[5] ?? drv.telemetry.brake;
                   drv.telemetry.drs = ch[45] ?? drv.telemetry.drs;
               }
           });
       }
   }
}

function parsePosition(base64: string, driversMap: Record<string, DriverState>) {
    const decoded = parseZData(base64);
    if (decoded && decoded.Position && decoded.Position.length > 0) {
        const latest = decoded.Position[decoded.Position.length - 1];
        if (latest && latest.Entries) {
            Object.keys(latest.Entries).forEach(num => {
                if (driversMap[num]) {
                    const pos = latest.Entries[num];
                    const drv = driversMap[num];
                    drv.positionData.x = pos.X ?? drv.positionData.x;
                    drv.positionData.y = pos.Y ?? drv.positionData.y;
                    drv.positionData.z = pos.Z ?? drv.positionData.z;
                    if (pos.Status) drv.positionData.status = pos.Status;
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
    private queue: { timestamp: number, data: any }[] = [];
    private intervalId: any = null;
    readonly URI = "wss://api.pitwall.me/ws";

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.ws = new WebSocket(this.URI);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
            console.log('KineticEngine: Connected to Pitwall proxy');
            useKineticStore.getState().setConnected(true);
            if (this.intervalId === null) {
                this.intervalId = setInterval(() => this.processQueue(), 100);
            }
        };

        this.ws.onmessage = (event) => {
            try {
                let jsonStr = "";
                if (event.data instanceof ArrayBuffer) {
                    try {
                        jsonStr = pako.inflateRaw(new Uint8Array(event.data), { to: 'string' });
                    } catch (e) {
                        try {
                            jsonStr = pako.inflate(new Uint8Array(event.data), { to: 'string' });
                        } catch (err) {
                            return;
                        }
                    }
                } else {
                    jsonStr = event.data;
                }
                if (!jsonStr) return;
                
                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.type === 'bundle' && Array.isArray(parsed.messages)) {
                    parsed.messages.forEach((m: any) => this.enqueueMessage(m));
                } else {
                    this.enqueueMessage(parsed);
                }
            } catch (e) {
                // Ignore parse errors on bad packets
            }
        };

        this.ws.onclose = () => {
            console.log('KineticEngine: Disconnected');
            useKineticStore.getState().setConnected(false);
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            setTimeout(() => this.connect(), 5000);
        };
    }

    private enqueueMessage(msg: any) {
        if (typeof msg === 'object' && msg !== null && 'R' in msg) {
            useKineticStore.getState().setInitialState(msg.R);
        } else {
            this.queue.push({ timestamp: Date.now(), data: msg });
        }
    }

    private processQueue() {
        const store = useKineticStore.getState();
        const syncDelayMs = store.tvSyncDelay * 1000;
        const now = Date.now();

        while (this.queue.length > 0 && (now - this.queue[0].timestamp) >= syncDelayMs) {
            const item = this.queue.shift();
            if (item) {
                this.applyFeed(item.data);
            }
        }
    }

    private applyFeed(data: any) {
        const store = useKineticStore.getState();
        if (data && data.M && Array.isArray(data.M)) {
            data.M.forEach((r: any) => {
                if (r && r.H === "Streaming" && r.M === "feed" && Array.isArray(r.A) && r.A.length >= 2) {
                    store.applyFeedUpdate(r.A[0], r.A[1]);
                }
            });
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const kineticEngine = new KineticEngine();
