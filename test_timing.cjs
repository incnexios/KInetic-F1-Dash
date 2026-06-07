const WebSocket = require('ws');
const ws = new WebSocket('wss://f1dash.net/ws', { headers: { Origin: 'https://ais-test.vercel.app' } });
ws.on('open', () => console.log('connected'));
ws.on('message', (data) => {
    const msg = data.toString();
    if (msg.includes('TimingData')) {
        const obj = JSON.parse(msg);
        console.log("TimingData keys:", Object.keys(obj.TimingData?.Lines || {}));
        const timingLine1 = Object.values(obj.TimingData?.Lines || {})[0];
        console.log("Timing line 1:", JSON.stringify(timingLine1, null, 2));
        process.exit();
    }
});
