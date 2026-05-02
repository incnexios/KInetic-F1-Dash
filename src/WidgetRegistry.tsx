import { LiveLeaderboard } from './components/LiveLeaderboard';
import { TelemetryOverlay } from './components/TelemetryOverlay';
import { MapMapper } from './components/MapMapper';
import { RaceStatusPanel } from './components/RaceStatusPanel';
import { LiveTimingTable } from './components/LiveTimingTable';
import { CustomChart } from './components/CustomChart';
import { ChampionshipStandings } from './components/ChampionshipStandings';
import { WeatherConditions } from './components/WeatherConditions';
import { TyreStints } from './components/TyreStints';
import { StreamsWidget } from './components/StreamsWidget';

export const WidgetRegistry = {
    LiveLeaderboard,
    TelemetryOverlay,
    TrackMap: MapMapper,
    RaceStatus: RaceStatusPanel,
    LiveTimingTable,
    TyreStints,
    StreamsWidget,
    CustomChart,
    ChampionshipStandings,
    WeatherConditions,
};
