const WebSocket=require('ws');
const ws=new WebSocket('wss://f1dash.net/ws');
ws.on('open', ()=>{ 
    console.log('Opened Vercel Origin'); 
});
ws.on('message', (msg) => {
    console.log('Msg:', msg.toString());
    process.exit(0);
});
ws.on('error', (err)=>{ console.log('Error', err.message); process.exit(1); });
ws.on('unexpected-response', (req, res)=>{ console.log('Resp', res.statusCode); process.exit(1); });
