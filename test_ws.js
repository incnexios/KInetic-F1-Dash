const WebSocket = require('ws');
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
        console.log('Position type:', Array.isArray(j.Position) ? 'array' : typeof j.Position);
        if (Array.isArray(j.Position)) {
             console.log('Position length:', j.Position.length);
             if (j.Position[0]) {
                 console.log('First position entry keys:', Object.keys(j.Position[0]));
                 console.log('First position Timestamp:', j.Position[0].Timestamp);
                 let keys = Object.keys(j.Position[0].Entries || {});
                 console.log('Num entries:', keys.length);
                 if (keys.length > 0) {
                     console.log('Sample entry:', j.Position[0].Entries[keys[0]]);
                 }
             }
        } else {
             console.log('Position keys:', Object.keys(j.Position));
        }
    }
    process.exit(0);
});
ws.on('error', console.error);
