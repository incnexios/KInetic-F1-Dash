const WebSocket=require('ws');
const ws=new WebSocket('wss://f1dash.net/ws', { headers: { Origin: 'https://ais-test.vercel.app', 'User-Agent': 'Mozilla/5.0' } });
ws.on('open', ()=>{ console.log('Opened Vercel Origin'); });
ws.on('message', (msg) => { console.log('Msg len:', msg.length); process.exit(0); });
ws.on('error', (err)=>{ console.log('Error', err.message); process.exit(1); });
ws.on('close', (code, reason)=>{ console.log('Closed', code, reason.toString()); process.exit(1); });
