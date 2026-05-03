const WebSocket = require('ws');
const ws = new WebSocket('wss://f1dash.net/ws', { headers: { 'Origin': 'https://f1dash.net', 'User-Agent': 'Mozilla/5.0' } });
ws.on('message', (data) => {
    let raw = data.toString();
    if (!raw.includes("DriverList") && !raw.includes("TimingData")) return;
    let j = JSON.parse(raw);
    if (j.DriverList) { console.log('Driver keys:', Object.keys(j.DriverList)); process.exit(0); }
    if (j.TimingData && j.TimingData.Lines) { console.log('TimingData keys:', Object.keys(j.TimingData.Lines)); }
});
