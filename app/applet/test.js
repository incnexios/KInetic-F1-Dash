const WebSocket = require('ws');
console.log('Started');
const ws = new WebSocket('wss://f1dash.net/ws', {
    headers: {
        'Origin': 'https://f1dash.net',
        'User-Agent': 'Mozilla/5.0'
    }
});
ws.on('open', () => console.log('connected'));
ws.on('message', (data) => {
    let raw = data.toString();
    console.log('Got msg size:', raw.length);
    let j = JSON.parse(raw);
    console.log('Keys:', Object.keys(j));
    if (j.Position) {
         console.log('Position keys:', Object.keys(j.Position));
         console.log('Position type:', typeof j.Position.Position);
         if (j.Position.Position && j.Position.Position.length) {
              let p = j.Position.Position[0];
              let k = Object.keys(p.Entries)[0];
              console.log('Entry:', p.Entries[k]);
         }
    }
    process.exit(0);
});
ws.on('error', console.error);
